/**
 * NIC eCourts Web Portal Integration — No API key required
 *
 * Implements the same flow as the bharat-courts Python library in Node.js:
 * 1. Establish HTTP session (get session cookie)
 * 2. Fetch CAPTCHA image
 * 3. Solve CAPTCHA with Tesseract OCR
 * 4. Submit search form
 * 5. Parse HTML response
 * 6. Retry up to 3× on CAPTCHA failure
 *
 * Portals:
 *   HC Services  → https://hcservices.ecourts.gov.in/hcservices
 *   District     → https://services.ecourts.gov.in
 */

const HC_BASE = 'https://hcservices.ecourts.gov.in/hcservices'
const DIST_BASE = 'https://services.ecourts.gov.in'
const MAX_CAPTCHA_RETRIES = 3
const RETRY_DELAY_MS = 1500

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-IN,en;q=0.9',
  'X-Requested-With': 'XMLHttpRequest',
}

// ─── State code maps ──────────────────────────────────────────────────────────

const HC_STATE_CODES: Record<string, string> = {
  DL: '7', MH: '13', KA: '10', TN: '23', UP: '25',
  WB: '27', GJ: '8', TS: '24', RJ: '20', PB: '17',
  HR: '9',  MP: '12', OD: '18', KL: '11', AP: '1',
}

// ─── Cookie jar ───────────────────────────────────────────────────────────────

class CookieJar {
  private store: Map<string, string> = new Map()

  ingest(headers: Headers) {
    // Node.js 18+ Headers.getSetCookie() returns string[]
    const raw: string[] = typeof (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
      : (headers.get('set-cookie') || '').split(',')

    for (const line of raw) {
      const [pair] = line.split(';')
      const eq = pair.indexOf('=')
      if (eq === -1) continue
      const name = pair.slice(0, eq).trim()
      const value = pair.slice(eq + 1).trim()
      if (name) this.store.set(name, value)
    }
  }

  header(): string {
    return Array.from(this.store.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
  }

  reset() { this.store.clear() }
}

// ─── CAPTCHA solver ───────────────────────────────────────────────────────────

async function solveCaptcha(imageBuffer: Buffer): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js')

    const worker = await createWorker('eng', 1, { logger: () => {} })
    await worker.setParameters({
      // Whitelist only alphanumeric — eCourts CAPTCHA is 6 chars
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    })

    const { data: { text } } = await worker.recognize(imageBuffer)
    await worker.terminate()

    return text.replace(/\s+/g, '').trim()
  } catch {
    return ''
  }
}

// ─── HTML parsing helpers ─────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
}

function extractTableRows(html: string): string[][] {
  const rows: string[][] = []
  const trMatches = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || []
  for (const tr of trMatches) {
    const cells = (tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [])
      .map((cell) => stripTags(cell))
    if (cells.length > 0) rows.push(cells)
  }
  return rows
}

function extractField(html: string, label: string): string {
  const rows = extractTableRows(html)
  for (const row of rows) {
    if (row[0]?.toLowerCase().includes(label.toLowerCase()) && row[1]) {
      return row[1].trim()
    }
  }
  return ''
}

/** Extract text between two markers */
function between(text: string, start: string, end: string): string {
  const s = text.indexOf(start)
  if (s === -1) return ''
  const e = text.indexOf(end, s + start.length)
  return e === -1 ? text.slice(s + start.length) : text.slice(s + start.length, e)
}

// ─── Structured result types ──────────────────────────────────────────────────

export interface WebCaseDetails {
  cnrNumber: string
  caseType: string
  filingNumber: string
  filingDate: string
  registrationNumber: string
  registrationDate: string
  status: string
  stage: string
  nextHearingDate: string
  courtNumber: string
  judge: string
  petitioner: string
  respondent: string
  petitionerAdvocate: string
  respondentAdvocate: string
  dateOfDecision: string
  natureOfDisposal: string
}

