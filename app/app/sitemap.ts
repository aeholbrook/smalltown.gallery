import type { MetadataRoute } from 'next'
import { getAllGalleryParams, getAllPhotographerParams, getAllTownParams } from '@/lib/gallery'

export const revalidate = 3600

const BASE_URL = 'https://smalltown.gallery'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [towns, galleries, photographers] = await Promise.all([
    getAllTownParams(),
    getAllGalleryParams(),
    getAllPhotographerParams(),
  ])

  return [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/towns`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, changeFrequency: 'yearly', priority: 0.4 },
    ...towns.map(({ town }) => ({
      url: `${BASE_URL}/towns/${town}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...galleries.map(({ town, year }) => ({
      url: `${BASE_URL}/towns/${town}/${year}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...photographers.map(({ slug }) => ({
      url: `${BASE_URL}/photographers/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]
}
