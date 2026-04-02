'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scale, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 hexis-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 border border-white rounded-full" />
          <div className="absolute top-32 left-32 w-48 h-48 border border-white rounded-full" />
          <div className="absolute bottom-40 right-20 w-80 h-80 border border-white rounded-full" />
          <div className="absolute bottom-20 right-40 w-56 h-56 border border-white rounded-full" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-hexis-gold/20 rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-hexis-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide font-serif">HEXIS</h1>
              <p className="text-hexis-gold text-xs tracking-widest uppercase">Law Firm</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight font-serif">
              Your Law Firm,
              <br />
              <span className="text-hexis-gold">Fully Automated.</span>
            </h2>
            <p className="text-gray-400 mt-4 text-base leading-relaxed">
              AI-powered legal drafting, real-time court tracking via NIC eCourts, and intelligent document management — built for Indian law firms.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '⚖️', title: 'AI Legal Drafting', desc: 'Generate court-ready documents in English & Hindi using Claude AI' },
              { icon: '📅', title: 'Case & Hearing Tracker', desc: 'Live court data from NIC eCourts — never miss a hearing' },
              { icon: '🗂️', title: 'Smart Document Vault', desc: 'OCR-powered searchable archive for all your case files' },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <p className="text-white font-medium text-sm">{feature.title}</p>
                  <p className="text-gray-400 text-xs">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-gray-600 text-xs">
            © 2024 HEXIS Law Firm, New Delhi. Internal System.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-hexis-navy rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-hexis-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-hexis-navy font-serif">HEXIS Law</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your HEXIS account</p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input pl-10"
                    placeholder="you@hexis.law"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-10 pr-10"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-hexis-gold/30 border-t-hexis-gold rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Default credentials for testing:
              </p>
              <div className="mt-2 space-y-1 text-xs text-center text-gray-500">
                <p><span className="font-medium">Owner:</span> owner@hexis.law / hexis@2024</p>
                <p><span className="font-medium">Associate:</span> associate@hexis.law / hexis@2024</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            HEXIS Law Management System v1.0 • Confidential
          </p>
        </div>
      </div>
    </div>
  )
}
