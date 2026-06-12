import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date in user's timezone
 * @param date - Date string or Date object (assumed to be UTC from backend)
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York', 'Asia/Tokyo')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, timezone: string = 'UTC') {
  try {
    // Ensure date is parsed correctly - backend sends UTC timestamps
    let dateObj: Date
    if (typeof date === 'string') {
      // Backend sends ISO 8601 format (e.g., "2024-01-01T12:00:00" or "2024-01-01T12:00:00Z")
      // If it doesn't end with Z, append it to ensure UTC parsing
      let dateString = date.trim()
      if (dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
        dateString = dateString + 'Z'
      }
      dateObj = new Date(dateString)
    } else {
      dateObj = date
    }
    
    // Validate date
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date')
    }
    
    // Format with the specified timezone
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    }).format(dateObj)
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    console.warn('Timezone conversion error:', error, 'date:', date, 'timezone:', timezone)
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(dateObj)
  }
}

/**
 * Format date and time in user's timezone
 * @param date - Date string or Date object (assumed to be UTC from backend)
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York', 'Asia/Tokyo')
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date, timezone: string = 'UTC') {
  try {
    // Ensure date is parsed correctly - backend sends UTC timestamps
    let dateObj: Date
    if (typeof date === 'string') {
      // Backend sends ISO 8601 format (e.g., "2024-01-01T12:00:00" or "2024-01-01T12:00:00Z")
      // If it doesn't end with Z, append it to ensure UTC parsing
      let dateString = date.trim()
      if (dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
        dateString = dateString + 'Z'
      }
      dateObj = new Date(dateString)
    } else {
      dateObj = date
    }
    
    // Validate date
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date')
    }
    
    // Format with the specified timezone
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: timezone,
    }).format(dateObj)
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    console.warn('Timezone conversion error:', error, 'date:', date, 'timezone:', timezone)
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'UTC',
    }).format(dateObj)
  }
}

/**
 * Format date and time with seconds in user's timezone
 * @param date - Date string or Date object (assumed to be UTC from backend)
 * @param timezone - IANA timezone identifier
 * @returns Formatted date and time string with seconds
 */
export function formatDateTimeWithSeconds(date: string | Date, timezone: string = 'UTC') {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: timezone,
    }).format(dateObj)
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
  }
}

/**
 * Get user's browser timezone
 * @returns IANA timezone identifier (e.g., 'America/New_York')
 */
export function getUserBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    return 'UTC'
  }
}

/**
 * Get list of common timezones grouped by region
 * @returns Array of timezone objects with label and value
 */
export function getCommonTimezones(): Array<{ label: string; value: string }> {
  return [
    // Americas
    { label: 'Eastern Time (US & Canada)', value: 'America/New_York' },
    { label: 'Central Time (US & Canada)', value: 'America/Chicago' },
    { label: 'Mountain Time (US & Canada)', value: 'America/Denver' },
    { label: 'Pacific Time (US & Canada)', value: 'America/Los_Angeles' },
    { label: 'Alaska', value: 'America/Anchorage' },
    { label: 'Hawaii', value: 'Pacific/Honolulu' },
    { label: 'Mexico City', value: 'America/Mexico_City' },
    { label: 'São Paulo', value: 'America/Sao_Paulo' },
    { label: 'Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
    
    // Europe
    { label: 'London', value: 'Europe/London' },
    { label: 'Paris', value: 'Europe/Paris' },
    { label: 'Berlin', value: 'Europe/Berlin' },
    { label: 'Rome', value: 'Europe/Rome' },
    { label: 'Madrid', value: 'Europe/Madrid' },
    { label: 'Amsterdam', value: 'Europe/Amsterdam' },
    { label: 'Moscow', value: 'Europe/Moscow' },
    { label: 'Istanbul', value: 'Europe/Istanbul' },
    
    // Asia
    { label: 'Tokyo', value: 'Asia/Tokyo' },
    { label: 'Shanghai', value: 'Asia/Shanghai' },
    { label: 'Hong Kong', value: 'Asia/Hong_Kong' },
    { label: 'Singapore', value: 'Asia/Singapore' },
    { label: 'Seoul', value: 'Asia/Seoul' },
    { label: 'Bangkok', value: 'Asia/Bangkok' },
    { label: 'Mumbai / Kolkata', value: 'Asia/Kolkata' },
    { label: 'Dubai', value: 'Asia/Dubai' },
    { label: 'Jakarta', value: 'Asia/Jakarta' },
    { label: 'Manila', value: 'Asia/Manila' },
    
    // Oceania
    { label: 'Sydney', value: 'Australia/Sydney' },
    { label: 'Melbourne', value: 'Australia/Melbourne' },
    { label: 'Auckland', value: 'Pacific/Auckland' },
    
    // Africa
    { label: 'Cairo', value: 'Africa/Cairo' },
    { label: 'Johannesburg', value: 'Africa/Johannesburg' },
    { label: 'Lagos', value: 'Africa/Lagos' },
    
    // UTC
    { label: 'UTC', value: 'UTC' },
  ]
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

