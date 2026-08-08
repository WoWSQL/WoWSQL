'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BarChart3, RefreshCw, Users, Shield, Clock, ShieldBan } from 'lucide-react'
import api from '@/lib/api'
import { PageSkeleton } from '@/components/Skeleton'

interface AuthStats {
  total_users: number
  verified_users: number
  banned_users: number
  active_sessions: number
  recent_signups: { date: string; count: number }[]
}

export default function PerformancePage() {
  const params = useParams()
  const slug = params.slug as string
  const [stats, setStats] = useState<AuthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [authEnabled, setAuthEnabled] = useState(true)

  useEffect(() => { loadStats() }, [slug])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/stats`)
      setStats(res.data)
      setAuthEnabled(true)
    } catch (err: any) {
      if (err.response?.status === 400) setAuthEnabled(false)
    } finally { setLoading(false) }
  }

  if (!authEnabled) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 text-zinc-600 dark:text-white/20 mx-auto mb-4" />
          <h2 className="text-sm font-semibold text-foreground mb-2">Authentication Not Enabled</h2>
          <p className="text-zinc-600 dark:text-white/50 text-sm">Enable authentication for this project first.</p>
        </div>
      </div>
    )
  }

  if (loading || !stats) {
  return <PageSkeleton variant="content" />
  }

  const statCards = [
    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'purple' },
    { label: 'Verified Users', value: stats.verified_users, icon: Shield, color: 'blue' },
    { label: 'Active Sessions', value: stats.active_sessions, icon: Clock, color: 'blue' },
    { label: 'Banned Users', value: stats.banned_users, icon: ShieldBan, color: 'red' },
  ]

  const colorMap: Record<string, string> = {
  purple: 'from-blue-500/20 to-blue-600/5 border-zinc-300 dark:border-white/10 text-blue-300',
  emerald: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-300',
  blue: 'from-blue-500/20 to-blue-600/5 border-zinc-300 dark:border-white/10 text-blue-300',
    red: 'from-red-500/20 to-red-600/5 border-red-500/20 text-red-300',
  }

  const maxSignups = Math.max(...stats.recent_signups.map(s => s.count), 1)

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Performance</h1>
          <p className="text-zinc-600 dark:text-white/50 text-sm mt-1">Authentication metrics and usage statistics</p>
        </div>
        <button onClick={loadStats} disabled={loading}
          className="p-2 rounded-md text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => {
          const Icon = card.icon
          const colors = colorMap[card.color]
          return (
            <div key={card.label} className={`rounded-md border bg-gradient-to-br p-4 ${colors}`}>
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{card.value.toLocaleString()}</p>
              <p className="text-xs text-zinc-600 dark:text-white/50 mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>

      <section>
        <h2 className="text-sm font-medium text-foreground mb-4">Signups (Last 30 Days)</h2>
        <div className="border border-zinc-300 dark:border-white/10 rounded-md p-5">
          {stats.recent_signups.length === 0 ? (
            <p className="text-center text-zinc-600 dark:text-white/40 text-sm py-8">No signups in the last 30 days</p>
          ) : (
            <div className="space-y-2">
              {stats.recent_signups.slice(0, 15).map(s => (
                <div key={s.date} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600 dark:text-white/40 w-24 flex-shrink-0">{new Date(s.date).toLocaleDateString()}</span>
                  <div className="flex-1 h-6 bg-zinc-100 dark:bg-white/5 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-blue-600 text-white shadow-sm rounded-md flex items-center px-2"
                      style={{ width: `${Math.max((s.count / maxSignups) * 100, 5)}%` }}
                    >
                      <span className="text-[10px] text-foreground font-medium">{s.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
