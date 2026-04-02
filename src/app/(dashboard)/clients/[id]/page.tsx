import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeft, Phone, Mail, MapPin, Briefcase, FileText,
  Plus, User, Building2, Edit
} from 'lucide-react'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      cases: {
        orderBy: { updatedAt: 'desc' },
        include: { lawyer: { select: { name: true } } },
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
    },
  })

  if (!client) notFound()

  const activeCases = client.cases.filter((c) => c.status === 'ACTIVE')
  const totalRetainer = client.cases.reduce((sum, c) => sum + (c.retainerAmount || 0), 0)

  return (
    <div>
      <div className="mb-6">
        <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-hexis-navy/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-hexis-navy">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              {client.nameHindi && (
                <p className="text-lg text-gray-500 font-hindi mt-0.5">{client.nameHindi}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="hexis-badge-active">{client.clientType}</span>
                <span className="text-xs text-gray-400">{client.clientCode}</span>
                {client.isActive ? (
                  <span className="hexis-badge-active">Active</span>
                ) : (
                  <span className="hexis-badge-disposed">Inactive</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href={`/cases/new?clientId=${client.id}`} className="btn-secondary">
              <Briefcase className="w-4 h-4" />
              New Case
            </Link>
            <Link href={`/clients/${client.id}/edit`} className="btn-primary">
              <Edit className="w-4 h-4" />
              Edit Client
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cases */}
          <div className="hexis-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">Cases ({client.cases.length})</h2>
              <Link href={`/cases/new?clientId=${client.id}`} className="btn-secondary text-xs py-1.5 px-3">
                <Plus className="w-3 h-3" />
                New Case
              </Link>
            </div>
            {client.cases.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No cases filed yet</p>
            ) : (
              <div className="space-y-3">
                {client.cases.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`w-1 self-stretch rounded-full ${
                      c.priority === 'HIGH' ? 'bg-red-400' :
                      c.priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-gray-200'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 group-hover:text-hexis-navy truncate">
                        {c.caseTitle}
                      </p>
                      <p className="text-xs text-gray-400">
                        {c.caseType} • {c.courtName} • Adv. {c.lawyer.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={c.status === 'ACTIVE' ? 'hexis-badge-active' : 'hexis-badge-disposed'}>
                        {c.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="hexis-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">Documents ({client.documents.length})</h2>
              <Link href={`/office?clientId=${client.id}`} className="btn-secondary text-xs py-1.5 px-3">
                <Plus className="w-3 h-3" />
                Upload
              </Link>
            </div>
            {client.documents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {client.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.category} • {formatDate(doc.createdAt)}</p>
                    </div>
                    {doc.ocrStatus === 'DONE' && <span className="text-xs text-green-600">OCR ✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Contact & Stats */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="hexis-card p-5">
            <h2 className="section-title">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Cases</span>
                <span className="font-bold text-gray-900">{activeCases.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Cases</span>
                <span className="font-bold text-gray-900">{client.cases.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Documents</span>
                <span className="font-bold text-gray-900">{client.documents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Retainer</span>
                <span className="font-bold text-gray-900">{formatCurrency(totalRetainer)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Client Since</span>
                <span className="text-sm text-gray-700">{formatDate(client.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="hexis-card p-5">
            <h2 className="section-title">Contact</h2>
            <div className="space-y-3">
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-hexis-navy">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {client.phone}
                </a>
              )}
              {client.alternatePhone && (
                <a href={`tel:${client.alternatePhone}`} className="flex items-center gap-3 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {client.alternatePhone} (Alt)
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-hexis-navy truncate">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {client.email}
                </a>
              )}
              {client.address && (
                <div className="flex items-start gap-3 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{client.address}, {client.city}, {client.state} {client.pincode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Identity */}
          {(client.pan || client.aadhaar || client.gstin) && (
            <div className="hexis-card p-5">
              <h2 className="section-title">Identity</h2>
              <div className="space-y-2 text-sm">
                {client.pan && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">PAN</span>
                    <span className="font-mono font-medium text-gray-900">{client.pan}</span>
                  </div>
                )}
                {client.aadhaar && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Aadhaar</span>
                    <span className="font-medium text-gray-900">XXXX XXXX {client.aadhaar.slice(-4)}</span>
                  </div>
                )}
                {client.gstin && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">GSTIN</span>
                    <span className="font-mono text-xs text-gray-900">{client.gstin}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="hexis-card p-5">
              <h2 className="section-title">Internal Notes</h2>
              <p className="text-sm text-gray-600">{client.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
