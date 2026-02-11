'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { deleteFromR2, isR2Configured } from '@/lib/storage/r2'
import { revalidatePath } from 'next/cache'

type ActionState = { error: string | null }

export async function updatePhotoCaption(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const photoId = formData.get('photoId') as string
  const caption = (formData.get('caption') as string)?.trim() || null

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { project: true },
  })
  const isAdmin = session.user.role === 'ADMIN'
  if (!photo || (!isAdmin && photo.userId !== session.user.id)) {
    return { error: 'Photo not found.' }
  }

  await prisma.photo.update({
    where: { id: photoId },
    data: { caption },
  })

  revalidatePath(`/dashboard/projects/${photo.projectId}`)
  revalidatePath(`/admin/projects/${photo.projectId}`)
  return { error: null }
}

export async function reorderPhotos(
  projectId: string,
  photoIds: string[]
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })
  const isAdmin = session.user.role === 'ADMIN'
  if (!project || (!isAdmin && project.userId !== session.user.id)) {
    return { error: 'Project not found.' }
  }

  // Validate all photoIds belong to this project
  const photos = await prisma.photo.findMany({
    where: { id: { in: photoIds } },
    select: { id: true, projectId: true },
  })
  if (photos.length !== photoIds.length || photos.some(p => p.projectId !== projectId)) {
    return { error: 'Invalid photo IDs.' }
  }

  await prisma.$transaction(
    photoIds.map((id, index) =>
      prisma.photo.update({ where: { id }, data: { order: index } })
    )
  )

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath(`/admin/projects/${projectId}`)
  return { error: null }
}

export async function deletePhoto(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const photoId = formData.get('photoId') as string

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { project: true },
  })
  const isAdmin = session.user.role === 'ADMIN'
  if (!photo || (!isAdmin && photo.userId !== session.user.id)) {
    return { error: 'Photo not found.' }
  }

  // Delete from object storage if configured (skip filesystem photos served via /photos/ route)
  if (isR2Configured() && !photo.blobUrl.startsWith('/photos/')) {
    try {
      await deleteFromR2(photo.pathname || photo.blobUrl)
    } catch {
      // Object may already be deleted
    }
  }

  await prisma.photo.delete({ where: { id: photoId } })

  // Update project photo count
  const count = await prisma.photo.count({
    where: { projectId: photo.projectId },
  })
  await prisma.project.update({
    where: { id: photo.projectId },
    data: { photoCount: count },
  })

  revalidatePath(`/dashboard/projects/${photo.projectId}`)
  revalidatePath(`/admin/projects/${photo.projectId}`)
  revalidatePath('/admin/projects')
  return { error: null }
}
