import { useEffect, useState } from 'react'
import { KeyRound, User, Mail, Lock, Eye, EyeOff, Shield, Building2, Hash } from 'lucide-react'
import { Input, Button, Alert } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { authService, type UpdateProfilePayload, type ChangePasswordPayload } from '@/services/authService'
import { displayName } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { RoleBadges } from '@/components/RoleBadges'

/* ── Design tokens ── */
const T = {
  text:       '#1e293b',
  textMid:    '#475569',
  textMuted:  '#94a3b8',
  border:     '#e2e8f0',
  borderLight:'#f1f5f9',
  white:      '#ffffff',
  bg:         '#f8fafc',
  accent:     '#0B3D91',
  accentBg:   '#eff6ff',
  amberBg:    '#fffbeb',
  amberText:  '#b45309',
  surface:    '#f1f5f9',
}

/* ── Helper: field label ── */
function FieldLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 600, color: T.textMid }}>
      <span style={{ color: T.textMuted, display: 'flex', flexShrink: 0 }}>{icon}</span>
      {label}
    </div>
  )
}

/* ── Helper: info badge ── */
function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: T.bg,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{
        width: 34, height: 34, flexShrink: 0, display: 'grid', placeItems: 'center',
        borderRadius: 8, background: T.accentBg, color: T.accent,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{value}</div>
      </div>
    </div>
  )
}

