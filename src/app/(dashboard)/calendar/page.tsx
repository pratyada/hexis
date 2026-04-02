import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { formatDate, getDaysUntil, getUrgencyColor } from '@/lib/utils'
import { Calendar, AlertTriangle, CheckCircle2, Clock, Briefcase } from 'lucide-react'
import Link from 'next/link'

export default async function CalendarPage() {
  const session = await getSession()

  const now = new Date()
  const thirtyDaysLater = new Date(now)
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

  const [upcomingHearings, pendingTasks, overdueTasks] = await Promise.all([
    prisma.hearing.findMany({
      where: {
        status: 'SCHEDULED',
        hearingDate: { gte: now, lte: thirtyDaysLater },
      },
      orderBy: { hearingDate: 'asc' },
      include: {
        case: {
          select: {
            caseTitle: true,
            caseNumber: true,
            courtName: true,
            client: { select: { name: true } },
          },
        },
        lawyer: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { gte: now },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        case: { select: { caseTitle: true } },
        assignee: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        case: { select: { caseTitle: true } },
        assignee: { select: { name: true } },
      },
    }),
  ])

  // Group hearings by date
  const hearingsByDate = upcomingHearings.reduce((acc, hearing) => {
    const dateKey = new Date(hearing.hearingDate).toDateString()
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(hearing)
    return acc
  }, {} as Record<string, typeof upcomingHearings>)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Calendar & Compliance Tracker</h1>
        <p className="page-subtitle">Next 30 days — hearings, tasks, and compliance deadlines</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card border-l-4 border-l-blue-400">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingHearings.length}</p>
              <p className="text-sm text-gray-500">Upcoming Hearings</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-amber-400">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
              <p className="text-sm text-gray-500">Pending Tasks</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-red-400">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{overdueTasks.length}</p>
              <p className="text-sm text-gray-500">Overdue Tasks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Hearings Timeline */}
        <div className="lg:col-span-2">
          <div className="hexis-card p-6">
            <h2 className="section-title">Hearing Schedule — Next 30 Days</h2>

            {Object.keys(hearingsByDate).length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400">No hearings in the next 30 days</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(hearingsByDate).map(([dateStr, hearings]) => {
                  const date = new Date(dateStr)
                  const daysUntil = getDaysUntil(date)
                  const isToday = daysUntil === 0
                  const isTomorrow = daysUntil === 1

                  return (
                    <div key={dateStr}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`text-center w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                          isToday ? 'bg-red-500 text-white' :
                          isTomorrow ? 'bg-amber-500 text-white' :
                          'bg-hexis-navy text-white'
                        }`}>
                          <p className="text-lg font-bold leading-none">{date.getDate()}</p>
                          <p className="text-[10px] uppercase">
                            {date.toLocaleDateString('en-IN', { month: 'short' })}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {isToday ? 'Today' :
                             isTomorrow ? 'Tomorrow' :
                             date.toLocaleDateString('en-IN', { weekday: 'long' })}
                          </p>
                          <p className="text-xs text-gray-400">{hearings.length} hearing{hearings.length > 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      <div className="ml-15 space-y-2 pl-4 border-l-2 border-gray-100">
                        {hearings.map((hearing) => {
                          const complianceItems = hearing.complianceItems
                            ? JSON.parse(hearing.complianceItems) as string[]
                            : []

                          return (
                            <Link
                              key={hearing.id}
                              href={`/cases/${hearing.case.id || ''}`}
                              className={`block p-4 rounded-xl border hover:border-hexis-navy/20 transition-all ${
                                isToday ? 'bg-red-50 border-red-100' :
                                isTomorrow ? 'bg-amber-50 border-amber-100' :
                                'bg-white border-gray-100'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{hearing.case.caseTitle}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {hearing.case.caseNumber} • {hearing.case.courtName}
                                    {hearing.courtRoom && ` • ${hearing.courtRoom}`}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {hearing.purpose} • {hearing.hearingTime || 'Time TBD'}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Client: {hearing.case.client.name} • Adv. {hearing.lawyer.name}
                                  </p>
                                </div>
                              </div>

                              {complianceItems.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Compliance Required:
                                  </p>
                                  <ul className="space-y-0.5">
                                    {complianceItems.slice(0, 3).map((item, i) => (
                                      <li key={i} className="text-xs text-amber-700">• {item}</li>
                                    ))}
                                    {complianceItems.length > 3 && (
                                      <li className="text-xs text-amber-500">+{complianceItems.length - 3} more...</li>
                                    )}
                                  </ul>
                                </div>
                              )}

                              {hearing.notes && (
                                <p className="mt-2 text-xs text-gray-500 italic">{hearing.notes}</p>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tasks Panel */}
        <div className="space-y-6">
          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div className="hexis-card p-5 border-red-200 bg-red-50">
              <h2 className="section-title text-red-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue ({overdueTasks.length})
              </h2>
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-white rounded-lg border border-red-100">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    {task.case && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{task.case.caseTitle}</p>
                    )}
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      Was due: {formatDate(task.dueDate)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks */}
          <div className="hexis-card p-5">
            <h2 className="section-title flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Upcoming Tasks ({pendingTasks.length})
            </h2>
            {pendingTasks.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-6 h-6 text-green-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 10).map((task) => {
                  const daysUntil = getDaysUntil(task.dueDate)
                  return (
                    <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          task.priority === 'HIGH' ? 'bg-red-500' :
                          task.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium">{task.title}</p>
                          {task.case && (
                            <p className="text-xs text-gray-400 truncate">{task.case.caseTitle}</p>
                          )}
                          <p className="text-xs text-gray-400">→ {task.assignee.name}</p>
                          {task.dueDate && (
                            <p className={`text-xs font-medium mt-0.5 ${getUrgencyColor(daysUntil)}`}>
                              Due: {formatDate(task.dueDate)}
                              {daysUntil !== null && daysUntil <= 3 && ` (${daysUntil}d)`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
