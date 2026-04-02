import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import path from 'path'
import fs from 'fs'
import { writeFile, mkdir } from 'fs/promises'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const category = searchParams.get('category')
  const caseId = searchParams.get('caseId')

  const where: Record<string, unknown> = {}
  if (category && category !== 'ALL') where.category = category
  if (caseId) where.caseId = caseId
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { ocrText: { contains: search } },
      { aiSummary: { contains: search } },
      { tags: { contains: search } },
    ]
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      uploader: { select: { name: true } },
      case: { select: { caseTitle: true } },
      client: { select: { name: true } },
    },
  })

  return NextResponse.json({ documents })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'GENERAL'
    const caseId = formData.get('caseId') as string || undefined
    const clientId = formData.get('clientId') as string || undefined

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Save file to disk
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const ext = path.extname(file.name).replace('.', '').toLowerCase()
    const timestamp = Date.now()
    const safeFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = path.join(uploadDir, safeFileName)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Generate document code
    const count = await prisma.document.count()
    const documentCode = `HX-DOC-${String(count + 1).padStart(4, '0')}`

    // Create document record
    const document = await prisma.document.create({
      data: {
        documentCode,
        name: file.name,
        originalName: file.name,
        fileType: ext,
        filePath: `/uploads/${safeFileName}`,
        fileSize: file.size,
        mimeType: file.type,
        category,
        ocrStatus: 'PENDING',
        uploadedBy: session.userId,
        caseId: caseId || undefined,
        clientId: clientId || undefined,
      },
    })

    // Trigger OCR in background (non-blocking)
    void processOCR(document.id, filePath)

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

async function processOCR(documentId: string, filePath: string) {
  try {
    await prisma.document.update({
      where: { id: documentId },
      data: { ocrStatus: 'PROCESSING' },
    })

    const { extractTextFromFile, sanitizeOCRText } = await import('@/lib/ocr')
    const result = await extractTextFromFile(filePath)
    const cleanText = sanitizeOCRText(result.text)

    // Generate AI summary if we have text
    let aiSummary: string | undefined
    if (cleanText.length > 100 && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-ant-your-key-here') {
      try {
        const { analyzeDocument } = await import('@/lib/claude')
        const analysis = await analyzeDocument(cleanText)
        aiSummary = analysis.summary
      } catch {
        // AI analysis failed, continue without it
      }
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrText: cleanText || undefined,
        ocrStatus: 'DONE',
        aiSummary: aiSummary || undefined,
      },
    })
  } catch (error) {
    console.error('OCR error:', error)
    await prisma.document.update({
      where: { id: documentId },
      data: { ocrStatus: 'FAILED' },
    })
  }
}
