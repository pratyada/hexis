import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Write to temp file
    const tmpDir = os.tmpdir()
    const ext = path.extname(file.name)
    const tmpPath = path.join(tmpDir, `hexis-ocr-${Date.now()}${ext}`)

    const bytes = await file.arrayBuffer()
    await writeFile(tmpPath, Buffer.from(bytes))

    let text = ''
    try {
      const { extractTextFromFile, sanitizeOCRText } = await import('@/lib/ocr')
      const result = await extractTextFromFile(tmpPath)
      text = sanitizeOCRText(result.text)
    } finally {
      // Cleanup temp file
      unlink(tmpPath).catch(() => {})
    }

    return NextResponse.json({ text, success: true })
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json({ text: '', success: false, error: 'OCR processing failed' })
  }
}
