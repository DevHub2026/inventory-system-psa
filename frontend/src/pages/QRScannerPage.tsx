import { useNavigate } from 'react-router-dom'
import { QrCode, Scan, Camera, ArrowLeft } from 'lucide-react'
import { SharedQrScanner } from '@/components/qr/SharedQrScanner'
import { Button, Card } from '@/components/ui'

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
  yellow:     '#FFD400',
  red:        '#E31C23',
  amberBg:    '#FFFBEB',
  amberText:  '#B45309',
}

function Section({
  icon,
  iconBg,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <Card noPadding className="overflow-hidden">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '22px 24px',
        background: T.bg,
        borderBottom: `1px solid ${T.borderLight}`,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>{title}</div>
          {subtitle && (
            <div style={{ marginTop: 4, fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>{subtitle}</div>
          )}
        </div>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          display: 'grid',
          placeItems: 'center',
          background: iconBg,
          flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
      <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </Card>
  )
}

function StepChip({ step }: { step: number }) {
  return (
    <div style={{
      display: 'grid',
      width: 30,
      height: 30,
      placeItems: 'center',
      borderRadius: '50%',
      background: T.white,
      color: T.accent,
      fontSize: 13,
      fontWeight: 800,
      border: `1px solid ${T.accentBg}`,
      boxShadow: '0 2px 6px rgba(15,23,42,0.08)',
    }}>
      {step}
    </div>
  )
}

export function QRScannerPage() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 1040, width: '100%', paddingBottom: 32, margin: '0 auto' }}>
      <Card className="space-y-4">
        <div style={{ borderTop: `4px solid ${T.accent}`, padding: '26px', display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(-1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.accent }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>QR Code Scanner</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: T.accent }} />
            <div style={{ width: 40, height: 4, borderRadius: 999, background: T.yellow }} />
            <div style={{ width: 40, height: 4, borderRadius: 999, background: T.red }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800, color: T.text, lineHeight: 1.1 }}>
              Scan QR codes instantly to open asset details
            </h1>
            <p style={{ margin: '14px 0 0', fontSize: 15, color: T.textMid, lineHeight: 1.8, maxWidth: 780 }}>
              Point your camera at an asset QR code and let the system load the matching record immediately. The clean, PSA-inspired layout helps you focus on scanning and action.
            </p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
        <Section
          icon={<QrCode size={20} style={{ color: T.amberText }} />}
          iconBg={T.amberBg}
          title="Why it matters"
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: T.textMid, lineHeight: 1.9 }}>
              A polished scanner experience that helps staff move faster while keeping asset workflows clear and consistent.
            </p>
            <div style={{ display: 'grid', gap: 12, padding: '14px 0 0', borderTop: `1px solid ${T.borderLight}` }}>
              {[
                'Open asset details instantly from each scanned QR code',
                'Move quickly through borrowing, returning, and reporting steps',
                'Keep your focus with a clean, distraction-free scanner panel',
                'Enjoy the same reliable scan behavior in a refreshed design',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 8, minWidth: 8, height: 8, marginTop: 6, borderRadius: '50%', background: T.accent }} />
                  <div style={{ fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>{item}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section
          icon={<Camera size={20} style={{ color: T.accent }} />}
          iconBg={T.accentBg}
          title="Live Scanner"
          subtitle="Position the QR code inside the frame to start scanning"
        >
          <SharedQrScanner
            open={true}
            onClose={() => navigate('/dashboard')}
            scanSource="sidebar_scanner"
            mode="page"
          />
        </Section>

        <Section
          icon={<Scan size={20} style={{ color: T.accent }} />}
          iconBg={T.accentBg}
          title="Quick guide"
          subtitle="Follow these simple steps for a smooth scan"
        >
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              'Activate the camera by tapping Start Scanner',
              'Center the QR code inside the frame',
              'Hold steady while the scanner reads the code',
              'Open the asset record and continue with actions',
            ].map((text, index) => (
              <div
                key={text}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: 14,
                  alignItems: 'start',
                  padding: '16px 18px',
                  borderRadius: 18,
                  background: T.white,
                  border: `1px solid ${T.borderLight}`,
                  boxShadow: '0 10px 24px rgba(15,23,42,0.04)',
                }}
              >
                <StepChip step={index + 1} />
                <div style={{ fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>{text}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
