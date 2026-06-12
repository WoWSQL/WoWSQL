'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import api from '@/lib/api'

/**
 * Activity Tracker Component
 * 
 * Tracks user activity and prevents auto-logout if user is active.
 * Only logs out after 12 hours of inactivity.
 * 
 * - Tracks mouse, keyboard, scroll, touch, and focus events
 * - Periodically pings backend to update last_activity_at timestamp
 * - Only logs out if user has been inactive for 12+ hours
 */
export function ActivityTracker() {
  const router = useRouter()
  const pathname = usePathname()
  const lastActivityRef = useRef<number>(Date.now())
  const lastPingRef = useRef<number>(0)
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const INACTIVITY_TIMEOUT_MS = 12 * 60 * 60 * 1000 // 12 hours in milliseconds
  const PING_INTERVAL_MS = 5 * 60 * 1000 // Ping backend every 5 minutes to update activity
  const ACTIVITY_CHECK_INTERVAL_MS = 10 * 60 * 1000 // Check inactivity every 10 minutes

  useEffect(() => {
    // Skip activity tracking on public auth pages (no authentication required)
    const publicAuthPaths = ['/login', '/signup', '/register', '/forgot-password', '/verify-email', '/reset-password']
    if (publicAuthPaths.some(path => pathname?.startsWith(path))) {
      return
    }

    // Check if user is logged in by trying to ping the backend
    // We'll verify authentication in the pingBackend function

    // Track various user activities
    const activities = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ]

    const updateActivity = () => {
      lastActivityRef.current = Date.now()
    }

    // Add event listeners for all activities
    activities.forEach(activity => {
      document.addEventListener(activity, updateActivity, { passive: true })
    })

    // Ping backend periodically to update last_activity_at timestamp
    // This keeps the session alive as long as user is active
    const pingBackend = async () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current
      
      // Only ping if user has been active in the last 5 minutes
      // This prevents unnecessary API calls when user is truly inactive
      if (timeSinceLastActivity < 5 * 60 * 1000) {
        try {
          // Ping /api/v1/auth/me to update last_activity_at on backend
          await api.get('/api/v1/auth/me')
          lastPingRef.current = now
        } catch (err: any) {
          // If ping fails (401), user session expired
          if (err.response?.status === 401) {
            router.push('/login')
          }
        }
      }
    }

    // Check inactivity and logout if needed
    const checkInactivity = async () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current

      // If user has been inactive for more than 12 hours
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT_MS) {
        try {
          // Verify session is still valid (cookies are sent automatically)
          await api.get('/api/v1/auth/me')
          // If session is valid but user is inactive, logout
          try {
            await api.post('/api/v1/auth/logout')
          } catch (err) {
            // Ignore errors
          }
          router.push('/login')
        } catch (err: any) {
          // Session expired or invalid
          if (err.response?.status === 401) {
            router.push('/login')
          }
        }
      }
    }

    // Initial activity update
    updateActivity()
    
    // Initial ping to backend
    pingBackend()

    // Ping backend every 5 minutes to keep session alive
    pingIntervalRef.current = setInterval(pingBackend, PING_INTERVAL_MS)
    
    // Check inactivity every 10 minutes
    activityCheckIntervalRef.current = setInterval(checkInactivity, ACTIVITY_CHECK_INTERVAL_MS)

    // Cleanup
    return () => {
      activities.forEach(activity => {
        document.removeEventListener(activity, updateActivity)
      })
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current)
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
    }
  }, [router, pathname])

  return null // This component doesn't render anything
}

