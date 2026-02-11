import { prisma } from './db'
import { slugify } from './utils'

export interface GalleryPhoto {
  filename: string
  src: string
  width: number
  height: number
  title: string | null
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
    // Resolve by slug against published projects for the year, not by plain
    // slug-to-name replacement. This avoids 404s for towns with punctuation.
    const projects = await prisma.project.findMany({
      where: { year, published: true },
      include: {
        town: true,
        photos: { orderBy: { order: 'asc' } },
      },
    })

    const project = projects.find(p => slugify(p.town.name) === townSlug)
    if (!project || project.photos.length === 0) return null

    return {
      townName: project.town.name,
      townSlug,
      year,
      photographer: project.photographer,
      description: project.description,
      photos: project.photos.map(p => ({
        filename: p.filename,
        src: p.blobUrl,
        width: p.width,
        height: p.height,
        title: p.title,
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

export interface TownGalleryOption {
  id: string
  townName: string
  townSlug: string
  year: number
  photographer: string
  photoCount: number
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
            width: photo.width,
            height: photo.height,
            title: photo.title,
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

export async function getTownGalleryPreviews(townSlug: string, count: number = 20): Promise<GalleryPreview[]> {
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
      if (slugify(project.town.name) !== townSlug) continue
      for (const photo of project.photos) {
        previews.push({
          townName: project.town.name,
          townSlug: slugify(project.town.name),
          year: project.year,
          photographer: project.photographer,
          photo: {
            filename: photo.filename,
            src: photo.blobUrl,
            width: photo.width,
            height: photo.height,
            title: photo.title,
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

export async function getTownGalleryOptions(townSlug: string): Promise<TownGalleryOption[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      include: { town: true, _count: { select: { photos: true } } },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    })

    return projects
      .filter(project => slugify(project.town.name) === townSlug)
      .map(project => ({
        id: project.id,
        townName: project.town.name,
        townSlug,
        year: project.year,
        photographer: project.photographer,
        photoCount: project._count.photos,
      }))
  } catch {
    return []
  }
}

export async function getAllTownParams(): Promise<{ town: string }[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      include: { town: true },
    })

    const towns = new Set<string>()
    for (const project of projects) {
      towns.add(slugify(project.town.name))
    }

    return Array.from(towns).sort().map(town => ({ town }))
  } catch {
    return []
  }
}
