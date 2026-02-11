import 'dotenv/config'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import { prisma } from '../lib/db'
import { allTowns } from '../lib/towns'
import { assertR2Configured, uploadBufferToR2 } from '../lib/storage/r2'

const API_KEY = '02a9672f3e09a525145b60466913a599'
const USER_ID = '30563993@N07'
const FLICKR_API = 'https://www.flickr.com/services/rest/'
const PLACEHOLDER_DOMAIN = 'smalltown.gallery'

type FlickrSet = {
  id: string
  title: { _content: string }
  photos: number | string
  date_create: string
}

type FlickrPhoto = {
  id: string
  title?: string
  datetaken?: string
  dateupload?: string
  tags?: string
  url_o?: string
  url_k?: string
  url_h?: string
  url_l?: string
  url_c?: string
  url_z?: string
  width_o?: string
  height_o?: string
  width_k?: string
  height_k?: string
  width_h?: string
  height_h?: string
  width_l?: string
  height_l?: string
  width_c?: string
  height_c?: string
  width_z?: string
  height_z?: string
}

type ExistingPhotoMeta = {
  filename: string
  exifData: unknown
}

type AlbumParse = {
  townName: string
  photographer: string
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
  let town = rawTown.trim()
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
  }

  if (aliases[town]) return aliases[town]
  if (/^\s*thebes\s*$/i.test(town)) return 'Thebes'
  return town
}

function parseAlbumTitle(title: string): AlbumParse {
  const trimmed = title.trim()

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

  const photographer = photographerRaw || 'Unknown'
  return { townName, photographer }
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

  return null
}

