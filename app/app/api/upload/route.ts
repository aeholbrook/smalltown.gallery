import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface UploadedPhotoInput {
  filename: string
  blobUrl: string
  pathname: string
  size: number
  width: number
  height: number
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role === 'PENDING') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = (await request.json()) as {
    projectId?: string
    photos?: UploadedPhotoInput[]
  }

  const projectId = payload.projectId
  const photos = payload.photos || []

  if (!projectId || photos.length === 0) {
    return NextResponse.json({ error: 'Missing project or photos' }, { status: 400 })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const maxOrder = await prisma.photo.aggregate({
    where: { projectId },
    _max: { order: true },
  })
  let nextOrder = (maxOrder._max.order ?? -1) + 1

  const created = []
  for (const photo of photos) {
    const record = await prisma.photo.create({
      data: {
        projectId,
        userId: session.user.id,
        filename: photo.filename,
        blobUrl: photo.blobUrl,
        pathname: photo.pathname,
        width: photo.width || 0,
        height: photo.height || 0,
        size: photo.size || 0,
        order: nextOrder++,
      },
    })
    created.push(record)
  }

  const count = await prisma.photo.count({ where: { projectId } })
  await prisma.project.update({
    where: { id: projectId },
    data: { photoCount: count },
  })

  return NextResponse.json({ photos: created, count })
}
