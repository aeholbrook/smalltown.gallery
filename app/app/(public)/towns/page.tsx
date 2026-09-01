import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import { getAllTownParams, getTownGalleryOptions } from '@/lib/gallery'
import { allTowns } from '@/lib/towns'
import { slugify } from '@/lib/utils'

// ISR: regenerate hourly; a crawlable index of every town with galleries
// (the map homepage exposes towns only through client-side interaction).
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Towns',
  description:
    'Every Southern Illinois town with published documentary photo galleries, by year and photographer.',
  alternates: { canonical: '/towns' },
}

interface TownIndexEntry {
  name: string
  slug: string
  years: { year: number; photographer: string }[]
}

async function getTownIndex(): Promise<TownIndexEntry[]> {
  const entries = new Map<string, TownIndexEntry>()

  for (const town of allTowns) {
    if (!town.hasPhotos || !town.years?.length) continue
    const slug = slugify(town.name)
    entries.set(slug, {
      name: town.name,
      slug,
      years: town.years.map(y => ({ year: y.year, photographer: y.photographer })),
    })
  }

  // Merge in DB-published galleries (may add towns or new years)
  const dbTowns = await getAllTownParams()
  for (const { town: slug } of dbTowns) {
    const options = await getTownGalleryOptions(slug)
    if (options.length === 0) continue
    const existing = entries.get(slug) ?? { name: options[0].townName, slug, years: [] }
    const seen = new Set(existing.years.map(y => `${y.year}::${y.photographer}`))
    for (const option of options) {
      const key = `${option.year}::${option.photographer}`
      if (seen.has(key)) continue
      seen.add(key)
      existing.years.push({ year: option.year, photographer: option.photographer })
    }
    existing.years.sort((a, b) => b.year - a.year)
    entries.set(slug, existing)
  }

  return Array.from(entries.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export default async function TownsIndexPage() {
  const towns = await getTownIndex()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
          Towns
        </h1>
        <p className="mt-2 mb-8 text-zinc-600 dark:text-zinc-400">
          Every town with published galleries. Prefer exploring visually? Use the{' '}
          <Link href="/" className="underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-amber-500">
            interactive map
          </Link>
          .
        </p>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {towns.map(town => (
            <li
              key={town.slug}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
            >
              <Link
                href={`/towns/${town.slug}`}
                className="text-lg font-semibold text-zinc-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                {town.name}
              </Link>
              <ul className="mt-2 space-y-1">
                {town.years.map(entry => (
                  <li key={`${entry.year}::${entry.photographer}`}>
                    <Link
                      href={`/towns/${town.slug}/${entry.year}`}
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      {entry.year} — {entry.photographer}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        {towns.length === 0 && (
          <p className="text-zinc-600 dark:text-zinc-400">No published galleries yet.</p>
        )}
      </main>
    </div>
  )
}
