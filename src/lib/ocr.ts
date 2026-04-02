import path from 'path'
import fs from 'fs'

export interface OCRResult {
  text: string
  confidence: number
  language: string
}

export async function extractTextFromFile(filePath: string, language: string = 'en'): Promise<OCRResult> {
  const ext = path.extname(filePath).toLowerCase()

  // For text files, read directly
  if (ext === '.txt') {
    const text = fs.readFileSync(filePath, 'utf-8')
    return { text, confidence: 100, language }
  }

  // Try Tesseract OCR — gracefully skip if unavailable (e.g. Vercel serverless)
  try {
    const { createWorker } = await import('tesseract.js')
    const tesseractLang = language === 'hi' ? 'hin+eng' : 'eng+hin'

    const worker = await createWorker(tesseractLang, 1, {
      logger: () => {},
    })

    const { data } = await worker.recognize(filePath)
    await worker.terminate()

    return {
      text: data.text,
      confidence: data.confidence,
      language,
    }
  } catch (error) {
    console.warn('OCR unavailable (expected on serverless):', error)
    return { text: '', confidence: 0, language }
  }
}

export function sanitizeOCRText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
