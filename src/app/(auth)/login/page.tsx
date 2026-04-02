'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Scale, Eye, EyeOff, Lock, Mail, AlertCircle, Award, Star } from 'lucide-react'

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
      {/* Left Panel — Founder Profile */}
      <div className="hidden lg:flex lg:w-1/2 hexis-sidebar flex-col justify-between p-0 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 border border-white rounded-full" />
          <div className="absolute top-32 left-32 w-48 h-48 border border-white rounded-full" />
          <div className="absolute bottom-40 right-20 w-80 h-80 border border-white rounded-full" />
          <div className="absolute bottom-20 right-40 w-56 h-56 border border-white rounded-full" />
        </div>

        {/* Top brand bar */}
        <div className="relative px-10 pt-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-hexis-gold/20 rounded-lg flex items-center justify-center">
            <Scale className="w-6 h-6 text-hexis-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide font-serif">HEXIS</h1>
            <p className="text-hexis-gold text-xs tracking-widest uppercase">Law Firm</p>
          </div>
        </div>

        {/* Founder card — fills the middle */}
        <div className="relative flex-1 flex flex-col justify-center px-10 py-8 gap-6">
          {/* Photo + name */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-hexis-gold/40 shadow-xl">
                <Image
                  src="/team/anushree-kapadia.jpeg"
                  alt="Anushree Kapadia"
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
              {/* Award badge */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-hexis-gold rounded-full flex items-center justify-center shadow-lg">
                <Award className="w-4 h-4 text-hexis-navy" />
              </div>
            </div>

            <div>
              <p className="text-hexis-gold text-xs tracking-widest uppercase mb-1 font-sans">Founder & Managing Partner</p>
              <h2 className="text-2xl font-bold text-white font-serif leading-tight">
                Anushree Kapadia
              </h2>
              <p className="text-gray-400 text-sm mt-1">Hexis Legal, New Delhi</p>
            </div>
          </div>

          {/* Award highlight */}
          <div className="bg-hexis-gold/10 border border-hexis-gold/25 rounded-xl p-4 flex gap-3 items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-hexis-gold/20 rounded-lg flex items-center justify-center mt-0.5">
              <Star className="w-4 h-4 text-hexis-gold" />
            </div>
            <div>
              <p className="text-hexis-gold text-xs font-semibold tracking-wider uppercase mb-1">
                Legal Luminary Award · #WBF2024, London
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                India&apos;s legal luminary representing Hexis Legal, Anushree Kapadia clinched the coveted{' '}
                <span className="text-white font-medium">Legal Luminary Award</span> at the World Business Forum 2024 in London —
                setting a remarkable standard and inspiring the future of legal excellence worldwide.
              </p>
            </div>
          </div>

          {/* Initiative tagline */}
          <div className="space-y-2">
            <p className="text-gray-400 text-xs tracking-widest uppercase font-sans">A Founder&apos;s Initiative</p>
            <p className="text-white text-base font-serif leading-relaxed">
              &ldquo;Her expertise and dedication to transforming Indian legal practice is the driving force behind HEXIS —
              where technology meets the rigour of law.&rdquo;
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-2.5 pt-2">
            {[
              { icon: '⚖️', title: 'AI Legal Drafting', desc: 'Court-ready documents in English & Hindi via Claude AI' },
              { icon: '📅', title: 'Case & Hearing Tracker', desc: 'Live court data from NIC eCourts' },
              { icon: '🗂️', title: 'Smart Document Vault', desc: 'OCR-powered searchable case archive' },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <div>
                  <p className="text-white text-xs font-semibold">{f.title}</p>
                  <p className="text-gray-500 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative px-10 pb-8">
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

          {/* Mobile founder strip */}
          <div className="lg:hidden flex items-center gap-3 mb-6 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-hexis-gold/30 flex-shrink-0">
              <Image
                src="/team/anushree-kapadia.jpeg"
                alt="Anushree Kapadia"
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <p className="text-xs text-hexis-gold font-semibold uppercase tracking-wide">Founder · Hexis Legal</p>
              <p className="text-sm font-bold text-hexis-navy font-serif">Anushree Kapadia</p>
              <p className="text-xs text-gray-400">Legal Luminary Award · WBF2024, London</p>
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

          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            HEXIS Law Management System v1.0 • Confidential
          </p>
        </div>
      </div>
    </div>
  )
}
