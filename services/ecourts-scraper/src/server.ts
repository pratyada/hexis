import express, { Request, Response, NextFunction } from 'express'
import {
  webSearchByCNR,
  searchHCByCaseNumber,
  searchHCByDiaryNumber,
  webGetCauseList,
} from './ecourts'

const app = express()
const PORT = process.env.PORT || 3001
const API_KEY = process.env.ECOURTS_API_KEY || ''

// ─── Auth middleware ──────────────────────────────────────────────────────────

function requireKey(req: Request, res: Response, next: NextFunction) {
  if (!API_KEY) return next() // no key configured = open (dev only)
  const auth = req.headers.authorization || ''
  if (auth === `Bearer ${API_KEY}`) return next()
  res.status(401).json({ error: 'Unauthorized' })
}

app.use(requireKey)

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ ok: true, version: '1.0.0' })
})

/** GET /cnr?cnr=DLHC010012345672024 */
app.get('/cnr', async (req: Request, res: Response) => {
  const cnr = (req.query.cnr as string)?.trim().toUpperCase()
  if (!cnr) return void res.status(400).json({ error: 'cnr is required' })
  if (!/^[A-Z]{4}\d{7,16}$/.test(cnr)) {
    return void res.status(400).json({ error: 'Invalid CNR format', hint: 'Example: DLHC010012345672024' })
  }
  try {
    const result = await webSearchByCNR(cnr)
    if (!result) return void res.status(404).json({ error: 'Case not found — CAPTCHA may have failed, retry' })
    res.json({ data: result, cnr })
  } catch (err) {
    console.error('CNR error:', err)
    res.status(500).json({ error: 'Search failed — retry' })
  }
})

/**
 * GET /search
 * ?type=cnr&cnr=...
 * ?type=case_number&court=delhi&caseType=W.P.(C)&caseNumber=1234&year=2024
 * ?type=diary_number&court=delhi&diaryNumber=5678&year=2024
 */
app.get('/search', async (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'cnr'

  try {
    if (type === 'cnr') {
      const cnr = (req.query.cnr as string)?.trim().toUpperCase()
      if (!cnr) return void res.status(400).json({ error: 'cnr is required' })
      const result = await webSearchByCNR(cnr)
      if (!result) return void res.status(404).json({ error: 'Case not found' })
      return void res.json({ data: result, cnr })
    }

    if (type === 'case_number') {
      const { court, caseType, caseNumber, year } = req.query as Record<string, string>
      if (!court || !caseType || !caseNumber || !year) {
        return void res.status(400).json({ error: 'court, caseType, caseNumber, year required' })
      }
      const result = await searchHCByCaseNumber({ court, caseType, caseNumber, year })
      if (!result) return void res.status(404).json({ error: 'Case not found' })
      return void res.json({ data: result })
    }

    if (type === 'diary_number') {
      const { court, diaryNumber, year } = req.query as Record<string, string>
      if (!court || !diaryNumber || !year) {
        return void res.status(400).json({ error: 'court, diaryNumber, year required' })
      }
      const result = await searchHCByDiaryNumber({ court, diaryNumber, year })
      if (!result) return void res.status(404).json({ error: 'Case not found' })
      return void res.json({ data: result })
    }

    res.status(400).json({ error: 'Invalid type. Use cnr, case_number, or diary_number' })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: 'Search failed — retry' })
  }
})

/** GET /causelist?court=delhi&date=02-04-2026&type=civil */
app.get('/causelist', async (req: Request, res: Response) => {
  const court = (req.query.court as string) || 'delhi'
  const date = (req.query.date as string) || ''
  const type = (req.query.type as string) || 'civil'

  try {
    const entries = await webGetCauseList({ court, date, civil: type === 'civil' })
    res.json({ data: entries, court, date: date || 'today', count: entries.length })
  } catch (err) {
    console.error('Cause list error:', err)
    res.status(500).json({ error: 'Failed to fetch cause list — retry' })
  }
})

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`eCourts scraper running on port ${PORT}`)
})
