'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Lock, Save, RefreshCw, Key } from 'lucide-react'
import api from '@/lib/api'
import { PageSkeleton } from '@/components/Skeleton'

export default function PoliciesPage() {
  const params = useParams()
  const slug = params.slug as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    min_password_length: 8,
    max_password_length: 128,
    require_uppercase: true,
    require_lowercase: true,
    require_number: true,
    require_special_char: false,
    jwt_expiry_hours: 24,
    refresh_token_expiry_days: 30,
  })

  useEffect(() => { loadConfig() }, [slug])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/status`)
      if (res.data.config) {
        const c = res.data.config
        setConfig({
          min_password_length: c.min_password_length ?? 8,
          max_password_length: c.max_password_length ?? 128,
          require_uppercase: c.require_uppercase ?? true,
          require_lowercase: c.require_lowercase ?? true,
          require_number: c.require_number ?? true,
          require_special_char: c.require_special_char ?? false,
          jwt_expiry_hours: c.jwt_expiry_hours ?? 24,
          refresh_token_expiry_days: c.refresh_token_expiry_days ?? 30,
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

  const toggles = [
    { key: 'require_uppercase', label: 'Require uppercase letter' },
    { key: 'require_lowercase', label: 'Require lowercase letter' },
    { key: 'require_number', label: 'Require number' },
    { key: 'require_special_char', label: 'Require special character' },
  ]

  return (
    <div className="ui-page p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="ui-page-title">Policies</h1>
        <p className="ui-page-desc mt-1">Configure password policies and JWT token settings</p>
      </div>

      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-blue-400 shrink-0" />
          <h2 className="ui-section-title">Password Policies</h2>
        </div>
        <div className="ui-panel p-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="ui-label mb-1.5 block">Minimum Password Length</label>
              <input type="number" value={config.min_password_length}
                onChange={e => setConfig(c => ({ ...c, min_password_length: Number(e.target.value) }))}
                className="ui-control w-full" min={6} max={64} />
            </div>
            <div>
              <label className="ui-label mb-1.5 block">Maximum Password Length</label>
              <input type="number" value={config.max_password_length}
                onChange={e => setConfig(c => ({ ...c, max_password_length: Number(e.target.value) }))}
                className="ui-control w-full" min={8} max={256} />
            </div>
          </div>

          <div className="space-y-2">
            {toggles.map(t => (
              <div key={t.key} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-foreground">{t.label}</span>
                <button onClick={() => setConfig(c => ({ ...c, [t.key]: !c[t.key as keyof typeof c] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${config[t.key as keyof typeof config] ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-white/20'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${config[t.key as keyof typeof config] ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-blue-400 shrink-0" />
          <h2 className="ui-section-title">JWT Configuration</h2>
        </div>
        <div className="ui-panel p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="ui-label mb-1.5 block">Access Token Expiry (hours)</label>
              <input type="number" value={config.jwt_expiry_hours}
                onChange={e => setConfig(c => ({ ...c, jwt_expiry_hours: Number(e.target.value) }))}
                className="ui-control w-full" min={1} />
            </div>
            <div>
              <label className="ui-label mb-1.5 block">Refresh Token Expiry (days)</label>
              <input type="number" value={config.refresh_token_expiry_days}
                onChange={e => setConfig(c => ({ ...c, refresh_token_expiry_days: Number(e.target.value) }))}
                className="ui-control w-full" min={1} />
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 shadow-sm">
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save All Changes
        </button>
      </div>
    </div>
  )
}
