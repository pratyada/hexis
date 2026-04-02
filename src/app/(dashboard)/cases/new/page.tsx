'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { CASE_TYPES, COURT_TYPES, STATES_INDIA } from '@/lib/utils'

export default function NewCasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    caseTitle: '',
    cnrNumber: '',
    caseNumber: '',
    caseType: 'CIVIL',
    courtName: '',
    courtState: 'Delhi',
    courtDistrict: '',
    benchType: 'HC',
    filingDate: '',
    status: 'ACTIVE',
    stage: 'ADMISSION',
    petitioner: '',
    respondent: '',
    petitionerAdvocate: '',
    respondentAdvocate: '',
    clientCode: '',
    retainerAmount: '',
    priority: 'MEDIUM',
    description: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create case')
        return
      }

      router.push(`/cases/${data.case.id}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <Link href="/cases" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-hexis-navy/10 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-hexis-navy" />
          </div>
          <div>
            <h1 className="page-title">File New Case</h1>
            <p className="page-subtitle">Register a new matter with HEXIS Law</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Case Details */}
        <div className="hexis-card p-6 mb-6">
          <h2 className="section-title">Case Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Case Title *</label>
              <input
                name="caseTitle"
                value={form.caseTitle}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Rajesh Kumar vs Union of India"
                required
              />
            </div>
            <div>
              <label className="form-label">Case Type *</label>
              <select name="caseType" value={form.caseType} onChange={handleChange} className="form-input">
                {CASE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="form-input">
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="form-label">Case Number</label>
              <input
                name="caseNumber"
                value={form.caseNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. W.P.(C) 1234/2024"
              />
            </div>
            <div>
              <label className="form-label">CNR Number (NIC)</label>
              <input
                name="cnrNumber"
                value={form.cnrNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. DLHC010012345672024"
              />
            </div>
            <div>
              <label className="form-label">Filing Date</label>
              <input type="date" name="filingDate" value={form.filingDate} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="form-label">Current Stage</label>
              <select name="stage" value={form.stage} onChange={handleChange} className="form-input">
                <option value="ADMISSION">Admission</option>
                <option value="HEARING">Hearing</option>
                <option value="EVIDENCE">Evidence</option>
                <option value="ARGUMENTS">Arguments</option>
                <option value="JUDGMENT">Judgment</option>
                <option value="COMPLIANCE">Compliance</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Case Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="form-input h-20 resize-none"
                placeholder="Brief description of the matter..."
              />
            </div>
          </div>
        </div>

        {/* Court Details */}
        <div className="hexis-card p-6 mb-6">
          <h2 className="section-title">Court Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Court Name *</label>
              <input
                name="courtName"
                value={form.courtName}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Delhi High Court"
                required
              />
            </div>
            <div>
              <label className="form-label">Bench / Court Type</label>
              <select name="benchType" value={form.benchType} onChange={handleChange} className="form-input">
                {COURT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">State</label>
              <select name="courtState" value={form.courtState} onChange={handleChange} className="form-input">
                {STATES_INDIA.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">District</label>
              <input
                name="courtDistrict"
                value={form.courtDistrict}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. South Delhi"
              />
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="hexis-card p-6 mb-6">
          <h2 className="section-title">Parties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Petitioner / Plaintiff *</label>
              <input
                name="petitioner"
                value={form.petitioner}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Respondent / Defendant *</label>
              <input
                name="respondent"
                value={form.respondent}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Petitioner&apos;s Advocate</label>
              <input
                name="petitionerAdvocate"
                value={form.petitionerAdvocate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Respondent&apos;s Advocate</label>
              <input
                name="respondentAdvocate"
                value={form.respondentAdvocate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Client & Fees */}
        <div className="hexis-card p-6 mb-6">
          <h2 className="section-title">Client & Retainer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Client Code</label>
              <input
                name="clientCode"
                value={form.clientCode}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. HX-CLI-001"
              />
            </div>
            <div>
              <label className="form-label">Retainer Amount (₹)</label>
              <input
                type="number"
                name="retainerAmount"
                value={form.retainerAmount}
                onChange={handleChange}
                className="form-input"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/cases" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            <Save className="w-4 h-4" />
            {loading ? 'Filing Case...' : 'File Case'}
          </button>
        </div>
      </form>
    </div>
  )
}
