import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Camera } from 'lucide-react'
import { unstable_noStore as noStore } from 'next/cache'
import Header from '@/components/ui/Header'
import { slugify } from '@/lib/utils'
import RollingGallery from '@/components/map/RollingGallery'
import { getAllTownParams, getTownGalleryOptions, getTownGalleryPreviews } from '@/lib/gallery'
import { getTownWikipediaRecord } from '@/lib/town-wikipedia'
import { allTowns } from '@/lib/towns'

interface PageProps {
  params: Promise<{ town: string }>
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return getAllTownParams()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  noStore()
  const { town } = await params
  const options = await getTownGalleryOptions(town)
  const knownTown = allTowns.find(entry => slugify(entry.name) === town)

  if (options.length === 0 && !knownTown) return { title: 'Not Found' }

  const townName = options[0]?.townName || knownTown?.name || 'Town'
  const state = townName.includes(', IN') ? 'Indiana' : 'Illinois'
  return {
    title: `${townName}, ${state} — Town Galleries`,
    description: `Browse published documentary projects for ${townName}, ${state} by year and photographer.`,
  }
}

export default async function TownLandingPage({ params }: PageProps) {
  noStore()
  const { town } = await params
  const options = await getTownGalleryOptions(town)
  const knownTown = allTowns.find(entry => slugify(entry.name) === town)

  if (options.length === 0 && !knownTown) notFound()

  const townName = options[0]?.townName || knownTown?.name || town
  const state = townName.includes(', IN') ? 'Indiana' : 'Illinois'
  const photographerLinks = new Set<string>()
  for (const option of options) {
    photographerLinks.add(option.photographer)
  }
  const leftPreviews = await getTownGalleryPreviews(town, 12)
  const rightPreviews = await getTownGalleryPreviews(town, 12)
  const wikipedia = await getTownWikipediaRecord(townName)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950 transition-colors">
      <Header />
      <main className="relative flex flex-1 min-h-0">
        <div className="hidden lg:block w-56 xl:w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 transition-colors">
          <RollingGallery previews={leftPreviews} direction="up" />
        </div>

        <div className="relative flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              Back to Map
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
                {townName}
                <span className="text-zinc-400 dark:text-zinc-500">, {state}</span>
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {options.length > 0
                  ? 'Select a year and photographer to open a gallery.'
                  : 'No published galleries are available for this town yet.'}
              </p>
            </div>

            {wikipedia?.summary && (
              <section className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {wikipedia.thumbnailUrl && (
                    <img
                      src={wikipedia.thumbnailUrl}
                      alt={wikipedia.matchedTitle || `${townName} from Wikipedia`}
                      className="h-36 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 object-cover sm:w-48"
                    />
                  )}
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                      From Wikipedia
                    </h2>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {wikipedia.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {wikipedia.coordinates && (
                        <span>
                          Coordinates: {wikipedia.coordinates.lat.toFixed(4)}, {wikipedia.coordinates.lon.toFixed(4)}
                        </span>
                      )}
                      {wikipedia.mapImageName && <span>Map image: {wikipedia.mapImageName}</span>}
                      {wikipedia.pushpinMap && <span>Pushpin map: {wikipedia.pushpinMap}</span>}
                    </div>
                    {wikipedia.pageUrl && (
                      <a
                        href={wikipedia.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-sm underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-amber-500"
                      >
                        View source on Wikipedia
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-4 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-4">
                Available Galleries ({options.length})
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {options.map(option => (
                  <Link
                    key={option.id}
                    href={`/towns/${option.townSlug}/${option.year}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 hover:border-amber-400/50 hover:bg-amber-50/50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                      <Camera size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-medium text-zinc-900 dark:text-white">
                        {option.year}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                        {option.photographer}
                      </p>
                    </div>
                    <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-500">
                      {option.photoCount} {option.photoCount === 1 ? 'photo' : 'photos'}
                    </span>
                  </Link>
                ))}
                {options.length === 0 && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Check back later for published work in this town.
                  </p>
                )}
              </div>
            </section>

            {photographerLinks.size > 0 && (
              <section className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
                <p>
                  Photographers:{' '}
                  {Array.from(photographerLinks).map((name, index) => (
                    <span key={name}>
                      <Link
                        href={`/photographers/${slugify(name)}`}
                        className="underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-amber-500"
                      >
                        {name}
                      </Link>
                      {index < photographerLinks.size - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              </section>
            )}
          </div>
        </div>

        <div className="hidden lg:block w-56 xl:w-64 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 transition-colors">
          <RollingGallery previews={rightPreviews} direction="down" />
        </div>
      </main>
    </div>
  )
}
