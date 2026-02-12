import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getR2SignedUploadUrl, isR2Configured } from '@/lib/storage/r2'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 20 * 1024 * 1024

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

  const payload = (await request.json()) as {
    projectId?: string
    filename?: string
    contentType?: string
    size?: number
  }

  const projectId = String(payload.projectId || '')
  const filename = sanitizeFilename(String(payload.filename || 'upload.jpg'))
  const contentType = String(payload.contentType || '')
  const size = Number(payload.size || 0)

  if (!projectId || !contentType || !size) {
    return NextResponse.json({ error: 'Missing project or file metadata' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  if (size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  const isAdmin = session.user.role === 'ADMIN'
  if (!project || (!isAdmin && project.userId !== session.user.id)) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const pathname = `projects/${projectId}/${randomUUID()}-${filename}`
  const signed = await getR2SignedUploadUrl({
    pathname,
    contentType,
    cacheControl: 'public, max-age=31536000, immutable',
  })

  return NextResponse.json({
    filename,
    pathname: signed.pathname,
    blobUrl: signed.url,
    uploadUrl: signed.signedUrl,
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
