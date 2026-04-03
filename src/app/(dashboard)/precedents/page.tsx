'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen, Search, Sparkles, Hash, Calendar,
  FileText, ChevronRight, AlertTriangle, CheckCircle,
  Clock, Gavel, RotateCcw, ExternalLink, Info,
} from 'lucide-react'

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

interface ECourtsCase {
  cnr_number: string
  case_type: string
  filing_number: string
  filing_date: string
  registration_number: string
  registration_date: string
  case_status: string
  next_hearing_date: string
  stage_of_case: string
  court_number: string
  judge: string
  petitioner_advocate: string
  respondent_advocate: string
  nature_of_disposal: string | null
  date_of_decision: string | null
}

interface ECourtsOrder {
  order_date: string
  order_number: string
  order_link: string
}

interface ECourtsHearing {
  hearing_date: string
  purpose_of_hearing: string
  cause_list_type: string
  court_number: string
  judge: string
  business_on_date: string
}

interface CNRResult {
  case_details: ECourtsCase
  history_of_hearings: ECourtsHearing[]
  orders: ECourtsOrder[]
}

type Tab = 'database' | 'cnr' | 'causelist'

export default function PrecedentsPage() {
  const [tab, setTab] = useState<Tab>('database')

  // Legal Database state
  const [precedents, setPrecedents] = useState<Precedent[]>([])
  const [search, setSearch] = useState('')
  const [practiceArea, setPracticeArea] = useState('ALL')
  const [dbLoading, setDbLoading] = useState(true)
  const [aiSearch, setAiSearch] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [selected, setSelected] = useState<Precedent | null>(null)

  // CNR Search state
  const [cnr, setCnr] = useState('')
  const [cnrResult, setCnrResult] = useState<CNRResult | null>(null)
  const [cnrLoading, setCnrLoading] = useState(false)
  const [cnrError, setCnrError] = useState('')
  const [cnrTab, setCnrTab] = useState<'details' | 'hearings' | 'orders'>('details')

  // Cause List state
  const [clCourt, setClCourt] = useState('delhi')
  const [clDate, setClDate] = useState('')
  const [clType, setClType] = useState('civil')
  const [clResults, setClResults] = useState<Record<string, unknown>[]>([])
  const [clLoading, setClLoading] = useState(false)
  const [clError, setClError] = useState('')

  useEffect(() => {
    async function fetchDb() {
      setDbLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (practiceArea !== 'ALL') params.set('area', practiceArea)
      const res = await fetch(`/api/precedents?${params}`)
      const data = await res.json()
      setPrecedents(data.precedents || [])
      setDbLoading(false)
    }
    fetchDb()
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

  async function handleCNRSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!cnr.trim()) return
    setCnrLoading(true)
    setCnrError('')
    setCnrResult(null)
    setCnrTab('details')
    try {
      const res = await fetch(`/api/ecourts/cnr?cnr=${encodeURIComponent(cnr.trim())}`)
      const json = await res.json()
      if (!res.ok) {
        setCnrError(json.hint || json.error || 'Lookup failed')
      } else {
        setCnrResult(json.data as CNRResult)
      }
    } catch {
      setCnrError('Network error. Please try again.')
    } finally {
      setCnrLoading(false)
    }
  }

  async function handleCauseList(e: React.FormEvent) {
    e.preventDefault()
    setClLoading(true)
    setClError('')
    setClResults([])
    try {
      const params = new URLSearchParams({ court: clCourt, type: clType })
      if (clDate) params.set('date', clDate.split('-').reverse().join('-'))
      const res = await fetch(`/api/ecourts/causelist?${params}`)
      const json = await res.json()
      if (!res.ok) {
        setClError(json.hint || json.error || 'Failed to fetch cause list')
      } else {
        setClResults(json.data || [])
      }
    } catch {
      setClError('Network error. Please try again.')
    } finally {
      setClLoading(false)
    }
  }

  const statusColor = (s: string) => {
    if (s?.toLowerCase().includes('pending')) return 'text-amber-600 bg-amber-50'
    if (s?.toLowerCase().includes('disposed')) return 'text-green-600 bg-green-50'
    return 'text-gray-600 bg-gray-100'
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
        <p className="page-subtitle">Case law · NIC eCourts live lookup · Cause list · AI legal research</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6 flex-wrap">
        {[
          { id: 'database' as Tab, label: 'Case Law Database', icon: BookOpen },
          { id: 'cnr' as Tab, label: 'CNR Case Search', icon: Hash },
          { id: 'causelist' as Tab, label: 'Cause List', icon: Calendar },
        ].map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-white text-hexis-navy shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ───────────── TAB: Legal Database ───────────── */}
      {tab === 'database' && (
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
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
                className="form-input sm:w-44"
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

            {dbLoading ? (
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
                            {p.source && <span className="text-xs text-gray-400">{p.source}</span>}
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm">{p.caseTitle}</h3>
                          {p.court && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {p.court} {p.year && `• ${p.year}`}
                            </p>
                          )}
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
                          {legalPoints.length > 0 && <span className="sr-only">{legalPoints.join(', ')}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {precedents.length === 0 && (
                  <div className="hexis-card p-12 text-center">
                    <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">No precedents found</p>
                    <p className="text-gray-400 text-sm mt-1">Try the AI Research tool or CNR search tab</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: AI Research + Detail */}
          <div className="space-y-6">
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
                placeholder="e.g. 'Landmark cases on natural justice in license cancellation'..."
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
                  <><Sparkles className="w-3 h-3" /> Research with AI</>
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
                  onClick={() => navigator.clipboard.writeText(`${selected.caseTitle} — ${selected.citation}`)}
                  className="btn-secondary w-full text-xs py-2 mt-2 justify-center"
                >
                  Copy Citation
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────── TAB: CNR Search ───────────── */}
      {tab === 'cnr' && (
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Search form */}
            <div className="hexis-card p-6">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4 text-hexis-navy" />
                <h2 className="text-sm font-semibold text-gray-800">Search by CNR Number</h2>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Case Number Record (CNR) uniquely identifies any case across India's courts.
                Format: <span className="font-mono bg-gray-100 px-1 rounded">DLHC010012345672024</span>
              </p>
              <form onSubmit={handleCNRSearch} className="flex flex-col sm:flex-row gap-3">
                <input
                  value={cnr}
                  onChange={(e) => setCnr(e.target.value.toUpperCase())}
                  placeholder="Enter CNR number e.g. DLHC010012345672024"
                  className="form-input flex-1 font-mono tracking-wider"
                  maxLength={20}
                />
                <button
                  type="submit"
                  disabled={cnrLoading || !cnr.trim()}
                  className="btn-primary disabled:opacity-60 sm:w-auto justify-center"
                >
                  {cnrLoading ? (
                    <><div className="w-4 h-4 border-2 border-hexis-gold/30 border-t-hexis-gold rounded-full animate-spin" /> Searching...</>
                  ) : (
                    <><Search className="w-4 h-4" /> Search</>
                  )}
                </button>
              </form>
            </div>

            {/* Error */}
            {cnrError && (
              <div className="hexis-card p-5 border-amber-200 bg-amber-50">
                <div className="flex gap-3">
                  {cnrError.includes('NIC') || cnrError.includes('API') ? (
                    <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-amber-800">{cnrError}</p>
                    {cnrError.includes('NIC') && (
                      <p className="text-xs text-amber-600 mt-1">
                        Register for API access at services.ecourts.gov.in or contact NIC for an app token.
                        Add it as <span className="font-mono">NIC_ECOURTS_API_KEY</span> in Vercel env vars.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {cnrResult && (
              <div className="hexis-card overflow-hidden">
                {/* Case header */}
                <div className="p-5 border-b border-gray-100 bg-hexis-navy/2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs bg-hexis-navy/10 text-hexis-navy px-2 py-0.5 rounded font-semibold">
                          {cnrResult.case_details.cnr_number}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(cnrResult.case_details.case_status)}`}>
                          {cnrResult.case_details.case_status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {cnrResult.case_details.case_type} · {cnrResult.case_details.registration_number}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Filed: {cnrResult.case_details.filing_date} · Court No. {cnrResult.case_details.court_number}
                      </p>
                    </div>
                    {cnrResult.case_details.next_hearing_date && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Next Hearing</p>
                        <p className="text-sm font-bold text-hexis-navy">{cnrResult.case_details.next_hearing_date}</p>
                        <p className="text-xs text-gray-500">{cnrResult.case_details.stage_of_case}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex border-b border-gray-100">
                  {[
                    { id: 'details' as const, label: 'Case Details', icon: FileText },
                    { id: 'hearings' as const, label: `Hearings (${cnrResult.history_of_hearings.length})`, icon: Clock },
                    { id: 'orders' as const, label: `Orders (${cnrResult.orders.length})`, icon: Gavel },
                  ].map((t) => {
                    const Icon = t.icon
                    return (
                      <button
                        key={t.id}
                        onClick={() => setCnrTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                          cnrTab === t.id
                            ? 'border-hexis-navy text-hexis-navy'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t.label}</span>
                        <span className="sm:hidden">{t.label.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="p-5">
                  {cnrTab === 'details' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Judge', value: cnrResult.case_details.judge },
                        { label: 'Stage', value: cnrResult.case_details.stage_of_case },
                        { label: 'Filing Date', value: cnrResult.case_details.filing_date },
                        { label: 'Registration Date', value: cnrResult.case_details.registration_date },
                        { label: "Petitioner's Advocate", value: cnrResult.case_details.petitioner_advocate },
                        { label: "Respondent's Advocate", value: cnrResult.case_details.respondent_advocate },
                        ...(cnrResult.case_details.date_of_decision ? [
                          { label: 'Decision Date', value: cnrResult.case_details.date_of_decision },
                          { label: 'Nature of Disposal', value: cnrResult.case_details.nature_of_disposal || '—' },
                        ] : []),
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                          <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {cnrTab === 'hearings' && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {cnrResult.history_of_hearings.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-6">No hearing history available</p>
                      ) : (
                        cnrResult.history_of_hearings.map((h, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-center min-w-[44px] flex-shrink-0">
                              <p className="text-sm font-bold text-gray-800">
                                {h.hearing_date?.split('-')[0]}
                              </p>
                              <p className="text-[10px] text-gray-400 uppercase">
                                {h.hearing_date?.split('-')[1]}
                              </p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800">{h.purpose_of_hearing}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {h.cause_list_type} · Court {h.court_number} · {h.judge}
                              </p>
                              {h.business_on_date && (
                                <p className="text-xs text-gray-500 mt-1 italic">{h.business_on_date}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {cnrTab === 'orders' && (
                    <div className="space-y-2">
                      {cnrResult.orders.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-6">No orders available</p>
                      ) : (
                        cnrResult.orders.map((o, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 bg-hexis-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Gavel className="w-4 h-4 text-hexis-navy" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-800">Order dated {o.order_date}</p>
                                {o.order_number && (
                                  <p className="text-xs text-gray-400">Order No. {o.order_number}</p>
                                )}
                              </div>
                            </div>
                            {o.order_link && (
                              <a
                                href={o.order_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-hexis-navy hover:underline flex-shrink-0"
                              >
                                PDF <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: info card */}
          <div className="space-y-4">
            <div className="hexis-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-800">How CNR Works</h3>
              </div>
              <div className="space-y-3 text-xs text-gray-600">
                <p>CNR (Case Number Record) is a unique 16-digit identifier assigned to every case in India's courts by NIC.</p>
                <div className="bg-gray-50 rounded-lg p-3 font-mono">
                  <p className="font-bold text-hexis-navy mb-1">DLHC 01 001234 567 2024</p>
                  <p className="text-gray-500 text-[10px]">State · Court · Number · Check · Year</p>
                </div>
                {[
                  { code: 'DL', label: 'Delhi' },
                  { code: 'MH', label: 'Maharashtra' },
                  { code: 'KA', label: 'Karnataka' },
                  { code: 'TN', label: 'Tamil Nadu' },
                  { code: 'UP', label: 'Uttar Pradesh' },
                ].map((s) => (
                  <div key={s.code} className="flex items-center justify-between">
                    <span className="font-mono bg-hexis-navy/10 text-hexis-navy px-1.5 py-0.5 rounded text-[11px]">{s.code}</span>
                    <span className="text-gray-500">{s.label}</span>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                  </div>
                ))}
              </div>
            </div>

            <div className="hexis-card p-5 bg-hexis-navy text-white">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-hexis-gold" />
                <h3 className="text-sm font-semibold text-hexis-gold">Data Source</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Live data from NIC eCourts portal — the same source used by bharat-courts library. Covers 25 High Courts and 700+ District Courts across India.
              </p>
              <div className="mt-3 space-y-1.5">
                {[
                  '25 High Courts',
                  '700+ District Courts',
                  'Supreme Court of India',
                  'Real-time case status',
                  'Full order history',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="w-1 h-1 bg-hexis-gold rounded-full" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── TAB: Cause List ───────────── */}
      {tab === 'causelist' && (
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="hexis-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-hexis-navy" />
                <h2 className="text-sm font-semibold text-gray-800">Daily Cause List</h2>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Fetch today&apos;s (or any date&apos;s) cause list for any High Court — equivalent to bharat-courts cause_list() method.
              </p>
              <form onSubmit={handleCauseList} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">High Court</label>
                    <select value={clCourt} onChange={(e) => setClCourt(e.target.value)} className="form-input">
                      <option value="delhi">Delhi High Court</option>
                      <option value="bombay">Bombay High Court</option>
                      <option value="madras">Madras High Court</option>
                      <option value="calcutta">Calcutta High Court</option>
                      <option value="allahabad">Allahabad High Court</option>
                      <option value="karnataka">Karnataka High Court</option>
                      <option value="gujarat">Gujarat High Court</option>
                      <option value="telangana">Telangana High Court</option>
                      <option value="rajasthan">Rajasthan High Court</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Date (blank = today)</label>
                    <input
                      type="date"
                      value={clDate}
                      onChange={(e) => setClDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Type</label>
                    <select value={clType} onChange={(e) => setClType(e.target.value)} className="form-input">
                      <option value="civil">Civil</option>
                      <option value="criminal">Criminal</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={clLoading} className="btn-primary disabled:opacity-60">
                  {clLoading ? (
                    <><div className="w-4 h-4 border-2 border-hexis-gold/30 border-t-hexis-gold rounded-full animate-spin" /> Fetching...</>
                  ) : (
                    <><RotateCcw className="w-4 h-4" /> Fetch Cause List</>
                  )}
                </button>
              </form>
            </div>

            {clError && (
              <div className="hexis-card p-5 border-amber-200 bg-amber-50">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">{clError}</p>
                    {clError.includes('NIC') && (
                      <p className="text-xs text-amber-600 mt-1">
                        Configure <span className="font-mono">NIC_ECOURTS_API_KEY</span> in Vercel environment variables.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {clResults.length > 0 && (
              <div className="hexis-card overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">{clResults.length} matters listed</p>
                  <span className="text-xs text-gray-400 capitalize">{clCourt} HC · {clType}</span>
                </div>
                <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                  {clResults.map((entry, i) => {
                    const e = entry as Record<string, string>
                    return (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <span className="text-xs text-gray-400 font-mono w-6 flex-shrink-0 pt-0.5">{e.serialNo || i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 font-mono">{e.caseNumber}</p>
                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {e.petitioner} <span className="text-gray-400">vs</span> {e.respondent}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {e.advocatePetitioner && `Adv: ${e.advocatePetitioner}`}
                            {e.courtNo && ` · Court ${e.courtNo}`}
                            {e.judge && ` · ${e.judge}`}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right info */}
          <div>
            <div className="hexis-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-800">About Cause Lists</h3>
              </div>
              <div className="space-y-3 text-xs text-gray-600">
                <p>The cause list is the official daily schedule of matters to be heard in court. It is published by the High Court registry every day before 5 PM for the next working day.</p>
                <p>Use this to:</p>
                <ul className="space-y-1.5">
                  {[
                    'Check if your matter is listed for hearing',
                    'Verify item number and bench assignment',
                    'Track opposing counsel listings',
                    'Plan court visits for the day',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-hexis-navy rounded-full mt-1.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
