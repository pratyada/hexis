'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Scale,
  LayoutDashboard,
  FileText,
  Briefcase,
  Building2,
  Users,
  BookOpen,
  Calendar,
  Settings,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JWTPayload } from '@/lib/auth'

const navItems = [
  {
    section: 'MAIN',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Overview' },
    ],
  },
  {
    section: 'MODULES',
    items: [
      {
        href: '/drafting',
        icon: FileText,
        label: 'AI Drafting',
        desc: 'Vaakil AI',
        badge: 'AI',
        badgeColor: 'bg-purple-500/20 text-purple-300',
      },
      {
        href: '/cases',
        icon: Briefcase,
        label: 'Case Management',
        desc: 'Nyay',
      },
      {
        href: '/office',
        icon: Building2,
        label: 'Office Management',
        desc: 'Daftar',
      },
    ],
  },
  {
    section: 'RECORDS',
    items: [
      { href: '/clients', icon: Users, label: 'Clients', desc: 'Client Registry' },
      { href: '/calendar', icon: Calendar, label: 'Calendar', desc: 'Hearings & Tasks' },
      { href: '/precedents', icon: BookOpen, label: 'Legal Database', desc: 'Case Law' },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { href: '/settings', icon: Settings, label: 'Settings', desc: 'Configuration' },
    ],
  },
]

export function Sidebar({
  session,
  isOpen,
  onClose,
}: {
  session: JWTPayload
  isOpen?: boolean
  onClose?: () => void
}) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 hexis-sidebar flex flex-col h-full border-r border-white/5 flex-shrink-0',
        'transition-transform duration-300 ease-in-out',
        'lg:relative lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-hexis-gold/15 rounded-lg flex items-center justify-center flex-shrink-0">
            <Scale className="w-5 h-5 text-hexis-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-lg leading-none font-serif tracking-wide">HEXIS</p>
            <p className="text-hexis-gold/70 text-[10px] tracking-widest uppercase mt-0.5">Law Firm</p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navItems.map((section) => (
          <div key={section.section}>
            <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase px-3 mb-2">
              {section.section}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'sidebar-link group',
                      isActive && 'active'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{item.label}</span>
                    {'badge' in item && item.badge && (
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', item.badgeColor)}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-hexis-gold/20 flex items-center justify-center flex-shrink-0">
            <span className="text-hexis-gold font-semibold text-sm">
              {session.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{session.name}</p>
            <p className="text-gray-500 text-xs truncate capitalize">{session.role.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
