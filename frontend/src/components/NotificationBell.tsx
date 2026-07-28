import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { notificationService } from '@/services/notificationService'
import type { AppNotification } from '@/types'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'

const POLL_MS = 30_000

function timeLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function NotificationBell() {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [items, setItems] = useState<AppNotification[]>([])

  const loadUnread = async () => {
    try {
      const count = await notificationService.unreadCount()
      setUnreadCount(count)
    } catch {
      // Keep last known badge count on transient failures.
    }
  }

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const result = await notificationService.list(15)
      setItems(result.items)
      setUnreadCount(result.meta.unread_count)
    } catch {
      // Ignore load errors in the bell UI.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUnread()
    const timer = window.setInterval(() => { void loadUnread() }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => onDataChanged((scope) => {
    if (
      affectsScope(scope, 'notifications') ||
      affectsScope(scope, 'dashboard') ||
      affectsScope(scope, 'borrowings') ||
      affectsScope(scope, 'reservations') ||
      affectsScope(scope, 'inventory') ||
      affectsScope(scope, 'maintenance') ||
      affectsScope(scope, 'assets')
    ) {
      void loadUnread()
      if (open) void loadNotifications()
    }
  }), [open])

  useEffect(() => {
    if (!open) return

    void loadNotifications()

    const onPointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const handleToggle = () => {
    setOpen((prev) => !prev)
  }

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllAsRead()
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      notifyDataChanged('notifications')
    } catch {
      // no-op
    }
  }

  const handleOpenNotification = async (notification: AppNotification) => {
    try {
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.id)
        setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
        notifyDataChanged('notifications')
      }
    } catch {
      // Continue navigation even if mark-read fails.
    }

    setOpen(false)
    if (notification.link) {
      navigate(notification.link)
    }
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={handleToggle}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 8,
          border: 'none', background: open ? '#f1f5f9' : 'transparent', cursor: 'pointer', color: '#64748b',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = open ? '#f1f5f9' : 'transparent' }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            minWidth: 16, height: 16, padding: '0 4px',
            borderRadius: 999, background: '#ef4444',
            border: '2px solid #ffffff',
            color: '#ffffff', fontSize: 9, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }} aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60,
          width: 360, maxWidth: 'calc(100vw - 24px)',
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14,
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, padding: '12px 14px', borderBottom: '1px solid #f1f5f9',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Notifications</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAll()}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: '#0B3D91', padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading && items.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                No notifications yet.
              </div>
            ) : (
              items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleOpenNotification(notification)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    border: 'none', borderBottom: '1px solid #f8fafc',
                    background: notification.is_read ? '#ffffff' : '#f8fbff',
                    cursor: 'pointer', padding: '12px 14px', fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    {!notification.is_read && (
                      <span style={{
                        width: 8, height: 8, marginTop: 5, borderRadius: '50%',
                        background: '#0B3D91', flexShrink: 0,
                      }} />
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                        {notification.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 1.45 }}>
                        {notification.message}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                        {timeLabel(notification.created_at)}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
