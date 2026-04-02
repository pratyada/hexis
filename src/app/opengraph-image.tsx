import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'HEXIS Law — Legal Management System'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0A1628 0%, #0F2040 60%, #152A52 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '64px 72px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Background decorative circles */}
        <div style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: '50%',
          border: '1px solid rgba(196,168,98,0.15)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 280,
          height: 280,
          borderRadius: '50%',
          border: '1px solid rgba(196,168,98,0.1)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -100,
          left: -60,
          width: 350,
          height: 350,
          borderRadius: '50%',
          border: '1px solid rgba(196,168,98,0.08)',
          display: 'flex',
        }} />

        {/* Logo Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Scale icon */}
          <div style={{
            width: 64,
            height: 64,
            background: 'rgba(196,168,98,0.15)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 7v2h16V7L12 3z" fill="#C4A862"/>
              <rect x="11.5" y="9" width="1" height="10" fill="#C4A862"/>
              <path d="M4 11L2 15h4l-2-4z" fill="#C4A862" opacity="0.8"/>
              <path d="M20 11l-2 4h4l-2-4z" fill="#C4A862" opacity="0.8"/>
              <rect x="4" y="19" width="16" height="1.5" rx="0.75" fill="#C4A862"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#FFFFFF', fontSize: 36, fontWeight: 700, letterSpacing: 4, lineHeight: 1 }}>
              HEXIS
            </span>
            <span style={{ color: '#C4A862', fontSize: 12, letterSpacing: 8, textTransform: 'uppercase', marginTop: 4 }}>
              LAW FIRM
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
          <div style={{
            color: '#C4A862',
            fontSize: 14,
            letterSpacing: 4,
            textTransform: 'uppercase',
            fontFamily: 'sans-serif',
            fontWeight: 500,
          }}>
            Legal Management System
          </div>
          <div style={{
            color: '#FFFFFF',
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1,
          }}>
            Your Law Firm,
            <br />
            <span style={{ color: '#C4A862' }}>Fully Automated.</span>
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 22,
            lineHeight: 1.5,
            fontFamily: 'sans-serif',
            fontWeight: 400,
            maxWidth: 580,
          }}>
            AI-powered legal drafting · NIC eCourts integration · Smart document vault — built for Indian law firms.
          </div>
        </div>

        {/* Bottom Features Row */}
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            { icon: '⚖️', label: 'Vaakil AI Drafting' },
            { icon: '📅', label: 'Case Management' },
            { icon: '🗂️', label: 'Document Vault' },
          ].map((f) => (
            <div key={f.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(196,168,98,0.1)',
              border: '1px solid rgba(196,168,98,0.2)',
              borderRadius: 12,
              padding: '10px 20px',
            }}>
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, fontFamily: 'sans-serif' }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
