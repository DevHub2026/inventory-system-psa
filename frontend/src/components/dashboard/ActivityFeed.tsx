/**
 * ActivityFeed
 *
 * Admin-only. Renders the recent activity items from getRecentActivity().
 * Action text is limited by what the backend provides — the feed does not
 * display asset/item names because the API does not include them.
 *
 * Scoped to src/components/dashboard/ — not a global shared-component.
 */
import { HandCoins, ClipboardList } from 'lucide-react'
import type { ActivityItem } from '@/types'
import { EmptyState } from '@/components/ui'
import { Badge } from '@/components/ui'

interface ActivityFeedProps {
  items: ActivityItem[]
}

/** Format a UTC datetime string to a relative "X min ago" label */
function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return iso

  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d ago`
}

const MODULE_ICON: Record<string, React.ReactNode> = {
  Borrowing:   <HandCoins  size={14} color="#003DA5" strokeWidth={2} />,
  Reservation: <ClipboardList size={14} color="#5b21b6" strokeWidth={2} />,
}

const MODULE_TONE: Record<string, 'blue' | 'violet'> = {
  Borrowing:   'blue',
  Reservation: 'violet',
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No recent activity"
        description="System activity will appear here as records are created."
      />
    )
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column' }}
      role="list"
      aria-label="Recent system activity"
    >
      {items.map((item) => (
        <div
          key={String(item.id)}
          role="listitem"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '10px 16px',
            borderBottom: '1px solid #f8fafc',
          }}
        >
          {/* Module icon */}
          <span
            aria-hidden="true"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 30,
              height: 30,
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {MODULE_ICON[item.module] ?? (
              <ClipboardList size={14} color="#64748b" strokeWidth={2} />
            )}
          </span>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#1e293b',
                  lineHeight: 1.3,
                }}
              >
                {item.action}
              </span>
              <Badge tone={MODULE_TONE[item.module] ?? 'gray'}>
                {item.module}
              </Badge>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 3,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {item.user}
              </span>
              <span style={{ fontSize: 11, color: '#cbd5e1' }}>·</span>
              <time
                dateTime={item.created_at}
                style={{ fontSize: 11, color: '#94a3b8' }}
              >
                {relativeTime(item.created_at)}
              </time>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
