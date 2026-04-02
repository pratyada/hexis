import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, FileText, Sparkles, Download, Copy, Scale } from 'lucide-react'

export default async function DraftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await prisma.draft.findUnique({
    where: { id },
    include: {
      case: { select: { id: true, caseTitle: true, caseNumber: true } },
      client: { select: { name: true } },
      creator: { select: { name: true } },
      versions: { orderBy: { version: 'asc' } },
    },
  })

  if (!draft) notFound()

  const languageLabel = draft.language === 'hi' ? 'Hindi' : draft.language === 'en-hi' ? 'Bilingual' : 'English'

  return (
    <div>
      <div className="mb-6">
        <Link href="/drafting" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Drafting
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                {draft.draftType.replace(/_/g, ' ')}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                draft.status === 'FILED' || draft.status === 'APPROVED'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {draft.status}
              </span>
              {draft.aiGenerated && (
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> AI Generated
                </span>
              )}
              <span className="text-xs text-gray-400">{languageLabel}</span>
              <span className="text-xs text-gray-400">v{draft.version}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{draft.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {draft.draftCode} • Created by {draft.creator.name} • {formatDate(draft.createdAt)}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {}}
              className="btn-secondary text-sm"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button className="btn-primary text-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Draft Content */}
        <div className="lg:col-span-3">
          <div className="hexis-card">
            <div className="border-b border-gray-100 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Draft Content</span>
              </div>
              <Link
                href={`/drafting/new?draftId=${draft.id}`}
                className="text-xs text-purple-600 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Regenerate
              </Link>
            </div>
            <div className="p-6">
              {draft.content ? (
                <div className={`text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-mono ${
                  draft.language === 'hi' ? 'font-hindi' : ''
                }`}>
                  {draft.content}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">No content yet</p>
                  <Link href={`/drafting/new?draftId=${draft.id}`} className="btn-gold inline-flex mt-4">
                    <Sparkles className="w-4 h-4" />
                    Generate with AI
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="hexis-card p-5">
            <h3 className="section-title">Draft Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Type</p>
                <p className="font-medium">{draft.draftType.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Language</p>
                <p className="font-medium">{languageLabel}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Version</p>
                <p className="font-medium">v{draft.version}</p>
              </div>
              {draft.case && (
                <div>
                  <p className="text-xs text-gray-400">Linked Case</p>
                  <Link href={`/cases/${draft.case.id}`} className="text-hexis-navy hover:underline text-xs">
                    {draft.case.caseTitle}
                  </Link>
                </div>
              )}
              {draft.client && (
                <div>
                  <p className="text-xs text-gray-400">Client</p>
                  <p className="font-medium">{draft.client.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Facts Summary */}
          {draft.factsSummary && (
            <div className="hexis-card p-5">
              <h3 className="section-title">Facts Summary</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{draft.factsSummary}</p>
            </div>
          )}

          {/* Laws Applicable */}
          {draft.lawsApplicable && (
            <div className="hexis-card p-5">
              <h3 className="section-title flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Laws Applied
              </h3>
              <p className="text-xs text-gray-600">{draft.lawsApplicable}</p>
            </div>
          )}

          {/* Version History */}
          {draft.versions.length > 0 && (
            <div className="hexis-card p-5">
              <h3 className="section-title">Version History</h3>
              <div className="space-y-2">
                {draft.versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Version {v.version}</span>
                    <span className="text-gray-400">{formatDate(v.savedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="hexis-card p-5 bg-amber-50 border-amber-200">
            <p className="text-xs font-semibold text-amber-800 mb-1">Legal Disclaimer</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              AI-generated drafts must be reviewed by a qualified advocate before filing. Verify all citations and legal provisions with current law.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
