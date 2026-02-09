import { NextRequest, NextResponse } from 'next/server'
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg'])
const LEGACY_PHOTOS_BASE_URL = process.env.LEGACY_PHOTOS_BASE_URL

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path

  if (segments.length !== 3) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const [townName, year, filename] = segments.map(decodeURIComponent)

  if (!/^\d{4}$/.test(year)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const ext = filename.includes('.')
    ? filename.slice(filename.lastIndexOf('.')).toLowerCase()
    : ''
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  if (
    filename.includes('..') ||
    townName.includes('..') ||
    year.includes('..') ||
    townName.includes('/') ||
    filename.includes('/')
  ) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // In production (Vercel), serve legacy filesystem photos from an external origin
  // to avoid bundling large local directories into serverless functions.
  if (LEGACY_PHOTOS_BASE_URL) {
    const base = LEGACY_PHOTOS_BASE_URL.replace(/\/+$/, '')
    const target = `${base}/${encodeURIComponent(townName)}/${year}/${encodeURIComponent(filename)}`
    return NextResponse.redirect(target, 307)
  }

  return new NextResponse('Not Found', { status: 404 })
}
