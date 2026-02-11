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
  theme?: 'dark' | 'light'
}

const ILLINOIS_BOUNDS_POLYGON: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[
    [-91.7, 36.95],
    [-87.45, 36.95],
    [-87.45, 42.55],
    [-91.7, 42.55],
    [-91.7, 36.95],
  ]],
}

function addTownLayers(mapInstance: mapboxgl.Map, towns: TownLocation[], isDark: boolean) {
  mapInstance.addLayer({
    id: 'i64-illinois-outline',
    type: 'line',
    source: 'composite',
    'source-layer': 'road',
    filter: [
      'all',
      ['==', ['get', 'class'], 'motorway'],
      [
        'any',
        ['in', 'I-64', ['coalesce', ['get', 'ref'], '']],
        ['in', 'I 64', ['coalesce', ['get', 'ref'], '']],
        ['in', 'Interstate 64', ['coalesce', ['get', 'name'], '']],
      ],
      ['within', ILLINOIS_BOUNDS_POLYGON as any],
    ],
    paint: {
      'line-color': isDark ? '#713f12' : '#fef08a',
      'line-width': [
        'interpolate', ['linear'], ['zoom'],
        6, 4,
        10, 7,
        14, 10,
      ],
      'line-opacity': isDark ? 0.9 : 0.8,
    },
  })

  mapInstance.addLayer({
    id: 'i64-illinois',
    type: 'line',
    source: 'composite',
    'source-layer': 'road',
    filter: [
      'all',
      ['==', ['get', 'class'], 'motorway'],
      [
        'any',
        ['in', 'I-64', ['coalesce', ['get', 'ref'], '']],
        ['in', 'I 64', ['coalesce', ['get', 'ref'], '']],
        ['in', 'Interstate 64', ['coalesce', ['get', 'name'], '']],
      ],
      ['within', ILLINOIS_BOUNDS_POLYGON as any],
    ],
    paint: {
      'line-color': isDark ? '#ca8a04' : '#fde047',
      'line-width': [
        'interpolate', ['linear'], ['zoom'],
        6, 2,
        10, 4,
        14, 6,
      ],
      'line-opacity': 0.95,
    },
  })

  mapInstance.addSource('towns', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: towns.map(town => ({
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
      'circle-color': isDark ? '#6b7280' : '#9ca3af',
      'circle-opacity': isDark ? 0.5 : 0.6,
      'circle-stroke-width': 1,
      'circle-stroke-color': isDark ? '#9ca3af' : '#6b7280',
      'circle-stroke-opacity': 0.3,
    },
  })

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
        isDark ? '#fbbf24' : '#b45309',
        isDark ? '#9ca3af' : '#4b5563',
      ],
      'text-halo-color': isDark ? '#1a1a2e' : '#ffffff',
      'text-halo-width': 1,
    },
  })
}

export default function InteractiveMap({
  onTownSelect,
  onMapReady,
  dbProjects = [],
  theme = 'dark',
}: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const prevThemeRef = useRef(theme)
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

      // Merge: combine static years with DB years, dedup by year+photographer
      const existingYears = town.years || []
      const existingYearKeys = new Set(existingYears.map(y => `${y.year}-${y.photographer}`))
      const newYears = dbYears.filter(y => !existingYearKeys.has(`${y.year}-${y.photographer}`))
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

    const isDark = theme === 'dark'
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${isDark ? 'dark' : 'light'}-v11`,
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

      addTownLayers(mapInstance, mergedTowns, isDark)

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
            <h3 class="map-popup-title"><a href="/towns/${props.slug}" class="map-popup-link">${props.name}</a></h3>
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleMarkerClick, mergedTowns])

  // Swap map style when theme changes
  useEffect(() => {
    const m = map.current
    if (!m || !mapLoaded) return
    if (theme === prevThemeRef.current) return
    prevThemeRef.current = theme

    const isDark = theme === 'dark'
    m.setStyle(`mapbox://styles/mapbox/${isDark ? 'dark' : 'light'}-v11`)
    m.once('style.load', () => {
      addTownLayers(m, mergedTowns, isDark)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, mergedTowns])

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 transition-colors">
          <div className="text-zinc-500 text-sm">Loading map...</div>
        </div>
      )}
    </div>
  )
}
