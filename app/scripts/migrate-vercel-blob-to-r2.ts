import 'dotenv/config'
import fs from 'fs'
import { prisma } from '../lib/db'
import {
  assertR2Configured,
  getR2PublicUrl,
  r2ObjectExists,
  uploadBufferToR2,
} from '../lib/storage/r2'

const STATE_FILE = '/tmp/migrate-vercel-blob-to-r2-state.json'

function guessContentType(filename: string) {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.jpeg') || lower.endsWith('.jpg')) return 'image/jpeg'
  return 'application/octet-stream'
}

type Candidate = {
  id: string
  filename: string
  pathname: string
  blobUrl: string
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchSourceBytes(url: string) {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetchWithTimeout(url, 30000)
      if (!res.ok) throw new Error(`source fetch failed (${res.status})`)
      return Buffer.from(await res.arrayBuffer())
    } catch (err) {
      lastError = err
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function fetchCandidates(batchSize: number, cursor?: string) {
  return prisma.photo.findMany({
    where: {
      blobUrl: {
        startsWith: 'https://',
      },
      NOT: [
        { blobUrl: { startsWith: process.env.R2_PUBLIC_BASE_URL || '__never__' } },
      ],
      pathname: {
        not: '',
      },
    },
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    take: batchSize,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      filename: true,
      pathname: true,
      blobUrl: true,
    },
  })
}

async function migrateOne(photo: Candidate) {
  const key = photo.pathname
  const targetUrl = getR2PublicUrl(key)

  const exists = await r2ObjectExists(key)
  if (!exists) {
    const bytes = await fetchSourceBytes(photo.blobUrl)
    await uploadBufferToR2({
      pathname: key,
      body: bytes,
      contentType: guessContentType(photo.filename),
    })
  }

  await prisma.photo.update({
    where: { id: photo.id },
    data: {
      blobUrl: targetUrl,
      pathname: key,
    },
  })

  return { existedBefore: exists }
}

async function main() {
  assertR2Configured()

  const stats = {
    scanned: 0,
    migrated: 0,
    updatedOnly: 0,
    failed: 0,
  }

  const batchSize = 100
  let cursor: string | undefined
  if (fs.existsSync(STATE_FILE)) {
    try {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as { cursor?: string }
      cursor = state.cursor
      if (cursor) console.log(`Resuming from cursor ${cursor}`)
    } catch {
      // ignore invalid state and start from the beginning
    }
  }

  while (true) {
    const batch = await fetchCandidates(batchSize, cursor)
    if (batch.length === 0) break

    for (const photo of batch) {
      stats.scanned++
      try {
        const { existedBefore } = await migrateOne(photo)
        if (existedBefore) stats.updatedOnly++
        else stats.migrated++
      } catch (err) {
        stats.failed++
        const msg = err instanceof Error ? err.message : String(err)
        console.log(`FAIL ${photo.id} ${photo.pathname} ${msg}`)
      }
    }

    cursor = batch[batch.length - 1].id
    fs.writeFileSync(STATE_FILE, JSON.stringify({ cursor }))
    console.log(`Processed ${stats.scanned} (migrated=${stats.migrated}, updatedOnly=${stats.updatedOnly}, failed=${stats.failed})`)
  }

  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE)
  console.log('Done')
  console.log(JSON.stringify(stats, null, 2))
}

main()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
