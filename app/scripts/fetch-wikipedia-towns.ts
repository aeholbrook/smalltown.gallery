import fs from 'node:fs/promises'
import path from 'node:path'
import { allTowns } from '../lib/towns'

type WikiPage = {
  title?: string
  fullurl?: string
  extract?: string
  coordinates?: Array<{ lat: number; lon: number }>
  thumbnail?: { source: string }
  pageimage?: string
}

type TownWikiRecord = {
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

const API = 'https://en.wikipedia.org/w/api.php'
const OUTPUT = path.join(process.cwd(), 'lib', 'data', 'town-wikipedia.json')

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const SPECIAL_TITLES: Record<string, string[]> = {
  'Cave-In-Rock': ['Cave-In-Rock, Illinois'],
  Desoto: ['De Soto, Illinois'],
  'St. Libory': ['St. Libory, Illinois'],
}

function cleanTownName(name: string): string {
  return name.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim()
}

function townState(name: string): 'Illinois' | 'Indiana' {
  return name.includes(', IN') ? 'Indiana' : 'Illinois'
}

function baseTownVariants(name: string): string[] {
  const original = cleanTownName(name)
  const variants = new Set<string>()
  variants.add(original)
  if (original.includes(', IN')) variants.add(original.replace(', IN', '').trim())
  if (original.includes('/')) for (const part of original.split('/').map(s => s.trim()).filter(Boolean)) variants.add(part)
  if (original.includes(',')) variants.add(original.split(',')[0].trim())
  if (original.includes(' and ')) variants.add(original.split(' and ')[0].replace(/,$/, '').trim())
  return Array.from(variants)
}

function candidateQueries(name: string): string[] {
  const original = cleanTownName(name)
  const out = new Set<string>()
  for (const special of SPECIAL_TITLES[original] || []) out.add(special)

  out.add(original)
  if (original.includes('/')) {
    for (const part of original.split('/').map(s => s.trim()).filter(Boolean)) {
      out.add(part)
      out.add(`${part}, Illinois`)
      out.add(`${part} Illinois`)
    }
  }
  if (original.includes(',')) {
    const [head, tail] = original.split(',', 2).map(s => s.trim())
    out.add(head)
    out.add(`${head}, ${tail}`)
  } else {
    out.add(`${original}, Illinois`)
    out.add(`${original} Illinois`)
  }

  if (original === 'Future City / North Cairo') {
    out.add('Future City, Illinois')
    out.add('North Cairo, Illinois')
    out.add('Cairo, Illinois')
  }
  if (original === 'Sesser/Valier') {
    out.add('Sesser, Illinois')
    out.add('Valier, Illinois')
  }
  if (original === 'Gorham, Neunart, and Jacob') out.add('Gorham, Illinois')

  return Array.from(out)
}

async function fetchJson(url: string, retries = 6): Promise<any> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'smalltown-gallery/1.0 (Wikipedia town enrichment)',
      Accept: 'application/json',
    },
  })
  if (res.ok) return res.json()

  if ((res.status === 429 || res.status >= 500) && retries > 0) {
    const retryAfter = Number(res.headers.get('retry-after') || '')
    const waitMs = Number.isFinite(retryAfter) ? Math.max(600, retryAfter * 1000) : 800 * (7 - retries)
    await sleep(waitMs)
    return fetchJson(url, retries - 1)
  }

  throw new Error(`HTTP ${res.status} for ${url}`)
}

async function fetchPageByTitle(title: string): Promise<WikiPage | null> {
  const url = new URL(API)
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('formatversion', '2')
  url.searchParams.set('redirects', '1')
  url.searchParams.set('prop', 'extracts|coordinates|pageimages|info')
  url.searchParams.set('inprop', 'url')
  url.searchParams.set('exintro', '1')
  url.searchParams.set('explaintext', '1')
  url.searchParams.set('piprop', 'thumbnail|name')
  url.searchParams.set('pithumbsize', '900')
  url.searchParams.set('titles', title)

  const data = await fetchJson(url.toString())
  const page = data?.query?.pages?.[0]
  if (!page || page.missing) return null
  return page as WikiPage
}

async function fetchTopSearchTitle(query: string): Promise<string | null> {
  const url = new URL(API)
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('formatversion', '2')
  url.searchParams.set('list', 'search')
  url.searchParams.set('srsearch', query)
  url.searchParams.set('srlimit', '5')
  const data = await fetchJson(url.toString())
  const top = data?.query?.search?.[0]?.title
  return typeof top === 'string' ? top : null
}

async function fetchGeoSearchTitles(lat: number, lng: number): Promise<string[]> {
  const url = new URL(API)
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('formatversion', '2')
  url.searchParams.set('list', 'geosearch')
  url.searchParams.set('gscoord', `${lat}|${lng}`)
  url.searchParams.set('gsradius', '20000')
  url.searchParams.set('gslimit', '15')
  const data = await fetchJson(url.toString())
  return (data?.query?.geosearch || []).map((x: { title?: string }) => x.title).filter((x: unknown): x is string => typeof x === 'string')
}

