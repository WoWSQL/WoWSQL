'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ScrollText, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

interface AuditEntry {
  id: string
  user_id: string | null
  event_type: string
  event_status: string
  ip_address: string | null
  created_at: string
}

export default function AuditLogsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/audit-logs`)
      setLogs(res.data.logs || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [slug])

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-purple-400" />
            Audit Logs
          </h1>
          <p className="text-zinc-600 dark:text-white/40 text-sm mt-1">Authentication events and security logs</p>
        </div>
        <button onClick={load} className="px-3 py-2 text-sm border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-600 dark:text-white/60 hover:bg-zinc-200 dark:hover:bg-white/5">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-100 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10">
              <th className="px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Event</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">IP Address</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-zinc-600 dark:text-white/30">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-zinc-600 dark:text-white/30">No audit logs yet</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-white/5">
                <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white font-mono">{log.event_type}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${log.event_status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {log.event_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600 dark:text-white/40 font-mono">{log.ip_address || '-'}</td>
                <td className="px-4 py-3 text-xs text-zinc-600 dark:text-white/40">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
