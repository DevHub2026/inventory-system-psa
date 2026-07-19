import type { AssetStatus, BorrowingStatus, MaintenanceStatus, ReservationStatus } from '@/types'

type BadgeTone = 'gray' | 'blue' | 'green' | 'red' | 'yellow'

export function assetStatusTone(status: AssetStatus): BadgeTone {
  switch (status) {
    case 'AVAILABLE':
      return 'green'
    case 'BORROWED':
      return 'blue'
    case 'RESERVED':
      return 'yellow'
    case 'MAINTENANCE':
      return 'red'
    default:
      return 'gray'
  }
}

export function reservationStatusTone(status: ReservationStatus): BadgeTone {
  switch (status) {
    case 'APPROVED':
      return 'green'
    case 'PENDING':
      return 'yellow'
    case 'REJECTED':
    case 'CANCELLED':
      return 'red'
    default:
      return 'gray'
  }
}

export function borrowingStatusTone(status: BorrowingStatus): BadgeTone {
  switch (status) {
    case 'BORROWED':
    case 'ACTIVE':
      return 'blue'
    case 'RETURNED':
      return 'green'
    case 'OVERDUE':
      return 'red'
    default:
      return 'yellow'
  }
}

export function maintenanceStatusTone(status: MaintenanceStatus): BadgeTone {
  switch (status) {
    case 'completed':
      return 'green'
    case 'in_progress':
      return 'blue'
    case 'cancelled':
      return 'red'
    default:
      return 'yellow'
  }
}