export interface WebHearing {
  date: string
  purpose: string
  causeListType: string
  courtNumber: string
  judge: string
  businessOnDate: string
}

export interface WebOrder {
  date: string
  number: string
  pdfUrl: string
}

export interface WebCauseListEntry {
  serialNo: string
  caseNumber: string
  petitioner: string
  respondent: string
  advocatePetitioner: string
  advocateRespondent: string
  courtNo: string
  judge: string
}

export interface WebCaseResult {
  caseDetails: WebCaseDetails
  hearings: WebHearing[]
  orders: WebOrder[]
  source: 'hcservices' | 'district'
}

// ─── HC Services — High Court CNR search ─────────────────────────────────────

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function searchHCByCNR(cnr: string): Promise<WebCaseResult | null> {
  const jar = new CookieJar()
  const statePrefix = cnr.substring(0, 2).toUpperCase()
  const stateCode = HC_STATE_CODES[statePrefix] || '7'

  for (let attempt = 0; attempt < MAX_CAPTCHA_RETRIES; attempt++) {
    try {
      jar.reset()

      // 1. Initialise session
      const initRes = await fetch(`${HC_BASE}/main.php`, {
        headers: { ...BROWSER_HEADERS, Referer: 'https://hcservices.ecourts.gov.in/' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? {} : {}),
      })
      jar.ingest(initRes.headers)
      await delay(500)

      // 2. Fetch CAPTCHA image
      const captchaRes = await fetch(`${HC_BASE}/securimage/securimage_show.php`, {
        headers: {
          ...BROWSER_HEADERS,
          Cookie: jar.header(),
          Referer: `${HC_BASE}/main.php`,
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'X-Requested-With': '',
        },
      })
      jar.ingest(captchaRes.headers)
      const captchaBuffer = Buffer.from(await captchaRes.arrayBuffer())
      await delay(300)

      // 3. Solve CAPTCHA with Tesseract
      const captchaText = await solveCaptcha(captchaBuffer)
      if (!captchaText || captchaText.length < 4) {
        await delay(RETRY_DELAY_MS)
        continue
      }

      // 4. Submit CNR search
      const body = new URLSearchParams({
        state_code: stateCode,
        bench_code: '1',
        action_code: 'showRecords',
        search_type: 'cnr_number',
        cnr_number: cnr,
        captcha: captchaText,
      })

      const searchRes = await fetch(`${HC_BASE}/cases_qry/index_qry.php`, {
        method: 'POST',
        headers: {
          ...BROWSER_HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: jar.header(),
          Referer: `${HC_BASE}/main.php`,
        },
        body: body.toString(),
      })
      jar.ingest(searchRes.headers)

      const raw = (await searchRes.text()).replace(/^\ufeff/, '')

      // CAPTCHA failure check
      if (
        raw.toLowerCase().includes('invalid captcha') ||
        raw.toLowerCase().includes('captcha error')
      ) {
        await delay(RETRY_DELAY_MS * (attempt + 1))
        continue
      }

      // 5. Parse response
      let jsonData: Record<string, string> = {}
      try {
        jsonData = JSON.parse(raw) as Record<string, string>
      } catch {
        // Some responses are plain HTML
        jsonData = { con: raw }
      }

      if (jsonData.Error && jsonData.Error.trim()) {
        console.error('HC eCourts error:', jsonData.Error)
        return null
      }

      const html = jsonData.con || raw
      return parseHCHTML(html, cnr)
    } catch (err) {
      console.error(`HC search attempt ${attempt + 1}:`, err)
      await delay(RETRY_DELAY_MS)
    }
  }

  return null
}

