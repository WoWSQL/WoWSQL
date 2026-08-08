'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ShieldAlert, Save, RefreshCw, Lock, Ban } from 'lucide-react'
import api from '@/lib/api'
import { PageSkeleton } from '@/components/Skeleton'

export default function AttackProtectionPage() {
  const params = useParams()
  const slug = params.slug as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    max_login_attempts: 5,
    login_lockout_duration_minutes: 30,
  })

  useEffect(() => { loadConfig() }, [slug])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/status`)
      if (res.data.config) {
        setConfig({
          max_login_attempts: res.data.config.max_login_attempts ?? 5,
          login_lockout_duration_minutes: res.data.config.login_lockout_duration_minutes ?? 30,
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
        <h1 className="text-sm font-semibold text-foreground">Attack Protection</h1>
        <p className="text-zinc-600 dark:text-white/50 text-sm mt-1">Configure brute-force protection and account lockout policies</p>
      </div>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Ban className="w-5 h-5 text-red-400" />
          <h2 className="text-sm font-medium text-foreground">Brute Force Protection</h2>
        </div>
        <div className="border border-zinc-300 dark:border-white/10 rounded-md p-5 space-y-5">
          <p className="text-sm text-zinc-600 dark:text-white/60">
            Protect user accounts from brute-force password attacks by temporarily locking accounts after repeated failed login attempts.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block">Maximum Login Attempts</label>
              <input type="number" value={config.max_login_attempts}
                onChange={e => setConfig(c => ({ ...c, max_login_attempts: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-foreground text-sm focus:outline-none focus:border-zinc-300 dark:border-white/10" min={1} max={20} />
              <p className="text-xs text-zinc-600 dark:text-white/40 mt-1.5">Number of failed attempts before lockout</p>
            </div>
            <div>
              <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block">Lockout Duration (minutes)</label>
              <input type="number" value={config.login_lockout_duration_minutes}
                onChange={e => setConfig(c => ({ ...c, login_lockout_duration_minutes: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-foreground text-sm focus:outline-none focus:border-zinc-300 dark:border-white/10" min={1} max={1440} />
              <p className="text-xs text-zinc-600 dark:text-white/40 mt-1.5">How long account stays locked after max attempts</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-medium text-foreground">CAPTCHA Protection</h2>
        </div>
        <div className="border border-zinc-300 dark:border-white/10 rounded-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enable CAPTCHA on Auth Pages</p>
              <p className="text-xs text-zinc-600 dark:text-white/40 mt-0.5">Require CAPTCHA verification on login and signup. Currently supports Cloudflare Turnstile.</p>
            </div>
            <span className="text-xs text-zinc-600 dark:text-white/30 bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-full border border-zinc-300 dark:border-white/10">Coming Soon</span>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
        className="px-5 py-2.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}
