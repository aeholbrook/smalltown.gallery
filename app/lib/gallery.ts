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

const photoSelect = {
  filename: true,
  blobUrl: true,
  width: true,
  height: true,
  title: true,
  caption: true,
} as const

type SelectedPhoto = {
  filename: string
  blobUrl: string
  width: number
  height: number
  title: string | null
  caption: string | null
}

function toGalleryPhoto(p: SelectedPhoto): GalleryPhoto {
  return {
    filename: p.filename,
    src: p.blobUrl,
    width: p.width,
    height: p.height,
    // Dashboard-edited captions win over import-time titles
    title: p.caption ?? p.title,
  }
}

// Towns table is small (~92 rows); resolving a slug through it avoids
// loading every published project (and its photos) just to match one slug.
async function resolveTownBySlug(townSlug: string) {
  const towns = await prisma.town.findMany({ select: { id: true, name: true } })
  return towns.find(town => slugify(town.name) === townSlug) ?? null
}

async function getDbGalleryData(townSlug: string, year: number): Promise<GalleryData | null> {
  try {
    const town = await resolveTownBySlug(townSlug)
    if (!town) return null

    // Deterministic pick if two photographers published the same town+year
    const project = await prisma.project.findFirst({
      where: { townId: town.id, year, published: true },
      orderBy: { createdAt: 'asc' },
      select: {
        photographer: true,
        description: true,
        photos: { orderBy: { order: 'asc' }, select: photoSelect },
      },
    })

    if (!project || project.photos.length === 0) return null

    return {
      townName: town.name,
      townSlug,
      year,
      photographer: project.photographer,
      description: project.description,
      photos: project.photos.map(toGalleryPhoto),
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

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

type PreviewProject = {
  year: number
  photographer: string
  town: { name: string }
  photos: SelectedPhoto[]
}

function toPreviews(projects: PreviewProject[]): GalleryPreview[] {
  const previews: GalleryPreview[] = []
  for (const project of projects) {
    const townSlug = slugify(project.town.name)
    for (const photo of project.photos) {
      previews.push({
        townName: project.town.name,
        townSlug,
        year: project.year,
        photographer: project.photographer,
        photo: toGalleryPhoto(photo),
      })
    }
  }
  return previews
}

const previewProjectSelect = {
  year: true,
  photographer: true,
  town: { select: { name: true } },
  photos: { orderBy: { order: 'asc' as const }, select: photoSelect },
} as const

export async function getRandomGalleryPreviews(count: number = 20): Promise<GalleryPreview[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      select: previewProjectSelect,
    })

    return shuffle(toPreviews(projects)).slice(0, count)
  } catch {
    return []
  }
}

export async function getTownGalleryPreviews(townSlug: string, count: number = 20): Promise<GalleryPreview[]> {
  try {
    const town = await resolveTownBySlug(townSlug)
    if (!town) return []

    const projects = await prisma.project.findMany({
      where: { townId: town.id, published: true },
      select: previewProjectSelect,
    })

    return shuffle(toPreviews(projects)).slice(0, count)
  } catch {
    return []
  }
}

export async function getAllGalleryParams(): Promise<{ town: string; year: string }[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      select: { year: true, town: { select: { name: true } } },
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
    const town = await resolveTownBySlug(townSlug)
    if (!town) return []

    const projects = await prisma.project.findMany({
      where: { townId: town.id, published: true },
      select: {
        id: true,
        year: true,
        photographer: true,
        _count: { select: { photos: true } },
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    })

    return projects.map(project => ({
      id: project.id,
      townName: town.name,
      townSlug,
      year: project.year,
      photographer: project.photographer,
      photoCount: project._count.photos,
    }))
  } catch {
    return []
  }
}

export async function getAllPhotographerParams(): Promise<{ slug: string }[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { not: 'PENDING' },
        projects: { some: { published: true } },
      },
      select: { name: true },
    })

    const slugs = new Set<string>()
    for (const user of users) {
      slugs.add(slugify(user.name))
    }

    return Array.from(slugs).sort().map(slug => ({ slug }))
  } catch {
    return []
  }
}

export async function getAllTownParams(): Promise<{ town: string }[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      select: { town: { select: { name: true } } },
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
