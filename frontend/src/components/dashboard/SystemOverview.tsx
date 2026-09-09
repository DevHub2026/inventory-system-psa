/**
 * SystemOverview
 *
 * Admin-only. Compact user/role count summary.
 * Data from stats.users.* — already loaded in AdminDashboard.
 *
 * Scoped to src/components/dashboard/ — not a global shared-component.
 */
import { Users, UserCheck, Shield, UserCog } from 'lucide-react'

interface SystemOverviewProps {
  total:          number | null
  active:         number | null
  employees:      number | null
  staff:          number | null
  administrators: number | null
}

interface OverviewRowProps {
  icon: React.ReactNode
  label: string
  value: number | null
  sublabel?: string
}

function OverviewRow({ icon, label, value, sublabel }: OverviewRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid #f8fafc',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
          flex: 1,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 28,
            height: 28,
            borderRadius: 8,
            background: '#f1f5f9',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#1e293b',
              lineHeight: 1.3,
            }}
          >
            {label}
          </div>
          {sublabel && (
            <div
              style={{
                fontSize: 11,
                color: '#94a3b8',
                marginTop: 1,
                lineHeight: 1.3,
              }}
            >
              {sublabel}
            </div>
          )}
        </div>
      </div>

      <span
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: '#0f172a',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          flexShrink: 0,
        }}
      >
        {value ?? '—'}
      </span>
    </div>
  )
}

export function SystemOverview({
  total,
  active,
  employees,
  staff,
  administrators,
}: SystemOverviewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <OverviewRow
        icon={<Users size={14} color="#64748b" strokeWidth={2} />}
        label="Total Users"
        value={total}
        sublabel="Registered accounts"
      />
      <OverviewRow
        icon={<UserCheck size={14} color="#2e7d32" strokeWidth={2} />}
        label="Active Users"
        value={active}
        sublabel="Active accounts"
      />
      <OverviewRow
        icon={<Users size={14} color="#5b21b6" strokeWidth={2} />}
        label="Employees"
        value={employees}
        sublabel="Employee role"
      />
      <OverviewRow
        icon={<UserCog size={14} color="#d97706" strokeWidth={2} />}
        label="Staff"
        value={staff}
        sublabel="Operational roles"
      />
      <OverviewRow
        icon={<Shield size={14} color="#003DA5" strokeWidth={2} />}
        label="Administrators"
        value={administrators}
        sublabel="System admins"
      />
    </div>
  )
}
