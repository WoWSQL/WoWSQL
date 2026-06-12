'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/lib/api'
import { getUserBrowserTimezone } from '@/lib/utils'

interface User {
  id: number
  email: string
  full_name?: string
  is_active: boolean
  is_verified: boolean
  avatar_url?: string
  provider?: string
  timezone?: string
  created_at: string
  last_login?: string
}

interface UserContextType {
  user: User | null
  timezone: string
  loading: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [timezone, setTimezone] = useState<string>('UTC')
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/v1/auth/me')
      const userData = response.data
      setUser(userData)
      // Set timezone from user profile, or detect from browser, or default to UTC
      const userTimezone = userData.timezone || getUserBrowserTimezone() || 'UTC'
      setTimezone(userTimezone)
    } catch (err) {
      // User not authenticated
      setUser(null)
      setTimezone(getUserBrowserTimezone() || 'UTC')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <UserContext.Provider value={{ user, timezone, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
