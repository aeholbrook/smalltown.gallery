import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import { prisma } from '../lib/db'
import { allTowns } from '../lib/towns'
import { assertR2Configured, uploadBufferToR2 } from '../lib/storage/r2'

const ROOT = '/opt/smalltown.gallery/flickr-import/full-albums'
const PLACEHOLDER_DOMAIN = 'smalltown.gallery'

type AlbumJson = {
  photoset_id: string
  title: string
  town_raw?: string
  photographer_raw?: string
  year_guess?: number | null
  photos: Array<{
    id: string
    filename?: string
    title?: string
    datetaken?: string
    dateupload?: string
    tags?: string
  }>
}

type ExistingPhotoMeta = {
  filename: string
  exifData: unknown
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function titleCaseTown(raw: string) {
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map(part => {
      if (part.toLowerCase() === 'du') return 'du'
      if (/^[a-z]\.$/i.test(part)) return part.toUpperCase()
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    })
    .join(' ')
}

function normalizeTownRaw(rawTown: string) {
  let town = (rawTown || '').trim()
  town = town.replace(/^\s+|\s+$/g, '')
  town = town.replace(/\s+/g, ' ')
  town = town.replace(/\s*,\s*IL$/i, '')
  town = town.replace(/\s*,\s*IN$/i, ', IN')
  town = town.replace(/\s+IL$/i, '')
  town = town.replace(/\s*\(.*\)$/, '')
  town = town.replace(/\s*\.$/, '')

  const aliases: Record<string, string> = {
    'North Cairo': 'Future City / North Cairo',
    'Future City/North Cairo': 'Future City / North Cairo',
    'New Harmony': 'New Harmony, IN',
    'Desoto': 'Desoto',
    'DeSoto': 'Desoto',
    'Sesser': 'Sesser/Valier',
    'Goreville,IL': 'Goreville',
    'Orient IL': 'Orient',
    'Prairie du Rocher': 'Prairie du Rocher',
    'Gorham': 'Gorham, Neunart, and Jacob',
  }

  if (aliases[town]) return aliases[town]
  if (/^\s*thebes\s*$/i.test(town)) return 'Thebes'
  return town
}

function parseAlbumTitle(title: string) {
  const trimmed = (title || '').trim()

  if (trimmed === "Small Town Documentary Class '08") {
    return { townName: 'Carbondale', photographer: "Small Town Documentary Class '08" }
  }
  if (/^small town 2010 class photo$/i.test(trimmed)) {
    return { townName: 'Carbondale', photographer: 'Small Town 2010 Class' }
  }
  if (/^small town documentary exhibition$/i.test(trimmed)) {
    return { townName: 'Carbondale', photographer: 'Small Town Documentary Exhibition' }
  }

  const parts = trimmed.split('/')
  const townRaw = parts[0] || trimmed
  const photographerRaw = parts.slice(1).join('/').trim()

  let townName = normalizeTownRaw(townRaw)
  if (!townName.includes('/')) townName = titleCaseTown(townName)

  return { townName, photographer: photographerRaw || 'Unknown' }
}

function findTownName(candidate: string): string | null {
  const cleaned = candidate.trim().toLowerCase()

  const exact = allTowns.find(t => t.name.toLowerCase() === cleaned)
  if (exact) return exact.name

  const noPunct = cleaned.replace(/[^a-z0-9]+/g, '')
  const fuzzy = allTowns.find(t => t.name.toLowerCase().replace(/[^a-z0-9]+/g, '') === noPunct)
  if (fuzzy) return fuzzy.name

  if (cleaned === 'orient il') return 'Orient'
  if (cleaned === 'future city / north cairo') return 'Future City / North Cairo'
  if (cleaned === 'new harmony') return 'New Harmony, IN'
  if (cleaned === 'gorham') return 'Gorham, Neunart, and Jacob'

  return null
}

async function ensurePhotographerUser(photographer: string) {
  const email = `legacy+${slugify(photographer) || 'unknown'}@${PLACEHOLDER_DOMAIN}`
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return existing

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10)
  return prisma.user.create({
    data: {
      email,
      name: photographer,
      passwordHash,
      role: Role.PENDING,
    },
  })
}

async function ensureTown(townName: string) {
  const existing = await prisma.town.findUnique({ where: { name: townName } })
  if (existing) return existing

  const meta = allTowns.find(t => t.name === townName)
  if (!meta) return null

  return prisma.town.create({
    data: {
      name: townName,
      latitude: meta.lat,
      longitude: meta.lng,
      state: 'Illinois',
    },
  })
}

function parseDateTaken(datetaken?: string) {
  if (!datetaken) return null
  try {
    const d = new Date(datetaken.replace(' ', 'T') + 'Z')
    if (Number.isNaN(d.getTime())) return null
    return d
  } catch {
    return null
  }
}

function existingFlickrIds(rows: ExistingPhotoMeta[]) {
  const ids = new Set<string>()
  for (const row of rows) {
    if (!row.exifData || typeof row.exifData !== 'object') continue
    const maybeId = (row.exifData as { flickrId?: unknown }).flickrId
    if (typeof maybeId === 'string' && maybeId) ids.add(maybeId)
  }
  return ids
}

