'use client'

import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { AuthSidebar } from './components/AuthSidebar'
import { EnableAuth } from './components/EnableAuth'
import api from '@/lib/api'
import { PageSkeleton } from '@/components/Skeleton'

interface Project {
  id: number
  name: string
  slug: string
}

interface AuthLayoutContextValue {
  authEnabled: boolean | null
  refreshAuthStatus: () => Promise<void>
  handleAuthDisabled: () => void
}

const AuthLayoutContext = createContext<AuthLayoutContextValue>({
  authEnabled: null,
  refreshAuthStatus: async () => {},
  handleAuthDisabled: () => {},
})

export function useAuthLayout() {
  return useContext(AuthLayoutContext)
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [project, setProject] = useState<Project | null>(null)
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAuthStatus = useCallback(async () => {
    if (!slug) return
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/status`)
      // Only trust an explicit false — network/401 must not trap users on Enable Auth
      // when the auth schema is already provisioned.
      setAuthEnabled(res.data?.enabled !== false)
    } catch {
      // Self-host ships with auth; keep existing UI on transient errors instead of Enable wizard
      setAuthEnabled((prev) => (prev === null ? true : prev))
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (!slug) return
    api.get(`/api/v1/projects/${slug}`)
      .then(res => setProject(res.data))
      .catch(() => {})

    fetchAuthStatus()
  }, [slug, fetchAuthStatus])

  const handleAuthEnabled = useCallback(() => {
    setAuthEnabled(true)
    router.push(`/dashboard/project/${slug}/auth/providers`)
  }, [router, slug])

  const handleAuthDisabled = useCallback(() => {
    setAuthEnabled(false)
    router.push(`/dashboard/project/${slug}/auth`)
  }, [router, slug])

  const refreshAuthStatus = useCallback(async () => {
    await fetchAuthStatus()
  }, [fetchAuthStatus])

  if (loading) {
    return <PageSkeleton variant="auth-shell" projectSlug={slug} projectName={project?.name || ''} />
  }

  return (
    <AuthLayoutContext.Provider value={{ authEnabled, refreshAuthStatus, handleAuthDisabled }}>
      <div className="min-h-screen bg-background overflow-hidden flex transition-colors duration-300">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,0,0,0.8)_70%,transparent_100%)] dark:[mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.8)_70%,transparent_100%)]" />
        </div>

        <Sidebar projectSlug={slug} projectName={project?.name || ''} />

        <div className="relative z-10 flex flex-1 transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
          {authEnabled ? (
            <>
              <AuthSidebar projectSlug={slug} />
              <main className="ui-page flex-1 overflow-y-auto h-screen bg-background">
                {children}
              </main>
            </>
          ) : (
            <main className="ui-page flex-1 overflow-y-auto h-screen bg-background">
              <EnableAuth onEnabled={handleAuthEnabled} />
            </main>
          )}
        </div>
      </div>
    </AuthLayoutContext.Provider>
  )
}
