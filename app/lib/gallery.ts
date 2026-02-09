import { prisma } from './db'
import { slugify } from './utils'

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
  return getDbGalleryData(townSlug, year)
}

export interface GalleryPreview {
  townName: string
  townSlug: string
  year: number
  photographer: string
  photo: GalleryPhoto
}

export async function getRandomGalleryPreviews(count: number = 20): Promise<GalleryPreview[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      include: {
        town: true,
        photos: {
          orderBy: { order: 'asc' },
        },
      },
    })

    const previews: GalleryPreview[] = []
    for (const project of projects) {
      for (const photo of project.photos) {
        previews.push({
          townName: project.town.name,
          townSlug: slugify(project.town.name),
          year: project.year,
          photographer: project.photographer,
          photo: {
            filename: photo.filename,
            src: photo.blobUrl,
          },
        })
      }
    }

    for (let i = previews.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[previews[i], previews[j]] = [previews[j], previews[i]]
    }

    return previews.slice(0, count)
  } catch {
    return []
  }
}

export async function getAllGalleryParams(): Promise<{ town: string; year: string }[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      include: { town: true },
    })

    const params = new Map<string, { town: string; year: string }>()
    for (const project of projects) {
      const town = slugify(project.town.name)
      const year = String(project.year)
      params.set(`${town}-${year}`, { town, year })
    }

    return Array.from(params.values())
  } catch {
    return []
  }
}