function parseHCHTML(html: string, cnr: string): WebCaseResult | null {
  if (!html || html.trim().length < 50) return null

  const caseDetails: WebCaseDetails = {
    cnrNumber: cnr,
    caseType: extractField(html, 'case type') || extractField(html, 'case_type'),
    filingNumber: extractField(html, 'filing number') || extractField(html, 'filing no'),
    filingDate: extractField(html, 'filing date'),
    registrationNumber: extractField(html, 'registration number') || extractField(html, 'reg. no'),
    registrationDate: extractField(html, 'registration date'),
    status: extractField(html, 'case status') || extractField(html, 'status'),
    stage: extractField(html, 'stage of case') || extractField(html, 'stage'),
    nextHearingDate: extractField(html, 'next hearing') || extractField(html, 'next date'),
    courtNumber: extractField(html, 'court number') || extractField(html, 'court no'),
    judge: extractField(html, 'judge') || extractField(html, 'coram'),
    petitioner: extractField(html, 'petitioner') || extractField(html, 'appellant'),
    respondent: extractField(html, 'respondent'),
    petitionerAdvocate: extractField(html, 'petitioner advocate') || extractField(html, 'adv. for petitioner'),
    respondentAdvocate: extractField(html, 'respondent advocate') || extractField(html, 'adv. for respondent'),
    dateOfDecision: extractField(html, 'date of decision') || extractField(html, 'decision date'),
    natureOfDisposal: extractField(html, 'nature of disposal') || extractField(html, 'disposal'),
  }

  // Parse hearing history table
  const hearings: WebHearing[] = []
  const hearingSection = between(html, 'Hearing History', '</table>')
  if (hearingSection) {
    const rows = extractTableRows(hearingSection)
    for (const row of rows) {
      if (row.length >= 2 && row[0]?.match(/\d{2}-\d{2}-\d{4}/)) {
        hearings.push({
          date: row[0] || '',
          purpose: row[1] || '',
          causeListType: row[2] || '',
          courtNumber: row[3] || '',
          judge: row[4] || '',
          businessOnDate: row[5] || '',
        })
      }
    }
  }

  // Parse orders table
  const orders: WebOrder[] = []
  const orderMatches = html.matchAll(/href="([^"]*display_pdf[^"]*)"[^>]*>([^<]*)<\/a>.*?(\d{2}[-\/]\d{2}[-\/]\d{4})/gi)
  for (const match of orderMatches) {
    orders.push({
      pdfUrl: match[1].startsWith('http') ? match[1] : `${HC_BASE}/${match[1]}`,
      number: match[2].trim(),
      date: match[3],
    })
  }

  return { caseDetails, hearings, orders, source: 'hcservices' }
}

// ─── District Courts — CNR search ────────────────────────────────────────────

