import { useState } from 'react'
import { KeyRound, User } from 'lucide-react'
import { Card, Input, Button, Alert } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { authService, type UpdateProfilePayload, type ChangePasswordPayload } from '@/services/authService'
import { displayName } from '@/types'
import { PageHeader } from '@/components/PageHeader'

export function SettingsPage() {
  const { user, setUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving,  setIsSaving]  = useState(false)
  const [message,   setMessage]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const initials = displayName(user).slice(0, 1).toUpperCase()

  return (
    <div className="space-y-6">
      <PageHeader title="Profile Settings" subtitle="Manage your account information and security." />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* ── Personal Information ── */}
      <Card>
        {/* Header row */}
        <div className="mb-5 flex items-center gap-4 border-b border-[#E5E7EB] pb-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#0D47A1] text-[20px] font-extrabold text-white shadow">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-[#1F2937]">{displayName(user)}</p>
            <p className="text-[14px] text-[#6B7280]">{user?.email}</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EEF4FF] text-[#0D47A1]">
            <User className="h-5 w-5" />
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Full Name" value={profileForm.name || ''}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              readOnly={!isEditing}
            />
            <Input
              label="Email" type="email" value={profileForm.email || ''}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              readOnly={!isEditing}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
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
      </Card>

      {/* ── Change Password ── */}
      <Card>
        <div className="mb-5 flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#1F2937]">Change Password</h3>
            <p className="mt-0.5 text-[13px] text-[#6B7280]">Use a strong password you don't use elsewhere.</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFFBEB] text-[#B45309]">
            <KeyRound className="h-5 w-5" />
          </span>
        </div>

        <div className="space-y-4">
          <Input
            label="Current Password" type="password"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="New Password" type="password"
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
            />
            <Input
              label="Confirm New Password" type="password"
              value={passwordForm.password_confirmation}
              onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
            />
          </div>
          <div className="pt-1">
            <Button
              onClick={handlePasswordChange}
              disabled={isSaving || !passwordForm.current_password || !passwordForm.password}
            >
              {isSaving ? 'Changing…' : 'Change Password'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
