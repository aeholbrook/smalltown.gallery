'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import MapSearch from './MapSearch'
import { useTheme } from '@/components/ui/ThemeProvider'
import type { MapActions } from './InteractiveMap'
import type { TownLocation } from '@/lib/towns'

const InteractiveMap = dynamic(
  () => import('@/components/map/InteractiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900">
        <div className="text-zinc-500 text-sm">Loading map...</div>
      </div>
    ),
  }
)

export interface DbProject {
  townName: string
  slug: string
  year: number
  photographer: string
}

export default function MapLoader({ dbProjects = [] }: { dbProjects?: DbProject[] }) {
  const { theme } = useTheme()
  const [mapActions, setMapActions] = useState<MapActions | null>(null)

  const handleMapReady = useCallback((actions: MapActions) => {
    setMapActions(actions)
  }, [])

  const handleTownFocus = useCallback((town: TownLocation) => {
    mapActions?.flyTo(town.lng, town.lat, 12)
  }, [mapActions])

  return (
    <div className="relative h-full w-full">
      <InteractiveMap dbProjects={dbProjects} onMapReady={handleMapReady} theme={theme} />
      <MapSearch onTownFocus={handleTownFocus} />
    </div>
  )
}
