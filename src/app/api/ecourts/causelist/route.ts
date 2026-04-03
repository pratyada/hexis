import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { webGetCauseList } from '@/lib/ecourts-web'

/**
 * GET /api/ecourts/causelist?court=delhi&date=02-04-2026&type=civil
 *
 * Fetches daily cause list from NIC eCourts HC Services portal.
 * No API key required — CAPTCHA handled automatically via Tesseract OCR.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const court = searchParams.get('court') || 'delhi'
  const date = searchParams.get('date') || ''       // DD-MM-YYYY; empty = today
  const type = searchParams.get('type') || 'civil'

  try {
    const entries = await webGetCauseList({
      court,
      date,
      civil: type === 'civil',
    })

    return NextResponse.json({
      data: entries,
      court,
      date: date || 'today',
      count: entries.length,
    })
  } catch (error) {
    console.error('Cause list error:', error)
    return NextResponse.json({ error: 'Failed to fetch cause list — please retry' }, { status: 500 })
  }
}
