import type { AssetStatus, BorrowingStatus, MaintenanceStatus, ReservationStatus } from '@/types'

const fallbackLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')

export function assetStatusLabel(status: AssetStatus | string): string {
  const labels: Record<AssetStatus, string> = {
    AVAILABLE: 'Available',
    BORROWED: 'Currently Borrowed',
    RESERVED: 'Reserved',
    MAINTENANCE: 'Under Maintenance',
    UNAVAILABLE: 'Unavailable',
    RETIRED: 'Retired',
    DISPOSED: 'Disposed',
  }

  return labels[status as AssetStatus] ?? fallbackLabel(status)
}

export function reservationStatusLabel(status: ReservationStatus | string): string {
  const labels: Record<ReservationStatus, string> = {
    PENDING: 'Waiting for Approval',
    APPROVED: 'Approved',
    REJECTED: 'Declined',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  }

  return labels[status as ReservationStatus] ?? fallbackLabel(status)
}

export function borrowingStatusLabel(status: BorrowingStatus | string): string {
  const labels: Record<BorrowingStatus, string> = {
    ACTIVE: 'Currently Borrowed',
    BORROWED: 'Currently Borrowed',
    PARTIALLY_RETURNED: 'Partly Returned',
    RETURNED: 'Returned',
    OVERDUE: 'Overdue',
  }

  return labels[status as BorrowingStatus] ?? fallbackLabel(status)
}

export function maintenanceStatusLabel(status: MaintenanceStatus | string): string {
  const labels: Record<MaintenanceStatus, string> = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  return labels[status as MaintenanceStatus] ?? fallbackLabel(status)
}

export function inventoryStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    IN_STOCK: 'In Stock',
    LOW_STOCK: 'Low Stock',
    OUT_OF_STOCK: 'Out of Stock',
    DISCONTINUED: 'Discontinued',
  }

  return labels[status] ?? fallbackLabel(status)
}
