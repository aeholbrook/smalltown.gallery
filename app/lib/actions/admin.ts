'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'

type ActionState = { error: string | null }

const TOWNS_ROOT = path.join(process.cwd(), '..', 'towns')

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

// --- Connect Filesystem Galleries ---

export async function connectGallery(
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

  if (!townName || !year || !userId) {
    return { error: 'Missing required fields.' }
  }

  // Find town in DB
  const town = await prisma.town.findUnique({ where: { name: townName } })
  if (!town) return { error: `Town "${townName}" not found in database.` }

  // Verify user exists and is approved
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'Selected user not found.' }
  if (user.role === 'PENDING') return { error: 'User must be approved before assigning galleries.' }

  // Check if already connected
  const existing = await prisma.project.findFirst({
    where: { townId: town.id, year },
  })
  if (existing) {
    return { error: `A project for ${townName} (${year}) already exists.` }
  }

  // Read filesystem data
  const yearDir = path.join(TOWNS_ROOT, townName, String(year))

  let photographer = 'Unknown'
  try {
    const content = await fs.readFile(path.join(yearDir, 'photographer.txt'), 'utf-8')
    photographer = content.replace(/^\uFEFF/, '').trim()
  } catch {
    // use default
  }

  let description: string | null = null
  try {
    const content = await fs.readFile(path.join(yearDir, 'description.txt'), 'utf-8')
    description = content.replace(/^\uFEFF/, '').trim()
  } catch {
    // no description
  }

  let allFiles: string[]
  try {
    allFiles = await fs.readdir(yearDir)
  } catch {
    return { error: `Directory not found: ${townName}/${year}` }
  }

  const photoFiles = allFiles
    .filter(f => /\.(jpg|jpeg)$/i.test(f))
    .filter(f => !f.endsWith('~'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

  if (photoFiles.length === 0) {
    return { error: `No photos found in ${townName}/${year}.` }
  }

  // Create project
  const project = await prisma.project.create({
    data: {
      townId: town.id,
      year,
      photographer,
      userId,
      published: true,
      description,
      photoCount: photoFiles.length,
    },
  })

  // Create photo records
  const photoData = await Promise.all(
    photoFiles.map(async (filename, index) => {
      const filePath = path.join(yearDir, filename)
      let size = 0
      try {
        const stat = await fs.stat(filePath)
        size = stat.size
      } catch {
        // default to 0
      }
      return {
        projectId: project.id,
        userId,
        filename,
        blobUrl: `/photos/${encodeURIComponent(townName)}/${year}/${encodeURIComponent(filename)}`,
        pathname: filePath,
        width: 1200,
        height: 800,
        size,
        order: index,
      }
    })
  )

  await prisma.photo.createMany({ data: photoData })

  revalidatePath('/admin/connect')
  revalidatePath('/admin/projects')
  revalidatePath('/admin')
  return { error: null }
}

export async function bulkConnectGalleries(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const userId = formData.get('userId') as string
  const galleriesJson = formData.get('galleries') as string

  if (!userId || !galleriesJson) {
    return { error: 'Missing required fields.' }
  }

  let galleries: { townName: string; year: number }[]
  try {
    galleries = JSON.parse(galleriesJson)
  } catch {
    return { error: 'Invalid gallery data.' }
  }

  if (galleries.length === 0) {
    return { error: 'No galleries selected.' }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'Selected user not found.' }
  if (user.role === 'PENDING') return { error: 'User must be approved before assigning galleries.' }

  let connected = 0
  let skipped = 0

  for (const { townName, year } of galleries) {
    const town = await prisma.town.findUnique({ where: { name: townName } })
    if (!town) { skipped++; continue }

    const existing = await prisma.project.findFirst({
      where: { townId: town.id, year },
    })
    if (existing) { skipped++; continue }

    const yearDir = path.join(TOWNS_ROOT, townName, String(year))

    let photographer = 'Unknown'
    try {
      const content = await fs.readFile(path.join(yearDir, 'photographer.txt'), 'utf-8')
      photographer = content.replace(/^\uFEFF/, '').trim()
    } catch { /* use default */ }

    let description: string | null = null
    try {
      const content = await fs.readFile(path.join(yearDir, 'description.txt'), 'utf-8')
      description = content.replace(/^\uFEFF/, '').trim()
    } catch { /* no description */ }

    let allFiles: string[]
    try {
      allFiles = await fs.readdir(yearDir)
    } catch { skipped++; continue }

    const photoFiles = allFiles
      .filter(f => /\.(jpg|jpeg)$/i.test(f))
      .filter(f => !f.endsWith('~'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

    if (photoFiles.length === 0) { skipped++; continue }

    const project = await prisma.project.create({
      data: {
        townId: town.id,
        year,
        photographer,
        userId,
        published: true,
        description,
        photoCount: photoFiles.length,
      },
    })

    const photoData = await Promise.all(
      photoFiles.map(async (filename, index) => {
        const filePath = path.join(yearDir, filename)
        let size = 0
        try {
          const stat = await fs.stat(filePath)
          size = stat.size
        } catch { /* default to 0 */ }
        return {
          projectId: project.id,
          userId,
          filename,
          blobUrl: `/photos/${encodeURIComponent(townName)}/${year}/${encodeURIComponent(filename)}`,
          pathname: filePath,
          width: 1200,
          height: 800,
          size,
          order: index,
        }
      })
    )

    await prisma.photo.createMany({ data: photoData })
    connected++
  }

  revalidatePath('/admin/connect')
  revalidatePath('/admin/projects')
  revalidatePath('/admin')

  if (skipped > 0 && connected === 0) {
    return { error: `All ${skipped} galleries were already connected or had errors.` }
  }

  return { error: null }
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
