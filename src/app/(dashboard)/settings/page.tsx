import { getSession } from '@/lib/auth'
import { Settings, Key, Database, Globe, Users, Bell, Zap } from 'lucide-react'

export default async function SettingsPage() {
  const session = await getSession()

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings & Integrations</h1>
        <p className="page-subtitle">Configure HEXIS Law system settings and external integrations</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* API Keys */}
        <div className="hexis-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Key className="w-5 h-5 text-hexis-navy" />
            <h2 className="section-title mb-0">API Keys & Credentials</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                name: 'Anthropic Claude API',
                key: 'ANTHROPIC_API_KEY',
                desc: 'Powers AI drafting (Vaakil AI), document analysis, and legal research',
                link: 'https://console.anthropic.com',
                status: process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-ant-your-key-here' ? 'CONFIGURED' : 'NOT SET',
                required: true,
              },
              {
                name: 'NIC eCourts API',
                key: 'NIC_ECOURTS_API_KEY',
                desc: 'Access real-time court case data from all courts across India',
                link: 'https://services.ecourts.gov.in',
                status: process.env.NIC_ECOURTS_API_KEY ? 'CONFIGURED' : 'NOT SET',
                required: false,
              },
              {
                name: 'Google Vision API (OCR)',
                key: 'GOOGLE_VISION_API_KEY',
                desc: 'Enhanced OCR for Hindi/English mixed documents (fallback: Tesseract.js)',
                link: 'https://cloud.google.com/vision',
                status: process.env.GOOGLE_VISION_API_KEY ? 'CONFIGURED' : 'USING TESSERACT',
                required: false,
              },
            ].map((api) => (
              <div key={api.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-900">{api.name}</p>
                    {api.required && (
                      <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Required</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{api.desc}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">.env.local → {api.key}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    api.status === 'CONFIGURED' ? 'bg-green-50 text-green-700' :
                    api.status === 'USING TESSERACT' ? 'bg-blue-50 text-blue-700' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {api.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-sm font-semibold text-amber-800 mb-1">How to configure API keys:</p>
            <p className="text-xs text-amber-700 font-mono">
              Edit: <span className="font-bold">/Users/dry/Documents/sudo/hexis/.env.local</span>
            </p>
            <p className="text-xs text-amber-700 mt-1">Then restart the dev server: <span className="font-mono font-bold">npm run dev</span></p>
          </div>
        </div>

        {/* Legal Portals */}
        <div className="hexis-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-5 h-5 text-hexis-navy" />
            <h2 className="section-title mb-0">Legal Database Portals</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Owner credentials for SCC Online and Manupatra are stored securely and used for reference lookup and citation verification.
          </p>
          <div className="space-y-3">
            {[
              { name: 'SCC Online', key: 'SCC_ONLINE_USERNAME', desc: 'Eastern Book Company — Supreme Court Cases' },
              { name: 'Manupatra', key: 'MANUPATRA_USERNAME', desc: 'Comprehensive Indian legal database' },
            ].map((portal) => (
              <div key={portal.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-sm text-gray-900">{portal.name}</p>
                  <p className="text-xs text-gray-500">{portal.desc}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">.env.local → {portal.key}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                  Manual Login
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Note: SCC Online and Manupatra use session-based authentication. Use the AI Research feature which leverages built-in legal knowledge, or log in directly to those portals in your browser.
          </p>
        </div>

        {/* NIC eCourts */}
        <div className="hexis-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Database className="w-5 h-5 text-hexis-navy" />
            <h2 className="section-title mb-0">NIC eCourts Integration</h2>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm font-semibold text-blue-800 mb-2">eCourts Case Status API</p>
            <p className="text-xs text-blue-700 mb-3">
              The eCourts platform provides case status, hearing dates, and orders for all courts across India via CNR (Case Number Record) lookup.
            </p>
            <div className="space-y-1 text-xs text-blue-700">
              <p>• <strong>API Endpoint:</strong> services.ecourts.gov.in/ecourtindiaAPI/</p>
              <p>• <strong>Data Available:</strong> Case status, next hearing date, orders, filings</p>
              <p>• <strong>Authentication:</strong> API key (register at ecourts.gov.in)</p>
              <p>• <strong>CNR Search:</strong> Each case has a unique CNR number for tracking</p>
            </div>
            <p className="text-xs text-blue-600 mt-3 font-medium">
              Once NIC_ECOURTS_API_KEY is set, cases with CNR numbers will auto-sync hearing dates.
            </p>
          </div>
        </div>

        {/* System Info */}
        <div className="hexis-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-5 h-5 text-hexis-navy" />
            <h2 className="section-title mb-0">System Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Version', value: 'HEXIS v1.0.0' },
              { label: 'Database', value: 'SQLite (local)' },
              { label: 'OCR Engine', value: 'Tesseract.js v5' },
              { label: 'AI Model', value: 'Claude Opus 4.6' },
              { label: 'Framework', value: 'Next.js 15' },
              { label: 'Current User', value: `${session?.name} (${session?.role})` },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
