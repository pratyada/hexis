'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Save } from 'lucide-react'
import { STATES_INDIA } from '@/lib/utils'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    nameHindi: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: 'Delhi',
    pincode: '',
    pan: '',
    aadhaar: '',
    occupation: '',
    clientType: 'INDIVIDUAL',
    companyName: '',
    gstin: '',
    notes: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create client')
        return
      }

      router.push(`/clients/${data.client.id}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="page-title">Register New Client</h1>
            <p className="page-subtitle">Add a new client to HEXIS client registry</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Client Type */}
        <div className="hexis-card p-6 mb-6">
          <h2 className="section-title">Client Type</h2>
          <div className="flex gap-3">
            {[
              { value: 'INDIVIDUAL', label: '👤 Individual', desc: 'Natural person' },
              { value: 'CORPORATE', label: '🏢 Corporate', desc: 'Company or firm' },
              { value: 'NGO', label: '🤝 NGO/Trust', desc: 'Non-profit entity' },
              { value: 'GOVERNMENT', label: '🏛️ Government', desc: 'Govt. body/dept' },
            ].map((type) => (
              <label
                key={type.value}
                className={`flex-1 border rounded-xl p-3 cursor-pointer transition-all text-center ${
                  form.clientType === type.value
                    ? 'border-hexis-navy bg-hexis-navy/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="clientType"
                  value={type.value}
                  checked={form.clientType === type.value}
                  onChange={handleChange}
                  className="hidden"
                />
                <p className="text-lg">{type.label.split(' ')[0]}</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">{type.label.split(' ')[1]}</p>
                <p className="text-xs text-gray-400">{type.desc}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <div className="hexis-card p-6 mb-6">
          <h2 className="section-title">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name (English) *</label>
              <input name="name" value={form.name} onChange={handleChange} className="form-input" required />
            </div>
            <div>
              <label className="form-label">पूरा नाम (Hindi) — Optional</label>
              <input
                name="nameHindi"
                value={form.nameHindi}
                onChange={handleChange}
                className="form-input font-hindi"
                placeholder="हिंदी में नाम"
              />
            </div>
            {form.clientType === 'CORPORATE' && (
              <div className="col-span-2">
                <label className="form-label">Company / Organization Name</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} className="form-input" />
              </div>
            )}
            <div>
              <label className="form-label">Occupation / Designation</label>
              <input name="occupation" value={form.occupation} onChange={handleChange} className="form-input" />
            </div>
            {form.clientType === 'CORPORATE' && (
              <div>
                <label className="form-label">GSTIN</label>
                <input name="gstin" value={form.gstin} onChange={handleChange} className="form-input" placeholder="22AAAAA0000A1Z5" />
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="hexis-card p-6 mb-6">
          <h2 className="section-title">Contact Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Mobile Number *</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="form-input" required placeholder="+91-9999999999" />
            </div>
            <div>
              <label className="form-label">Alternate Phone</label>
              <input name="alternatePhone" value={form.alternatePhone} onChange={handleChange} className="form-input" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="form-input" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="hexis-card p-6 mb-6">
          <h2 className="section-title">Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Street Address</label>
              <input name="address" value={form.address} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="form-label">City</label>
              <input name="city" value={form.city} onChange={handleChange} className="form-input" placeholder="New Delhi" />
            </div>
            <div>
              <label className="form-label">State</label>
              <select name="state" value={form.state} onChange={handleChange} className="form-input">
                {STATES_INDIA.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">PIN Code</label>
              <input name="pincode" value={form.pincode} onChange={handleChange} className="form-input" placeholder="110001" maxLength={6} />
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="hexis-card p-6 mb-6">
          <h2 className="section-title">Identity Documents</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">PAN Card Number</label>
              <input name="pan" value={form.pan} onChange={handleChange} className="form-input" placeholder="ABCDE1234F" maxLength={10} />
            </div>
            <div>
              <label className="form-label">Aadhaar Number (last 4 digits)</label>
              <input name="aadhaar" value={form.aadhaar} onChange={handleChange} className="form-input" placeholder="XXXX XXXX 1234" maxLength={14} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="hexis-card p-6 mb-6">
          <h2 className="section-title">Internal Notes</h2>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="form-input h-24 resize-none"
            placeholder="Any internal notes about this client (not visible to client)..."
          />
        </div>

        <div className="flex gap-3">
          <Link href="/clients" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            <Save className="w-4 h-4" />
            {loading ? 'Registering...' : 'Register Client'}
          </button>
        </div>
      </form>
    </div>
  )
}
