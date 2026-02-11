import { slugify } from './utils'
import { allTowns } from './towns'
import apiUrlData from './data/town-wikipedia-api-urls.json'

export interface TownWikipediaRecord {
  townName: string
  queryTried: string[]
  matchedTitle: string | null
  pageUrl: string | null
  summary: string | null
  coordinates: { lat: number; lon: number } | null
  thumbnailUrl: string | null
  pageImageName: string | null
  mapImageName: string | null
  pushpinMap: string | null
}

type WikipediaSummaryResponse = {
  title?: string
  extract?: string
  content_urls?: { desktop?: { page?: string } }
  coordinates?: { lat: number; lon: number }
  thumbnail?: { source?: string }
  originalimage?: { source?: string }
}

type WikipediaQueryResponse = {
  query?: {
    search?: Array<{ title?: string }>
    pages?: Array<{
      title?: string
      extract?: string
      fullurl?: string
      coordinates?: Array<{ lat: number; lon: number }>
      thumbnail?: { source?: string }
      pageimage?: string
    }>
  }
}

type TownApiUrlRecord = {
  townName: string
  preferredTitle: string
  summaryUrl: string
  queryByTitleUrl: string
  searchUrl: string
}

const API = 'https://en.wikipedia.org/w/api.php'
const SUMMARY_API = 'https://en.wikipedia.org/api/rest_v1/page/summary'
const WIKIPEDIA_FETCH_HEADERS = {
  accept: 'application/json',
  'user-agent': 'smalltown-gallery/1.0 (town landing wikipedia lookup)',
}

const townApiUrlRecords = ((apiUrlData as { records?: TownApiUrlRecord[] })?.records || [])
const townApiUrlBySlug = new Map<string, TownApiUrlRecord>(
  townApiUrlRecords.map(record => [slugify(record.townName), record])
)

function guessState(townName: string) {
  return townName.includes(', IN') ? 'Indiana' : 'Illinois'
}

function candidateQueries(townName: string): string[] {
  const cleaned = townName.trim()
  const out = new Set<string>()
  out.add(cleaned)
  out.add(`${cleaned}, ${guessState(cleaned)}`)

  if (cleaned.includes('/')) {
    for (const p of cleaned.split('/').map(s => s.trim()).filter(Boolean)) {
      out.add(p)
      out.add(`${p}, ${guessState(cleaned)}`)
    }
  }

  if (cleaned.includes(',')) {
    out.add(cleaned.split(',')[0].trim())
  }

  // known aliases from the towns list
  if (cleaned === 'Future City / North Cairo') {
    out.add('Future City, Illinois')
    out.add('North Cairo, Illinois')
  }
  if (cleaned === 'Sesser/Valier') {
    out.add('Sesser, Illinois')
    out.add('Valier, Illinois')
  }
  if (cleaned === 'Desoto') out.add('De Soto, Illinois')
  if (cleaned === 'Cave-In-Rock') out.add('Cave-In-Rock, Illinois')
  if (cleaned === 'St. Libory') out.add('St. Libory, Illinois')

  return Array.from(out)
}

async function fetchTopTitle(query: string): Promise<string | null> {
  const url = new URL(API)
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('formatversion', '2')
  url.searchParams.set('list', 'search')
  url.searchParams.set('srlimit', '1')
  url.searchParams.set('srsearch', query)

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 * 24 },
    headers: WIKIPEDIA_FETCH_HEADERS,
  })
  if (!res.ok) return null
  const data = (await res.json()) as WikipediaQueryResponse
  return data?.query?.search?.[0]?.title ?? null
}

async function fetchSummaryByTitle(title: string): Promise<WikipediaSummaryResponse | null> {
  const res = await fetch(`${SUMMARY_API}/${encodeURIComponent(title)}`, {
    next: { revalidate: 60 * 60 * 24 },
    headers: WIKIPEDIA_FETCH_HEADERS,
  })
  if (!res.ok) return null
  return (await res.json()) as WikipediaSummaryResponse
}

async function fetchSummaryByUrl(url: string): Promise<WikipediaSummaryResponse | null> {
  const res = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 },
    headers: WIKIPEDIA_FETCH_HEADERS,
  })
  if (!res.ok) return null
  return (await res.json()) as WikipediaSummaryResponse
}

async function fetchPageByUrl(url: string) {
  const res = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 },
    headers: WIKIPEDIA_FETCH_HEADERS,
  })
  if (!res.ok) return null
  const data = (await res.json()) as WikipediaQueryResponse
  return data?.query?.pages?.[0] ?? null
}

