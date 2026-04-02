import { prisma } from '@/lib/prisma'
import { formatDate, getDaysUntil, getUrgencyColor } from '@/lib/utils'
import Link from 'next/link'
import {
  Briefcase, Plus, Search, AlertTriangle, Calendar,
  ChevronRight, RefreshCw
} from 'lucide-react'

interface SearchParams {
  status?: string
  type?: string
  search?: string
  priority?: string
}

export default async function CasesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { status, type, search, priority } = await searchParams

  const where: Record<string, unknown> = {}
  if (status && status !== 'ALL') where.status = status
  if (type && type !== 'ALL') where.caseType = type
  if (priority && priority !== 'ALL') where.priority = priority
  if (search) {
    where.OR = [
      { caseTitle: { contains: search } },
      { caseNumber: { contains: search } },
      { cnrNumber: { contains: search } },
      { petitioner: { contains: search } },
      { respondent: { contains: search } },
    ]
  }

  const [cases, stats] = await Promise.all([
    prisma.case.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
      include: {
        client: { select: { name: true, clientCode: true } },
        lawyer: { select: { name: true } },
        hearings: {
          where: { status: 'SCHEDULED', hearingDate: { gte: new Date() } },
          orderBy: { hearingDate: 'asc' },
          take: 1,
        },
        _count: { select: { documents: true, tasks: { where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } } } },
      },
    }),
    prisma.case.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ])

  const statusCounts = Object.fromEntries(
    stats.map((s) => [s.status, s._count.id])
  )

  const caseTypeColors: Record<string, string> = {
    WRIT: 'bg-blue-50 text-blue-700 border-blue-200',
    CIVIL: 'bg-green-50 text-green-700 border-green-200',
    CRIMINAL: 'bg-red-50 text-red-700 border-red-200',
    ARBITRATION: 'bg-purple-50 text-purple-700 border-purple-200',
    MATRIMONIAL: 'bg-pink-50 text-pink-700 border-pink-200',
    CONSUMER: 'bg-orange-50 text-orange-700 border-orange-200',
    LABOUR: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    CORPORATE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    TAXATION: 'bg-teal-50 text-teal-700 border-teal-200',
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Case Management</h1>
          <p className="page-subtitle">
            {cases.length} cases • {statusCounts['ACTIVE'] || 0} active
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Sync NIC
          </button>
          <Link href="/cases/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Case
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { label: 'All Cases', value: 'ALL', count: Object.values(statusCounts).reduce((a, b) => a + b, 0) },
          { label: 'Active', value: 'ACTIVE', count: statusCounts['ACTIVE'] || 0 },
          { label: 'Disposed', value: 'DISPOSED', count: statusCounts['DISPOSED'] || 0 },
          { label: 'Withdrawn', value: 'WITHDRAWN', count: statusCounts['WITHDRAWN'] || 0 },
        ].map((tab) => {
          const isActive = (!status && tab.value === 'ALL') || status === tab.value
          return (
            <Link
              key={tab.value}
              href={`/cases?status=${tab.value}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-hexis-navy text-hexis-gold'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-hexis-navy/30'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-hexis-gold/20 text-hexis-gold' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <form>
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by case title, number, CNR, party..."
              className="form-input pl-9"
            />
          </form>
        </div>
        <select
          className="form-input w-40"
          defaultValue={type}
        >
          <option value="ALL">All Types</option>
          <option value="WRIT">Writ Petition</option>
          <option value="CIVIL">Civil</option>
          <option value="CRIMINAL">Criminal</option>
          <option value="ARBITRATION">Arbitration</option>
          <option value="MATRIMONIAL">Matrimonial</option>
          <option value="CONSUMER">Consumer</option>
          <option value="LABOUR">Labour</option>
          <option value="TAXATION">Taxation</option>
        </select>
        <select className="form-input w-36" defaultValue={priority}>
          <option value="ALL">All Priority</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Cases List */}
      {cases.length === 0 ? (
        <div className="hexis-card p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No cases found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or add a new case.</p>
          <Link href="/cases/new" className="btn-primary inline-flex mt-4">
            <Plus className="w-4 h-4" />
            Add Case
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const nextHearing = c.hearings[0]
            const daysUntil = nextHearing ? getDaysUntil(nextHearing.hearingDate) : null
            const urgencyColor = getUrgencyColor(daysUntil)

            return (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="hexis-card p-5 flex items-center gap-4 group block"
              >
                {/* Priority indicator */}
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                  c.priority === 'HIGH' ? 'bg-red-400' :
                  c.priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-gray-200'
                }`} />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${
                      caseTypeColors[c.caseType] || 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      {c.caseType}
                    </span>
                    <span className="text-xs text-gray-400">{c.caseCode}</span>
                    {c.caseNumber && (
                      <span className="text-xs text-gray-400">• {c.caseNumber}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-hexis-navy transition-colors">
                    {c.caseTitle}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-500">
                      Client: <span className="font-medium">{c.client.name}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      Lawyer: <span className="font-medium">{c.lawyer.name}</span>
                    </span>
                    {c.courtName && (
                      <span className="text-xs text-gray-500 truncate">{c.courtName}</span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{c._count.documents}</p>
                    <p className="text-xs text-gray-400">Docs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{c._count.tasks}</p>
                    <p className="text-xs text-gray-400">Tasks</p>
                  </div>
                </div>

                {/* Next Hearing */}
                <div className="flex-shrink-0 text-right min-w-[100px]">
                  {nextHearing ? (
                    <div>
                      <div className="flex items-center gap-1 justify-end mb-0.5">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">Next hearing</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{formatDate(nextHearing.hearingDate)}</p>
                      <p className={`text-xs font-semibold ${urgencyColor}`}>
                        {daysUntil === 0 ? 'Today' :
                         daysUntil === 1 ? 'Tomorrow' :
                         daysUntil && daysUntil < 0 ? 'Overdue' :
                         `${daysUntil}d away`}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400">No hearing</p>
                      <p className="text-xs text-gray-400">scheduled</p>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-hexis-navy transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
