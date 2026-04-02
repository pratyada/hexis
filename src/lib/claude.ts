import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface DraftingInput {
  draftType: string
  language: string
  petitioner: string
  respondent: string
  court: string
  facts: string
  reliefSought: string
  lawsApplicable: string
  ocrText?: string
  precedents?: string[]
  existingDraft?: string
}

export interface AnalysisResult {
  summary: string
  keyFacts: string[]
  legalIssues: string[]
  relevantLaws: string[]
  suggestedArguments: string[]
  riskAssessment: string
}

export async function generateDraft(input: DraftingInput): Promise<string> {
  const languageInstruction =
    input.language === 'hi'
      ? 'Draft entirely in Hindi (Devanagari script).'
      : input.language === 'en-hi'
      ? 'Draft in English with legal terms and party names in Hindi where appropriate (bilingual format).'
      : 'Draft in formal legal English.'

  const precedentContext =
    input.precedents && input.precedents.length > 0
      ? `\n\nRelevant precedents to cite:\n${input.precedents.join('\n')}`
      : ''

  const ocrContext = input.ocrText
    ? `\n\nScanned document text (for reference):\n${input.ocrText.substring(0, 3000)}`
    : ''

  const systemPrompt = `You are an expert Indian advocate with 25+ years of experience in Delhi High Court, Supreme Court of India, and District Courts. You specialize in drafting legal documents that are:
- Precise and legally sound under Indian law
- Following the established formats of Indian courts
- Citing relevant provisions of Indian statutes and case law
- Adhering to the Civil Procedure Code, Criminal Procedure Code, and relevant special laws
- Written in the proper court language and style

${languageInstruction}

Always structure documents with:
1. Proper court heading and case details
2. Parties with proper legal descriptions
3. Numbered paragraphs for facts
4. Clear prayer/relief section
5. Proper verification/affidavit clauses
6. Date and place`

  const userPrompt = `Draft a ${input.draftType} for the following matter:

**Court:** ${input.court}
**Petitioner/Plaintiff:** ${input.petitioner}
**Respondent/Defendant:** ${input.respondent}

**Facts of the Case:**
${input.facts}

**Relief Sought:**
${input.reliefSought}

**Applicable Laws/Provisions:**
${input.lawsApplicable}
${precedentContext}
${ocrContext}

Please draft a complete, court-ready ${input.draftType} following all Indian legal formatting standards. Include all necessary legal provisions, precedent citations, and prayer clause.`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type === 'text') {
    return content.text
  }
  throw new Error('Unexpected response from Claude')
}

export async function analyzeDocument(ocrText: string, documentType?: string): Promise<AnalysisResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `You are a senior Indian legal analyst. Analyze legal documents and extract key information relevant to Indian law practice. Return structured JSON analysis.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this ${documentType || 'legal document'} text and provide a structured analysis:

${ocrText.substring(0, 6000)}

Return a JSON object with these exact fields:
{
  "summary": "2-3 sentence summary",
  "keyFacts": ["fact1", "fact2", ...],
  "legalIssues": ["issue1", "issue2", ...],
  "relevantLaws": ["Act/Section 1", "Act/Section 2", ...],
  "suggestedArguments": ["argument1", "argument2", ...],
  "riskAssessment": "Brief assessment of case strength and risks"
}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type === 'text') {
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AnalysisResult
      }
    } catch {
      // fallback
    }
  }

  return {
    summary: 'Document analyzed. Manual review recommended.',
    keyFacts: [],
    legalIssues: [],
    relevantLaws: [],
    suggestedArguments: [],
    riskAssessment: 'Unable to automatically assess. Please review manually.',
  }
}

export async function extractComplianceFromOrder(orderText: string): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `You are an Indian legal assistant. Extract compliance requirements and action items from court orders.`,
    messages: [
      {
        role: 'user',
        content: `Extract all compliance items and action items that the advocate/party must fulfill from this court order:

${orderText.substring(0, 4000)}

Return a JSON array of strings, each being a specific action item. Example:
["File counter affidavit within 4 weeks", "Serve copy on respondent counsel", "Deposit court fee of Rs. 500"]`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type === 'text') {
    try {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as string[]
      }
    } catch {
      // fallback
    }
  }
  return []
}

export async function searchLegalPrecedents(query: string, practiceArea?: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: `You are a senior Indian legal researcher with expertise in Indian case law, statutes, and legal databases including SCC Online and Manupatra. Provide accurate case citations and legal research.`,
    messages: [
      {
        role: 'user',
        content: `Research relevant Indian case law and legal provisions for:

Query: ${query}
${practiceArea ? `Practice Area: ${practiceArea}` : ''}

Provide:
1. Top 5-7 most relevant landmark cases with full citations (SCC/AIR/etc.)
2. Key statutory provisions
3. Brief holding of each case
4. How they apply to the query

Format as structured markdown.`,
      },
    ],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text : 'Research unavailable.'
}
