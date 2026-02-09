'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { townsWithPhotos } from '@/lib/towns'
import { slugify } from '@/lib/utils'

export default function TownList() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-zinc-400 hover:text-white transition-colors"
      >
        Towns
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg max-h-[70vh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-t-xl sm:rounded-xl p-6 sm:p-8 animate-slide-up">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-white mb-4">
              Towns
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {townsWithPhotos
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(town => (
                  <div key={town.name}>
                    {town.years?.map(y => (
                      <Link
                        key={`${town.name}-${y.year}`}
                        href={`/towns/${slugify(town.name)}/${y.year}`}
                        onClick={() => setOpen(false)}
                        className="flex items-baseline gap-2 rounded px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <span className="font-medium">{town.name}</span>
                        <span className="text-xs text-zinc-500">{y.year}</span>
                        <span className="ml-auto text-xs text-zinc-600 italic truncate max-w-[120px]">
                          {y.photographer}
                        </span>
                      </Link>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