async function importAlbumFolder(folder: string) {
  const albumPath = path.join(ROOT, folder, 'album.json')
  if (!fs.existsSync(albumPath)) return { imported: 0, skipped: 0, failed: 0, skippedSet: true }

  const album = JSON.parse(fs.readFileSync(albumPath, 'utf8')) as AlbumJson
  const parsed = parseAlbumTitle(album.title)
  const resolvedTown = findTownName(parsed.townName)

  if (!resolvedTown) {
    console.log(`SKIP town-not-found | ${album.photoset_id} | ${album.title} | parsed="${parsed.townName}"`)
    return { imported: 0, skipped: album.photos.length, failed: 0, skippedSet: true }
  }

  const year = Number(album.year_guess) || 0
  if (!year) {
    console.log(`SKIP year-missing | ${album.photoset_id} | ${album.title}`)
    return { imported: 0, skipped: album.photos.length, failed: 0, skippedSet: true }
  }

  const town = await ensureTown(resolvedTown)
  if (!town) {
    console.log(`SKIP town-meta-missing | ${album.photoset_id} | ${album.title} | town="${resolvedTown}"`)
    return { imported: 0, skipped: album.photos.length, failed: 0, skippedSet: true }
  }

  const user = await ensurePhotographerUser(parsed.photographer)

  let project = await prisma.project.findFirst({
    where: {
      townId: town.id,
      year,
      photographer: parsed.photographer,
    },
    select: { id: true, userId: true },
  })

  if (!project) {
    project = await prisma.project.create({
      data: {
        townId: town.id,
        year,
        photographer: parsed.photographer,
        userId: user.id,
        published: false,
        photoCount: 0,
      },
      select: { id: true, userId: true },
    })
  }

  const existing = await prisma.photo.findMany({
    where: { projectId: project.id },
    select: { filename: true, exifData: true },
  })
  const existingByName = new Set(existing.map(p => p.filename))
  const existingByFlickrId = existingFlickrIds(existing)

  let imported = 0
  let skipped = 0
  let failed = 0

  for (const photo of album.photos || []) {
    const photoId = String(photo.id || '')
    if (!photoId) {
      failed++
      continue
    }

    const filename = `${photoId}.jpg`
    if (existingByName.has(filename) || existingByFlickrId.has(photoId)) {
      skipped++
      continue
    }

    const localPath = path.join(ROOT, folder, filename)
    if (!fs.existsSync(localPath)) {
      failed++
      continue
    }

    try {
      const file = fs.readFileSync(localPath)
      const pathname = `projects/${project.id}/flickr-${filename}`
      const uploaded = await uploadBufferToR2({
        pathname,
        body: file,
        contentType: 'image/jpeg',
      })

      await prisma.photo.create({
        data: {
          projectId: project.id,
          userId: project.userId,
          filename,
          title: photo.title || null,
          dateTaken: parseDateTaken(photo.datetaken),
          blobUrl: uploaded.url,
          pathname: uploaded.pathname,
          width: 1200,
          height: 800,
          size: file.length,
          order: existing.length + imported,
          exifData: {
            source: 'flickr',
            flickrSetId: album.photoset_id,
            flickrId: photoId,
            flickrTitle: photo.title || null,
            dateTaken: photo.datetaken || null,
            dateUploaded: photo.dateupload || null,
            tags: photo.tags || null,
            sourceType: 'local-full-albums',
          },
        },
      })

      imported++
      process.stdout.write(`  ${resolvedTown} ${year} ${parsed.photographer}: ${imported}/${album.photos.length} imported\r`)
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : String(err)
      console.log(`  photo-import-error ${album.photoset_id}/${photoId}: ${message}`)
    }
  }

  const totalCount = await prisma.photo.count({ where: { projectId: project.id } })
  await prisma.project.update({ where: { id: project.id }, data: { photoCount: totalCount } })

  console.log(`\nDONE | ${album.photoset_id} | ${resolvedTown} | ${year} | ${parsed.photographer} | imported=${imported} skipped=${skipped} failed=${failed} total_project=${totalCount}`)
  return { imported, skipped, failed, skippedSet: false }
}

async function main() {
  assertR2Configured()
  if (!process.env.POSTGRES_PRISMA_URL && !process.env.DATABASE_URL) {
    throw new Error('Missing POSTGRES_PRISMA_URL/DATABASE_URL')
  }

  const folders = fs.readdirSync(ROOT).filter(d => fs.statSync(path.join(ROOT, d)).isDirectory()).sort()
  console.log(`Local Flickr album folders found: ${folders.length}`)

  let imported = 0
  let skipped = 0
  let failed = 0
  let skippedSets = 0

  for (const folder of folders) {
    const result = await importAlbumFolder(folder)
    imported += result.imported
    skipped += result.skipped
    failed += result.failed
    if (result.skippedSet) skippedSets++
  }

  console.log('')
  console.log('Import summary')
  console.log(JSON.stringify({
    albums: folders.length,
    skippedSets,
    imported,
    skipped,
    failed,
  }, null, 2))
}

main()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
