'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { slugify } from '@/lib/utils'
import Modal from './Modal'

interface DbProject {
  townName: string
  year: number
  photographer: string
}

export default function PhotographerList({ dbProjects = [] }: { dbProjects?: DbProject[] }) {
  const [open, setOpen] = useState(false)

  const photographers = useMemo(() => {
    const byPhotographer = new Map<string, { townName: string; year: number }[]>()
    for (const p of dbProjects) {
      const existing = byPhotographer.get(p.photographer) || []
      existing.push({ townName: p.townName, year: p.year })
      byPhotographer.set(p.photographer, existing)
    }

    return Array.from(byPhotographer.entries())
      .map(([name, projects]) => ({
        name,
        projects: projects.sort((a, b) => b.year - a.year || a.townName.localeCompare(b.townName)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [dbProjects])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        Photographers
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Photographers" maxWidthClass="max-w-xl">
        <div className="space-y-2">
              {photographers.map((photographer) => (
                <Link
                  key={photographer.name}
                  href={`/photographers/${slugify(photographer.name)}`}
                  onClick={() => setOpen(false)}
                  className="block rounded px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{photographer.name}</span>
                    <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-500">
                      {photographer.projects.length} {photographer.projects.length === 1 ? 'project' : 'projects'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500 truncate">
                    {photographer.projects.slice(0, 3).map(p => `${p.townName} ${p.year}`).join(' · ')}
                    {photographer.projects.length > 3 ? ' · ...' : ''}
                  </div>
                </Link>
              ))}
        </div>
      </Modal>
    </>
  )
}
