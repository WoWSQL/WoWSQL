'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { KeyRound, CheckCircle, XCircle, Mail, Globe, Chrome, Github } from 'lucide-react'
import api from '@/lib/api'

interface ProviderConfig {
  email_enabled: boolean
  anonymous_enabled: boolean
  google_enabled: boolean
  google_client_id: string
  google_client_secret: string
  github_enabled: boolean
  github_client_id: string
  github_client_secret: string
}

export default function ProvidersPage() {
  const params = useParams()
  const slug = params.slug as string
  const [config, setConfig] = useState<ProviderConfig>({
    email_enabled: true,
    anonymous_enabled: false,
    google_enabled: false,
    google_client_id: '',
    google_client_secret: '',
    github_enabled: false,
    github_client_id: '',
    github_client_secret: '',
  })
  const [loading, setLoading] = useState(true)
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/v1/projects/${slug}/auth/providers`)
        setConfig(c => ({ ...c, ...res.data }))
      } catch {}
      setLoading(false)
    }
    load()
  }, [slug])

  const saveProvider = async (provider: string) => {
    setSaving(true)
    try {
      await api.put(`/api/v1/projects/${slug}/auth/providers`, config)
      showToast(`${provider} settings saved`, true)
    } catch {
      showToast('Failed to save', false)
    }
    setSaving(false)
  }

  const providers = [
    { key: 'email', label: 'Email / Password', icon: Mail, desc: 'Users sign in with email and password', enabled: config.email_enabled, hasConfig: false },
    { key: 'anonymous', label: 'Anonymous', icon: Globe, desc: 'Allow anonymous sign-ins (temporary users)', enabled: config.anonymous_enabled, hasConfig: false },
    { key: 'google', label: 'Google', icon: Chrome, desc: 'Sign in with Google OAuth 2.0', enabled: config.google_enabled, hasConfig: true },
    { key: 'github', label: 'GitHub', icon: Github, desc: 'Sign in with GitHub OAuth', enabled: config.github_enabled, hasConfig: true },
  ]

  const inp = "px-3 py-2.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"

  if (loading) return <div className="p-8 text-zinc-600 dark:text-white/50 text-sm">Loading...</div>

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg
          ${toast.ok ? 'bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-purple-400" />
          Auth Providers
        </h1>
        <p className="text-zinc-600 dark:text-white/40 text-sm mt-1">Configure which authentication methods are available to your users</p>
      </div>

      <div className="space-y-3">
        {providers.map(p => {
          const Icon = p.icon
          const isExpanded = expandedProvider === p.key
          return (
            <div key={p.key} className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden">
              <div className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition">
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => p.hasConfig && setExpandedProvider(isExpanded ? null : p.key)}>
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5">
                    <Icon className="w-5 h-5 text-zinc-600 dark:text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{p.label}</p>
                    <p className="text-xs text-zinc-600 dark:text-white/40">{p.desc}</p>
                  </div>
                </div>
                <button onClick={() => { setConfig(c => ({ ...c, [`${p.key}_enabled`]: !p.enabled })); saveProvider(p.key) }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${p.enabled ? 'bg-purple-500' : 'bg-zinc-300 dark:bg-white/20'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${p.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {p.hasConfig && isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-zinc-200 dark:border-white/5 space-y-3">
                  <div>
                    <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block font-medium">Client ID</label>
                    <input type="text" value={(config as any)[`${p.key}_client_id`] || ''} 
                      onChange={e => setConfig(c => ({ ...c, [`${p.key}_client_id`]: e.target.value }))}
                      className={'w-full ' + inp} placeholder={`${p.label} Client ID`} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block font-medium">Client Secret</label>
                    <input type="password" value={(config as any)[`${p.key}_client_secret`] || ''} 
                      onChange={e => setConfig(c => ({ ...c, [`${p.key}_client_secret`]: e.target.value }))}
                      className={'w-full ' + inp} placeholder={`${p.label} Client Secret`} />
                  </div>
                  <div className="pt-2">
                    <button onClick={() => saveProvider(p.key)} disabled={saving}
                      className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white rounded-lg disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-white/30">
                    {p.key === 'google' && 'Get credentials from Google Cloud Console → APIs & Services → Credentials'}
                    {p.key === 'github' && 'Get credentials from GitHub → Settings → Developer Settings → OAuth Apps'}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
