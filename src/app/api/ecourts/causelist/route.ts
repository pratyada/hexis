import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { clientGetCauseList } from '@/lib/ecourts-client'

/**
 * GET /api/ecourts/causelist?court=delhi&date=02-04-2026&type=civil
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const court = searchParams.get('court') || 'delhi'
  const date = searchParams.get('date') || ''
  const type = searchParams.get('type') || 'civil'

  try {
    const entries = await clientGetCauseList({ court, date, type })
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
