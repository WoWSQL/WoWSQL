'use client'

import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { useParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { AuthSidebar } from './components/AuthSidebar'
import api from '@/lib/api'

interface AuthLayoutContextValue {
  authEnabled: boolean
  refreshAuthStatus: () => Promise<void>
}

const AuthLayoutContext = createContext<AuthLayoutContextValue>({
  authEnabled: true,
  refreshAuthStatus: async () => {},
})

export function useAuthLayout() {
  return useContext(AuthLayoutContext)
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const slug = params.slug as string
  const [authEnabled, setAuthEnabled] = useState(true)
  const [loading, setLoading] = useState(true)

  const fetchAuthStatus = useCallback(async () => {
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/status`)
      setAuthEnabled(res.data.enabled !== false)
    } catch {
      setAuthEnabled(true)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchAuthStatus() }, [fetchAuthStatus])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] overflow-hidden flex">
        <Sidebar projectSlug={slug} projectName="WoWSQL" />
        <div className="flex-1 flex items-center justify-center" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
          <div className="text-zinc-600 dark:text-white/50 text-sm">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <AuthLayoutContext.Provider value={{ authEnabled, refreshAuthStatus: fetchAuthStatus }}>
      <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] overflow-hidden flex">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,0,0,0.8)_70%,transparent_100%)]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
        </div>

        <Sidebar projectSlug={slug} projectName="WoWSQL" />

        <div className="relative z-10 flex flex-1 transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
          <AuthSidebar projectSlug={slug} />
          <main className="flex-1 overflow-y-auto h-screen">
            {children}
          </main>
        </div>
      </div>
    </AuthLayoutContext.Provider>
  )
}
