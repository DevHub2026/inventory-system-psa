import { useAuth } from '@/hooks/useAuth'
import { AdminDashboard } from '@/components/AdminDashboard'
import { StaffDashboard } from '@/components/StaffDashboard'
import { EmployeeDashboard } from '@/components/EmployeeDashboard'
import { getUserRoleCategory } from '@/utils/roleHelpers'

export function DashboardPage() {
  const { user } = useAuth()
  const roleCategory = getUserRoleCategory(user)

  if (roleCategory === 'admin') {
    return <AdminDashboard />
  }

  if (roleCategory === 'staff') {
    return <StaffDashboard />
  }

  if (roleCategory === 'employee') {
    return <EmployeeDashboard />
  }

  // Fallback for users without roles or unknown roles
  return <EmployeeDashboard />
}