async function flickrJson<T = unknown>(params: Record<string, string | number>) {
  const url = new URL(FLICKR_API)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('user_id', USER_ID)
  url.searchParams.set('format', 'json')
  url.searchParams.set('nojsoncallback', '1')

  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`Flickr request failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json() as { stat?: string; message?: string }
  if (data.stat && data.stat !== 'ok') {
    throw new Error(`Flickr API error: ${data.message || 'unknown'}`)
  }
  return data as T
}

async function getAllSets() {
  const data = await flickrJson<{ photosets: { photoset: FlickrSet[] } }>({
    method: 'flickr.photosets.getList',
    per_page: 500,
    page: 1,
  })
  return data.photosets.photoset
}

async function getSetPhotos(setId: string) {
  const data = await flickrJson<{ photoset: { photo: FlickrPhoto[] } }>({
    method: 'flickr.photosets.getPhotos',
    photoset_id: setId,
    extras: 'date_taken,date_upload,url_o,url_k,url_h,url_l,url_c,url_z,o_dims,tags',
    per_page: 500,
    page: 1,
  })
  return data.photoset.photo
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

function yearFromSet(set: FlickrSet) {
  const ts = Number(set.date_create)
  if (Number.isFinite(ts) && ts > 0) {
    return new Date(ts * 1000).getUTCFullYear()
  }
  return new Date().getUTCFullYear()
}

function pickBestUrl(photo: FlickrPhoto) {
  const keys: Array<['o' | 'k' | 'h' | 'l' | 'c' | 'z', keyof FlickrPhoto, keyof FlickrPhoto, keyof FlickrPhoto]> = [
    ['o', 'url_o', 'width_o', 'height_o'],
    ['k', 'url_k', 'width_k', 'height_k'],
    ['h', 'url_h', 'width_h', 'height_h'],
    ['l', 'url_l', 'width_l', 'height_l'],
    ['c', 'url_c', 'width_c', 'height_c'],
    ['z', 'url_z', 'width_z', 'height_z'],
  ]

  for (const [sizeKey, urlKey, widthKey, heightKey] of keys) {
    const url = photo[urlKey]
    if (!url) continue
    const width = Number(photo[widthKey]) || 1200
    const height = Number(photo[heightKey]) || 800
    return { sizeKey, url, width, height }
  }

  return null
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

async function importSet(set: FlickrSet) {
  const title = set.title?._content || ''
  const parsed = parseAlbumTitle(title)
  const resolvedTown = findTownName(parsed.townName)

  if (!resolvedTown) {
    console.log(`SKIP town-not-found | ${set.id} | ${title} | parsed="${parsed.townName}"`)
    return { imported: 0, skipped: Number(set.photos) || 0, failed: 0, skippedSet: true }
  }

  const year = yearFromSet(set)
  const town = await ensureTown(resolvedTown)
  if (!town) {
    console.log(`SKIP town-meta-missing | ${set.id} | ${title} | town="${resolvedTown}"`)
    return { imported: 0, skipped: Number(set.photos) || 0, failed: 0, skippedSet: true }
  }

  const setPhotos = await getSetPhotos(set.id)
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

  for (let i = 0; i < setPhotos.length; i++) {
    const p = setPhotos[i]
    const photoId = p.id
    const filename = `${photoId}.jpg`

    if (existingByName.has(filename) || existingByFlickrId.has(photoId)) {
      skipped++
      continue
    }

    const best = pickBestUrl(p)
    if (!best) {
      failed++
      console.log(`  photo-no-url ${set.id}/${photoId}`)
      continue
    }

    try {
      const imageRes = await fetch(best.url)
      if (!imageRes.ok) {
        failed++
        console.log(`  photo-fetch-failed ${set.id}/${photoId} (${imageRes.status})`)
        continue
      }
      const arrayBuffer = await imageRes.arrayBuffer()
      const file = Buffer.from(arrayBuffer)
      const blobPath = `projects/${project.id}/flickr-${filename}`

      const uploaded = await uploadBufferToR2({
        pathname: blobPath,
        body: file,
        contentType: 'image/jpeg',
      })

      await prisma.photo.create({
        data: {
          projectId: project.id,
          userId: project.userId,
          filename,
          title: p.title || null,
          dateTaken: parseDateTaken(p.datetaken),
          blobUrl: uploaded.url,
          pathname: uploaded.pathname,
          width: best.width,
          height: best.height,
          size: file.length,
          order: existing.length + imported,
          exifData: {
            source: 'flickr',
            flickrSetId: set.id,
            flickrId: photoId,
            flickrTitle: p.title || null,
            dateTaken: p.datetaken || null,
            dateUploaded: p.dateupload || null,
            tags: p.tags || null,
            flickrSize: best.sizeKey,
          },
        },
      })

      imported++
      existingByName.add(filename)
      existingByFlickrId.add(photoId)
      process.stdout.write(`  ${resolvedTown} ${year} ${parsed.photographer}: ${imported}/${setPhotos.length} imported\r`)
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : String(err)
      console.log(`  photo-import-error ${set.id}/${photoId}: ${message}`)
    }
  }

  const totalCount = existing.length + imported
  await prisma.project.update({ where: { id: project.id }, data: { photoCount: totalCount } })

  console.log(`\nDONE | ${set.id} | ${resolvedTown} | ${year} | ${parsed.photographer} | imported=${imported} skipped=${skipped} failed=${failed} total_project=${totalCount}`)
  return { imported, skipped, failed, skippedSet: false }
}

async function main() {
  assertR2Configured()
  if (!process.env.POSTGRES_PRISMA_URL && !process.env.DATABASE_URL) {
    throw new Error('Missing POSTGRES_PRISMA_URL/DATABASE_URL')
  }

  const sets = await getAllSets()
  console.log(`Flickr albums found: ${sets.length}`)

  let imported = 0
  let skipped = 0
  let failed = 0
  let skippedSets = 0

  for (const set of sets) {
    const result = await importSet(set)
    imported += result.imported
    skipped += result.skipped
    failed += result.failed
    if (result.skippedSet) skippedSets++
  }

  console.log('')
  console.log('Import summary')
  console.log(JSON.stringify({
    albums: sets.length,
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
