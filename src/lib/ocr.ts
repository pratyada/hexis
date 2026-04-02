import { createWorker } from 'tesseract.js'
import path from 'path'
import fs from 'fs'

export interface OCRResult {
  text: string
  confidence: number
  language: string
}

export async function extractTextFromFile(filePath: string, language: string = 'en'): Promise<OCRResult> {
  const ext = path.extname(filePath).toLowerCase()

  // For text-based documents, read directly
  if (ext === '.txt') {
    const text = fs.readFileSync(filePath, 'utf-8')
    return { text, confidence: 100, language }
  }

  // OCR for images and PDFs
  const tesseractLang = language === 'hi' ? 'hin+eng' : 'eng+hin'

  try {
    const worker = await createWorker(tesseractLang, 1, {
      logger: () => {}, // suppress logs
    })

    const { data } = await worker.recognize(filePath)
    await worker.terminate()

    return {
      text: data.text,
      confidence: data.confidence,
      language,
    }
  } catch (error) {
    console.error('OCR Error:', error)
    return {
      text: '',
      confidence: 0,
      language,
    }
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
