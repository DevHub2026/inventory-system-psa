import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui'
import { hasPermission, hasRole } from '@/utils/roleHelpers'

interface RequirePermissionProps {
  /** A nav.* permission string (or array of strings) from the DB. Checked via hasPermission(). If an array is provided, it acts as an OR condition. */
  permission?: string | string[]
  /** A role name (exact match). Checked via hasRole(). Useful when no nav.* permission exists. */
  role?: string
  children: React.ReactNode
}

/**
 * Renders children only when the authenticated user holds the required permission or role.
 * Redirects to /unauthorized otherwise.
 *
 * Authentication itself is enforced by the parent ProtectedRoute; this component only
 * handles authorization (RBAC). It must be rendered inside a ProtectedRoute.
 */
export function RequirePermission({ permission, role, children }: RequirePermissionProps) {
  const { user, loading } = useAuth()

  // Still resolving session -- avoid a flash of unauthorized before user loads.
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <Spinner label="Checking permissions..." />
      </div>
    )
  }

  // No guard conditions -- open to all authenticated users.
  if (!permission && !role) {
    return <>{children}</>
  }

  let permissionOk = false
  if (permission) {
    if (Array.isArray(permission)) {
      permissionOk = permission.some(p => hasPermission(user, p))
    } else {
      permissionOk = hasPermission(user, permission)
    }
  }

  const roleOk = role ? hasRole(user, role) : false

  if (!permissionOk && !roleOk) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
