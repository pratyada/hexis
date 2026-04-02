import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const drafts = await prisma.draft.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      case: { select: { caseTitle: true } },
      client: { select: { name: true } },
    },
  })

  return NextResponse.json({ drafts })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    let clientId: string | undefined
    if (body.clientCode) {
      const client = await prisma.client.findUnique({ where: { clientCode: body.clientCode } })
      if (client) clientId = client.id
    }

    const count = await prisma.draft.count()
    const draftCode = `HX-DRAFT-${String(count + 1).padStart(3, '0')}`

    const draft = await prisma.draft.create({
      data: {
        draftCode,
        title: body.title,
        draftType: body.draftType,
        language: body.language || 'en',
        content: body.content,
        aiGenerated: body.aiGenerated || false,
        aiModel: body.aiGenerated ? 'claude-opus-4-6' : undefined,
        factsSummary: body.factsSummary,
        reliefSought: body.reliefSought,
        lawsApplicable: body.lawsApplicable,
        caseId: body.caseId || undefined,
        clientId,
        createdBy: session.userId,
        status: 'DRAFT',
      },
    })

    return NextResponse.json({ draft }, { status: 201 })
  } catch (error) {
    console.error('Save draft error:', error)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}
