import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { FileText, Plus, Sparkles, Clock, CheckCircle2, BookOpen } from 'lucide-react'

export default async function DraftingPage() {
  const session = await getSession()

  const [drafts, recentPrecedents] = await Promise.all([
    prisma.draft.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        case: { select: { caseTitle: true, caseNumber: true } },
        client: { select: { name: true } },
        creator: { select: { name: true } },
      },
    }),
    prisma.legalPrecedent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const draftTypeColors: Record<string, string> = {
    WRIT_PETITION: 'bg-blue-50 text-blue-700',
    CIVIL_SUIT: 'bg-green-50 text-green-700',
    CRIMINAL_COMPLAINT: 'bg-red-50 text-red-700',
    REPLY: 'bg-purple-50 text-purple-700',
    REJOINDER: 'bg-indigo-50 text-indigo-700',
    APPLICATION: 'bg-cyan-50 text-cyan-700',
    NOTICE: 'bg-orange-50 text-orange-700',
    AGREEMENT: 'bg-teal-50 text-teal-700',
    VAKALATNAMA: 'bg-gray-50 text-gray-700',
    AFFIDAVIT: 'bg-yellow-50 text-yellow-700',
    APPEAL: 'bg-pink-50 text-pink-700',
    BAIL_APPLICATION: 'bg-rose-50 text-rose-700',
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'hexis-badge-pending',
    REVIEW: 'hexis-badge-pending',
    APPROVED: 'hexis-badge-active',
    FILED: 'hexis-badge-active',
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <h1 className="page-title">Vaakil AI — Legal Drafting</h1>
          </div>
          <p className="page-subtitle">
            AI-powered legal document drafting • English, Hindi & Bilingual • Backed by SCC & Manupatra precedents
          </p>
        </div>
        <Link href="/drafting/new" className="btn-gold">
          <Plus className="w-4 h-4" />
          New Draft
        </Link>
      </div>

      {/* Quick Start Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { type: 'WRIT_PETITION', label: 'Writ Petition', icon: '⚖️', desc: 'HC / SC writs' },
          { type: 'NOTICE', label: 'Legal Notice', icon: '📜', desc: 'Section 80 / General' },
          { type: 'BAIL_APPLICATION', label: 'Bail Application', icon: '🔓', desc: 'Regular / Anticipatory' },
          { type: 'AGREEMENT', label: 'Agreement / MOU', icon: '🤝', desc: 'Commercial contracts' },
        ].map((quick) => (
          <Link
            key={quick.type}
            href={`/drafting/new?type=${quick.type}`}
            className="hexis-card p-4 hover:border-purple-200 hover:bg-purple-50/30 transition-all group text-center"
          >
            <div className="text-3xl mb-2">{quick.icon}</div>
            <p className="font-medium text-sm text-gray-900">{quick.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{quick.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Drafts List */}
        <div className="lg:col-span-2">
          <div className="hexis-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">All Drafts ({drafts.length})</h2>
              <div className="flex gap-2">
                <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600">
                  <option>All Status</option>
                  <option>Draft</option>
                  <option>Approved</option>
                  <option>Filed</option>
                </select>
              </div>
            </div>

            {drafts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No drafts yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first AI-powered legal draft</p>
                <Link href="/drafting/new" className="btn-gold inline-flex mt-4">
                  <Sparkles className="w-4 h-4" />
                  Start Drafting
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <Link
                    key={draft.id}
                    href={`/drafting/${draft.id}`}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          draftTypeColors[draft.draftType] || 'bg-gray-50 text-gray-600'
                        }`}>
                          {draft.draftType.replace(/_/g, ' ')}
                        </span>
                        <span className={statusColors[draft.status]}>
                          {draft.status}
                        </span>
                        {draft.aiGenerated && (
                          <span className="bg-purple-50 text-purple-600 text-[11px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> AI
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {draft.language === 'hi' ? 'हिंदी' : draft.language === 'en-hi' ? 'EN+HI' : 'English'}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 group-hover:text-hexis-navy transition-colors truncate">
                        {draft.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        {draft.case && (
                          <span className="text-xs text-gray-400 truncate">{draft.case.caseTitle}</span>
                        )}
                        {draft.client && !draft.case && (
                          <span className="text-xs text-gray-400">{draft.client.name}</span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">v{draft.version} • {formatDate(draft.updatedAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Tools & Precedents */}
        <div className="space-y-6">
          {/* Drafting Stats */}
          <div className="hexis-card p-5">
            <h2 className="section-title">Drafting Stats</h2>
            <div className="space-y-3">
              {[
                { label: 'Total Drafts', value: drafts.length, icon: FileText, color: 'text-purple-600' },
                { label: 'AI Generated', value: drafts.filter((d) => d.aiGenerated).length, icon: Sparkles, color: 'text-purple-400' },
                { label: 'Filed', value: drafts.filter((d) => d.status === 'FILED').length, icon: CheckCircle2, color: 'text-green-600' },
                { label: 'In Review', value: drafts.filter((d) => d.status === 'REVIEW').length, icon: Clock, color: 'text-amber-600' },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-sm text-gray-600">{stat.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stat.value}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI Features */}
          <div className="hexis-card p-5 bg-gradient-to-br from-hexis-navy to-hexis-navy-light text-white">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-hexis-gold" />
              <h2 className="text-sm font-semibold text-hexis-gold">Vaakil AI Features</h2>
            </div>
            <ul className="space-y-2.5">
              {[
                'Draft in English, Hindi, or Bilingual',
                'Auto-cite relevant SCC/Manupatra cases',
                'OCR-based document understanding',
                'State-specific law awareness (Delhi HC format)',
                'Compliance-aware drafting',
                'Version history & collaboration',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-xs text-gray-300">
                  <span className="text-hexis-gold mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Precedents */}
          <div className="hexis-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Legal Database</h2>
              <Link href="/precedents" className="text-xs text-hexis-navy hover:underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {recentPrecedents.map((p) => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2">{p.caseTitle}</p>
                  <p className="text-xs text-hexis-navy font-mono mt-1">{p.citation}</p>
                  {p.holdingsSummary && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.holdingsSummary}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
