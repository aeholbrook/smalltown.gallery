'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type ActionState = { error: string | null }
type ActionStateWithSuccess = { error: string | null; success: boolean }

export async function createProject(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id || session.user.role === 'PENDING') {
    return { error: 'Unauthorized' }
  }

  const townId = formData.get('townId') as string
  const year = parseInt(formData.get('year') as string)
  const description = (formData.get('description') as string)?.trim() || null
  const title = (formData.get('title') as string)?.trim() || null

  if (!townId) return { error: 'Please select a town.' }
  if (!year || year < 2000 || year > new Date().getFullYear() + 1) {
    return { error: 'Please enter a valid year (2000 or later).' }
  }

  const town = await prisma.town.findUnique({ where: { id: townId } })
  if (!town) return { error: 'Selected town not found.' }

  const existing = await prisma.project.findUnique({
    where: {
      townId_year_userId: { townId, year, userId: session.user.id },
    },
  })
  if (existing) {
    return { error: `You already have a project for ${town.name} in ${year}.` }
  }

  const project = await prisma.project.create({
    data: {
      townId,
      year,
      userId: session.user.id,
      photographer: session.user.name || 'Unknown',
      title,
      description,
    },
  })

  redirect(`/dashboard/projects/${project.id}`)
}

export async function updateProject(
  _prevState: ActionStateWithSuccess,
  formData: FormData
): Promise<ActionStateWithSuccess> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized', success: false }

  const projectId = formData.get('projectId') as string
  const title = (formData.get('title') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project || project.userId !== session.user.id) {
    return { error: 'Project not found.', success: false }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { title, description, notes },
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { error: null, success: true }
}

export async function toggleProjectPublished(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const projectId = formData.get('projectId') as string

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project || project.userId !== session.user.id) {
    return { error: 'Project not found.' }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { published: !project.published },
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard')
  return { error: null }
}

export async function deleteProject(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const projectId = formData.get('projectId') as string

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { photos: true },
  })
  if (!project || project.userId !== session.user.id) {
    return { error: 'Project not found.' }
  }

  // Delete photos from Vercel Blob if configured (skip filesystem photos served via /photos/ route)
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

  redirect('/dashboard')
}
