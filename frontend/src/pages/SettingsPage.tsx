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
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [profileForm, setProfileForm] = useState<UpdateProfilePayload>({
    name: displayName(user),
    email: user?.email || '',
  })

  const [passwordForm, setPasswordForm] = useState<ChangePasswordPayload>({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const handleProfileUpdate = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const updatedUser = await authService.updateProfile(profileForm)
      setUser(updatedUser)
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    setIsSaving(true)
    setMessage(null)
    try {
      await authService.changePassword(passwordForm)
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' })
      setMessage({ type: 'success', text: 'Password changed successfully.' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password.' })
    } finally {
      setIsSaving(false)
    }
  }

  /* Avatar initials */
  const initials = displayName(user).slice(0, 1).toUpperCase()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account information and security."
      />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* ── Personal Information ── */}
      <Card>
        <div className="mb-5 flex items-center gap-4 border-b border-[#EEF2F8] pb-5">
          {/* Avatar */}
          <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-[#003DA5] text-xl font-extrabold text-white shadow">
            {initials}
          </span>
          <div>
            <p className="text-base font-bold text-slate-900">{displayName(user)}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
          {/* Section icon */}
          <span className="ml-auto grid h-9 w-9 flex-none place-items-center rounded-xl bg-[#EEF4FF] text-[#003DA5]">
            <User className="h-4 w-4" />
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Full Name"
              value={profileForm.name || ''}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              readOnly={!isEditing}
            />
            <Input
              label="Email"
              type="email"
              value={profileForm.email || ''}
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
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Change Password ── */}
      <Card>
        <div className="mb-5 flex items-center justify-between border-b border-[#EEF2F8] pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Change Password</h3>
            <p className="mt-0.5 text-xs text-slate-500">Use a strong password you don't use elsewhere.</p>
          </div>
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-amber-50 text-amber-600">
            <KeyRound className="h-4 w-4" />
          </span>
        </div>

        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="New Password"
              type="password"
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
            />
            <Input
              label="Confirm New Password"
              type="password"
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
