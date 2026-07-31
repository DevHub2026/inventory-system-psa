import { useNavigate } from 'react-router-dom'
import { QrCode, Scan, Camera } from 'lucide-react'
import { SharedQrScanner } from '@/components/qr/SharedQrScanner'

/* ── Design tokens ── */
const T = {
  text:       '#0F172A',
  textMid:    '#475569',
  textMuted:  '#94A3B8',
  border:     '#E2E8F0',
  borderLight:'#F1F5F9',
  white:      '#FFFFFF',
  bg:         '#F8FAFC',
  accent:     '#003DA5',
  accentBg:   '#EFF6FF',
  amberBg:    '#FFFBEB',
  amberText:  '#B45309',
  surface:    '#F1F5F9',
  blue:       '#003DA5',
  yellow:     '#FFD400',
  red:        '#E31C23',
}

/* ── Section card with PSA tri-color accent ── */
function Section({
  icon, iconBg, iconColor, title, subtitle, children,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      {/* PSA tri-color top accent */}
      <div style={{ height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: T.blue }} />
        <div style={{ flex: 1, background: T.yellow }} />
        <div style={{ flex: 1, background: T.red }} />
      </div>

      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: subtitle ? `1px solid ${T.borderLight}` : 'none',
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3, lineHeight: 1.4 }}>{subtitle}</div>}
        </div>
        <div style={{
          display: 'grid', width: 40, height: 40, placeItems: 'center',
          borderRadius: 12, background: iconBg, flexShrink: 0,
        }}>
          <span style={{ color: iconColor, display: 'flex' }}>{icon}</span>
        </div>
      </div>

      {/* Section body */}
      <div style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  )
}

export function QRScannerPage() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32, maxWidth: 800 }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{
          margin: 0,
          fontSize: 26,
          fontWeight: 800,
          color: T.text,
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
        }}>
          QR Code Scanner
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: T.textMuted, lineHeight: 1.4 }}>
          Scan asset QR codes to quickly access information and perform actions
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════
          SCANNER
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<Camera size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="QR Scanner"
        subtitle="Position the QR code within the camera view to scan"
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SharedQrScanner
            open={true}
            onClose={() => navigate('/dashboard')}
            scanSource="sidebar_scanner"
            mode="page"
          />
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════
          HOW TO USE
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<Scan size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="How to Use"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: 1, text: 'Click "Start Scanner" to activate your camera' },
            { step: 2, text: 'Position the QR code within the scanner frame' },
            { step: 3, text: 'Wait for automatic detection or tap to scan manually' },
            { step: 4, text: 'View asset details and available actions after scanning' },
          ].map((item) => (
            <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: T.textMid, lineHeight: 1.7 }}>
              <div style={{
                display: 'grid', width: 28, height: 28, flexShrink: 0,
                placeItems: 'center', borderRadius: '50%',
                background: T.accentBg, color: T.accent,
                fontSize: 13, fontWeight: 700,
              }}>
                {item.step}
              </div>
              <div style={{ paddingTop: 3 }}>{item.text}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════
          INFORMATION
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<QrCode size={20} />}
        iconBg={T.amberBg}
        iconColor={T.amberText}
        title="Information"
      >
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7, margin: 0 }}>
          The QR Scanner allows you to quickly retrieve asset information by scanning QR codes attached to PSA equipment. Each asset has a unique QR code that contains its identification number, making it easy to access details, track location, and perform actions such as borrowing or reporting issues.
        </p>
      </Section>
    </div>
  )
}
