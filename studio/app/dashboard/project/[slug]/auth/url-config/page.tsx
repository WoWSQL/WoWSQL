'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Link2, Save, RefreshCw, Copy, CheckCircle, ExternalLink } from 'lucide-react'
import api from '@/lib/api'
import { API_URL } from '@/lib/constants'
import { PageSkeleton } from '@/components/Skeleton'

export default function URLConfigPage() {
  const params = useParams()
  const slug = params.slug as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [frontendUrl, setFrontendUrl] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const apiDomain = useMemo(() => {
    return API_URL.replace('https://', '').replace('http://', '').replace('apis.', '').replace(':8000', '').split('/')[0]
  }, [])

  const authBaseUrl = `https://${slug}.${apiDomain}/api/auth`

  useEffect(() => { loadConfig() }, [slug])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/status`)
      if (res.data.config) {
        setFrontendUrl(res.data.config.frontend_url || '')
      }
    } catch { }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/api/v1/projects/${slug}/auth/config`, { frontend_url: frontendUrl.trim() || null })
      await loadConfig()
    } catch (err: any) { alert(err.response?.data?.detail || 'Failed to save.') }
    finally { setSaving(false) }
  }

  const copyToClipboard = (val: string, label: string) => {
    navigator.clipboard.writeText(val)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <PageSkeleton variant="form" />

  const endpoints = [
    { label: 'Sign Up', path: '/signup' },
    { label: 'Sign In', path: '/login' },
    { label: 'Reset Password', path: '/reset-password' },
    { label: 'Get User', path: '/me' },
    { label: 'Refresh Token', path: '/refresh' },
    { label: 'Sign Out', path: '/logout' },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-sm font-semibold text-foreground">URL Configuration</h1>
        <p className="text-zinc-600 dark:text-white/50 text-sm mt-1">Configure redirect URLs and view your auth API endpoints</p>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-foreground mb-4">Frontend URL</h2>
        <div className="border border-zinc-300 dark:border-white/10 rounded-md p-5 space-y-4">
          <p className="text-sm text-zinc-600 dark:text-white/60">
            Configure where users are redirected after email verification, magic links, and password resets.
            Leave empty to show a success page instead of redirecting.
          </p>
          <div>
            <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block">Frontend URL (Optional)</label>
            <input type="url" value={frontendUrl} onChange={e => setFrontendUrl(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-foreground text-sm focus:outline-none focus:border-zinc-300 dark:border-white/10"
              placeholder="https://your-app.com" />
            {frontendUrl && (
              <p className="text-xs text-zinc-600 dark:text-white/40 mt-1.5">
                Users will be redirected to <span className="text-zinc-600 dark:text-white/70">{frontendUrl}/auth/verified</span> after email verification
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-foreground mb-4">Auth API Endpoints</h2>
        <div className="border border-zinc-300 dark:border-white/10 rounded-md overflow-hidden divide-y divide-white/10">
          {endpoints.map(ep => {
            const url = `${authBaseUrl}${ep.path}`
            return (
              <div key={ep.path} className="flex items-center justify-between p-4 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{ep.label}</p>
                  <p className="text-xs text-zinc-600 dark:text-white/40 font-mono mt-0.5">{url}</p>
                </div>
                <button onClick={() => copyToClipboard(url, ep.path)}
                  className="p-2 rounded-md text-zinc-600 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                  {copied === ep.path ? <CheckCircle className="w-4 h-4 text-blue-500 dark:text-blue-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-zinc-600 dark:text-white/40 mt-3">
          Client apps should call these endpoints via the project subdomain <span className="text-zinc-600 dark:text-white/60 font-semibold">{slug}.{apiDomain}</span>
        </p>
      </section>
    </div>
  )
}
