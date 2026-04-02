'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Search, Sparkles, ExternalLink } from 'lucide-react'

interface Precedent {
  id: string
  caseTitle: string
  citation: string
  court: string | null
  year: number | null
  holdingsSummary: string | null
  legalPoints: string | null
  actsReferred: string | null
  source: string | null
  practiceArea: string | null
}

export default function PrecedentsPage() {
  const [precedents, setPrecedents] = useState<Precedent[]>([])
  const [search, setSearch] = useState('')
  const [practiceArea, setPracticeArea] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [aiSearch, setAiSearch] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [selected, setSelected] = useState<Precedent | null>(null)

  useEffect(() => {
    async function fetch_() {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (practiceArea !== 'ALL') params.set('area', practiceArea)
      const res = await fetch(`/api/precedents?${params}`)
      const data = await res.json()
      setPrecedents(data.precedents || [])
      setLoading(false)
    }
    fetch_()
  }, [search, practiceArea])

  async function handleAiSearch() {
    if (!aiSearch.trim()) return
    setAiLoading(true)
    setAiResult('')
    try {
      const res = await fetch('/api/precedents/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiSearch, practiceArea }),
      })
      const data = await res.json()
      setAiResult(data.result || 'No results found.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <h1 className="page-title">Legal Database — Nyaykosha</h1>
        </div>
        <p className="page-subtitle">Case law database • SCC Online & Manupatra reference • AI-powered research</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Database */}
        <div className="lg:col-span-2">
          {/* Search */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cases, citations, keywords..."
                className="form-input pl-9"
              />
            </div>
            <select
              value={practiceArea}
              onChange={(e) => setPracticeArea(e.target.value)}
              className="form-input w-44"
            >
              <option value="ALL">All Areas</option>
              <option value="CONSTITUTIONAL">Constitutional</option>
              <option value="CIVIL">Civil</option>
              <option value="CRIMINAL">Criminal</option>
              <option value="LABOUR">Labour</option>
              <option value="CONSUMER">Consumer</option>
              <option value="CORPORATE">Corporate</option>
              <option value="TAXATION">Taxation</option>
            </select>
          </div>

          {/* Precedent List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="hexis-card p-5 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {precedents.map((p) => {
                const legalPoints = p.legalPoints ? JSON.parse(p.legalPoints) as string[] : []
                const acts = p.actsReferred ? JSON.parse(p.actsReferred) as string[] : []

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`hexis-card p-5 cursor-pointer transition-all ${
                      selected?.id === p.id ? 'border-hexis-navy/30 bg-hexis-navy/5' : 'hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono font-semibold text-hexis-navy bg-hexis-navy/10 px-2 py-0.5 rounded">
                            {p.citation}
                          </span>
                          {p.practiceArea && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {p.practiceArea}
                            </span>
                          )}
                          {p.source && (
                            <span className="text-xs text-gray-400">{p.source}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm">{p.caseTitle}</h3>
                        {p.court && <p className="text-xs text-gray-500 mt-0.5">{p.court} {p.year && `• ${p.year}`}</p>}

                        {p.holdingsSummary && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{p.holdingsSummary}</p>
                        )}

                        {acts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {acts.slice(0, 3).map((act, i) => (
                              <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                {act}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {precedents.length === 0 && (
                <div className="hexis-card p-12 text-center">
                  <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">No precedents found</p>
                  <p className="text-gray-400 text-sm mt-1">Try the AI Research tool to find relevant cases</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: AI Research + Detail */}
        <div className="space-y-6">
          {/* AI Research */}
          <div className="hexis-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-semibold text-gray-800">AI Legal Research</h2>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Ask about any legal question. AI will search SCC/Manupatra knowledge and provide relevant case law.
            </p>
            <textarea
              value={aiSearch}
              onChange={(e) => setAiSearch(e.target.value)}
              placeholder="e.g. 'Landmark cases on natural justice in license cancellation' or 'Supreme Court judgments on anticipatory bail under 438 CrPC'..."
              className="form-input h-24 text-sm resize-none mb-3"
            />
            <button
              onClick={handleAiSearch}
              disabled={aiLoading || !aiSearch.trim()}
              className="btn-gold w-full justify-center text-sm disabled:opacity-60"
            >
              {aiLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-hexis-navy/30 border-t-hexis-navy rounded-full animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Research with AI
                </>
              )}
            </button>

            {aiResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 mb-2 font-medium">AI Research Results:</p>
                <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                  {aiResult}
                </div>
              </div>
            )}
          </div>

          {/* Selected Precedent Detail */}
          {selected && (
            <div className="hexis-card p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">{selected.caseTitle}</h3>
              <p className="text-xs font-mono font-bold text-hexis-navy mb-3">{selected.citation}</p>

              {selected.holdingsSummary && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Key Holdings:</p>
                  <p className="text-xs text-gray-600">{selected.holdingsSummary}</p>
                </div>
              )}

              {selected.legalPoints && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Legal Points:</p>
                  <ul className="space-y-1">
                    {(JSON.parse(selected.legalPoints) as string[]).map((point, i) => (
                      <li key={i} className="text-xs text-gray-600">• {point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${selected.caseTitle} — ${selected.citation}`)
                }}
                className="btn-secondary w-full text-xs py-2 mt-2 justify-center"
              >
                Copy Citation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
