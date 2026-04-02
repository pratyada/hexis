import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatDate, formatCurrency, getDaysUntil, getUrgencyColor } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeft, Briefcase, Calendar, FileText, CheckSquare,
  Clock, AlertTriangle, User, Scale, Plus, Edit, ExternalLink,
  MapPin, Phone
} from 'lucide-react'

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const caseData = await prisma.case.findUnique({
    where: { id },
    include: {
      client: true,
      lawyer: true,
      hearings: {
        orderBy: { hearingDate: 'desc' },
        take: 10,
      },
      documents: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { uploader: { select: { name: true } } },
      },
      drafts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { author: { select: { name: true } } },
      },
      tasks: {
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
      },
      orders: {
        orderBy: { orderDate: 'desc' },
        take: 5,
      },
    },
  })

  if (!caseData) notFound()

  const nextHearing = caseData.hearings.find(
    (h) => h.status === 'SCHEDULED' && new Date(h.hearingDate) >= new Date()
  )
  const daysUntilHearing = nextHearing ? getDaysUntil(nextHearing.hearingDate) : null

  const statusColors: Record<string, string> = {
    ACTIVE: 'hexis-badge-active',
    DISPOSED: 'hexis-badge-disposed',
    WITHDRAWN: 'hexis-badge-disposed',
    TRANSFERRED: 'hexis-badge-pending',
  }

  const priorityColors: Record<string, string> = {
    HIGH: 'hexis-badge-urgent',
    MEDIUM: 'hexis-badge-pending',
    LOW: 'hexis-badge-active',
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/cases" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={statusColors[caseData.status] || 'hexis-badge-pending'}>
                {caseData.status}
              </span>
              <span className={priorityColors[caseData.priority]}>
                {caseData.priority} PRIORITY
              </span>
              <span className="text-xs text-gray-400">{caseData.caseCode}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 max-w-2xl">{caseData.caseTitle}</h1>
            {caseData.caseNumber && (
              <p className="text-gray-500 text-sm mt-1">{caseData.caseNumber}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Link href={`/drafting/new?caseId=${caseData.id}`} className="btn-secondary">
              <FileText className="w-4 h-4" />
              Draft Document
            </Link>
            <Link href={`/cases/${caseData.id}/edit`} className="btn-primary">
              <Edit className="w-4 h-4" />
              Edit Case
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Overview */}
          <div className="hexis-card p-6">
            <h2 className="section-title">Case Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Petitioner</p>
                <p className="text-sm font-medium text-gray-900">{caseData.petitioner}</p>
                {caseData.petitionerAdvocate && (
                  <p className="text-xs text-gray-500 mt-0.5">Adv. {caseData.petitionerAdvocate}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Respondent</p>
                <p className="text-sm font-medium text-gray-900">{caseData.respondent}</p>
                {caseData.respondentAdvocate && (
                  <p className="text-xs text-gray-500 mt-0.5">Adv. {caseData.respondentAdvocate}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Court</p>
                <p className="text-sm font-medium text-gray-900">{caseData.courtName}</p>
                <p className="text-xs text-gray-500">{caseData.courtState}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Case Type</p>
                <p className="text-sm font-medium text-gray-900">{caseData.caseType}</p>
                <p className="text-xs text-gray-500">Stage: {caseData.stage}</p>
              </div>
              {caseData.cnrNumber && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">CNR Number</p>
                  <p className="text-sm font-mono text-gray-900">{caseData.cnrNumber}</p>
                  <a
                    href={`https://services.ecourts.gov.in/ecourtindia_v6/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    Check on eCourts <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Filed On</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(caseData.filingDate)}</p>
              </div>
              {caseData.description && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-700">{caseData.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Hearings */}
          <div className="hexis-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">Hearings</h2>
              <button className="btn-secondary text-xs py-1.5 px-3">
                <Plus className="w-3 h-3" />
                Add Hearing
              </button>
            </div>

            {caseData.hearings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No hearings recorded</p>
            ) : (
              <div className="space-y-3">
                {caseData.hearings.map((hearing) => {
                  const isPast = new Date(hearing.hearingDate) < new Date()
                  const complianceItems = hearing.complianceItems
                    ? JSON.parse(hearing.complianceItems) as string[]
                    : []

                  return (
                    <div
                      key={hearing.id}
                      className={`p-4 rounded-xl border ${
                        hearing.status === 'SCHEDULED' && !isPast
                          ? 'border-blue-100 bg-blue-50'
                          : hearing.status === 'COMPLETED'
                          ? 'border-green-100 bg-green-50'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {formatDate(hearing.hearingDate)}
                            {hearing.hearingTime && ` at ${hearing.hearingTime}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {hearing.purpose}
                            {hearing.courtRoom && ` • ${hearing.courtRoom}`}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          hearing.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                          hearing.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {hearing.status}
                        </span>
                      </div>
                      {hearing.outcome && (
                        <p className="text-xs text-gray-600 mb-2">
                          <span className="font-medium">Outcome:</span> {hearing.outcome}
                        </p>
                      )}
                      {hearing.notes && (
                        <p className="text-xs text-gray-600 mb-2">{hearing.notes}</p>
                      )}
                      {complianceItems.length > 0 && hearing.status === 'SCHEDULED' && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Pending Compliances:
                          </p>
                          <ul className="space-y-1">
                            {complianceItems.map((item, i) => (
                              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                                <span className="mt-0.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {hearing.nextDate && (
                        <p className="text-xs text-gray-500 mt-2">
                          Next date: {formatDate(hearing.nextDate)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="hexis-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">Documents ({caseData.documents.length})</h2>
              <Link href={`/office?caseId=${caseData.id}`} className="btn-secondary text-xs py-1.5 px-3">
                <Plus className="w-3 h-3" />
                Upload
              </Link>
            </div>
            {caseData.documents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {caseData.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.category} • {formatDate(doc.createdAt)} • {doc.uploader.name}</p>
                    </div>
                    {doc.ocrStatus === 'DONE' && (
                      <span className="text-xs text-green-600">OCR ✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="hexis-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">Notes & Strategy</h2>
              <button className="btn-secondary text-xs py-1.5 px-3">
                <Plus className="w-3 h-3" />
                Add Note
              </button>
            </div>
            {caseData.notes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No notes added</p>
            ) : (
              <div className="space-y-3">
                {caseData.notes.map((note) => (
                  <div key={note.id} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-sm text-gray-800">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {note.author.name} • {formatDate(note.createdAt)} • {note.noteType}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Next Hearing Alert */}
          {nextHearing && (
            <div className={`rounded-xl p-5 border ${
              daysUntilHearing !== null && daysUntilHearing <= 2
                ? 'bg-red-50 border-red-200'
                : daysUntilHearing !== null && daysUntilHearing <= 7
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-semibold text-gray-800">Next Hearing</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatDate(nextHearing.hearingDate)}</p>
              <p className={`text-sm font-semibold mt-1 ${getUrgencyColor(daysUntilHearing)}`}>
                {daysUntilHearing === 0 ? 'TODAY' :
                 daysUntilHearing === 1 ? 'Tomorrow' :
                 `${daysUntilHearing} days away`}
              </p>
              {nextHearing.hearingTime && (
                <p className="text-xs text-gray-500 mt-1">at {nextHearing.hearingTime}</p>
              )}
              {nextHearing.purpose && (
                <p className="text-xs text-gray-600 mt-2 font-medium">{nextHearing.purpose}</p>
              )}
            </div>
          )}

          {/* Client Info */}
          <div className="hexis-card p-5">
            <h2 className="section-title">Client</h2>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-hexis-navy/10 flex items-center justify-center">
                <User className="w-5 h-5 text-hexis-navy/60" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{caseData.client.name}</p>
                {caseData.client.nameHindi && (
                  <p className="text-sm text-gray-500 font-hindi">{caseData.client.nameHindi}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{caseData.client.clientCode}</p>
                {caseData.client.phone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {caseData.client.phone}
                  </p>
                )}
                {caseData.client.city && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {caseData.client.city}, {caseData.client.state}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/clients/${caseData.client.id}`}
              className="mt-3 text-xs text-hexis-navy hover:underline flex items-center gap-1"
            >
              View client profile →
            </Link>
          </div>

          {/* Assigned Lawyer */}
          <div className="hexis-card p-5">
            <h2 className="section-title">Assigned Advocate</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-hexis-gold/20 flex items-center justify-center">
                <Scale className="w-5 h-5 text-hexis-gold" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{caseData.lawyer.name}</p>
                <p className="text-xs text-gray-500">{caseData.lawyer.designation}</p>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="hexis-card p-5">
            <h2 className="section-title">Financials</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Retainer</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(caseData.retainerAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Status</span>
                <span className={caseData.isPaid ? 'hexis-badge-active' : 'hexis-badge-urgent'}>
                  {caseData.isPaid ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="hexis-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Pending Tasks ({caseData.tasks.length})</h2>
              <button className="text-xs text-hexis-navy hover:underline">+ Add</button>
            </div>
            {caseData.tasks.length === 0 ? (
              <p className="text-sm text-gray-400">No pending tasks</p>
            ) : (
              <div className="space-y-2">
                {caseData.tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                      task.priority === 'HIGH' ? 'bg-red-500' :
                      task.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-gray-300'
                    }`} />
                    <div>
                      <p className="text-sm text-gray-800">{task.title}</p>
                      {task.dueDate && (
                        <p className={`text-xs mt-0.5 ${getUrgencyColor(getDaysUntil(task.dueDate))}`}>
                          Due: {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Drafts */}
          {caseData.drafts.length > 0 && (
            <div className="hexis-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">Drafts ({caseData.drafts.length})</h2>
                <Link href={`/drafting/new?caseId=${caseData.id}`} className="text-xs text-hexis-navy hover:underline">+ New</Link>
              </div>
              <div className="space-y-2">
                {caseData.drafts.map((draft) => (
                  <Link
                    key={draft.id}
                    href={`/drafting/${draft.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{draft.title}</p>
                      <p className="text-xs text-gray-400">{draft.draftType} • v{draft.version}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
