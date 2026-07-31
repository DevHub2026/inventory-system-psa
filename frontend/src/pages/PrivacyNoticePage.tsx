import { Shield, FileText, Lock, Users, Clock, Trash2, Mail, Phone } from 'lucide-react'

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
  icon, iconBg, iconColor, title, children,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
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
        borderBottom: `1px solid ${T.borderLight}`,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{title}</div>
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

export function PrivacyNoticePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, paddingBottom: 32 }}>

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
          Privacy Notice
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: T.textMuted, lineHeight: 1.4 }}>
          Philippine Data Privacy Act of 2012 (RA 10173) Compliance
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════
          DATA COLLECTION
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<FileText size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="Data Collection"
      >
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7, margin: 0 }}>
          The PSA Inventory Management System collects personal information necessary for inventory management purposes, including:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 20, fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>
          <li>Full name (first, middle, last)</li>
          <li>Employee identification number</li>
          <li>Email address</li>
          <li>Department and office assignment</li>
          <li>Username for system access</li>
          <li>Login and activity logs</li>
        </ul>
      </Section>

      {/* ════════════════════════════════════════════════════════
          PURPOSE OF COLLECTION
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<Users size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="Purpose of Collection"
      >
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7, margin: 0 }}>
          Personal information is collected for the following purposes:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 20, fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>
          <li>Asset borrowing and return tracking</li>
          <li>Inventory management and accountability</li>
          <li>User authentication and access control</li>
          <li>Audit trail and security monitoring</li>
          <li>System administration and maintenance</li>
        </ul>
      </Section>

      {/* ════════════════════════════════════════════════════════
          DATA STORAGE AND SECURITY
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<Lock size={20} />}
        iconBg={T.amberBg}
        iconColor={T.amberText}
        title="Data Storage and Security"
      >
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7, margin: 0 }}>
          All personal information is stored securely using:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 20, fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>
          <li>Encrypted password storage using bcrypt hashing</li>
          <li>Secure session management with token expiration</li>
          <li>Role-based access control to limit data access</li>
          <li>Audit logging for all sensitive operations</li>
          <li>Secure API endpoints with authentication</li>
        </ul>
      </Section>

      {/* ════════════════════════════════════════════════════════
          DATA ACCESS AND SHARING
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<Shield size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="Data Access and Sharing"
      >
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7, margin: 0 }}>
          Access to personal information is restricted to:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 20, fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>
          <li>Authorized system administrators</li>
          <li>Department supervisors for asset management</li>
          <li>Users accessing their own information</li>
          <li>Auditors for compliance purposes</li>
        </ul>
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7, marginTop: 12 }}>
          Personal information is not shared with third parties except as required by law or with explicit consent.
        </p>
      </Section>

      {/* ════════════════════════════════════════════════════════
          DATA RETENTION
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<Clock size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="Data Retention"
      >
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7, margin: 0 }}>
          Personal information is retained for the duration of employment and as required by law. Upon separation, user accounts are deactivated but records are maintained for audit and compliance purposes.
        </p>
      </Section>

      {/* ════════════════════════════════════════════════════════
          RIGHTS OF DATA SUBJECTS
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<Users size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="Rights of Data Subjects"
      >
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7, margin: 0 }}>
          Under RA 10173, you have the right to:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 20, fontSize: 14, color: T.textMid, lineHeight: 1.8 }}>
          <li>Access your personal information</li>
          <li>Request correction of inaccurate information</li>
          <li>Object to processing of your data</li>
          <li>Request deletion of your data (subject to legal requirements)</li>
          <li>File a complaint with the National Privacy Commission</li>
        </ul>
      </Section>

      {/* ════════════════════════════════════════════════════════
          CONTACT INFORMATION
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<Mail size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="Contact Information"
      >
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7, margin: 0 }}>
          For inquiries, requests, or complaints regarding your personal information, please contact:
        </p>
        <div style={{
          marginTop: 16,
          padding: '16px 20px',
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <Shield size={16} style={{ color: T.accent, flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 600, color: T.text }}>Data Protection Officer:</span>
              <span style={{ color: T.textMid, marginLeft: 6 }}>[DPO Name]</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <Mail size={16} style={{ color: T.accent, flexShrink: 0 }} />
            <span style={{ color: T.textMid }}>dpo@psa.gov.ph</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <Phone size={16} style={{ color: T.accent, flexShrink: 0 }} />
            <span style={{ color: T.textMid }}>[Contact Number]</span>
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════
          CONSENT
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<FileText size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="Consent"
      >
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7, margin: 0 }}>
          By using this system, you consent to the collection, processing, and storage of your personal information as described in this Privacy Notice. You may withdraw your consent at any time by contacting the Data Protection Officer, subject to legal and operational requirements.
        </p>
      </Section>
    </div>
  )
}
