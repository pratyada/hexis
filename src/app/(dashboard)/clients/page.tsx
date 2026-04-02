import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Users, Plus, Phone, Mail, MapPin, Briefcase, ChevronRight } from 'lucide-react'

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { cases: true, documents: true } },
    },
  })

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Client Registry</h1>
          <p className="page-subtitle">{clients.length} clients registered</p>
        </div>
        <Link href="/clients/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="hexis-card p-12 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No clients yet</p>
          <Link href="/clients/new" className="btn-primary inline-flex mt-4">
            <Plus className="w-4 h-4" />
            Add First Client
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="hexis-card p-5 block hover:border-hexis-navy/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-hexis-navy/10 flex items-center justify-center">
                  <span className="font-semibold text-hexis-navy">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  client.clientType === 'CORPORATE'
                    ? 'bg-blue-50 text-blue-700'
                    : client.clientType === 'NGO'
                    ? 'bg-green-50 text-green-700'
                    : client.clientType === 'GOVERNMENT'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-gray-50 text-gray-600'
                }`}>
                  {client.clientType}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 group-hover:text-hexis-navy transition-colors mb-0.5">
                {client.name}
              </h3>
              {client.nameHindi && (
                <p className="text-sm text-gray-500 font-hindi">{client.nameHindi}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{client.clientCode}</p>

              <div className="mt-3 space-y-1">
                {client.phone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> {client.phone}
                  </p>
                )}
                {client.email && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3" /> {client.email}
                  </p>
                )}
                {client.city && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> {client.city}, {client.state}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{client._count.cases} cases</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">{client._count.documents} docs</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-300 ml-auto" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
