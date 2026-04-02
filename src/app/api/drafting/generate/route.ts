import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { generateDraft } from '@/lib/claude'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    if (!body.facts || !body.court || !body.petitioner) {
      return NextResponse.json(
        { error: 'Facts, Court, and Petitioner are required' },
        { status: 400 }
      )
    }

    // Check for Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-your-key-here') {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to .env.local' },
        { status: 503 }
      )
    }

    // Fetch relevant precedents from DB
    const precedents = await prisma.legalPrecedent.findMany({
      where: {
        OR: [
          body.lawsApplicable ? { actsReferred: { contains: body.lawsApplicable.split(',')[0] } } : {},
          body.facts ? { keywords: { contains: body.facts.split(' ').slice(0, 3).join(' ') } } : {},
        ],
      },
      take: 5,
    })

    const precedentList = precedents.map(
      (p) => `${p.caseTitle} — ${p.citation}: ${p.holdingsSummary}`
    )

    const draft = await generateDraft({
      draftType: body.draftType,
      language: body.language,
      petitioner: body.petitioner,
      respondent: body.respondent || 'Opposite Party',
      court: body.court,
      facts: body.facts,
      reliefSought: body.reliefSought || 'As may be deemed fit and proper',
      lawsApplicable: body.lawsApplicable || '',
      ocrText: body.ocrText || '',
      precedents: precedentList,
    })

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Draft generation error:', error)
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
