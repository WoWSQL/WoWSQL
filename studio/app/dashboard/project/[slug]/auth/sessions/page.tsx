'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Clock, RefreshCw, Trash2, ChevronLeft, ChevronRight, Shield, Monitor, Smartphone, Globe } from 'lucide-react'
import api from '@/lib/api'
import { SkeletonTableRows } from '@/components/Skeleton'

interface Session {
  id: string
  user_id: string
  user_email: string | null
  ip_address: string | null
  user_agent: string | null
  device_type: string | null
  is_active: boolean
  created_at: string
  expires_at: string | null
  last_activity_at: string | null
}

export default function SessionsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [sessions, setSessions] = useState<Session[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [activeOnly, setActiveOnly] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(24)
  const [refreshExpiry, setRefreshExpiry] = useState(30)

  useEffect(() => { loadData() }, [slug, page, activeOnly])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sessRes, statusRes] = await Promise.all([
        api.get(`/api/v1/projects/${slug}/auth/sessions`, { params: { page, per_page: 20, active_only: activeOnly } }),
        api.get(`/api/v1/projects/${slug}/auth/status`)
      ])
      setSessions(sessRes.data.sessions)
      setTotal(sessRes.data.total)
      setTotalPages(sessRes.data.total_pages)
      if (statusRes.data.config) {
        setConfig(statusRes.data.config)
        setSessionTimeout(statusRes.data.config.session_timeout_hours ?? 24)
        setRefreshExpiry(statusRes.data.config.refresh_token_expiry_days ?? 30)
      }
    } catch { }
    finally { setLoading(false) }
  }

  const handleRevoke = async (sessionId: string) => {
    try {
      await api.delete(`/api/v1/projects/${slug}/auth/sessions/${sessionId}`)
      await loadData()
    } catch (err: any) { alert(err.response?.data?.detail || 'Failed to revoke session.') }
  }

  const handleRevokeAll = async () => {
    if (!confirm('Revoke all active sessions? Users will need to sign in again.')) return
    try {
      await api.delete(`/api/v1/projects/${slug}/auth/sessions`)
      await loadData()
    } catch (err: any) { alert(err.response?.data?.detail || 'Failed.') }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      await api.patch(`/api/v1/projects/${slug}/auth/config`, {
        session_timeout_hours: sessionTimeout,
        refresh_token_expiry_days: refreshExpiry
      })
      await loadData()
    } catch (err: any) { alert(err.response?.data?.detail || 'Failed to save.') }
    finally { setSaving(false) }
  }

  const deviceIcon = (type: string | null) => {
    if (!type) return <Globe className="w-4 h-4" />
    if (type.toLowerCase().includes('mobile')) return <Smartphone className="w-4 h-4" />
    return <Monitor className="w-4 h-4" />
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-sm font-semibold text-foreground">Sessions</h1>
        <p className="text-zinc-600 dark:text-white/50 text-sm mt-1">Manage active sessions and session configuration</p>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-foreground mb-4">Session Configuration</h2>
        <div className="border border-zinc-300 dark:border-white/10 rounded-md p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block">Session Timeout (hours)</label>
              <input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-foreground text-sm focus:outline-none focus:border-zinc-300 dark:border-white/10" min={1} />
            </div>
            <div>
              <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block">Refresh Token Expiry (days)</label>
              <input type="number" value={refreshExpiry} onChange={e => setRefreshExpiry(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-foreground text-sm focus:outline-none focus:border-zinc-300 dark:border-white/10" min={1} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveConfig} disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
              Save Configuration
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">Active Sessions ({total})</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-white/60">
              <input type="checkbox" checked={activeOnly} onChange={e => { setActiveOnly(e.target.checked); setPage(1) }}
              className="w-4 h-4 rounded border-zinc-300 dark:border-white/20 bg-zinc-100 dark:bg-white/5" />
              Active only
            </label>
            <button onClick={handleRevokeAll} className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors">
              Revoke All
            </button>
          </div>
        </div>

        <div className="border border-zinc-300 dark:border-white/10 rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
            <tr className="border-b border-zinc-300 dark:border-white/10 bg-zinc-100 dark:bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Device</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">IP</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Created</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
              <SkeletonTableRows rows={6} cols={6} />
              ) : sessions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-zinc-600 dark:text-white/40 text-sm">No sessions found</td></tr>
              ) : sessions.map(s => (
                <tr key={s.id} className="hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">{s.user_email || s.user_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-white/60">
                      {deviceIcon(s.device_type)}
                      <span className="text-xs truncate max-w-[200px]">{s.user_agent?.split(' ')[0] || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600 dark:text-white/40 font-mono">{s.ip_address || '-'}</td>
                  <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${s.is_active ? 'text-blue-500 dark:text-blue-400' : 'text-zinc-600 dark:text-white/30'}`}>
                      {s.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600 dark:text-white/40">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {s.is_active && (
                      <button onClick={() => handleRevoke(s.id)} className="p-1.5 rounded-md text-zinc-600 dark:text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-zinc-600 dark:text-white/40">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-2 rounded-md text-zinc-600 dark:text-white/60 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-2 rounded-md text-zinc-600 dark:text-white/60 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
