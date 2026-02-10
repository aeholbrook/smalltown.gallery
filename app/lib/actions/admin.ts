'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { hash } from 'bcryptjs'
import { randomUUID } from 'crypto'

type ActionState = { error: string | null }
const PLACEHOLDER_EMAIL = process.env.LEGACY_PLACEHOLDER_EMAIL || 'unclaimed@smalltown.gallery'
const PLACEHOLDER_NAME = process.env.LEGACY_PLACEHOLDER_NAME || 'Unclaimed Legacy Collection'

async function getOrCreatePlaceholderUser() {
  const existing = await prisma.user.findUnique({ where: { email: PLACEHOLDER_EMAIL } })
  if (existing) return existing

  const passwordHash = await hash(randomUUID(), 10)
  return prisma.user.create({
    data: {
      email: PLACEHOLDER_EMAIL,
      name: PLACEHOLDER_NAME,
      passwordHash,
      role: 'PENDING',
    },
  })
}

// --- User Management ---

export async function approveUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const userId = formData.get('userId') as string
  if (!userId) return { error: 'Missing user ID.' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'User not found.' }
  if (user.role !== 'PENDING') return { error: 'User is not pending.' }

  await prisma.user.update({
    where: { id: userId },
    data: { role: 'PHOTOGRAPHER' },
  })

  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return { error: null }
}

export async function rejectUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const userId = formData.get('userId') as string
  if (!userId) return { error: 'Missing user ID.' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'User not found.' }
  if (user.role !== 'PENDING') return { error: 'Can only reject pending users.' }

  await prisma.user.delete({ where: { id: userId } })

  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return { error: null }
}

export async function promoteToAdmin(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const userId = formData.get('userId') as string
  if (!userId) return { error: 'Missing user ID.' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'User not found.' }
  if (user.role !== 'PHOTOGRAPHER') return { error: 'Can only promote photographers.' }

  await prisma.user.update({
    where: { id: userId },
    data: { role: 'ADMIN' },
  })

  revalidatePath('/admin/users')
  return { error: null }
}

export async function demoteToPhotographer(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const userId = formData.get('userId') as string
  if (!userId) return { error: 'Missing user ID.' }
  if (userId === session.user.id) return { error: 'Cannot demote yourself.' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'User not found.' }
  if (user.role !== 'ADMIN') return { error: 'User is not an admin.' }

  await prisma.user.update({
    where: { id: userId },
    data: { role: 'PHOTOGRAPHER' },
  })

  revalidatePath('/admin/users')
  return { error: null }
}

// --- Project Management ---

export async function adminTogglePublished(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const projectId = formData.get('projectId') as string
  if (!projectId) return { error: 'Missing project ID.' }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return { error: 'Project not found.' }

  await prisma.project.update({
    where: { id: projectId },
    data: { published: !project.published },
  })

  revalidatePath('/admin/projects')
  return { error: null }
}

export async function adminDeleteProject(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const projectId = formData.get('projectId') as string
  if (!projectId) return { error: 'Missing project ID.' }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { photos: true },
  })
  if (!project) return { error: 'Project not found.' }

  // Clean up Vercel Blob photos (skip filesystem photos served via /photos/ route)
  if (process.env.BLOB_READ_WRITE_TOKEN && project.photos.length > 0) {
    const { del } = await import('@vercel/blob')
    for (const photo of project.photos) {
      if (!photo.blobUrl.startsWith('/photos/')) {
        try {
          await del(photo.blobUrl)
        } catch {
          // Blob may already be deleted
        }
      }
    }
  }

  await prisma.project.delete({ where: { id: projectId } })

  revalidatePath('/admin/projects')
  revalidatePath('/admin')
  return { error: null }
}

export async function createPlaceholderProject(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const townId = formData.get('townId') as string
  const year = Number(formData.get('year'))
  const photographer = (formData.get('photographer') as string)?.trim()

  if (!townId || !Number.isFinite(year) || year < 1900 || year > 2100) {
    return { error: 'Please select a town and provide a valid year.' }
  }

  const town = await prisma.town.findUnique({ where: { id: townId } })
  if (!town) return { error: 'Town not found.' }

  const existing = await prisma.project.findFirst({
    where: { townId, year },
  })
  if (existing) {
    return { error: `A project for ${town.name} (${year}) already exists.` }
  }

  const placeholderUser = await getOrCreatePlaceholderUser()

  await prisma.project.create({
    data: {
      townId,
      year,
      photographer: photographer || 'Unassigned',
      userId: placeholderUser.id,
      published: false,
      photoCount: 0,
    },
  })

  revalidatePath('/admin/placeholders')
  revalidatePath('/admin/projects')
  revalidatePath('/admin')
  return { error: null }
}

export async function claimPlaceholderProject(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const projectId = formData.get('projectId') as string
  const userId = formData.get('userId') as string
  const publishOnClaim = formData.get('publishOnClaim') === '1'

  if (!projectId || !userId) return { error: 'Missing required fields.' }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) return { error: 'Selected user not found.' }
  if (targetUser.role === 'PENDING') return { error: 'User must be approved before claiming.' }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { user: true },
  })
  if (!project) return { error: 'Project not found.' }
  if (project.user.email !== PLACEHOLDER_EMAIL && project.user.role !== 'PENDING') {
    return { error: 'This project is not a placeholder.' }
  }

  await prisma.$transaction([
    prisma.project.update({
      where: { id: project.id },
      data: {
        userId: targetUser.id,
        ...(publishOnClaim ? { published: true } : {}),
      },
    }),
    prisma.photo.updateMany({
      where: { projectId: project.id },
      data: { userId: targetUser.id },
    }),
  ])

  revalidatePath('/admin/placeholders')
  revalidatePath('/admin/projects')
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { error: null }
}

