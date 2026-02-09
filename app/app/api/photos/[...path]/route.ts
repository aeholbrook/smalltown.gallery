import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const TOWNS_ROOT = path.join(process.cwd(), '..', 'towns')
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg'])

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

  const ext = path.extname(filename).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  if (filename.includes('..') || townName.includes('..') || year.includes('..')) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const filePath = path.join(TOWNS_ROOT, townName, year, filename)
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(TOWNS_ROOT))) {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const stat = await fs.stat(filePath)
    const fileBuffer = await fs.readFile(filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(stat.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Last-Modified': stat.mtime.toUTCString(),
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
