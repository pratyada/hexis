import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getCauseList } from '@/lib/ecourts'

/**
 * GET /api/ecourts/causelist?court=delhi&date=2024-04-02&type=civil
 * Fetches today's (or a given date's) cause list for a court
 * Equivalent to bharat-courts HCServicesClient.cause_list()
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const court = searchParams.get('court') || 'delhi'
  const date = searchParams.get('date') || ''          // DD-MM-YYYY; empty = today
  const type = searchParams.get('type') || 'civil'    // civil | criminal

  const nicKey = process.env.NIC_ECOURTS_API_KEY
  if (!nicKey) {
    return NextResponse.json({
      error: 'NIC eCourts API not configured',
      hint: 'Add NIC_ECOURTS_API_KEY to environment variables.',
      configRequired: true,
    }, { status: 503 })
  }

  try {
    const data = await getCauseList({ court, date, civil: type === 'civil' })
    return NextResponse.json({ data, court, date: date || 'today' })
  } catch (error) {
    console.error('Cause list error:', error)
    return NextResponse.json({ error: 'Failed to fetch cause list' }, { status: 500 })
  }
}
