import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { clientSearchByCNR } from '@/lib/ecourts-client'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cnr = searchParams.get('cnr')?.trim().toUpperCase()

  if (!cnr) return NextResponse.json({ error: 'CNR number is required' }, { status: 400 })

  if (!/^[A-Z]{4}\d{7,16}$/.test(cnr)) {
    return NextResponse.json({
      error: 'Invalid CNR format',
      hint: 'CNR should look like DLHC010012345672024 — 4 letters followed by digits',
    }, { status: 400 })
  }

  try {
    const result = await clientSearchByCNR(cnr)
    if (!result) {
      return NextResponse.json({
        error: 'Case not found on eCourts',
        hint: 'Check that the CNR number is correct. CAPTCHA may have failed — try again.',
        cnr,
      }, { status: 404 })
    }
    return NextResponse.json({ data: result, cnr })
  } catch (error) {
    console.error('CNR lookup error:', error)
    return NextResponse.json({ error: 'eCourts lookup failed — please retry' }, { status: 500 })
  }
}
