import { useNavigate } from 'react-router-dom'
import { ShieldCheck, BookOpen, Users, Settings, Package, ArrowRightLeft, ClipboardCheck, Camera, BarChart3, AlertTriangle, Wrench, FileText, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roleHelpers'

const T = {
  text: '#0F172A',
  textMid: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  white: '#FFFFFF',
  bg: '#F8FAFC',
  accent: '#003DA5',
  accentBg: '#EFF6FF',
  amberBg: '#FFFBEB',
  amberText: '#B45309',
  red: '#E31C23',
  green: '#16A34A',
}

function Section({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: T.accent }} />
        <div style={{ flex: 1, background: '#FFD400' }} />
        <div style={{ flex: 1, background: T.red }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${T.borderLight}` }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{title}</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{subtitle}</div>
        </div>
        <div style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 12, background: T.accentBg, color: T.accent }}>
          {icon}
        </div>
      </div>
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  )
}

const navLinks = [
  { label: 'Dashboard', route: '/dashboard', icon: <BookOpen size={16} /> },
  { label: 'Users', route: '/users', icon: <Users size={16} /> },
  { label: 'Roles', route: '/roles', icon: <ShieldCheck size={16} /> },
  { label: 'System Setup', route: '/system-setup', icon: <Settings size={16} /> },
  { label: 'Inventory', route: '/inventory', icon: <Package size={16} /> },
  { label: 'Assets', route: '/assets', icon: <ClipboardCheck size={16} /> },
  { label: 'Borrowings', route: '/borrowings', icon: <ArrowRightLeft size={16} /> },
  { label: 'Reservations', route: '/reservations', icon: <FileText size={16} /> },
  { label: 'QR Scanner', route: '/qr', icon: <Camera size={16} /> },
  { label: 'Reports', route: '/reports', icon: <BarChart3 size={16} /> },
  { label: 'FAQ Management', route: '/documentation', icon: <BookOpen size={16} /> },
]

export function DocumentationPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const canViewDocumentation = !!user && (isAdmin(user) || user.roles?.some((role) => role.name === 'System Administrator' || role.name === 'Super Administrator'))

  if (!canViewDocumentation) {
    return (
      <div style={{ maxWidth: 720, padding: '32px 0' }}>
        <div style={{ background: T.white, border: '1px solid #FECACA', borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Access restricted</div>
          <div style={{ color: T.textMid, lineHeight: 1.6 }}>System documentation is limited to System Administrator and Super Administrator accounts.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, paddingBottom: 32 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: T.text }}>System Documentation</h1>
        <p style={{ margin: '8px 0 0', color: T.textMid, lineHeight: 1.6 }}>
          This page consolidates the verified operational guidance used by the current application. It is intended for administrative use only and is based on the project’s implemented routes, RBAC model, and workflows.
        </p>
      </div>

      <Section title="Quick navigation" subtitle="Open the operational modules used by the current system" icon={<BookOpen size={18} />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
          {navLinks.map((link) => (
            <button
              key={link.route}
              type="button"
              onClick={() => navigate(link.route)}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                background: T.bg,
                padding: '12px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                color: T.text,
                fontWeight: 700,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: T.accent, display: 'inline-flex' }}>{link.icon}</span>
                {link.label}
              </span>
              <ArrowRightLeft size={14} style={{ color: T.textMuted }} />
            </button>
          ))}
        </div>
      </Section>

      <Section title="RBAC and admin responsibilities" subtitle="How the current role model is intended to be used" icon={<ShieldCheck size={18} />}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Super Administrator</div>
            <div style={{ color: T.textMid, lineHeight: 1.6 }}>Manage the full system, including user and role administration, system configuration, audit/report access, and high-level operational oversight.</div>
          </div>
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>System Administrator</div>
            <div style={{ color: T.textMid, lineHeight: 1.6 }}>Maintain daily administration, setup data, core workflows, and operational configuration while keeping the system aligned with RBAC restrictions.</div>
          </div>
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Other roles</div>
            <div style={{ color: T.textMid, lineHeight: 1.6 }}>Use the system within their assigned responsibilities. FAQ and documentation are informational only and do not bypass the underlying server-side authorization model.</div>
          </div>
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 20 }}>
        <Section title="Inventory and assets" subtitle="Operational guidance" icon={<Package size={18} />}>
          <ul style={{ margin: 0, paddingLeft: 18, color: T.textMid, display: 'grid', gap: 10, lineHeight: 1.7 }}>
            <li>Use Inventory to manage stock records, filters, and exports.</li>
            <li>Use Assets for lifecycle management such as assignment, transfers, maintenance, and available states.</li>
            <li>Ensure request and approval workflows are followed before modifying item state.</li>
          </ul>
        </Section>

        <Section title="Borrowing and return" subtitle="Workflow overview" icon={<ArrowRightLeft size={18} />}>
          <ul style={{ margin: 0, paddingLeft: 18, color: T.textMid, display: 'grid', gap: 10, lineHeight: 1.7 }}>
            <li>Borrowers can request or complete borrowing actions through the Borrowings workflow.</li>
            <li>Borrowing details show current due dates, status, and valid actions for the record.</li>
            <li>Extension requests are reviewed through the extension workflow; approval and rejection remain role-gated.</li>
          </ul>
        </Section>

        <Section title="QR and physical asset lookup" subtitle="What the scanner actually does" icon={<Camera size={18} />}>
          <ul style={{ margin: 0, paddingLeft: 18, color: T.textMid, display: 'grid', gap: 10, lineHeight: 1.7 }}>
            <li>QR scanning resolves the asset or record for quick lookup and action routing.</li>
            <li>The scanner does not replace the approval model or the borrowing lifecycle.</li>
            <li>Available actions depend on current asset state and the user’s permissions.</li>
          </ul>
        </Section>

        <Section title="Reservations and reports" subtitle="Operational review" icon={<FileText size={18} />}>
          <ul style={{ margin: 0, paddingLeft: 18, color: T.textMid, display: 'grid', gap: 10, lineHeight: 1.7 }}>
            <li>Reservations follow the role-aware approval flow implemented for the application.</li>
            <li>Reports and exports should be driven from the same filters used in the active page.</li>
            <li>Audit and operational reporting remain visible only to authorized roles.</li>
          </ul>
        </Section>

        <Section title="Systems and safety" subtitle="Administrative guidance" icon={<Wrench size={18} />}>
          <ul style={{ margin: 0, paddingLeft: 18, color: T.textMid, display: 'grid', gap: 10, lineHeight: 1.7 }}>
            <li>System Setup is for administrator-managed configuration such as departments, offices, locations, and related references.</li>
            <li>Use the project documentation in the repository as the source-of-truth for architecture, roles, and business rules.</li>
            <li>Do not expose sensitive information, credentials, or private operational data in user-facing help.</li>
          </ul>
        </Section>

        <Section title="Troubleshooting and support" subtitle="Operational checks" icon={<AlertTriangle size={18} />}>
          <ul style={{ margin: 0, paddingLeft: 18, color: T.textMid, display: 'grid', gap: 10, lineHeight: 1.7 }}>
            <li>If a page is unavailable, verify that the current user has the needed role or permission.</li>
            <li>If a QR scan does not resolve, confirm the asset is valid and the code matches the current application records.</li>
            <li>When unsure about a workflow, follow the route and approval process shown in the app rather than assumptions from external documentation.</li>
          </ul>
        </Section>
      </div>

      <Section title="Security reminder" subtitle="Authentication and permissions remain the source of truth" icon={<Lock size={18} />}>
        <div style={{ color: T.textMid, lineHeight: 1.7 }}>
          FAQ and documentation are informational only. They do not grant access, modify permissions, or replace the server-side RBAC and authorization model. Any persisted admin content should be protected by the same backend authorization rules that govern the rest of the application.
        </div>
      </Section>
    </div>
  )
}
