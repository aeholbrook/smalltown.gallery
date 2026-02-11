import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isR2Configured, uploadBufferToR2 } from '@/lib/storage/r2'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 20 * 1024 * 1024
// No-op tweak to trigger a fresh deployment.

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_') || 'upload.jpg'
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role === 'PENDING') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isR2Configured()) {
    return NextResponse.json({ error: 'R2 is not configured.' }, { status: 500 })
  }

  const form = await request.formData()
  const projectId = String(form.get('projectId') || '')
  const width = Number(form.get('width') || 0)
  const height = Number(form.get('height') || 0)
  const file = form.get('file')

  if (!projectId || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing project or file' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  const isAdmin = session.user.role === 'ADMIN'
  if (!project || (!isAdmin && project.userId !== session.user.id)) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const originalName = sanitizeFilename(file.name)
  const pathname = `projects/${projectId}/${randomUUID()}-${originalName}`

  const bytes = Buffer.from(await file.arrayBuffer())
  const uploaded = await uploadBufferToR2({
    pathname,
    body: bytes,
    contentType: file.type,
    cacheControl: 'public, max-age=31536000, immutable',
  })

  return NextResponse.json({
    filename: originalName,
    blobUrl: uploaded.url,
    pathname: uploaded.pathname,
    size: file.size,
    width,
    height,
  })
}
