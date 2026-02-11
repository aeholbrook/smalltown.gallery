'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { allTowns, type TownLocation } from '@/lib/towns'

interface MapSearchProps {
  onTownFocus?: (town: TownLocation) => void
  dbProjects?: { townName: string; year: number; photographer: string }[]
}

type SearchResult =
  | { key: string; type: 'town'; town: TownLocation }
  | { key: string; type: 'photographer'; town: TownLocation; year: number; photographer: string }

export default function MapSearch({ onTownFocus, dbProjects = [] }: MapSearchProps) {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [filter, setFilter] = useState<'all' | 'photos' | 'no-photos'>('all')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const mergedTowns = useMemo(() => {
    if (dbProjects.length === 0) return allTowns

    const dbByTown = new Map<string, { year: number; photographer: string }[]>()
    for (const p of dbProjects) {
      const existing = dbByTown.get(p.townName) || []
      existing.push({ year: p.year, photographer: p.photographer })
      dbByTown.set(p.townName, existing)
    }

    return allTowns.map(town => {
      const dbYears = dbByTown.get(town.name)
      if (!dbYears) return town

      const existingYears = town.years || []
      const existingYearKeys = new Set(existingYears.map(y => `${y.year}-${y.photographer}`))
      const newYears = dbYears.filter(y => !existingYearKeys.has(`${y.year}-${y.photographer}`))

      return {
        ...town,
        hasPhotos: true,
        years: [...existingYears, ...newYears],
      }
    })
  }, [dbProjects])

  const visibleTowns = mergedTowns.filter(t => {
    if (filter === 'photos') return t.hasPhotos
    if (filter === 'no-photos') return !t.hasPhotos
    return true
  })

  const q = query.trim().toLowerCase()
  const results = useMemo<SearchResult[]>(() => {
    const townResults = visibleTowns
      .filter(t => t.name.toLowerCase().includes(q))
      .map(t => ({ key: `town:${t.name}`, type: 'town' as const, town: t }))

    if (!q || filter === 'no-photos') {
      return townResults.sort((a, b) => {
        if (a.town.hasPhotos !== b.town.hasPhotos) return a.town.hasPhotos ? -1 : 1
        return a.town.name.localeCompare(b.town.name)
      })
    }

    const photographerResults: SearchResult[] = []
    for (const town of visibleTowns) {
      for (const y of town.years || []) {
        if (y.photographer.toLowerCase().includes(q)) {
          photographerResults.push({
            key: `photographer:${town.name}:${y.year}:${y.photographer}`,
            type: 'photographer',
            town,
            year: y.year,
            photographer: y.photographer,
          })
        }
      }
    }

    const allResults = [...townResults, ...photographerResults]
    allResults.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'town' ? -1 : 1
      if (a.town.hasPhotos !== b.town.hasPhotos) return a.town.hasPhotos ? -1 : 1
      if (a.town.name !== b.town.name) return a.town.name.localeCompare(b.town.name)
      if (a.type === 'photographer' && b.type === 'photographer') return b.year - a.year
      return 0
    })
    return allResults
  }, [visibleTowns, q, filter])

  const handleSelect = useCallback((town: TownLocation) => {
    setQuery(town.name)
    setShowResults(false)
    onTownFocus?.(town)
  }, [onTownFocus])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setShowResults(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div ref={containerRef} className="absolute top-4 left-4 z-10 w-72">
      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search towns or photographers... ( / )"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setShowResults(true) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div className="mt-1 max-h-80 overflow-y-auto rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-xl transition-colors">
          {/* Filter tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-700 px-1 py-1 gap-1">
            {([
              ['all', 'All'],
              ['photos', 'With Photos'],
              ['no-photos', 'No Photos'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  filter === key
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Town list */}
          <div className="py-1">
            {results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-400 dark:text-zinc-500">No matches found</div>
            ) : (
              results.map(result => (
                <button
                  key={result.key}
                  onClick={() => handleSelect(result.town)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    result.town.hasPhotos ? 'bg-amber-400' : 'bg-zinc-600'
                  }`} />
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {result.type === 'town' ? result.town.name : `${result.photographer} (${result.year})`}
                  </span>
                  {result.type === 'photographer' ? (
                    <span className="ml-auto text-xs text-zinc-500">{result.town.name}</span>
                  ) : result.town.hasPhotos && result.town.years ? (
                    <span className="ml-auto text-xs text-zinc-500">
                      {result.town.years.length} {result.town.years.length === 1 ? 'gallery' : 'galleries'}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>

          {/* Result count */}
          <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            {results.length} results
          </div>
        </div>
      )}
    </div>
  )
}
