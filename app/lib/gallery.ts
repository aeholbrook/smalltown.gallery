import { townsWithPhotos } from './towns'
import { prisma } from './db'
import { slugify } from './utils'

const USE_FILESYSTEM_GALLERIES = process.env.VERCEL !== '1'

async function getFsDeps() {
  const [fs, path] = await Promise.all([import('fs/promises'), import('path')])
  return { fs: fs.default, path: path.default }
}

function getTownsRoot(pathMod: { join: (...parts: string[]) => string }) {
  return process.env.LOCAL_TOWNS_ROOT || pathMod.join(process.cwd(), '..', 'towns')
}

export interface GalleryPhoto {
  filename: string
  src: string
}

export interface GalleryData {
  townName: string
  townSlug: string
  year: number
  photographer: string
  description: string | null
  photos: GalleryPhoto[]
}

export function getTownBySlug(slug: string) {
  return townsWithPhotos.find(t => slugify(t.name) === slug) || null
}

async function readTextFile(filePath: string): Promise<string | null> {
  if (!USE_FILESYSTEM_GALLERIES) return null

  const { fs } = await getFsDeps()
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content.replace(/^\uFEFF/, '').trim()
  } catch {
    return null
  }
}

async function getFilesystemGalleryData(townSlug: string, year: number): Promise<GalleryData | null> {
  if (!USE_FILESYSTEM_GALLERIES) return null

  const { fs, path } = await getFsDeps()
  const town = getTownBySlug(townSlug)
  if (!town) return null

  const TOWNS_ROOT = getTownsRoot(path)
  const yearDir = path.join(TOWNS_ROOT, town.name, String(year))

  try {
    await fs.access(yearDir)
  } catch {
    return null
  }

  const photographer = await readTextFile(path.join(yearDir, 'photographer.txt'))
  const description = await readTextFile(path.join(yearDir, 'description.txt'))

  const allFiles = await fs.readdir(yearDir)
  const photoFiles = allFiles
    .filter(f => /\.(jpg|jpeg)$/i.test(f))
    .filter(f => !f.endsWith('~'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

  const photos: GalleryPhoto[] = photoFiles.map(filename => ({
    filename,
    src: `/photos/${encodeURIComponent(town.name)}/${year}/${encodeURIComponent(filename)}`,
  }))

  return {
    townName: town.name,
    townSlug,
    year,
    photographer: photographer || town.years?.find(y => y.year === year)?.photographer || 'Unknown',
    description,
    photos,
  }
}

async function getDbGalleryData(townSlug: string, year: number): Promise<GalleryData | null> {
  try {
    const town = await prisma.town.findFirst({
      where: {
        name: {
          equals: townSlug.replace(/-/g, ' '),
          mode: 'insensitive',
        },
      },
    })
    if (!town) return null

    const project = await prisma.project.findFirst({
      where: { townId: town.id, year, published: true },
      include: { photos: { orderBy: { order: 'asc' } } },
    })
    if (!project || project.photos.length === 0) return null

    return {
      townName: town.name,
      townSlug,
      year,
      photographer: project.photographer,
      description: project.description,
      photos: project.photos.map(p => ({
        filename: p.filename,
        src: p.blobUrl,
      })),
    }
  } catch {
    return null
  }
}

export async function getGalleryData(townSlug: string, year: number): Promise<GalleryData | null> {
  // Try filesystem first (existing galleries)
  if (USE_FILESYSTEM_GALLERIES) {
    const fsData = await getFilesystemGalleryData(townSlug, year)
    if (fsData) return fsData
  }

  // Fall back to database (new uploads)
  return getDbGalleryData(townSlug, year)
}

export interface GalleryPreview {
  townName: string
  townSlug: string
  year: number
  photographer: string
  photo: GalleryPhoto
}

/** Get a shuffled selection of photos from filesystem galleries for sidebar display */
export async function getRandomGalleryPreviews(count: number = 20): Promise<GalleryPreview[]> {
  if (!USE_FILESYSTEM_GALLERIES) return []

  const { fs, path } = await getFsDeps()
  const TOWNS_ROOT = getTownsRoot(path)
  const previews: GalleryPreview[] = []

  for (const town of townsWithPhotos) {
    if (!town.years || !town.hasPhotos) continue

    for (const { year, photographer } of town.years) {
      const yearDir = path.join(TOWNS_ROOT, town.name, String(year))
      try {
        const allFiles = await fs.readdir(yearDir)
        const photoFiles = allFiles
          .filter(f => /\.(jpg|jpeg)$/i.test(f))
          .filter(f => !f.endsWith('~'))

        for (const filename of photoFiles) {
          previews.push({
            townName: town.name,
            townSlug: slugify(town.name),
            year,
            photographer,
            photo: {
              filename,
              src: `/photos/${encodeURIComponent(town.name)}/${year}/${encodeURIComponent(filename)}`,
            },
          })
        }
      } catch {
        // Skip if directory doesn't exist
      }
    }
  }

  // Shuffle and return requested count
  for (let i = previews.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [previews[i], previews[j]] = [previews[j], previews[i]]
  }

  return previews.slice(0, count)
}

export async function getAllGalleryParams(): Promise<{ town: string; year: string }[]> {
  const params: { town: string; year: string }[] = []

  // Filesystem galleries
  if (USE_FILESYSTEM_GALLERIES) {
    for (const town of townsWithPhotos) {
      if (!town.years) continue
      for (const { year } of town.years) {
        params.push({ town: slugify(town.name), year: String(year) })
      }
    }
  }

  // DB galleries (published projects)
  try {
    const dbProjects = await prisma.project.findMany({
      where: { published: true },
      include: { town: true },
    })
    for (const project of dbProjects) {
      const slug = slugify(project.town.name)
      const yearStr = String(project.year)
      // Don't duplicate filesystem entries
      if (!params.some(p => p.town === slug && p.year === yearStr)) {
        params.push({ town: slug, year: yearStr })
      }
    }
  } catch {
    // DB not available during build is fine
  }

  return params
}
