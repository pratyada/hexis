'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, LogOut, ChevronDown, User, Menu } from 'lucide-react'
import type { JWTPayload } from '@/lib/auth'

export function TopBar({
  session,
  onMenuToggle,
}: {
  session: JWTPayload
  onMenuToggle?: () => void
}) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const roleLabels: Record<string, string> = {
    OWNER: 'Firm Owner',
    PARTNER: 'Partner',
    ASSOCIATE: 'Associate Advocate',
    CLERK: 'Office Clerk',
    ADMIN: 'Administrator',
  }

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-100 flex items-center gap-3 px-4 sm:px-6 flex-shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search cases, clients..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hexis-navy/10 focus:border-hexis-navy/30 focus:bg-white transition-all"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Date — desktop only */}
        <div className="hidden md:block text-right">
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-hexis-navy flex items-center justify-center">
              <span className="text-hexis-gold font-semibold text-sm">
                {session.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800">{session.name}</p>
              <p className="text-xs text-gray-400">{roleLabels[session.role] || session.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 sm:w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-medium text-gray-800">{session.name}</p>
                  <p className="text-xs text-gray-400 truncate">{session.email}</p>
                </div>
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile & Settings
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {loggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
