import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { clientSearch, clientSearchByCNR } from '@/lib/ecourts-client'

/**
 * GET /api/ecourts/search
 * ?type=cnr&cnr=DLHC010012345672024
 * ?type=case_number&court=delhi&caseType=W.P.(C)&caseNumber=1234&year=2024
 * ?type=diary_number&court=delhi&diaryNumber=5678&year=2024
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'cnr'

  try {
    if (type === 'cnr') {
      const cnr = searchParams.get('cnr')?.trim().toUpperCase()
      if (!cnr) return NextResponse.json({ error: 'CNR number required' }, { status: 400 })
      if (!/^[A-Z]{4}\d{7,16}$/.test(cnr)) {
        return NextResponse.json({
          error: 'Invalid CNR format',
          hint: 'Example: DLHC010012345672024 — 4 letters then digits',
        }, { status: 400 })
      }
      const result = await clientSearchByCNR(cnr)
      if (!result) return NextResponse.json({ error: 'Case not found — CAPTCHA may have failed, please retry', cnr }, { status: 404 })
      return NextResponse.json({ data: result, cnr })
    }

    if (type === 'case_number') {
      const court = searchParams.get('court')
      const caseType = searchParams.get('caseType')
      const caseNumber = searchParams.get('caseNumber')
      const year = searchParams.get('year')
      if (!court || !caseType || !caseNumber || !year) {
        return NextResponse.json({ error: 'court, caseType, caseNumber and year are required' }, { status: 400 })
      }
      const result = await clientSearch({ type: 'case_number', court, caseType, caseNumber, year })
      if (!result) return NextResponse.json({ error: 'Case not found — please retry' }, { status: 404 })
      return NextResponse.json({ data: result })
    }

    if (type === 'diary_number') {
      const court = searchParams.get('court')
      const diaryNumber = searchParams.get('diaryNumber')
      const year = searchParams.get('year')
      if (!court || !diaryNumber || !year) {
        return NextResponse.json({ error: 'court, diaryNumber and year are required' }, { status: 400 })
      }
      const result = await clientSearch({ type: 'diary_number', court, diaryNumber: diaryNumber, year })
      if (!result) return NextResponse.json({ error: 'Case not found — please retry' }, { status: 404 })
      return NextResponse.json({ data: result })
    }

    return NextResponse.json({ error: 'Invalid type. Use cnr, case_number, or diary_number' }, { status: 400 })
  } catch (error) {
    console.error('eCourts search error:', error)
    return NextResponse.json({ error: 'Search failed — please retry' }, { status: 500 })
  }
}
