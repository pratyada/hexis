/**
 * NIC eCourts API Integration
 * Based on the official eCourts mobile app API (reverse-engineered)
 *
 * Official endpoint: https://services.ecourts.gov.in/ecourtindiaAPI/
 * Authentication: App token obtained via handshake
 *
 * For production: Obtain formal MoU with NIC/DoJ at services.ecourts.gov.in
 */

const ECOURTS_BASE_URL = process.env.NIC_ECOURTS_API_URL || 'https://services.ecourts.gov.in/ecourtindiaAPI/api'

let _cachedToken: string | null = null
let _tokenExpiry: Date | null = null

export interface ECourtsCase {
  cnr_number: string
  case_type: string
  filing_number: string
  filing_date: string
  registration_number: string
  registration_date: string
  case_status: 'Pending' | 'Disposed' | 'Transferred'
  next_hearing_date: string
  stage_of_case: string
  court_number: string
  judge: string
  petitioner_advocate: string
  respondent_advocate: string
  nature_of_disposal: string | null
  date_of_decision: string | null
}

export interface ECourtsHearing {
  hearing_date: string
  purpose_of_hearing: string
  cause_list_type: string
  court_number: string
  judge: string
  business_on_date: string
}

export interface ECourtsOrder {
  order_date: string
  order_number: string
  order_link: string
}

export interface ECourtsResponse {
  case_details: ECourtsCase
  history_of_hearings: ECourtsHearing[]
  orders: ECourtsOrder[]
}

async function getToken(): Promise<string> {
  if (_cachedToken && _tokenExpiry && new Date() < _tokenExpiry) {
    return _cachedToken
  }

  const appKey = process.env.NIC_ECOURTS_API_KEY
  if (!appKey) {
    throw new Error('NIC_ECOURTS_API_KEY not configured')
  }

  const res = await fetch(`${ECOURTS_BASE_URL}/getToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'eCourts/7.0.3 (Android)',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({ appid: appKey }),
  })

  if (!res.ok) {
    throw new Error(`eCourts token fetch failed: ${res.status}`)
  }

  const data = await res.json() as { token: string }
  _cachedToken = data.token
  _tokenExpiry = new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours
  return _cachedToken
}

/**
 * Fetch case details by CNR number
 * CNR format: DLHC010012342023 (Delhi High Court)
 */
export async function getCaseByCNR(cnrNumber: string): Promise<ECourtsResponse | null> {
  try {
    const token = await getToken()

    const res = await fetch(`${ECOURTS_BASE_URL}/casestatus/cnr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        cnr_number: cnrNumber,
        apptoken: token,
      }),
    })

    if (!res.ok) return null
    return await res.json() as ECourtsResponse
  } catch (error) {
    console.error('eCourts CNR lookup error:', error)
    return null
  }
}

/**
 * Fetch case by case number components
 */