// --- Connect Filesystem Galleries ---

export async function connectGallery(
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }
  return { error: 'Filesystem connect is disabled. Use legacy import or normal uploads.' }
}

export async function bulkConnectGalleries(
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }
  return { error: 'Filesystem bulk connect is disabled. Use legacy import or normal uploads.' }
}

export async function bulkDisconnectGalleries(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const galleriesJson = formData.get('galleries') as string
  if (!galleriesJson) return { error: 'Missing gallery data.' }

  let galleries: { townName: string; year: number }[]
  try {
    galleries = JSON.parse(galleriesJson)
  } catch {
    return { error: 'Invalid gallery data.' }
  }

  if (galleries.length === 0) {
    return { error: 'No galleries selected.' }
  }

  let disconnected = 0
  for (const { townName, year } of galleries) {
    const town = await prisma.town.findUnique({ where: { name: townName } })
    if (!town) continue

    const project = await prisma.project.findFirst({
      where: { townId: town.id, year },
    })
    if (!project) continue

    await prisma.project.delete({ where: { id: project.id } })
    disconnected++
  }

  revalidatePath('/admin/connect')
  revalidatePath('/admin/projects')
  revalidatePath('/admin')

  if (disconnected === 0) {
    return { error: 'No connected galleries found to disconnect.' }
  }

  return { error: null }
}

export async function claimGallery(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const townName = formData.get('townName') as string
  const year = parseInt(formData.get('year') as string)
  const userId = formData.get('userId') as string
  const publishOnClaim = formData.get('publishOnClaim') === '1'

  if (!townName || !year || !userId) {
    return { error: 'Missing required fields.' }
  }

  const town = await prisma.town.findUnique({ where: { name: townName } })
  if (!town) return { error: 'Town not found.' }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) return { error: 'Selected user not found.' }
  if (targetUser.role === 'PENDING') return { error: 'User must be approved before claiming galleries.' }

  const project = await prisma.project.findFirst({
    where: { townId: town.id, year },
    include: { user: true },
  })
  if (!project) return { error: 'No project found for this town/year.' }
  if (project.user.role !== 'PENDING') {
    return { error: 'Only placeholder galleries can be claimed.' }
  }

  await prisma.$transaction([
    prisma.project.update({
      where: { id: project.id },
      data: {
        userId: targetUser.id,
        ...(publishOnClaim ? { published: true } : {}),
      },
    }),
    prisma.photo.updateMany({
      where: { projectId: project.id },
      data: { userId: targetUser.id },
    }),
  ])

  revalidatePath('/admin/connect')
  revalidatePath('/admin/projects')
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function bulkClaimGalleries(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const userId = formData.get('userId') as string
  const galleriesJson = formData.get('galleries') as string
  const publishOnClaim = formData.get('publishOnClaim') === '1'

  if (!userId || !galleriesJson) {
    return { error: 'Missing required fields.' }
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) return { error: 'Selected user not found.' }
  if (targetUser.role === 'PENDING') return { error: 'User must be approved before claiming galleries.' }

  let galleries: { townName: string; year: number }[]
  try {
    galleries = JSON.parse(galleriesJson)
  } catch {
    return { error: 'Invalid gallery data.' }
  }
  if (galleries.length === 0) return { error: 'No galleries selected.' }

  let claimed = 0

  for (const { townName, year } of galleries) {
    const town = await prisma.town.findUnique({ where: { name: townName } })
    if (!town) continue

    const project = await prisma.project.findFirst({
      where: { townId: town.id, year },
      include: { user: true },
    })
    if (!project) continue
    if (project.user.role !== 'PENDING') continue

    await prisma.$transaction([
      prisma.project.update({
        where: { id: project.id },
        data: {
          userId: targetUser.id,
          ...(publishOnClaim ? { published: true } : {}),
        },
      }),
      prisma.photo.updateMany({
        where: { projectId: project.id },
        data: { userId: targetUser.id },
      }),
    ])
    claimed++
  }

  revalidatePath('/admin/connect')
  revalidatePath('/admin/projects')
  revalidatePath('/admin')
  revalidatePath('/dashboard')

  if (claimed === 0) {
    return { error: 'No claimable galleries found.' }
  }

  return { error: null }
}

export async function disconnectGallery(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const townName = formData.get('townName') as string
  const year = parseInt(formData.get('year') as string)

  if (!townName || !year) return { error: 'Missing required fields.' }

  const town = await prisma.town.findUnique({ where: { name: townName } })
  if (!town) return { error: 'Town not found.' }

  const project = await prisma.project.findFirst({
    where: { townId: town.id, year },
  })
  if (!project) return { error: 'No connected project found.' }

  // No Blob cleanup needed — these are filesystem photos
  await prisma.project.delete({ where: { id: project.id } })

  revalidatePath('/admin/connect')
  revalidatePath('/admin/projects')
  revalidatePath('/admin')
  return { error: null }
}
