'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Sparkles, FileText, Upload, X, Languages,
  AlertCircle, Copy, Download, Save, ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { DRAFT_TYPES, LANGUAGES, CASE_TYPES, COURT_TYPES } from '@/lib/utils'

export default function NewDraftPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') || 'WRIT_PETITION'
  const caseId = searchParams.get('caseId') || ''

  const [form, setForm] = useState({
    title: '',
    draftType: defaultType,
    language: 'en',
    petitioner: '',
    respondent: '',
    court: '',
    facts: '',
    reliefSought: '',
    lawsApplicable: '',
    caseId,
    clientCode: '',
  })

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [ocrTexts, setOcrTexts] = useState<string[]>([])
  const [generatedDraft, setGeneratedDraft] = useState('')
  const [generating, setGenerating] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'input' | 'output'>('input')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newFiles = Array.from(files)
    setUploadedFiles((prev) => [...prev, ...newFiles])

    setOcrLoading(true)
    try {
      for (const file of newFiles) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/documents/ocr', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json()
          setOcrTexts((prev) => [...prev, data.text || ''])
        }
      }
    } finally {
      setOcrLoading(false)
    }
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFileUpload(e.dataTransfer.files)
  }

  async function handleGenerate() {
    if (!form.facts || !form.court || !form.petitioner) {
      setError('Please fill in Petitioner, Court, and Facts before generating.')
      return
    }
    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/drafting/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ocrText: ocrTexts.join('\n\n'),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Generation failed')
        return
      }

      setGeneratedDraft(data.draft)
      setStep('output')
    } catch {
      setError('Network error. Check your connection.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/drafting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title || `${form.draftType.replace(/_/g, ' ')} - ${form.petitioner}`,
          draftType: form.draftType,
          language: form.language,
          content: generatedDraft,
          aiGenerated: true,
          factsSummary: form.facts,
          reliefSought: form.reliefSought,
          lawsApplicable: form.lawsApplicable,
          caseId: form.caseId || undefined,
          clientCode: form.clientCode || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/drafting/${data.draft.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedDraft)
  }

  return (
    <div>
      <div className="page-header">
        <Link href="/drafting" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Drafting
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="page-title">Vaakil AI — New Draft</h1>
            <p className="page-subtitle">AI-powered legal document generation</p>
          </div>
        </div>
      </div>

      {step === 'input' ? (
        <div className="max-w-3xl">
          {error && (
            <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Document Type & Language */}
          <div className="hexis-card p-6 mb-6">
            <h2 className="section-title">Document Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Document Type *</label>
                <select name="draftType" value={form.draftType} onChange={handleChange} className="form-input">
                  {DRAFT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label flex items-center gap-2">
                  <Languages className="w-4 h-4 text-gray-400" />
                  Draft Language
                </label>
                <select name="language" value={form.language} onChange={handleChange} className="form-input">
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Draft Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className="form-label">Link to Case (optional)</label>
                <input
                  name="caseId"
                  value={form.caseId}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Case ID"
                />
              </div>
            </div>
          </div>

          {/* Parties & Court */}
          <div className="hexis-card p-6 mb-6">
            <h2 className="section-title">Parties & Court</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Petitioner / Applicant *</label>
                <input name="petitioner" value={form.petitioner} onChange={handleChange} className="form-input" required />
              </div>
              <div>
                <label className="form-label">Respondent / Opposite Party</label>
                <input name="respondent" value={form.respondent} onChange={handleChange} className="form-input" />
              </div>
              <div className="col-span-2">
                <label className="form-label">Court / Forum *</label>
                <input
                  name="court"
                  value={form.court}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. Delhi High Court, Saket District Court"
                  required
                />
              </div>
            </div>
          </div>

          {/* Facts & Relief */}
          <div className="hexis-card p-6 mb-6">
            <h2 className="section-title">Facts & Arguments</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Facts of the Case *</label>
                <textarea
                  name="facts"
                  value={form.facts}
                  onChange={handleChange}
                  className="form-input h-40 resize-none"
                  placeholder="Describe the facts in detail. The AI will structure them into proper legal paragraphs. Include dates, events, parties involved, and the sequence of events..."
                  required
                />
              </div>
              <div>
                <label className="form-label">Relief Sought / Prayer</label>
                <textarea
                  name="reliefSought"
                  value={form.reliefSought}
                  onChange={handleChange}
                  className="form-input h-24 resize-none"
                  placeholder="List what you want the court to order or grant..."
                />
              </div>
              <div>
                <label className="form-label">Applicable Laws & Sections</label>
                <input
                  name="lawsApplicable"
                  value={form.lawsApplicable}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. Article 226 of Constitution, Section 482 CrPC, Consumer Protection Act 2019..."
                />
              </div>
            </div>
          </div>

          {/* Document Upload / OCR */}
          <div className="hexis-card p-6 mb-6">
            <h2 className="section-title">Upload Source Documents (Optional)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload scanned documents, FIR copies, contracts, or any reference materials. OCR will extract text automatically for the AI to analyze.
            </p>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Drop files or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPEG, PNG, DOCX • Max 50MB each</p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>

            {ocrLoading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-purple-600">
                <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                Extracting text via OCR...
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                    {ocrTexts[i] && (
                      <span className="text-xs text-green-600 font-medium">OCR ✓</span>
                    )}
                    <button onClick={() => {
                      setUploadedFiles((prev) => prev.filter((_, j) => j !== i))
                      setOcrTexts((prev) => prev.filter((_, j) => j !== i))
                    }}>
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <Link href="/drafting" className="btn-secondary">Cancel</Link>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-gold disabled:opacity-60 flex-1 justify-center"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-hexis-navy/30 border-t-hexis-navy rounded-full animate-spin" />
                  Generating with Claude AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Legal Draft with AI
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Output Step */
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('input')}
                className="btn-secondary text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit Inputs
              </button>
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                <Sparkles className="w-4 h-4" />
                AI Draft Generated
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={copyToClipboard} className="btn-secondary text-sm">
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="hexis-card">
                <div className="border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Generated Draft — {form.draftType.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-400">
                    {form.language === 'hi' ? 'हिंदी' : form.language === 'en-hi' ? 'EN + HI' : 'English'}
                  </span>
                </div>
                <div className="p-6">
                  <textarea
                    value={generatedDraft}
                    onChange={(e) => setGeneratedDraft(e.target.value)}
                    className="w-full h-[600px] text-sm font-mono text-gray-800 resize-none focus:outline-none leading-relaxed"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="hexis-card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Draft Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Type</p>
                    <p className="font-medium">{form.draftType.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Language</p>
                    <p className="font-medium">
                      {form.language === 'hi' ? 'Hindi' : form.language === 'en-hi' ? 'Bilingual' : 'English'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Court</p>
                    <p className="font-medium">{form.court}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Petitioner</p>
                    <p className="font-medium">{form.petitioner}</p>
                  </div>
                </div>
              </div>

              <div className="hexis-card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">⚠️ Disclaimer</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  This draft is AI-generated and should be reviewed and verified by a qualified advocate before filing. Always verify citations and ensure compliance with current law.
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-secondary w-full justify-center text-sm"
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
                {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
