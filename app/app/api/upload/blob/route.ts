import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Deprecated endpoint. Use /api/upload/r2.' },
    { status: 410 }
  )
}
