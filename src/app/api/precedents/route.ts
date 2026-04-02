import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const area = searchParams.get('area')

  const where: Record<string, unknown> = {}
  if (area && area !== 'ALL') where.practiceArea = area
  if (search) {
    where.OR = [
      { caseTitle: { contains: search } },
      { citation: { contains: search } },
      { keywords: { contains: search } },
      { holdingsSummary: { contains: search } },
    ]
  }

  const precedents = await prisma.legalPrecedent.findMany({
    where,
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  return NextResponse.json({ precedents })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    const precedent = await prisma.legalPrecedent.create({
      data: {
        caseTitle: body.caseTitle,
        citation: body.citation,
        court: body.court,
        year: body.year ? parseInt(body.year) : undefined,
        holdingsSummary: body.holdingsSummary,
        legalPoints: body.legalPoints ? JSON.stringify(body.legalPoints) : undefined,
        actsReferred: body.actsReferred ? JSON.stringify(body.actsReferred) : undefined,
        source: body.source || 'MANUAL',
        practiceArea: body.practiceArea,
        keywords: body.keywords,
      },
    })

    return NextResponse.json({ precedent }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to add precedent' }, { status: 500 })
  }
}
