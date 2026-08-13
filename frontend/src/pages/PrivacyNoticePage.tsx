import { Shield, FileText, Lock, Users, Clock, Mail, Phone } from 'lucide-react'
import { Card } from '@/components/ui'

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
        gap: 16,
        padding: '22px 24px',
        background: T.bg,
        borderBottom: `1px solid ${T.borderLight}`,
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          display: 'grid',
          placeItems: 'center',
          background: iconBg,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>{title}</div>
          {subtitle && (
            <div style={{ marginTop: 4, fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>{subtitle}</div>
          )}
        </div>
      </div>
      <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </Card>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      borderRadius: 999,
      background: '#E0F2FE',
      color: '#0369A1',
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    }}>
      {children}
    </span>
  )
}

export function PrivacyNoticePage() {
  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 980, width: '100%', paddingBottom: 32 }}>
      <Card className="space-y-4">
        <div style={{ display: 'grid', gap: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.accent }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>Privacy Notice</span>
            </div>
            <h1 style={{ margin: '12px 0 0', fontSize: 32, fontWeight: 800, color: T.text, lineHeight: 1.15 }}>
              Safeguarding your personal information with clarity and care
            </h1>
            <p style={{ margin: '16px 0 0', fontSize: 15, color: T.textMid, lineHeight: 1.8, maxWidth: 760 }}>
              This notice describes how the PSA Inventory Management System collects, uses, stores, and protects personal information in accordance with the Philippine Data Privacy Act of 2012 (RA 10173).
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Badge>Data protection</Badge>
            <Badge>RA 10173 compliant</Badge>
            <Badge>Secure access</Badge>
            <Badge>Purpose-limited</Badge>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <Section
          icon={<FileText size={20} style={{ color: T.accent }} />}
          iconBg={T.accentBg}
          title="What we collect"
          subtitle="Only necessary information is gathered for inventory operations."
        >
          <p style={{ margin: 0, fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>
            We collect information required for accurate tracking, user access, and reporting.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10, color: T.textMid, fontSize: 14, lineHeight: 1.8 }}>
            <li>Full name and employee ID</li>
            <li>Official email and department</li>
            <li>System username and login history</li>
            <li>Asset activity logs for security and audits</li>
          </ul>
        </Section>

        <Section
          icon={<Users size={20} style={{ color: T.accent }} />}
          iconBg={T.accentBg}
          title="Why we collect it"
          subtitle="Information supports defined and lawful system functions."
        >
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10, color: T.textMid, fontSize: 14, lineHeight: 1.8 }}>
            <li>Track borrowing and returns</li>
            <li>Manage inventory and accountability</li>
            <li>Authenticate users and control access</li>
            <li>Support auditing and compliance</li>
          </ul>
        </Section>

        <Section
          icon={<Lock size={20} style={{ color: T.amberText }} />}
          iconBg={T.amberBg}
          title="How we protect it"
          subtitle="Strong safeguards help keep your data safe."
        >
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10, color: T.textMid, fontSize: 14, lineHeight: 1.8 }}>
            <li>Passwords stored with bcrypt hashing</li>
            <li>Session tokens expire automatically</li>
            <li>Role-based controls limit access</li>
            <li>Audit logs track sensitive activity</li>
          </ul>
        </Section>

        <Section
          icon={<Shield size={20} style={{ color: T.accent }} />}
          iconBg={T.accentBg}
          title="Who can access it"
          subtitle="Access is limited to authorized personnel."
        >
          <p style={{ margin: 0, fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>
            Personal information is only shared with authorized users or when required by law.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10, color: T.textMid, fontSize: 14, lineHeight: 1.8 }}>
            <li>System administrators</li>
            <li>Department supervisors for asset oversight</li>
            <li>Users viewing their own information</li>
            <li>Auditors for compliance review</li>
          </ul>
        </Section>

        <Section
          icon={<Clock size={20} style={{ color: T.accent }} />}
          iconBg={T.accentBg}
          title="Retention and deactivation"
          subtitle="Information is kept only as long as needed."
        >
          <p style={{ margin: 0, fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>
            We retain personal data while it is needed for employment, inventory management, and legal compliance. Accounts are deactivated when no longer required.
          </p>
        </Section>
      </div>

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Card className="space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: T.accentBg }}>
              <Mail size={22} style={{ color: T.accent }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Contact information</div>
              <div style={{ marginTop: 4, fontSize: 13, color: T.textMid }}>Reach out to the Data Protection Officer for privacy requests.</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12, padding: 10, background: T.bg, borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={16} style={{ color: T.accent }} />
              <span style={{ color: T.text, fontWeight: 600 }}>Data Protection Officer</span>
            </div>
            <div style={{ display: 'grid', gap: 6, color: T.textMid, fontSize: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={16} style={{ color: T.accent, flexShrink: 0 }} />
                <span>dpo@psa.gov.ph</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={16} style={{ color: T.accent, flexShrink: 0 }} />
                <span>[Contact Number]</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#FEF3C7' }}>
              <FileText size={22} style={{ color: T.amberText }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Your rights</div>
              <div style={{ marginTop: 4, fontSize: 13, color: T.textMid }}>Control how your personal information is handled.</div>
            </div>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10, color: T.textMid, fontSize: 14, lineHeight: 1.8 }}>
            <li>Access and review your personal data</li>
            <li>Request correction of inaccurate information</li>
            <li>Object to processing for non-essential purposes</li>
            <li>Request deletion subject to legal requirements</li>
            <li>File a complaint with the National Privacy Commission</li>
          </ul>
        </Card>
      </div>

      <Card className="space-y-4">
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Consent and commitments</div>
          <p style={{ margin: 0, fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>
            By using this system, you consent to the collection, processing, and storage of your personal information as described in this Privacy Notice. You may withdraw your consent by contacting the Data Protection Officer, subject to legal and operational requirements.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>
            We are committed to managing your information responsibly, transparently, and in accordance with applicable privacy laws.
          </p>
        </div>
      </Card>
    </div>
  )
}
