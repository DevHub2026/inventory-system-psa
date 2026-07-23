/**
 * Date formatting utilities for the inventory management system
 */

/**
 * Format a date string to "July 23, 2026" format
 * @param dateString - ISO date string (e.g., "2026-07-23" or "2026-07-23T09:30:00")
 * @returns Formatted date string
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format a date string to "09:45:18 AM" format (with seconds)
 * @param dateString - ISO date string (e.g., "2026-07-23T09:45:18")
 * @returns Formatted time string
 */
export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Time'
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

/**
 * Format a date string to "July 23, 2026 at 09:30 AM" format
 * @param dateString - ISO date string (e.g., "2026-07-23T09:30:00")
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Calculate the duration between two dates
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Human-readable duration string (e.g., "2 days 6 hours 15 minutes")
 */
export function calculateDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid Duration'
  
  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  const parts = []
  if (diffDays > 0) parts.push(`${diffDays} day${diffDays > 1 ? 's' : ''}`)
  if (diffHours > 0) parts.push(`${diffHours} hour${diffHours > 1 ? 's' : ''}`)
  if (diffMinutes > 0) parts.push(`${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`)
  
  return parts.length > 0 ? parts.join(' ') : 'Less than a minute'
}