export async function searchDistrictByCNR(cnr: string): Promise<WebCaseResult | null> {
  const jar = new CookieJar()
  let appToken = ''

  for (let attempt = 0; attempt < MAX_CAPTCHA_RETRIES; attempt++) {
    try {
      jar.reset()

      // 1. Get initial session + app_token + CAPTCHA
      const initBody = new URLSearchParams({ ajax_req: 'true', app_token: '' })
      const initRes = await fetch(`${DIST_BASE}/?p=casestatus/getCaptcha`, {
        method: 'POST',
        headers: {
          ...BROWSER_HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: `${DIST_BASE}/`,
        },
        body: initBody.toString(),
      })
      jar.ingest(initRes.headers)
      const initRaw = (await initRes.text()).replace(/^\ufeff/, '')
      await delay(500)

      let initJson: Record<string, string> = {}
      try { initJson = JSON.parse(initRaw) as Record<string, string> } catch { /* plain */ }

      appToken = initJson.app_token || ''

      // Extract CAPTCHA image from base64 or URL in the HTML
      const captchaImgMatch = initJson.captcha_html?.match(/src="([^"]+)"/) ||
                               initRaw.match(/securimage_show\.php[^"']*/)
      let captchaBuffer: Buffer = Buffer.alloc(0)

      if (captchaImgMatch) {
        const captchaUrl = captchaImgMatch[1].startsWith('http')
          ? captchaImgMatch[1]
          : `${DIST_BASE}/${captchaImgMatch[1]}`

        const captchaRes = await fetch(captchaUrl, {
          headers: { ...BROWSER_HEADERS, Cookie: jar.header(), Referer: `${DIST_BASE}/`, 'X-Requested-With': '' },
        })
        captchaBuffer = Buffer.from(await captchaRes.arrayBuffer())
      }

      await delay(300)
      const captchaText = await solveCaptcha(captchaBuffer)

      if (!captchaText || captchaText.length < 4) {
        await delay(RETRY_DELAY_MS)
        continue
      }

      // 2. Submit CNR search
      const searchBody = new URLSearchParams({
        ajax_req: 'true',
        app_token: appToken,
        cnr_number: cnr,
        captcha: captchaText,
      })

      const searchRes = await fetch(`${DIST_BASE}/?p=casestatus/submitCNR`, {
        method: 'POST',
        headers: {
          ...BROWSER_HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: jar.header(),
          Referer: `${DIST_BASE}/`,
        },
        body: searchBody.toString(),
      })
      jar.ingest(searchRes.headers)

      const raw = (await searchRes.text()).replace(/^\ufeff/, '')
      let json: Record<string, string> = {}
      try { json = JSON.parse(raw) as Record<string, string> } catch { json = { party_data: raw } }

      appToken = json.app_token || appToken

      if (json.status === '0' || raw.toLowerCase().includes('invalid captcha')) {
        await delay(RETRY_DELAY_MS * (attempt + 1))
        continue
      }

      const html = json.party_data || json.con || raw
      return parseDistrictHTML(html, cnr)
    } catch (err) {
      console.error(`District search attempt ${attempt + 1}:`, err)
      await delay(RETRY_DELAY_MS)
    }
  }

  return null
}

function parseDistrictHTML(html: string, cnr: string): WebCaseResult | null {
  if (!html || html.length < 50) return null

  const caseDetails: WebCaseDetails = {
    cnrNumber: cnr,
    caseType: extractField(html, 'case type'),
    filingNumber: extractField(html, 'filing number'),
    filingDate: extractField(html, 'filing date'),
    registrationNumber: extractField(html, 'registration number'),
    registrationDate: extractField(html, 'registration date'),
    status: extractField(html, 'case status') || extractField(html, 'status'),
    stage: extractField(html, 'stage'),
    nextHearingDate: extractField(html, 'next hearing date') || extractField(html, 'next date'),
    courtNumber: extractField(html, 'court no') || extractField(html, 'court number'),
    judge: extractField(html, 'judge'),
    petitioner: extractField(html, 'petitioner'),
    respondent: extractField(html, 'respondent'),
    petitionerAdvocate: extractField(html, 'petitioner advocate'),
    respondentAdvocate: extractField(html, 'respondent advocate'),
    dateOfDecision: extractField(html, 'date of decision'),
    natureOfDisposal: extractField(html, 'nature of disposal'),
  }

  const hearings: WebHearing[] = []
  const rows = extractTableRows(html)
  for (const row of rows) {
    if (row[0]?.match(/\d{2}-\d{2}-\d{4}/) && row.length >= 3) {
      hearings.push({
        date: row[0],
        purpose: row[1] || '',
        causeListType: row[2] || '',
        courtNumber: row[3] || '',
        judge: row[4] || '',
        businessOnDate: row[5] || '',
      })
    }
  }

  const orders: WebOrder[] = []
  for (const match of html.matchAll(/href="([^"]*\.pdf[^"]*)"[^>]*>.*?(\d{2}[-\/]\d{2}[-\/]\d{4})/gi)) {
    orders.push({ pdfUrl: match[1], number: '', date: match[2] })
  }

  return { caseDetails, hearings, orders, source: 'district' }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Search eCourts by CNR number — no API key required.
 * Tries HC Services first, then District Courts.
 * Same flow as bharat-courts Python library.
 */
export async function webSearchByCNR(cnr: string): Promise<WebCaseResult | null> {
  const upper = cnr.toUpperCase()

  // Attempt HC Services first (covers all 25 High Courts)
  const hcResult = await searchHCByCNR(upper)
  if (hcResult) return hcResult

  // Fall back to District Courts portal
  return searchDistrictByCNR(upper)
}

// ─── Cause list ───────────────────────────────────────────────────────────────

export async function webGetCauseList(params: {
  court: string
  date?: string    // DD-MM-YYYY; empty = today
  civil?: boolean
}): Promise<WebCauseListEntry[]> {
  const jar = new CookieJar()
  const stateCode = HC_STATE_CODES[params.court.toUpperCase().slice(0, 2)] ||
    Object.values(HC_STATE_CODES)[0]

  const dateStr = params.date || new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\//g, '-')

  for (let attempt = 0; attempt < MAX_CAPTCHA_RETRIES; attempt++) {
    try {
      jar.reset()

      // Init session
      const initRes = await fetch(`${HC_BASE}/main.php`, {
        headers: { ...BROWSER_HEADERS, Referer: 'https://hcservices.ecourts.gov.in/' },
      })
      jar.ingest(initRes.headers)
      await delay(500)

      // CAPTCHA
      const captchaRes = await fetch(`${HC_BASE}/securimage/securimage_show.php`, {
        headers: { ...BROWSER_HEADERS, Cookie: jar.header(), Referer: `${HC_BASE}/main.php`, 'X-Requested-With': '' },
      })
      jar.ingest(captchaRes.headers)
      const captchaBuffer = Buffer.from(await captchaRes.arrayBuffer())
      await delay(300)

      const captchaText = await solveCaptcha(captchaBuffer)
      if (!captchaText || captchaText.length < 4) {
        await delay(RETRY_DELAY_MS)
        continue
      }

      const body = new URLSearchParams({
        state_code: stateCode,
        bench_code: '1',
        action_code: 'showCauseList',
        causelist_type: params.civil !== false ? 'civil' : 'criminal',
        causelist_date: dateStr,
        captcha: captchaText,
      })

      const listRes = await fetch(`${HC_BASE}/cases/cases.php`, {
        method: 'POST',
        headers: {
          ...BROWSER_HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: jar.header(),
          Referer: `${HC_BASE}/main.php`,
        },
        body: body.toString(),
      })
      jar.ingest(listRes.headers)

      const raw = (await listRes.text()).replace(/^\ufeff/, '')
      if (raw.toLowerCase().includes('invalid captcha')) {
        await delay(RETRY_DELAY_MS * (attempt + 1))
        continue
      }

      let html = raw
      try {
        const j = JSON.parse(raw) as Record<string, string>
        html = j.con || j.causelist_data || raw
      } catch { /* plain HTML */ }

      return parseCauseListHTML(html)
    } catch (err) {
      console.error(`Cause list attempt ${attempt + 1}:`, err)
      await delay(RETRY_DELAY_MS)
    }
  }

  return []
}

function parseCauseListHTML(html: string): WebCauseListEntry[] {
  const rows = extractTableRows(html)
  const entries: WebCauseListEntry[] = []

  for (const row of rows) {
    if (row.length < 4) continue
    // Skip header rows
    if (row[0]?.toLowerCase().includes('serial') || row[0]?.toLowerCase().includes('sno')) continue
    if (!row[0]?.match(/^\d+$/)) continue

    entries.push({
      serialNo: row[0] || '',
      caseNumber: row[1] || '',
      petitioner: row[2] || '',
      respondent: row[3] || '',
      advocatePetitioner: row[4] || '',
      advocateRespondent: row[5] || '',
      courtNo: row[6] || '',
      judge: row[7] || '',
    })
  }

  return entries
}