/* ── Password input with toggle ── */
function PasswordField({
  value, onChange, placeholder, show, onToggle,
}: {
  value: string; onChange: (v: string) => void; placeholder: string
  show: boolean; onToggle: () => void
}) {
  return (
    <div style={{ position: 'relative' }}>
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.textMuted, display: 'flex', alignItems: 'center', padding: 0,
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

/* ── Section card ── */
function Section({
  icon, iconBg, iconColor, title, subtitle, children,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: `1px solid ${T.borderLight}`,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3, lineHeight: 1.4 }}>{subtitle}</div>
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

/* ==================================================================
   PAGE COMPONENT
   ================================================================== */
export function SettingsPage() {
  const { user, setUser } = useAuth()
  const [isEditing,   setIsEditing]   = useState(false)
  const [isSaving,    setIsSaving]    = useState(false)
  const [message,     setMessage]     = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [profileForm, setProfileForm] = useState<UpdateProfilePayload>({
    name:  displayName(user),
    email: user?.email || '',
  })

  /*
   * Bug fix: sync profileForm when user context changes from outside
   * (e.g. after a successful save, user is updated via setUser).
   * Only update when NOT actively editing to avoid overwriting in-progress edits.
   */
  useEffect(() => {
    if (!isEditing) {
      setProfileForm({
        name:  displayName(user),
        email: user?.email || '',
      })
    }
  }, [user?.id, user?.name, user?.full_name, user?.first_name, user?.last_name, user?.email, isEditing])

  const [passwordForm, setPasswordForm] = useState<ChangePasswordPayload>({
    current_password: '', password: '', password_confirmation: '',
  })

  const handleProfileUpdate = async () => {
    if (!profileForm.name?.trim()) {
      setMessage({ type: 'error', text: 'Full name cannot be empty.' })
      return
    }
    setIsSaving(true); setMessage(null)
    try {
      const updated = await authService.updateProfile(profileForm)
      setUser(updated)
      setProfileForm({
        name:  displayName(updated),
        email: updated.email || '',
      })
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to update profile.' })
    } finally { setIsSaving(false) }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setMessage({ type: 'error', text: 'New passwords do not match.' }); return
    }
    setIsSaving(true); setMessage(null)
    try {
      await authService.changePassword(passwordForm)
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' })
      setMessage({ type: 'success', text: 'Password changed successfully.' })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to change password.' })
    } finally { setIsSaving(false) }
  }

  const name     = displayName(user)
  const initials = name
    .split(' ')
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
      <PageHeader title="Profile Settings" subtitle="Manage your account information and security." />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* ════════════════════════════════════════════════════════
          PERSONAL INFORMATION
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<User size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="Personal Information"
        subtitle="Your name, email address, and account details."
      >
        {/* ── Avatar + identity bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 20px',
          borderRadius: 12,
          background: T.bg,
          border: `1px solid ${T.border}`,
          marginBottom: 24,
        }}>
          <div style={{
            display: 'grid', width: 52, height: 52, flexShrink: 0,
            placeItems: 'center', borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.accent}, #2563eb)`,
            fontSize: 20, fontWeight: 800, color: '#ffffff',
            boxShadow: `0 2px 8px rgba(11,61,145,0.25)`,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
              {user?.email}
            </div>
          </div>
          <RoleBadges roles={user?.roles ?? []} maxVisible={3} />
        </div>

        {/* ── Info chips grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
          <InfoChip icon={<User size={16} />} label="Full Name" value={name} />
          <InfoChip icon={<Mail size={16} />} label="Email" value={user?.email || '—'} />
          <InfoChip icon={<Hash size={16} />} label="Employee ID" value={user?.employee_number || '—'} />
          <InfoChip icon={<Building2 size={16} />} label="Department" value={user?.department?.name || '—'} />
          <InfoChip
            icon={<Shield size={16} />}
            label="Status"
            value={`${(user?.status || 'unknown').charAt(0).toUpperCase()}${(user?.status || 'unknown').slice(1)}`}
          />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: T.bg,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: '12px 14px',
          }}>
            <div style={{
              width: 34, height: 34, flexShrink: 0, display: 'grid', placeItems: 'center',
              borderRadius: 8, background: T.accentBg, color: T.accent,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 4 }}>Roles</div>
              <RoleBadges roles={user?.roles ?? []} maxVisible={4} />
            </div>
          </div>
        </div>

        {/* ── Editable fields ── */}
        <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div>
              <FieldLabel icon={<User size={13} />} label="Full Name" />
              <Input
                value={profileForm.name || ''}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                readOnly={!isEditing}
                placeholder="Your full name"
              />
            </div>
            <div>
              <FieldLabel icon={<Mail size={13} />} label="Email Address" />
              <Input
                type="email"
                value={profileForm.email || ''}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                readOnly={!isEditing}
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
            {isEditing ? (
              <>
                <Button onClick={handleProfileUpdate} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════
          CHANGE PASSWORD
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<KeyRound size={20} />}
        iconBg={T.amberBg}
        iconColor={T.amberText}
        title="Change Password"
        subtitle="Use a strong password that you don't use elsewhere."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current Password */}
          <div>
            <FieldLabel icon={<Lock size={13} />} label="Current Password" />
            <PasswordField
              value={passwordForm.current_password}
              onChange={(v) => setPasswordForm({ ...passwordForm, current_password: v })}
              placeholder="Enter current password"
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
            />
          </div>

          {/* New + Confirm */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div>
              <FieldLabel icon={<Lock size={13} />} label="New Password" />
              <PasswordField
                value={passwordForm.password}
                onChange={(v) => setPasswordForm({ ...passwordForm, password: v })}
                placeholder="Min. 8 characters"
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
              />
            </div>
            <div>
              <FieldLabel icon={<Lock size={13} />} label="Confirm New Password" />
              <PasswordField
                value={passwordForm.password_confirmation}
                onChange={(v) => setPasswordForm({ ...passwordForm, password_confirmation: v })}
                placeholder="Repeat new password"
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
              />
            </div>
          </div>

          {/* Hint */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.textMuted }}>
            <Lock size={12} />
            Password must be at least 8 characters long with a mix of letters and numbers.
          </div>

          {/* Action */}
          <div style={{ paddingTop: 16, borderTop: `1px solid ${T.borderLight}` }}>
            <Button
              onClick={handlePasswordChange}
              disabled={isSaving || !passwordForm.current_password || !passwordForm.password}
            >
              {isSaving ? 'Changing…' : 'Change Password'}
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )
}