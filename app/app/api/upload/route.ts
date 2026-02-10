import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role === 'PENDING') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          'Photo upload requires BLOB_READ_WRITE_TOKEN to be set. Configure Vercel Blob to enable uploads.',
      },
      { status: 503 }
    )
  }

  const formData = await request.formData()
  const projectId = formData.get('projectId') as string
  const files = formData.getAll('files') as File[]
  const dimensionsRaw = formData.getAll('dimensions') as string[]

  if (!projectId || files.length === 0) {
    return NextResponse.json({ error: 'Missing project or files' }, { status: 400 })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Parse dimensions sent from client
  const dimensionsMap = new Map<string, { width: number; height: number }>()
  for (const d of dimensionsRaw) {
    try {
      const parsed = JSON.parse(d)
      dimensionsMap.set(parsed.name, {
        width: parsed.width || 0,
        height: parsed.height || 0,
      })
    } catch {
      // Skip invalid
    }
  }

  const maxOrder = await prisma.photo.aggregate({
    where: { projectId },
    _max: { order: true },
  })
  let nextOrder = (maxOrder._max.order ?? -1) + 1

  const { put } = await import('@vercel/blob')
  const uploaded = []

  for (const file of files) {
    if (
      !file.type.startsWith('image/jpeg') &&
      !file.type.startsWith('image/png') &&
      !file.type.startsWith('image/webp')
    ) {
      continue
    }
    if (file.size > 20 * 1024 * 1024) continue

    const pathname = `projects/${projectId}/${file.name}`
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    const dims = dimensionsMap.get(file.name) || { width: 0, height: 0 }

    const photo = await prisma.photo.create({
      data: {
        projectId,
        userId: session.user.id,
        filename: file.name,
        blobUrl: blob.url,
        pathname: blob.pathname,
        width: dims.width,
        height: dims.height,
        size: file.size,
        order: nextOrder++,
      },
    })

    uploaded.push(photo)
  }

  // Update project photo count
  const count = await prisma.photo.count({ where: { projectId } })
  await prisma.project.update({
    where: { id: projectId },
    data: { photoCount: count },
  })

  return NextResponse.json({ photos: uploaded, count })
}
