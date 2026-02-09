import fs from 'fs/promises'
import type { Dirent } from 'fs'
import path from 'path'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { head, put } from '@vercel/blob'
import { Role } from '@prisma/client'
import { prisma } from '../lib/db'
import { allTowns } from '../lib/towns'

const TOWNS_ROOT = process.env.LOCAL_TOWNS_ROOT || path.join(process.cwd(), '..', 'towns')
const PLACEHOLDER_EMAIL = process.env.LEGACY_PLACEHOLDER_EMAIL || 'unclaimed@smalltown.gallery'
const PLACEHOLDER_NAME = process.env.LEGACY_PLACEHOLDER_NAME || 'Unclaimed Legacy Collection'
const PUBLISH_ON_IMPORT = process.env.LEGACY_PUBLISH_ON_IMPORT === '1'

type TownYear = {
  townName: string
  year: number
  yearDir: string
}

type ImportCounters = {
  scanned: number
  imported: number
  skippedExistingProject: number
  skippedNoPhotos: number
  skippedMissingTownMeta: number
  photoUploaded: number
  photoReused: number
  photoFailed: number
}

function safeSegment(value: string) {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return cleaned || 'unknown'
}

async function readTextFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content.replace(/^\uFEFF/, '').trim()
  } catch {
    return null
  }
}

async function discoverTownYears(rootDir: string): Promise<TownYear[]> {
  const towns = await fs.readdir(rootDir, { withFileTypes: true })
  const entries: TownYear[] = []

  for (const townEntry of towns) {
    if (!townEntry.isDirectory()) continue
    const townName = townEntry.name
    const townDir = path.join(rootDir, townName)

    let years: Dirent[]
    try {
      years = await fs.readdir(townDir, { withFileTypes: true })
    } catch {
      continue
    }

    for (const yearEntry of years) {
      if (!yearEntry.isDirectory()) continue
      if (!/^\d{4}$/.test(yearEntry.name)) continue
      const year = parseInt(yearEntry.name, 10)
      entries.push({
        townName,
        year,
        yearDir: path.join(townDir, yearEntry.name),
      })
    }
  }

  entries.sort((a, b) => {
    const townCmp = a.townName.localeCompare(b.townName)
    if (townCmp !== 0) return townCmp
    return a.year - b.year
  })

  return entries
}

async function ensurePlaceholderUser() {
  const existing = await prisma.user.findUnique({ where: { email: PLACEHOLDER_EMAIL } })
  if (existing) return existing

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10)
  return prisma.user.create({
    data: {
      email: PLACEHOLDER_EMAIL,
      name: PLACEHOLDER_NAME,
      passwordHash,
      role: Role.PENDING,
    },
  })
}

async function ensureTown(townName: string) {
  const existing = await prisma.town.findUnique({ where: { name: townName } })
  if (existing) return existing

  const meta = allTowns.find(t => t.name.toLowerCase() === townName.toLowerCase())
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

async function uploadPhoto(townName: string, year: number, filePath: string, filename: string) {
  const townSeg = safeSegment(townName)
  const blobPath = `legacy/${townSeg}/${year}/${filename}`

  try {
    const existing = await head(blobPath)
    return {
      url: existing.url,
      pathname: existing.pathname,
      reused: true,
    }
  } catch {
    const file = await fs.readFile(filePath)
    const uploaded = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/jpeg',
    })
    return {
      url: uploaded.url,
      pathname: uploaded.pathname,
      reused: false,
    }
  }
}

async function importTownYear(entry: TownYear, placeholderUserId: string, counters: ImportCounters) {
  counters.scanned++

  const town = await ensureTown(entry.townName)
  if (!town) {
    counters.skippedMissingTownMeta++
    console.log(`skip town metadata missing: ${entry.townName}`)
    return
  }

  const existingProject = await prisma.project.findFirst({
    where: { townId: town.id, year: entry.year },
    select: { id: true },
  })
  if (existingProject) {
    counters.skippedExistingProject++
    return
  }

  const files = await fs.readdir(entry.yearDir)
  const photoFiles = files
    .filter(f => /\.(jpg|jpeg)$/i.test(f))
    .filter(f => !f.endsWith('~'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

  if (photoFiles.length === 0) {
    counters.skippedNoPhotos++
    return
  }

  const photographer = (await readTextFile(path.join(entry.yearDir, 'photographer.txt'))) || 'Unknown'
  const description = await readTextFile(path.join(entry.yearDir, 'description.txt'))

  const project = await prisma.project.create({
    data: {
      townId: town.id,
      year: entry.year,
      photographer,
      userId: placeholderUserId,
      published: PUBLISH_ON_IMPORT,
      description,
      photoCount: 0,
    },
  })

  const photosToCreate: {
    projectId: string
    userId: string
    filename: string
    blobUrl: string
    pathname: string
    width: number
    height: number
    size: number
    order: number
  }[] = []

  for (let i = 0; i < photoFiles.length; i++) {
    const filename = photoFiles[i]
    const filePath = path.join(entry.yearDir, filename)
    try {
      const stat = await fs.stat(filePath)
      const uploaded = await uploadPhoto(entry.townName, entry.year, filePath, filename)
      if (uploaded.reused) counters.photoReused++
      else counters.photoUploaded++

      photosToCreate.push({
        projectId: project.id,
        userId: placeholderUserId,
        filename,
        blobUrl: uploaded.url,
        pathname: uploaded.pathname,
        width: 1200,
        height: 800,
        size: stat.size,
        order: i,
      })
    } catch (err) {
      counters.photoFailed++
      console.error(`photo failed: ${entry.townName}/${entry.year}/${filename}`, err)
    }
  }

  if (photosToCreate.length === 0) {
    await prisma.project.delete({ where: { id: project.id } })
    counters.skippedNoPhotos++
    return
  }

  await prisma.photo.createMany({ data: photosToCreate })
  await prisma.project.update({
    where: { id: project.id },
    data: { photoCount: photosToCreate.length },
  })
  counters.imported++
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN')
  }
  if (!process.env.POSTGRES_PRISMA_URL && !process.env.DATABASE_URL) {
    throw new Error('Missing POSTGRES_PRISMA_URL/DATABASE_URL')
  }

  const counters: ImportCounters = {
    scanned: 0,
    imported: 0,
    skippedExistingProject: 0,
    skippedNoPhotos: 0,
    skippedMissingTownMeta: 0,
    photoUploaded: 0,
    photoReused: 0,
    photoFailed: 0,
  }

  const placeholderUser = await ensurePlaceholderUser()
  const entries = await discoverTownYears(TOWNS_ROOT)

  console.log(`Found ${entries.length} legacy town/year directories in ${TOWNS_ROOT}`)
  console.log(`Using placeholder owner: ${placeholderUser.email} (${placeholderUser.id})`)

  for (const entry of entries) {
    await importTownYear(entry, placeholderUser.id, counters)
  }

  console.log('Import complete')
  console.log(JSON.stringify(counters, null, 2))
}

main()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