async function fetchSearchTitlesByUrl(url: string): Promise<string[]> {
  const res = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 },
    headers: WIKIPEDIA_FETCH_HEADERS,
  })
  if (!res.ok) return []
  const data = (await res.json()) as WikipediaQueryResponse
  return (data?.query?.search || []).map(entry => entry.title).filter((title): title is string => Boolean(title))
}

export async function getTownWikipediaRecord(townName: string): Promise<TownWikipediaRecord | null> {
  const knownTown = allTowns.find(t => slugify(t.name) === slugify(townName))
  const effectiveTownName = knownTown?.name || townName
  const tried: string[] = []
  const preferredUrls = townApiUrlBySlug.get(slugify(effectiveTownName))

  if (preferredUrls) {
    tried.push(`queryByTitle:${preferredUrls.queryByTitleUrl}`)
    const page = await fetchPageByUrl(preferredUrls.queryByTitleUrl)
    if (page?.extract) {
      return {
        townName: effectiveTownName,
        queryTried: tried,
        matchedTitle: page.title || preferredUrls.preferredTitle,
        pageUrl: page.fullurl || null,
        summary: page.extract || null,
        coordinates: page.coordinates?.[0] ? { lat: page.coordinates[0].lat, lon: page.coordinates[0].lon } : null,
        thumbnailUrl: page.thumbnail?.source || null,
        pageImageName: page.pageimage || null,
        mapImageName: null,
        pushpinMap: null,
      }
    }

    tried.push(`summary:${preferredUrls.summaryUrl}`)
    const summary = await fetchSummaryByUrl(preferredUrls.summaryUrl)
    if (summary?.extract) {
      return {
        townName: effectiveTownName,
        queryTried: tried,
        matchedTitle: summary.title || preferredUrls.preferredTitle,
        pageUrl: summary.content_urls?.desktop?.page || null,
        summary: summary.extract || null,
        coordinates: summary.coordinates ? { lat: summary.coordinates.lat, lon: summary.coordinates.lon } : null,
        thumbnailUrl: summary.thumbnail?.source || summary.originalimage?.source || null,
        pageImageName: null,
        mapImageName: null,
        pushpinMap: null,
      }
    }

    tried.push(`search:${preferredUrls.searchUrl}`)
    const searchTitles = await fetchSearchTitlesByUrl(preferredUrls.searchUrl)
    for (const title of searchTitles) {
      const summary = await fetchSummaryByTitle(title)
      if (!summary?.extract) continue
      return {
        townName: effectiveTownName,
        queryTried: [...tried, `searchTitle:${title}`],
        matchedTitle: summary.title || title,
        pageUrl: summary.content_urls?.desktop?.page || null,
        summary: summary.extract || null,
        coordinates: summary.coordinates ? { lat: summary.coordinates.lat, lon: summary.coordinates.lon } : null,
        thumbnailUrl: summary.thumbnail?.source || summary.originalimage?.source || null,
        pageImageName: null,
        mapImageName: null,
        pushpinMap: null,
      }
    }
  }

  for (const query of candidateQueries(effectiveTownName)) {
    tried.push(query)
    const topTitle = await fetchTopTitle(query)
    if (!topTitle) continue

    const summary = await fetchSummaryByTitle(topTitle)
    if (!summary?.extract) continue

    const title = summary.title || topTitle
    const state = guessState(effectiveTownName).toLowerCase()
    const extractLc = summary.extract.toLowerCase()
    const titleLc = title.toLowerCase()
    const baseTown = effectiveTownName.split(',')[0].split('/')[0].trim().toLowerCase()

    // Basic relevance filter so we don't show unrelated pages.
    if (!extractLc.includes(state) && !titleLc.includes(state)) continue
    if (!extractLc.includes(baseTown) && !titleLc.includes(baseTown)) continue

    return {
      townName: effectiveTownName,
      queryTried: tried,
      matchedTitle: title,
      pageUrl: summary.content_urls?.desktop?.page || null,
      summary: summary.extract || null,
      coordinates: summary.coordinates ? { lat: summary.coordinates.lat, lon: summary.coordinates.lon } : null,
      thumbnailUrl: summary.thumbnail?.source || summary.originalimage?.source || null,
      pageImageName: null,
      mapImageName: null,
      pushpinMap: null,
    }
  }

  return null
}
