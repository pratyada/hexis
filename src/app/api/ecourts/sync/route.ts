import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCaseByCNR, parseECourtsData } from '@/lib/ecourts'
import { extractComplianceFromOrder } from '@/lib/claude'

/**
 * POST /api/ecourts/sync
 * Sync a single case by CNR number from eCourts
 *
 * POST /api/ecourts/sync/all
 * Bulk sync all active cases that have CNR numbers
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nicKey = process.env.NIC_ECOURTS_API_KEY
  if (!nicKey) {
    return NextResponse.json(
      {
        error: 'NIC eCourts API key not configured',
        hint: 'Add NIC_ECOURTS_API_KEY to .env.local. Register at services.ecourts.gov.in',
        mockData: true,
      },
      { status: 503 }
    )
  }

  try {
    const { caseId, cnrNumber } = await req.json()

    let cnr = cnrNumber
    if (caseId && !cnr) {
      const caseRecord = await prisma.case.findUnique({ where: { id: caseId } })
      cnr = caseRecord?.cnrNumber
    }

    if (!cnr) {
      return NextResponse.json({ error: 'CNR number required' }, { status: 400 })
    }

    const ecourtData = await getCaseByCNR(cnr)
    if (!ecourtData) {
      return NextResponse.json({ error: 'Case not found on eCourts' }, { status: 404 })
    }

    const parsed = parseECourtsData(ecourtData)

    // Update case in DB
    const updatedCase = await prisma.case.update({
      where: caseId ? { id: caseId } : { cnrNumber: cnr },
      data: {
        status: parsed.status === 'Disposed' ? 'DISPOSED' :
                parsed.status === 'Transferred' ? 'TRANSFERRED' : 'ACTIVE',
        stage: parsed.stage || undefined,
        lastNicSync: new Date(),
        nicRawData: parsed.rawData,
      },
    })

    // Create/update hearings from eCourts data
    if (parsed.nextHearingDate) {
      await prisma.hearing.upsert({
        where: {
          // Use a unique combination; since we don't have a unique constraint, use findFirst + create
          id: (await prisma.hearing.findFirst({
            where: {
              caseId: updatedCase.id,
              status: 'SCHEDULED',
              hearingDate: { gte: new Date() },
            },
          }))?.id || 'new',
        },
        update: {
          hearingDate: parsed.nextHearingDate,
          purpose: parsed.nextHearingPurpose || undefined,
          courtRoom: parsed.courtNumber || undefined,
        },
        create: {
          caseId: updatedCase.id,
          lawyerId: updatedCase.lawyerId,
          hearingDate: parsed.nextHearingDate,
          purpose: parsed.nextHearingPurpose || undefined,
          courtRoom: parsed.courtNumber || undefined,
          status: 'SCHEDULED',
        },
      })
    }

    // Import court orders and extract compliance items
    for (const order of parsed.orders.slice(0, 5)) {
      if (!order.date) continue

      const existingOrder = await prisma.courtOrder.findFirst({
        where: { caseId: updatedCase.id, orderDate: order.date },
      })

      if (!existingOrder) {
        // Try to extract compliance items using AI if order text available
        let complianceItems: string[] = []
        if (order.pdfUrl && process.env.ANTHROPIC_API_KEY) {
          // In production, download PDF and extract text, then run through Claude
          // For now, mark as needing review
          complianceItems = ['Review order PDF for compliance requirements']
        }

        await prisma.courtOrder.create({
          data: {
            caseId: updatedCase.id,
            orderDate: order.date,
            orderType: 'ORDER',
            complianceRequired: complianceItems.length > 0,
            complianceItems: complianceItems.length > 0 ? JSON.stringify(complianceItems) : undefined,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      case: updatedCase,
      syncedAt: new Date().toISOString(),
      nextHearingDate: parsed.nextHearingDate,
      status: parsed.status,
    })
  } catch (error) {
    console.error('eCourts sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

/**
 * GET /api/ecourts/sync - Bulk sync all cases with CNR numbers
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cases = await prisma.case.findMany({
    where: {
      status: 'ACTIVE',
      cnrNumber: { not: null },
    },
    select: { id: true, cnrNumber: true, caseTitle: true },
  })

  return NextResponse.json({
    pending: cases.length,
    cases: cases.map((c) => ({
      id: c.id,
      cnr: c.cnrNumber,
      title: c.caseTitle,
    })),
    message: `${cases.length} cases ready to sync. POST to /api/ecourts/sync with caseId to sync individual case.`,
  })
}
