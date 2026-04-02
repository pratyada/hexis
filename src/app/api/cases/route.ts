import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = {}
  if (status && status !== 'ALL') where.status = status
  if (search) {
    where.OR = [
      { caseTitle: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { caseNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { cnrNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
    ]
  }

  const cases = await prisma.case.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      client: { select: { name: true, clientCode: true } },
      lawyer: { select: { name: true } },
    },
  })

  return NextResponse.json({ cases })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    // Look up client
    let clientId: string | null = null
    if (body.clientCode) {
      const client = await prisma.client.findUnique({ where: { clientCode: body.clientCode } })
      if (!client) return NextResponse.json({ error: 'Client not found with that code' }, { status: 400 })
      clientId = client.id
    }

    // Auto-assign first client if none
    if (!clientId) {
      const firstClient = await prisma.client.findFirst()
      if (!firstClient) return NextResponse.json({ error: 'No clients found. Add a client first.' }, { status: 400 })
      clientId = firstClient.id
    }

    // Generate case code
    const count = await prisma.case.count()
    const caseCode = `HX-CASE-${String(count + 1).padStart(3, '0')}`

    const newCase = await prisma.case.create({
      data: {
        caseCode,
        caseTitle: body.caseTitle,
        cnrNumber: body.cnrNumber || undefined,
        caseNumber: body.caseNumber || undefined,
        caseType: body.caseType,
        courtName: body.courtName,
        courtState: body.courtState || 'Delhi',
        courtDistrict: body.courtDistrict || undefined,
        benchType: body.benchType,
        filingDate: body.filingDate ? new Date(body.filingDate) : undefined,
        status: 'ACTIVE',
        stage: body.stage || 'ADMISSION',
        petitioner: body.petitioner,
        respondent: body.respondent,
        petitionerAdvocate: body.petitionerAdvocate || undefined,
        respondentAdvocate: body.respondentAdvocate || undefined,
        clientId,
        lawyerId: session.userId,
        retainerAmount: body.retainerAmount ? parseFloat(body.retainerAmount) : undefined,
        priority: body.priority || 'MEDIUM',
        description: body.description || undefined,
      },
    })

    return NextResponse.json({ case: newCase }, { status: 201 })
  } catch (error) {
    console.error('Create case error:', error)
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }
}
