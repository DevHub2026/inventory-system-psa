import { useState } from 'react'
import { Card, Input, Button, Alert } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { authService, type UpdateProfilePayload, type ChangePasswordPayload } from '@/services/authService'
import { displayName } from '@/types'

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
      setMessage({ type: 'error', text: 'Passwords do not match.' })
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500">Manage your account information and security</p>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card title="Personal Information">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Full Name"
              value={profileForm.name || ''}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              readOnly={!isEditing}
            />
            <Input
              label="Email"
              value={profileForm.email || ''}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              readOnly={!isEditing}
              type="email"
            />
          </div>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleProfileUpdate} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card title="Change Password">
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
          />
          <div className="grid gap-3 md:grid-cols-2">
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
          
          <Button onClick={handlePasswordChange} disabled={isSaving}>
            {isSaving ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
