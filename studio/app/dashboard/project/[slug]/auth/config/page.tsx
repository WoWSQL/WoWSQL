'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Settings, Save, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import api from '@/lib/api'

interface AuthConfig {
  enable_signup: boolean
  email_password_enabled: boolean
  email_confirmation_required: boolean
  jwt_expiry_hours: number
  refresh_token_expiry_days: number
  site_url: string
  auth_service_name: string
}

export default function AuthConfigPage() {
  const params = useParams()
  const slug = params.slug as string
  const [config, setConfig] = useState<AuthConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/config`)
      setConfig(res.data)
    } catch {
      showToast('Failed to load auth config', false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadConfig() }, [slug])

  const saveConfig = async () => {
    if (!config) return
    setSaving(true)
    try {
      await api.put(`/api/v1/projects/${slug}/auth/config`, config)
      showToast('Auth configuration saved', true)
    } catch {
      showToast('Failed to save configuration', false)
    } finally {
      setSaving(false)
    }
  }

  const inp = "px-3 py-2.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"

  if (loading || !config) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="text-zinc-600 dark:text-white/50 text-sm">Loading configuration...</div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg
          ${toast.ok ? 'bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-400" />
            Auth Settings
          </h1>
          <p className="text-zinc-600 dark:text-white/40 text-sm mt-1">Configure authentication behavior for your project</p>
        </div>
        <button onClick={saveConfig} disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        {/* General */}
        <section className="border border-zinc-200 dark:border-white/10 rounded-xl p-6 bg-white dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block font-medium">Auth Service Name</label>
              <input type="text" value={config.auth_service_name} onChange={e => setConfig({ ...config, auth_service_name: e.target.value })}
                className={'w-full ' + inp} />
            </div>
            <div>
              <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block font-medium">Site URL</label>
              <input type="text" value={config.site_url} onChange={e => setConfig({ ...config, site_url: e.target.value })}
                className={'w-full ' + inp} placeholder="http://localhost:8080" />
              <p className="text-xs text-zinc-600 dark:text-white/30 mt-1">Used for email verification and password reset links</p>
            </div>
          </div>
        </section>

        {/* Sign Up */}
        <section className="border border-zinc-200 dark:border-white/10 rounded-xl p-6 bg-white dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Sign Up</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition">
              <div>
                <p className="text-sm text-zinc-900 dark:text-white font-medium">Allow new users to sign up</p>
                <p className="text-xs text-zinc-600 dark:text-white/40 mt-0.5">When disabled, only admins can create users</p>
              </div>
              <input type="checkbox" checked={config.enable_signup} onChange={e => setConfig({ ...config, enable_signup: e.target.checked })}
                className="w-5 h-5 rounded bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/20 text-purple-500 focus:ring-purple-500/50" />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition">
              <div>
                <p className="text-sm text-zinc-900 dark:text-white font-medium">Email + Password sign-in</p>
                <p className="text-xs text-zinc-600 dark:text-white/40 mt-0.5">Allow users to sign in with email and password</p>
              </div>
              <input type="checkbox" checked={config.email_password_enabled} onChange={e => setConfig({ ...config, email_password_enabled: e.target.checked })}
                className="w-5 h-5 rounded bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/20 text-purple-500 focus:ring-purple-500/50" />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition">
              <div>
                <p className="text-sm text-zinc-900 dark:text-white font-medium">Require email confirmation</p>
                <p className="text-xs text-zinc-600 dark:text-white/40 mt-0.5">Users must verify email before they can sign in</p>
              </div>
              <input type="checkbox" checked={config.email_confirmation_required} onChange={e => setConfig({ ...config, email_confirmation_required: e.target.checked })}
                className="w-5 h-5 rounded bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/20 text-purple-500 focus:ring-purple-500/50" />
            </label>
          </div>
        </section>

        {/* Token Settings */}
        <section className="border border-zinc-200 dark:border-white/10 rounded-xl p-6 bg-white dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Token Expiry</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block font-medium">Access Token Expiry (hours)</label>
              <input type="number" value={config.jwt_expiry_hours} onChange={e => setConfig({ ...config, jwt_expiry_hours: parseInt(e.target.value) || 24 })}
                className={'w-full ' + inp} min={1} max={720} />
            </div>
            <div>
              <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block font-medium">Refresh Token Expiry (days)</label>
              <input type="number" value={config.refresh_token_expiry_days} onChange={e => setConfig({ ...config, refresh_token_expiry_days: parseInt(e.target.value) || 7 })}
                className={'w-full ' + inp} min={1} max={365} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
