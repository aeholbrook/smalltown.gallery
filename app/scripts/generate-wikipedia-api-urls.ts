import fs from 'node:fs/promises'
import path from 'node:path'
import { allTowns } from '../lib/towns'

function stateForTown(name: string): 'Illinois' | 'Indiana' {
  return name.includes(', IN') ? 'Indiana' : 'Illinois'
}

function primaryTitle(name: string): string {
  const trimmed = name.trim()
  if (trimmed === 'Desoto') return 'De Soto, Illinois'
  if (trimmed === 'Sesser/Valier') return 'Sesser, Illinois'
  if (trimmed === 'Future City / North Cairo') return 'North Cairo, Illinois'
  if (trimmed === 'Gorham, Neunart, and Jacob') return 'Gorham, Illinois'
  if (trimmed.includes('/')) return `${trimmed.split('/')[0].trim()}, ${stateForTown(trimmed)}`
  if (trimmed.endsWith(', IN')) return `${trimmed.replace(', IN', '').trim()}, Indiana`
  if (trimmed.includes(',')) return trimmed
  return `${trimmed}, ${stateForTown(trimmed)}`
}

function buildRecord(townName: string) {
  const title = primaryTitle(townName)
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`

  const byTitle = new URL('https://en.wikipedia.org/w/api.php')
  byTitle.searchParams.set('action', 'query')
  byTitle.searchParams.set('format', 'json')
  byTitle.searchParams.set('formatversion', '2')
  byTitle.searchParams.set('redirects', '1')
  byTitle.searchParams.set('prop', 'extracts|coordinates|pageimages|info')
  byTitle.searchParams.set('inprop', 'url')
  byTitle.searchParams.set('exintro', '1')
  byTitle.searchParams.set('explaintext', '1')
  byTitle.searchParams.set('piprop', 'thumbnail|name')
  byTitle.searchParams.set('pithumbsize', '900')
  byTitle.searchParams.set('titles', title)

  const search = new URL('https://en.wikipedia.org/w/api.php')
  search.searchParams.set('action', 'query')
  search.searchParams.set('format', 'json')
  search.searchParams.set('formatversion', '2')
  search.searchParams.set('list', 'search')
  search.searchParams.set('srlimit', '5')
  search.searchParams.set('srsearch', title)

  return {
    townName,
    preferredTitle: title,
    summaryUrl,
    queryByTitleUrl: byTitle.toString(),
    searchUrl: search.toString(),
  }
}

async function main() {
  const records = allTowns.map(t => buildRecord(t.name))
  const payload = {
    generatedAt: new Date().toISOString(),
    count: records.length,
    records,
  }

  const out = path.join(process.cwd(), 'lib', 'data', 'town-wikipedia-api-urls.json')
  await fs.mkdir(path.dirname(out), { recursive: true })
  await fs.writeFile(out, JSON.stringify(payload, null, 2), 'utf8')

  console.log(`Wrote ${records.length} records to ${out}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
