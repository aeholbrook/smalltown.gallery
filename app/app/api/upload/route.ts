import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getR2PublicUrl } from '@/lib/storage/r2'

interface UploadedPhotoInput {
  filename: string
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
  const isAdmin = session.user.role === 'ADMIN'
  if (!project || (!isAdmin && project.userId !== session.user.id)) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Pathnames must stay inside this project's prefix — the sign route only issues
  // keys there, and deletePhoto later deletes photo.pathname from R2 verbatim.
  const prefix = `projects/${projectId}/`
  for (const photo of photos) {
    const pathname = photo.pathname || ''
    if (!pathname.startsWith(prefix) || pathname.includes('..')) {
      return NextResponse.json({ error: 'Invalid photo pathname' }, { status: 400 })
    }
  }

  const { created, count } = await prisma.$transaction(async (tx) => {
    const maxOrder = await tx.photo.aggregate({
      where: { projectId },
      _max: { order: true },
    })
    let nextOrder = (maxOrder._max.order ?? -1) + 1

    const created = []
    for (const photo of photos) {
      const record = await tx.photo.create({
        data: {
          projectId,
          userId: project.userId,
          filename: photo.filename,
          blobUrl: getR2PublicUrl(photo.pathname),
          pathname: photo.pathname,
          width: photo.width || 0,
          height: photo.height || 0,
          size: photo.size || 0,
          order: nextOrder++,
        },
      })
      created.push(record)
    }

    const count = await tx.photo.count({ where: { projectId } })
    await tx.project.update({
      where: { id: projectId },
      data: { photoCount: count },
    })

    return { created, count }
  })

  return NextResponse.json({ photos: created, count })
}