async function fetchMapFields(pageTitle: string): Promise<{ mapImageName: string | null; pushpinMap: string | null }> {
  const url = new URL(API)
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('formatversion', '2')
  url.searchParams.set('redirects', '1')
  url.searchParams.set('prop', 'revisions')
  url.searchParams.set('rvprop', 'content')
  url.searchParams.set('rvslots', 'main')
  url.searchParams.set('titles', pageTitle)
  const data = await fetchJson(url.toString())
  const content: string = data?.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content || ''
  const mapImageMatch = content.match(/\|\s*(?:map_image|image_map)\s*=\s*([^\n|]+)/i)
  const pushpinMatch = content.match(/\|\s*pushpin_map\s*=\s*([^\n|]+)/i)
  return {
    mapImageName: mapImageMatch?.[1]?.trim() || null,
    pushpinMap: pushpinMatch?.[1]?.trim() || null,
  }
}

function looksLikeDisambiguation(summary: string | undefined): boolean {
  if (!summary) return false
  const text = summary.toLowerCase()
  return text.includes('may refer to') || text.includes('can refer to')
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isLikelyTownMatch(page: WikiPage, state: string, variants: string[]): boolean {
  const title = (page.title || '').toLowerCase()
  const extract = (page.extract || '').toLowerCase()
  const titleNorm = normalizeForMatch(title)
  const extractNorm = normalizeForMatch(extract)

  if (looksLikeDisambiguation(page.extract)) return false
  if (!extract || extract.length < 40) return false
  if (!title.includes(state.toLowerCase()) && !extract.includes(state.toLowerCase())) return false

  return variants.some(v => {
    const core = normalizeForMatch(v.replace(', IN', '').trim())
    return core.length > 0 && (titleNorm.includes(core) || extractNorm.includes(core))
  })
}

async function resolveTown(town: { name: string; lat: number; lng: number }): Promise<TownWikiRecord> {
  const townName = town.name
  const state = townState(townName)
  const variants = baseTownVariants(townName)
  const queries = candidateQueries(townName)
  const tried: string[] = []
  let page: WikiPage | null = null

  const geoTitles = await fetchGeoSearchTitles(town.lat, town.lng)
  for (const title of geoTitles) {
    tried.push(`geo:${title}`)
    const candidate = await fetchPageByTitle(title)
    if (candidate && isLikelyTownMatch(candidate, state, variants)) {
      page = candidate
      break
    }
    await sleep(30)
  }

  for (const q of queries) {
    if (page) break
    tried.push(q)
    const direct = await fetchPageByTitle(q)
    if (direct && isLikelyTownMatch(direct, state, variants)) {
      page = direct
      break
    }
    const topTitle = await fetchTopSearchTitle(q)
    if (topTitle) {
      tried.push(`search:${q} -> ${topTitle}`)
      const fromSearch = await fetchPageByTitle(topTitle)
      if (fromSearch && isLikelyTownMatch(fromSearch, state, variants)) {
        page = fromSearch
        break
      }
    }
    await sleep(40)
  }

  if (!page || !page.title) {
    return {
      townName,
      queryTried: tried,
      matchedTitle: null,
      pageUrl: null,
      summary: null,
      coordinates: null,
      thumbnailUrl: null,
      pageImageName: null,
      mapImageName: null,
      pushpinMap: null,
    }
  }

  const mapFields = await fetchMapFields(page.title)
  const coord = page.coordinates?.[0]
  return {
    townName,
    queryTried: tried,
    matchedTitle: page.title || null,
    pageUrl: page.fullurl || null,
    summary: page.extract?.trim() || null,
    coordinates: coord ? { lat: coord.lat, lon: coord.lon } : null,
    thumbnailUrl: page.thumbnail?.source || null,
    pageImageName: page.pageimage || null,
    mapImageName: mapFields.mapImageName,
    pushpinMap: mapFields.pushpinMap,
  }
}

async function main() {
  const records: TownWikiRecord[] = []
  for (const [i, town] of allTowns.entries()) {
    const rec = await resolveTown({ name: town.name, lat: town.lat, lng: town.lng })
    records.push(rec)
    process.stdout.write(`[${i + 1}/${allTowns.length}] ${rec.summary ? 'ok' : 'miss'} ${town.name}\n`)
    await sleep(50)
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'Wikipedia (MediaWiki API)',
    totals: {
      towns: records.length,
      withSummary: records.filter(r => r.summary).length,
      withCoords: records.filter(r => r.coordinates).length,
      withThumb: records.filter(r => r.thumbnailUrl).length,
      withMapField: records.filter(r => r.mapImageName || r.pushpinMap).length,
    },
    records,
  }

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true })
  await fs.writeFile(OUTPUT, JSON.stringify(payload, null, 2), 'utf8')
  console.log('\nDone.')
  console.log(`Output: ${OUTPUT}`)
  console.log(`Summary coverage: ${payload.totals.withSummary}/${payload.totals.towns}`)
  console.log(`Coordinate coverage: ${payload.totals.withCoords}/${payload.totals.towns}`)
  console.log(`Thumbnail coverage: ${payload.totals.withThumb}/${payload.totals.towns}`)
  console.log(`Map field coverage: ${payload.totals.withMapField}/${payload.totals.towns}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

