import { useState } from 'react'
import { KeyRound, User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Input, Button, Alert } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { authService, type UpdateProfilePayload, type ChangePasswordPayload } from '@/services/authService'
import { displayName } from '@/types'
import { PageHeader } from '@/components/PageHeader'

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
}

/** Consistent section card */
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

  const [passwordForm, setPasswordForm] = useState<ChangePasswordPayload>({
    current_password: '', password: '', password_confirmation: '',
  })

  const handleProfileUpdate = async () => {
    setIsSaving(true); setMessage(null)
    try {
      const updated = await authService.updateProfile(profileForm)
      setUser(updated); setIsEditing(false)
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
  const initials = name.slice(0, 1).toUpperCase()
  const role     = (user as { role?: string })?.role ?? 'Account'
  const roleLabel = role ? role[0].toUpperCase() + role.slice(1).toLowerCase() : 'Account'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Profile Settings" subtitle="Manage your account information and security." />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* ── Personal Information ── */}
      <Section
        icon={<User size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="Personal Information"
        subtitle="Your name, email address, and account details."
      >
        {/* User identity row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 20px',
          borderRadius: 12,
          background: T.bg,
          border: `1px solid ${T.border}`,
          marginBottom: 24,
        }}>
          {/* Avatar */}
          <div style={{
            display: 'grid', width: 52, height: 52, flexShrink: 0,
            placeItems: 'center', borderRadius: '50%',
            background: T.accent,
            fontSize: 20, fontWeight: 800, color: '#ffffff',
            boxShadow: '0 2px 8px rgba(11,61,145,0.25)',
          }}>
            {initials}
          </div>
          {/* Name + role */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
              {user?.email}
            </div>
          </div>
          {/* Role badge */}
          <div style={{
            flexShrink: 0,
            padding: '4px 12px',
            borderRadius: 999,
            background: T.accentBg,
            border: `1px solid rgba(11,61,145,0.15)`,
            fontSize: 11, fontWeight: 700, color: T.accent,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {roleLabel}
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0,1fr))', gap: 16 }}
             className="md:!grid-cols-2">
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 600, color: T.textMid }}>
              <User size={13} style={{ color: T.textMuted }} />
              Full Name
            </label>
            <Input
              value={profileForm.name || ''}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              readOnly={!isEditing}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 600, color: T.textMid }}>
              <Mail size={13} style={{ color: T.textMuted }} />
              Email Address
            </label>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.borderLight}` }}>
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
      </Section>

      {/* ── Change Password ── */}
      <Section
        icon={<KeyRound size={20} />}
        iconBg="#fffbeb"
        iconColor="#b45309"
        title="Change Password"
        subtitle="Use a strong password that you don't use elsewhere."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current password */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 600, color: T.textMid }}>
              <Lock size={13} style={{ color: T.textMuted }} />
              Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: T.textMuted, display: 'flex', alignItems: 'center', padding: 0,
                }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New + Confirm */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0,1fr))', gap: 16 }}
               className="md:!grid-cols-2">
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 600, color: T.textMid }}>
                <Lock size={13} style={{ color: T.textMuted }} />
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: T.textMuted, display: 'flex', alignItems: 'center', padding: 0,
                  }}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 600, color: T.textMid }}>
                <Lock size={13} style={{ color: T.textMuted }} />
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={passwordForm.password_confirmation}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: T.textMuted, display: 'flex', alignItems: 'center', padding: 0,
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Password strength hint */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.textMuted }}>
            <Lock size={12} />
            Password must be at least 8 characters long with a mix of letters and numbers.
          </div>

          {/* Action */}
          <div style={{ paddingTop: 4, borderTop: `1px solid ${T.borderLight}`, marginTop: 4 }}>
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
