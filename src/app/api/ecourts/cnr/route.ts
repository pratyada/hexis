import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getCaseByCNR } from '@/lib/ecourts'

/**
 * GET /api/ecourts/cnr?cnr=DLHC010012345672024
 * Standalone CNR lookup — returns raw case data without saving to DB
 * Equivalent to bharat-courts HCServicesClient.case_status_by_cnr()
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cnr = searchParams.get('cnr')?.trim().toUpperCase()

  if (!cnr) {
    return NextResponse.json({ error: 'CNR number is required' }, { status: 400 })
  }

  // Validate CNR format: 16-char alphanumeric (e.g. DLHC010012345672024)
  if (!/^[A-Z]{4}\d{12,16}$/.test(cnr)) {
    return NextResponse.json({
      error: 'Invalid CNR format',
      hint: 'CNR should be like DLHC010012345672024 — 4 letters followed by digits',
    }, { status: 400 })
  }

  const nicKey = process.env.NIC_ECOURTS_API_KEY
  if (!nicKey) {
    return NextResponse.json({
      error: 'NIC eCourts API not configured',
      hint: 'Add NIC_ECOURTS_API_KEY to environment variables. Contact NIC at services.ecourts.gov.in to obtain an API key.',
      configRequired: true,
    }, { status: 503 })
  }

  try {
    const data = await getCaseByCNR(cnr)
    if (!data) {
      return NextResponse.json({ error: 'Case not found on eCourts for CNR: ' + cnr }, { status: 404 })
    }
    return NextResponse.json({ data, cnr })
  } catch (error) {
    console.error('CNR lookup error:', error)
    return NextResponse.json({ error: 'eCourts lookup failed' }, { status: 500 })
  }
}
