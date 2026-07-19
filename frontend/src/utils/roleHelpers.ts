import type { User } from '@/types'

const ADMIN_ROLES = ['Super Administrator', 'System Administrator']
const STAFF_ROLES = ['Property Custodian', 'Inventory Officer', 'Department Head', 'Auditor']
const EMPLOYEE_ROLES = ['Employee']

export function hasRole(user: User | null, role: string): boolean {
  if (!user?.roles) return false
  return user.roles.some((r) => r.name === role)
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
  if (!user?.roles) return false
  return user.roles.some((r) => roles.includes(r.name))
}

export function isAdmin(user: User | null): boolean {
  return hasAnyRole(user, ADMIN_ROLES)
}

export function isStaff(user: User | null): boolean {
  return hasAnyRole(user, STAFF_ROLES)
}

export function isEmployee(user: User | null): boolean {
  return hasAnyRole(user, EMPLOYEE_ROLES)
}

export function getUserRoleCategory(user: User | null): 'admin' | 'staff' | 'employee' | null {
  if (!user?.roles) return null
  if (isAdmin(user)) return 'admin'
  if (isStaff(user)) return 'staff'
  if (isEmployee(user)) return 'employee'
  return null
}
