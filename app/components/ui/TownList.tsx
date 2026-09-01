'use client'

import { useState } from 'react'
import Link from 'next/link'
import { allTowns } from '@/lib/towns'
import { slugify } from '@/lib/utils'
import Modal from './Modal'

interface DbProject {
  townName: string
  year: number
  photographer: string
}

export default function TownList({ dbProjects = [] }: { dbProjects?: DbProject[] }) {
  const [open, setOpen] = useState(false)
  const dbByTown = new Map<string, { year: number; photographer: string }[]>()

  for (const p of dbProjects) {
    const existing = dbByTown.get(p.townName) || []
    existing.push({ year: p.year, photographer: p.photographer })
    dbByTown.set(p.townName, existing)
  }

  const mergedTowns = allTowns.map(town => {
    const dbYears = dbByTown.get(town.name)
    if (!dbYears) return town

    const existingYears = town.years || []
    // Dedupe by year + photographer (matching the map and search), so a new
    // photographer's gallery in a year that also has a static entry still shows
    const existingKeys = new Set(existingYears.map(y => `${y.year}::${y.photographer}`))
    const newYears = dbYears.filter(y => !existingKeys.has(`${y.year}::${y.photographer}`))
    const mergedYears = [...existingYears, ...newYears].sort((a, b) => b.year - a.year)

    return {
      ...town,
      hasPhotos: mergedYears.length > 0,
      years: mergedYears,
    }
  }).filter(town => (town.years?.length || 0) > 0)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        Towns
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Towns" maxWidthClass="max-w-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {mergedTowns
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(town => (
              <div key={town.name}>
                {town.years?.map(y => (
                  <Link
                    key={`${town.name}-${y.year}-${y.photographer}`}
                    href={`/towns/${slugify(town.name)}/${y.year}`}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-2 rounded px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <span className="font-medium">{town.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">{y.year}</span>
                    <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-600 italic truncate max-w-[120px]">
                      {y.photographer}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
        </div>
      </Modal>
    </>
  )
}
