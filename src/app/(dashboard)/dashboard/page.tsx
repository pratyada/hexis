import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate, getDaysUntil, getUrgencyColor, formatCurrency } from '@/lib/utils'
import {
  Briefcase, Users, FileText, Calendar, AlertTriangle,
  TrendingUp, Clock, CheckCircle2, Scale, ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getSession()

  // Fetch stats
  const [
    totalCases,
    activeCases,
    totalClients,
    totalDocuments,
    upcomingHearings,
    pendingTasks,
    recentCases,
    urgentTasks,
  ] = await Promise.all([
    prisma.case.count(),
    prisma.case.count({ where: { status: 'ACTIVE' } }),
    prisma.client.count(),
    prisma.document.count(),
    prisma.hearing.findMany({
      where: {
        status: 'SCHEDULED',
        hearingDate: { gte: new Date() },
      },
      orderBy: { hearingDate: 'asc' },
      take: 5,
      include: { case: { select: { caseTitle: true, caseNumber: true } } },
    }),
    prisma.task.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.case.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        client: { select: { name: true } },
        lawyer: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { case: { select: { caseTitle: true } } },
    }),
  ])

  const stats = [
    {
      label: 'Active Cases',
      value: activeCases,
      total: `of ${totalCases} total`,
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/cases',
    },
    {
      label: 'Clients',
      value: totalClients,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/clients',
    },
    {
      label: 'Documents',
      value: totalDocuments,
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/office',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/calendar',
    },
  ]

  const priorityColors: Record<string, string> = {
    HIGH: 'hexis-badge-urgent',
    MEDIUM: 'hexis-badge-pending',
    LOW: 'hexis-badge-active',
  }

  const caseTypeColors: Record<string, string> = {
    WRIT: 'bg-blue-50 text-blue-700',
    CIVIL: 'bg-green-50 text-green-700',
    CRIMINAL: 'bg-red-50 text-red-700',
    ARBITRATION: 'bg-purple-50 text-purple-700',
    MATRIMONIAL: 'bg-pink-50 text-pink-700',
    CONSUMER: 'bg-orange-50 text-orange-700',
    LABOUR: 'bg-yellow-50 text-yellow-700',
    CORPORATE: 'bg-indigo-50 text-indigo-700',
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {session?.name.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here&apos;s what&apos;s happening at HEXIS Law today.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/drafting/new" className="btn-gold">
            <Scale className="w-4 h-4" />
            New Draft
          </Link>
          <Link href="/cases/new" className="btn-primary">
            <Briefcase className="w-4 h-4" />
            New Case
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href} className="stat-card hover:border-hexis-navy/20 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-hexis-navy transition-colors" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              {stat.total && <p className="text-xs text-gray-400 mt-0.5">{stat.total}</p>}
            </Link>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Upcoming Hearings */}
        <div className="lg:col-span-2">
          <div className="hexis-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">Upcoming Hearings</h2>
              <Link href="/calendar" className="text-sm text-hexis-navy font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {upcomingHearings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No upcoming hearings scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingHearings.map((hearing) => {
                  const daysUntil = getDaysUntil(hearing.hearingDate)
                  const urgencyColor = getUrgencyColor(daysUntil)
                  const isToday = daysUntil === 0
                  const isTomorrow = daysUntil === 1

                  return (
                    <div
                      key={hearing.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:border-hexis-navy/20 ${
                        isToday
                          ? 'bg-red-50 border-red-100'
                          : isTomorrow
                          ? 'bg-amber-50 border-amber-100'
                          : 'bg-gray-50 border-transparent'
                      }`}
                    >
                      <div className="text-center min-w-[48px]">
                        <p className="text-lg font-bold text-gray-900">
                          {new Date(hearing.hearingDate).getDate()}
                        </p>
                        <p className="text-xs text-gray-500 uppercase">
                          {new Date(hearing.hearingDate).toLocaleDateString('en-IN', { month: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{hearing.case.caseTitle}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {hearing.case.caseNumber} • {hearing.purpose} • {hearing.hearingTime || 'Time TBD'}
                          {hearing.courtRoom && ` • ${hearing.courtRoom}`}
                        </p>
                        {hearing.complianceItems && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {JSON.parse(hearing.complianceItems).length} compliance items pending
                          </p>
                        )}
                      </div>
                      <div className={`text-xs font-semibold ${urgencyColor}`}>
                        {isToday ? 'TODAY' : isTomorrow ? 'TOMORROW' : `${daysUntil}d`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Cases */}
          <div className="hexis-card p-6 mt-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">Recent Cases</h2>
              <Link href="/cases" className="text-sm text-hexis-navy font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-hexis-navy/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Briefcase className="w-4 h-4 text-hexis-navy/60" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.caseTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.client.name} • {c.lawyer.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      caseTypeColors[c.caseType] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {c.caseType}
                    </span>
                    <span className={priorityColors[c.priority]}>
                      {c.priority}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Urgent Tasks */}
          <div className="hexis-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">Urgent Tasks</h2>
              <Link href="/calendar" className="text-sm text-hexis-navy font-medium hover:underline flex items-center gap-1">
                All tasks <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {urgentTasks.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentTasks.map((task) => {
                  const daysUntil = getDaysUntil(task.dueDate)
                  const urgencyColor = getUrgencyColor(daysUntil)
                  return (
                    <div key={task.id} className="flex items-start gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                        task.priority === 'HIGH' ? 'bg-red-500' :
                        task.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium leading-tight">{task.title}</p>
                        {task.case && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{task.case.caseTitle}</p>
                        )}
                        {task.dueDate && (
                          <p className={`text-xs mt-0.5 font-medium ${urgencyColor}`}>
                            Due: {formatDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="hexis-card p-6">
            <h2 className="section-title">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Draft Legal Notice', href: '/drafting/new?type=NOTICE', icon: FileText, color: 'text-purple-600' },
                { label: 'Add New Client', href: '/clients/new', icon: Users, color: 'text-emerald-600' },
                { label: 'File New Case', href: '/cases/new', icon: Briefcase, color: 'text-blue-600' },
                { label: 'Upload Document', href: '/office', icon: FileText, color: 'text-orange-600' },
                { label: 'Search Legal Database', href: '/precedents', icon: Scale, color: 'text-hexis-navy' },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <Icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{action.label}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300 ml-auto group-hover:text-gray-500" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Module Health */}
          <div className="hexis-card p-6 bg-hexis-navy text-white">
            <h2 className="text-sm font-semibold mb-4 text-hexis-gold">System Status</h2>
            <div className="space-y-3">
              {[
                { label: 'AI Drafting (Claude)', status: 'LIVE', color: 'text-green-400' },
                { label: 'NIC eCourts Sync', status: 'CONFIG NEEDED', color: 'text-amber-400' },
                { label: 'OCR Processing', status: 'LIVE', color: 'text-green-400' },
                { label: 'SCC / Manupatra', status: 'CONFIG NEEDED', color: 'text-amber-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{item.label}</span>
                  <span className={`text-xs font-semibold ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
            <Link href="/settings" className="mt-4 text-xs text-hexis-gold/70 hover:text-hexis-gold flex items-center gap-1">
              Configure integrations <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
