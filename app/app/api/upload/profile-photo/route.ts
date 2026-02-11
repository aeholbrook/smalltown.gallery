import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { isR2Configured, uploadBufferToR2 } from '@/lib/storage/r2'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 10 * 1024 * 1024

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_') || 'profile.jpg'
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isR2Configured()) {
    return NextResponse.json({ error: 'R2 is not configured.' }, { status: 500 })
  }

  const form = await request.formData()
  const file = form.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const originalName = sanitizeFilename(file.name)
  const pathname = `profiles/${session.user.id}/${randomUUID()}-${originalName}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const uploaded = await uploadBufferToR2({
    pathname,
    body: bytes,
    contentType: file.type,
    cacheControl: 'public, max-age=31536000, immutable',
  })

  return NextResponse.json({
    filename: originalName,
    profilePhotoUrl: uploaded.url,
    pathname: uploaded.pathname,
    size: file.size,
  })
}
