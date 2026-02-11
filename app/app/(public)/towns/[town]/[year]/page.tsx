import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { unstable_noStore as noStore } from 'next/cache'
import { getGalleryData, getAllGalleryParams } from '@/lib/gallery'
import { PhotoGallery } from '@/components/gallery/PhotoGallery'
import { PhotographerInfo } from '@/components/gallery/PhotographerInfo'
import Header from '@/components/ui/Header'

interface PageProps {
  params: Promise<{ town: string; year: string }>
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return getAllGalleryParams()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  noStore()
  const { town, year } = await params
  const gallery = await getGalleryData(town, parseInt(year))
  if (!gallery) return { title: 'Not Found' }

  return {
    title: `${gallery.townName}, Illinois (${gallery.year}) — Small Town Documentary`,
    description: `Documentary photography of ${gallery.townName}, Illinois by ${gallery.photographer} (${gallery.year}).`,
  }
}

export default async function GalleryPage({ params }: PageProps) {
  noStore()
  const { town, year } = await params
  const yearNum = parseInt(year)

  if (isNaN(yearNum)) notFound()

  const gallery = await getGalleryData(town, yearNum)
  if (!gallery || gallery.photos.length === 0) notFound()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Map
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
            {gallery.townName}
            <span className="text-zinc-400 dark:text-zinc-500">, Illinois</span>
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            {gallery.year} — Photographs by {gallery.photographer}
          </p>
        </div>

        {gallery.description && (
          <PhotographerInfo descriptionHtml={gallery.description} />
        )}

        <PhotoGallery photos={gallery.photos} townName={gallery.townName} />
      </main>
    </div>
  )
}
