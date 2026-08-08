'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ScrollText, RefreshCw, ChevronLeft, ChevronRight, Filter, Shield } from 'lucide-react'
import api from '@/lib/api'
import { AppSelect } from '@/components/AppSelect'
import { SkeletonTableRows } from '@/components/Skeleton'

interface AuditLog {
  id: string
  user_id: string | null
  event_type: string
  ip_address: string | null
  user_agent: string | null
  metadata: any
  created_at: string
}

const EVENT_TYPES = [
  '', 'login', 'signup', 'logout', 'password_reset', 'email_verified',
  'mfa_enabled', 'mfa_disabled', 'user_banned', 'user_deleted', 'token_refresh'
]

export default function AuditLogsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [eventType, setEventType] = useState('')
  const [authEnabled, setAuthEnabled] = useState(true)

  useEffect(() => { loadLogs() }, [slug, page, eventType])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: 50 }
      if (eventType) params.event_type = eventType
      const res = await api.get(`/api/v1/projects/${slug}/auth/audit-logs`, { params })
      setLogs(res.data.logs)
      setTotal(res.data.total)
      setTotalPages(res.data.total_pages)
      setAuthEnabled(true)
    } catch (err: any) {
      if (err.response?.status === 400) setAuthEnabled(false)
    } finally { setLoading(false) }
  }

  const eventColor = (type: string) => {
  if (type.includes('login') || type.includes('signup')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    if (type.includes('banned') || type.includes('deleted')) return 'text-red-400 bg-red-500/10 border-red-500/20'
    if (type.includes('password') || type.includes('mfa')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-blue-400 bg-blue-500/10 border-zinc-300 dark:border-white/10'
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

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Audit Logs</h1>
          <p className="text-zinc-600 dark:text-white/50 text-sm mt-1">{total} total events</p>
        </div>
        <button onClick={loadLogs} disabled={loading}
          className="p-2 rounded-md text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-zinc-600 dark:text-white/40" />
        <AppSelect
          value={eventType}
          onChange={(v) => { setEventType(v); setPage(1) }}
          className="w-48"
          options={[
            { value: '', label: 'All events' },
            ...EVENT_TYPES.filter(Boolean).map((t) => ({
              value: t,
              label: t.replace('_', ' '),
            })),
          ]}
        />
      </div>

      <div className="border border-zinc-300 dark:border-white/10 rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
          <tr className="border-b border-zinc-300 dark:border-white/10 bg-zinc-100 dark:bg-white/5">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Event</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">User ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">IP Address</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
            <SkeletonTableRows rows={6} cols={4} />
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-zinc-600 dark:text-white/40 text-sm">No audit logs found</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs font-medium px-2 py-1 rounded-md border ${eventColor(log.event_type)}`}>
                    {log.event_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600 dark:text-white/50 font-mono">{log.user_id ? log.user_id.substring(0, 8) + '...' : '-'}</td>
                <td className="px-4 py-3 text-xs text-zinc-600 dark:text-white/50 font-mono">{log.ip_address || '-'}</td>
                <td className="px-4 py-3 text-xs text-zinc-600 dark:text-white/40">{new Date(log.created_at).toLocaleString()}</td>
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
    </div>
  )
}
