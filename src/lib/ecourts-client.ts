/**
 * Thin HTTP client that proxies eCourts requests to the scraper microservice.
 * Set ECOURTS_SCRAPER_URL + ECOURTS_API_KEY in Vercel environment variables.
 *
 * The microservice runs on a VPS with a residential/ISP IP so the eCourts
 * portal doesn't block it (AWS/Vercel IPs get blocked by NIC portals).
 */

import type { WebCaseResult, WebCauseListEntry } from './ecourts-web'

const SCRAPER_URL = (process.env.ECOURTS_SCRAPER_URL || '').replace(/\/$/, '')
const SCRAPER_KEY = process.env.ECOURTS_API_KEY || ''

function scraperHeaders() {
  return SCRAPER_KEY ? { Authorization: `Bearer ${SCRAPER_KEY}` } : {}
}

async function scraperGet(path: string): Promise<Response> {
  if (!SCRAPER_URL) throw new Error('ECOURTS_SCRAPER_URL is not set')
  return fetch(`${SCRAPER_URL}${path}`, {
    headers: scraperHeaders(),
    signal: AbortSignal.timeout(55_000),
  })
}

export async function clientSearchByCNR(cnr: string): Promise<WebCaseResult | null> {
  const res = await scraperGet(`/cnr?cnr=${encodeURIComponent(cnr)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Scraper error ${res.status}`)
  const j = await res.json() as { data: WebCaseResult }
  return j.data
}

export async function clientSearch(params: Record<string, string>): Promise<WebCaseResult | null> {
  const qs = new URLSearchParams(params).toString()
  const res = await scraperGet(`/search?${qs}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Scraper error ${res.status}`)
  const j = await res.json() as { data: WebCaseResult }
  return j.data
}

export async function clientGetCauseList(params: {
  court: string
  date?: string
  type?: string
}): Promise<WebCauseListEntry[]> {
  const qs = new URLSearchParams({
    court: params.court,
    date: params.date || '',
    type: params.type || 'civil',
  }).toString()
  const res = await scraperGet(`/causelist?${qs}`)
  if (!res.ok) throw new Error(`Scraper error ${res.status}`)
  const j = await res.json() as { data: WebCauseListEntry[] }
  return j.data
}
