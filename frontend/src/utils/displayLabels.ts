import type { Asset, AssetStatus, BorrowingStatus, MaintenanceStatus, ReservationStatus } from '@/types'
import type { Tone } from '@/components/ui'

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

/**
 * Returns the user-facing display information for an asset's status cell,
 * taking reservation_context into account when the asset is RESERVED.
 *
 * Two-badge model:
 *   - label / tone        → primary badge  — always reflects the physical asset state
 *   - subtext / subtextTone → secondary badge — reflects the reservation workflow state
 *
 * Rules:
 *   RESERVED + context.status === 'APPROVED'
 *     primary:   "Reserved"               yellow
 *     secondary: "Approved — Awaiting Release"  blue
 *
 *   RESERVED + context.status === 'PENDING'
 *     primary:   "Reserved"               yellow
 *     secondary: "Pending Approval"       orange
 *
 *   RESERVED (no context — e.g. manual admin change)
 *     primary:   "Reserved"               yellow
 *     secondary: none
 *
 *   All other statuses: standard label/tone, no secondary badge.
 *
 * The backend asset.status is never changed by this helper.
 */
export function getEffectiveAssetStatus(asset: Pick<Asset, 'status' | 'reservation_context'>): {
  label: string
  tone: Tone
  subtext: string | null
  subtextTone: Tone | null
} {
  if (asset.status === 'RESERVED') {
    const ctx = asset.reservation_context
    if (ctx?.status === 'APPROVED') {
      return {
        label: 'Reserved',
        tone: 'yellow',
        subtext: 'Approved — Awaiting Release',
        subtextTone: 'blue',
      }
    }
    if (ctx?.status === 'PENDING') {
      return {
        label: 'Reserved',
        tone: 'yellow',
        subtext: 'Pending Approval',
        subtextTone: 'orange',
      }
    }
    // No context — plain reserved
    return {
      label: 'Reserved',
      tone: 'yellow',
      subtext: null,
      subtextTone: null,
    }
  }

  // All other statuses: standard label/tone, no secondary badge
  const toneMap: Partial<Record<AssetStatus, Tone>> = {
    AVAILABLE: 'green',
    BORROWED: 'blue',
    MAINTENANCE: 'red',
  }

  return {
    label: assetStatusLabel(asset.status),
    tone: toneMap[asset.status as AssetStatus] ?? 'gray',
    subtext: null,
    subtextTone: null,
  }
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
