'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { allTowns, MAP_CENTER, MAP_ZOOM, type TownLocation } from '@/lib/towns'
import { slugify } from '@/lib/utils'
import type { DbProject } from './MapLoader'

export interface MapActions {
  flyTo: (lng: number, lat: number, zoom?: number) => void
}

interface InteractiveMapProps {
  onTownSelect?: (town: TownLocation) => void
  onMapReady?: (actions: MapActions) => void
  dbProjects?: DbProject[]
}

export default function InteractiveMap({ onTownSelect, onMapReady, dbProjects = [] }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Merge DB projects into static town data
  const mergedTowns = useMemo(() => {
    if (dbProjects.length === 0) return allTowns

    // Group DB projects by town name
    const dbByTown = new Map<string, { year: number; photographer: string }[]>()
    for (const p of dbProjects) {
      const existing = dbByTown.get(p.townName) || []
      existing.push({ year: p.year, photographer: p.photographer })
      dbByTown.set(p.townName, existing)
    }

    return allTowns.map(town => {
      const dbYears = dbByTown.get(town.name)
      if (!dbYears) return town

      // Merge: combine static years with DB years, dedup by year
      const existingYears = town.years || []
      const existingYearNums = new Set(existingYears.map(y => y.year))
      const newYears = dbYears.filter(y => !existingYearNums.has(y.year))
      const mergedYears = [...existingYears, ...newYears]

      return {
        ...town,
        hasPhotos: true,
        years: mergedYears,
      }
    })
  }, [dbProjects])

  const handleMarkerClick = useCallback((town: TownLocation) => {
    onTownSelect?.(town)
  }, [onTownSelect])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.warn('Mapbox token not set. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local')
      return
    }

    mapboxgl.accessToken = token

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [MAP_CENTER.lng, MAP_CENTER.lat],
      zoom: MAP_ZOOM,
      minZoom: 6,
      maxZoom: 14,
      attributionControl: false,
    })

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    )

    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    )

    map.current.on('load', () => {
      setMapLoaded(true)

      const mapInstance = map.current!

      // Expose map actions for external control (e.g., search flyTo)
      onMapReady?.({
        flyTo: (lng, lat, zoom = 11) => {
          mapInstance.flyTo({ center: [lng, lat], zoom, duration: 1500 })
        },
      })

      // Add town markers as a GeoJSON source
      mapInstance.addSource('towns', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: mergedTowns.map(town => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [town.lng, town.lat],
            },
            properties: {
              name: town.name,
              hasPhotos: town.hasPhotos,
              slug: slugify(town.name),
              years: JSON.stringify(town.years || []),
            },
          })),
        },
      })

      // Layer for towns without photos (subtle dots)
      mapInstance.addLayer({
        id: 'towns-no-photos',
        type: 'circle',
        source: 'towns',
        filter: ['==', ['get', 'hasPhotos'], false],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            6, 3,
            10, 5,
            14, 8,
          ],
          'circle-color': '#6b7280',
          'circle-opacity': 0.5,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#9ca3af',
          'circle-stroke-opacity': 0.3,
        },
      })

      // Layer for towns with photos (highlighted dots)
      mapInstance.addLayer({
        id: 'towns-with-photos',
        type: 'circle',
        source: 'towns',
        filter: ['==', ['get', 'hasPhotos'], true],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            6, 4,
            10, 7,
            14, 10,
          ],
          'circle-color': '#f59e0b',
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fbbf24',
          'circle-stroke-opacity': 0.6,
        },
      })

      // Town name labels
      mapInstance.addLayer({
        id: 'town-labels',
        type: 'symbol',
        source: 'towns',
        minzoom: 9,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        },
        paint: {
          'text-color': [
            'case',
            ['get', 'hasPhotos'],
            '#fbbf24',
            '#9ca3af',
          ],
          'text-halo-color': '#1a1a2e',
          'text-halo-width': 1,
        },
      })

      // Hover state for interactive towns
      mapInstance.on('mouseenter', 'towns-with-photos', () => {
        mapInstance.getCanvas().style.cursor = 'pointer'
      })

      mapInstance.on('mouseleave', 'towns-with-photos', () => {
        mapInstance.getCanvas().style.cursor = ''
      })

      mapInstance.on('mouseenter', 'towns-no-photos', () => {
        mapInstance.getCanvas().style.cursor = 'pointer'
      })

      mapInstance.on('mouseleave', 'towns-no-photos', () => {
        mapInstance.getCanvas().style.cursor = ''
      })

      // Click handler for towns with photos
      mapInstance.on('click', 'towns-with-photos', (e) => {
        if (!e.features?.[0]) return

        const feature = e.features[0]
        const props = feature.properties!
        const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number]
        const years = JSON.parse(props.years || '[]') as { year: number; photographer: string }[]
        const town = mergedTowns.find(t => t.name === props.name)

        // Build popup content
        const yearLinks = years.map(y =>
          `<a href="/towns/${props.slug}/${y.year}" class="map-popup-link">${y.year} — <em>${y.photographer}</em></a>`
        ).join('')

        const popupHTML = `
          <div class="map-popup">
            <h3 class="map-popup-title">${props.name}</h3>
            <div class="map-popup-years">${yearLinks}</div>
          </div>
        `

        popupRef.current?.remove()
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '240px',
          className: 'map-popup-container',
        })
          .setLngLat(coords)
          .setHTML(popupHTML)
          .addTo(mapInstance)

        if (town) handleMarkerClick(town)
      })

      // Click handler for towns without photos
      mapInstance.on('click', 'towns-no-photos', (e) => {
        if (!e.features?.[0]) return

        const feature = e.features[0]
        const props = feature.properties!
        const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number]

        const popupHTML = `
          <div class="map-popup">
            <h3 class="map-popup-title">${props.name}</h3>
            <p class="map-popup-empty">No photos yet</p>
          </div>
        `

        popupRef.current?.remove()
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '200px',
          className: 'map-popup-container',
        })
          .setLngLat(coords)
          .setHTML(popupHTML)
          .addTo(mapInstance)
      })
    })

    return () => {
      popupRef.current?.remove()
      map.current?.remove()
      map.current = null
    }
  }, [handleMarkerClick, mergedTowns])

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <div className="text-zinc-500 text-sm">Loading map...</div>
        </div>
      )}
    </div>
  )
}
