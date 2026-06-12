'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Link2, Save, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

export default function UrlConfigPage() {
  const params = useParams()
  const slug = params.slug as string
  const [siteUrl, setSiteUrl] = useState('http://localhost:8080')
  const [redirectUrls, setRedirectUrls] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    api.get(`/api/v1/projects/${slug}/auth/config`).then(res => {
      setSiteUrl(res.data.site_url || 'http://localhost:8080')
      setRedirectUrls(res.data.redirect_urls || '')
    }).catch(() => {})
  }, [slug])

  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/api/v1/projects/${slug}/auth/config`, { site_url: siteUrl, redirect_urls: redirectUrls })
      showToast('URL configuration saved', true)
    } catch {
      showToast('Failed to save', false)
    }
    setSaving(false)
  }

  const inp = "px-3 py-2.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"

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
            <Link2 className="w-6 h-6 text-purple-400" />
            URL Configuration
          </h1>
          <p className="text-zinc-600 dark:text-white/40 text-sm mt-1">Configure redirect URLs and site settings</p>
        </div>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      <div className="space-y-6">
        <section className="border border-zinc-200 dark:border-white/10 rounded-xl p-6 bg-white dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Site URL</h2>
          <input type="text" value={siteUrl} onChange={e => setSiteUrl(e.target.value)}
            className={'w-full ' + inp} placeholder="https://yourdomain.com" />
          <p className="text-xs text-zinc-600 dark:text-white/30 mt-2">
            The base URL of your site. Used in email templates for verification links and password resets.
          </p>
        </section>

        <section className="border border-zinc-200 dark:border-white/10 rounded-xl p-6 bg-white dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Redirect URLs</h2>
          <textarea value={redirectUrls} onChange={e => setRedirectUrls(e.target.value)}
            className={'w-full h-32 ' + inp} placeholder="http://localhost:3000&#10;https://yourdomain.com/callback" />
          <p className="text-xs text-zinc-600 dark:text-white/30 mt-2">
            Allowed redirect URLs after authentication (one per line). Used for OAuth callbacks and magic links.
          </p>
        </section>
      </div>
    </div>
  )
}
