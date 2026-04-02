import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { searchLegalPrecedents } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { query, practiceArea } = await req.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-your-key-here') {
      return NextResponse.json(
        { result: 'Anthropic API key not configured. Please add your key to .env.local to use AI research.' }
      )
    }

    const result = await searchLegalPrecedents(query, practiceArea)
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Legal research error:', error)
    return NextResponse.json({ result: 'Research failed. Please try again.' })
  }
}
