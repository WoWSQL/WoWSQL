'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Gauge, Save, RefreshCw, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import { PageSkeleton } from '@/components/Skeleton'

export default function RateLimitsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    rate_limit_per_hour: 100,
    rate_limit_per_day: 1000,
  })

  useEffect(() => { loadConfig() }, [slug])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/status`)
      if (res.data.config) {
        setConfig({
          rate_limit_per_hour: res.data.config.rate_limit_per_hour ?? 100,
          rate_limit_per_day: res.data.config.rate_limit_per_day ?? 1000,
        })
      }
    } catch { }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/api/v1/projects/${slug}/auth/config`, config)
      await loadConfig()
    } catch (err: any) { alert(err.response?.data?.detail || 'Failed to save.') }
    finally { setSaving(false) }
  }

  if (loading) return <PageSkeleton variant="form" />

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-sm font-semibold text-foreground">Rate Limits</h1>
        <p className="text-zinc-600 dark:text-white/50 text-sm mt-1">Configure rate limiting for authentication endpoints</p>
      </div>

      <div className="border border-zinc-300 dark:border-white/10 rounded-md p-5 space-y-5">
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-md">
          <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-700 dark:text-amber-200">
            Rate limits apply per IP address for authentication endpoints (login, signup, password reset, OTP requests).
            Setting limits too low may lock out legitimate users.
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="w-4 h-4 text-blue-400" />
              <label className="text-sm font-medium text-foreground">Requests per Hour</label>
            </div>
            <input type="number" value={config.rate_limit_per_hour}
            onChange={e => setConfig(c => ({ ...c, rate_limit_per_hour: Number(e.target.value) }))}
            className="w-full px-3 py-2.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-foreground text-sm focus:outline-none focus:border-zinc-300 dark:border-white/10" min={10} />
            <p className="text-xs text-zinc-600 dark:text-white/40 mt-1.5">Maximum auth requests from a single IP per hour</p>
          </div>
          <div>
          <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-blue-400" />
          <label className="text-sm font-medium text-foreground">Requests per Day</label>
        </div>
        <input type="number" value={config.rate_limit_per_day}
        onChange={e => setConfig(c => ({ ...c, rate_limit_per_day: Number(e.target.value) }))}
        className="w-full px-3 py-2.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-foreground text-sm focus:outline-none focus:border-zinc-300 dark:border-white/10" min={100} />
        <p className="text-xs text-zinc-600 dark:text-white/40 mt-1.5">Maximum auth requests from a single IP per day</p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
      <button onClick={handleSave} disabled={saving}
      className="px-5 py-2.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm">
      {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      Save Changes
    </button>
    </div>
  </div>
</div>
  )
}