export async function getCaseByNumber(params: {
  stateCode: string
  distCode: string
  caseType: string
  caseNo: string
  year: string
}): Promise<ECourtsResponse | null> {
  try {
    const token = await getToken()

    const res = await fetch(`${ECOURTS_BASE_URL}/casestatus/caseNo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        state_code: params.stateCode,
        dist_code: params.distCode,
        case_type: params.caseType,
        case_no: params.caseNo,
        rgyear: params.year,
        apptoken: token,
      }),
    })

    if (!res.ok) return null
    return await res.json() as ECourtsResponse
  } catch (error) {
    console.error('eCourts case number lookup error:', error)
    return null
  }
}

/**
 * Parse eCourts response and extract useful fields for our CRM
 */
export function parseECourtsData(data: ECourtsResponse) {
  const details = data.case_details

  // Parse next hearing date (DD-MM-YYYY → ISO)
  function parseIndianDate(dateStr: string | null): Date | null {
    if (!dateStr) return null
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
    }
    return null
  }

  const nextHearing = data.history_of_hearings
    .filter((h) => {
      const d = parseIndianDate(h.hearing_date)
      return d && d >= new Date()
    })
    .sort((a, b) => {
      const da = parseIndianDate(a.hearing_date)
      const db = parseIndianDate(b.hearing_date)
      return (da?.getTime() || 0) - (db?.getTime() || 0)
    })[0]

  return {
    status: details.case_status,
    stage: details.stage_of_case,
    courtNumber: details.court_number,
    judge: details.judge,
    nextHearingDate: parseIndianDate(details.next_hearing_date),
    nextHearingPurpose: nextHearing?.purpose_of_hearing,
    filingDate: parseIndianDate(details.filing_date),
    registrationDate: parseIndianDate(details.registration_date),
    disposalDate: parseIndianDate(details.date_of_decision),
    natureOfDisposal: details.nature_of_disposal,
    hearingHistory: data.history_of_hearings.map((h) => ({
      date: parseIndianDate(h.hearing_date),
      purpose: h.purpose_of_hearing,
      causeListType: h.cause_list_type,
      judge: h.judge,
      outcome: h.business_on_date,
    })),
    orders: data.orders.map((o) => ({
      date: parseIndianDate(o.order_date),
      number: o.order_number,
      pdfUrl: o.order_link,
    })),
    rawData: JSON.stringify(data),
  }
}

export interface ECaurtsCauseListEntry {
  serialNo: string
  caseNumber: string
  petitioner: string
  respondent: string
  advocatePetitioner: string
  advocateRespondent: string
  courtNo: string
  judge: string
}

export interface ECourtsOrderDetail {
  orderDate: string
  orderNumber: string
  orderLink: string
  judge?: string
}

/**
 * Fetch cause list for a High Court
 * Equivalent to bharat-courts HCServicesClient.cause_list()
 */
export async function getCauseList(params: {
  court: string
  date?: string   // DD-MM-YYYY; empty = today
  civil?: boolean
  benchCode?: string
}): Promise<ECaurtsCauseListEntry[]> {
  try {
    const token = await getToken()

    const courtCodes: Record<string, string> = {
      delhi: '7',
      bombay: '13',
      madras: '23',
      calcutta: '27',
      allahabad: '25',
      karnataka: '10',
      gujarat: '8',
      telangana: '24',
      rajasthan: '20',
    }
    const courtCode = courtCodes[params.court.toLowerCase()] || '7'

    const res = await fetch(`${ECOURTS_BASE_URL}/causelist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        state_code: courtCode,
        bench_code: params.benchCode || '1',
        causelist_type: params.civil !== false ? 'civil' : 'criminal',
        causelist_date: params.date || '',
        apptoken: token,
      }),
    })

    if (!res.ok) return []
    const data = await res.json() as { causelist?: ECaurtsCauseListEntry[] }
    return data.causelist || []
  } catch (error) {
    console.error('eCourts cause list error:', error)
    return []
  }
}

/**
 * Fetch all orders for a case by CNR
 * Equivalent to bharat-courts HCServicesClient.court_orders()
 */
export async function getCaseOrders(cnrNumber: string): Promise<ECourtsOrderDetail[]> {
  try {
    const data = await getCaseByCNR(cnrNumber)
    if (!data) return []
    return (data.orders || []).map((o) => ({
      orderDate: o.order_date,
      orderNumber: o.order_number,
      orderLink: o.order_link,
    }))
  } catch (error) {
    console.error('eCourts orders error:', error)
    return []
  }
}

/**
 * State codes for eCourts API
 */
export const STATE_CODES: Record<string, { code: string; districts: Record<string, string> }> = {
  Delhi: { code: '7', districts: { Delhi: '1' } },
  Maharashtra: { code: '13', districts: { Mumbai: '1', Pune: '17', Nagpur: '22' } },
  Karnataka: { code: '10', districts: { Bengaluru: '1', Mysuru: '16' } },
  'Tamil Nadu': { code: '23', districts: { Chennai: '1', Coimbatore: '5' } },
  'Uttar Pradesh': { code: '25', districts: { Allahabad: '1', Lucknow: '10', Agra: '2' } },
  'West Bengal': { code: '27', districts: { Kolkata: '1' } },
  Gujarat: { code: '8', districts: { Ahmedabad: '1', Surat: '7' } },
  Telangana: { code: '24', districts: { Hyderabad: '1' } },
  Rajasthan: { code: '20', districts: { Jodhpur: '1', Jaipur: '2' } },
  Haryana: { code: '9', districts: { Gurugram: '8', Faridabad: '5' } },
}
