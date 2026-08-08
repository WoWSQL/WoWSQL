'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Webhook, Save, RefreshCw, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { PageSkeleton } from '@/components/Skeleton'

const EVENT_OPTIONS = [
  { value: 'user.signup', label: 'User Signup' },
  { value: 'user.login', label: 'User Login' },
  { value: 'user.logout', label: 'User Logout' },
  { value: 'user.deleted', label: 'User Deleted' },
  { value: 'user.banned', label: 'User Banned' },
  { value: 'user.unbanned', label: 'User Unbanned' },
  { value: 'password.reset', label: 'Password Reset' },
  { value: 'email.verified', label: 'Email Verified' },
  { value: 'mfa.enabled', label: 'MFA Enabled' },
  { value: 'session.created', label: 'Session Created' },
  { value: 'session.revoked', label: 'Session Revoked' },
]

export default function HooksPage() {
  const params = useParams()
  const slug = params.slug as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<string[]>([])
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { loadConfig() }, [slug])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/status`)
      if (res.data.config) {
        const c = res.data.config
        setWebhookUrl(c.webhook_url || '')
        setWebhookSecret(c.webhook_secret || '')
        try {
          const events = typeof c.webhook_events === 'string' ? JSON.parse(c.webhook_events) : c.webhook_events
          setWebhookEvents(Array.isArray(events) ? events : [])
        } catch { setWebhookEvents([]) }
      }
    } catch { }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/api/v1/projects/${slug}/auth/config`, {
        webhook_url: webhookUrl.trim() || null,
        webhook_secret: webhookSecret || null,
        webhook_events: JSON.stringify(webhookEvents)
      })
      await loadConfig()
    } catch (err: any) { alert(err.response?.data?.detail || 'Failed to save.') }
    finally { setSaving(false) }
  }

  const toggleEvent = (event: string) => {
    setWebhookEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event])
  }

  const generateSecret = () => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    setWebhookSecret(Array.from(array).map(b => b.toString(16).padStart(2, '0')).join(''))
  }

  if (loading) return <PageSkeleton variant="form" />

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-foreground">Auth Hooks</h1>
          <span className="text-[9px] font-bold bg-blue-500/20 text-blue-400 dark:text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-full">BETA</span>
        </div>
        <p className="text-zinc-600 dark:text-white/50 text-sm mt-1">Configure webhooks to receive notifications about auth events</p>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-foreground mb-4">Webhook Configuration</h2>
        <div className="border border-zinc-300 dark:border-white/10 rounded-md p-5 space-y-4">
          <div>
            <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block">Webhook URL</label>
            <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-foreground text-sm focus:outline-none focus:border-zinc-300 dark:border-white/10"
              placeholder="https://your-server.com/webhooks/auth" />
          </div>
          <div>
            <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block">Webhook Secret</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input type={showSecret ? 'text' : 'password'} value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-foreground text-sm focus:outline-none focus:border-zinc-300 dark:border-white/10 pr-10"
                  placeholder="Used to verify webhook payloads" />
                <button onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-white/30 hover:text-zinc-500 dark:text-white/60">
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button onClick={generateSecret} className="px-3 py-2.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all">
                Generate
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-foreground mb-4">Events</h2>
        <div className="border border-zinc-300 dark:border-white/10 rounded-md overflow-hidden divide-y divide-white/10">
          {EVENT_OPTIONS.map(ev => (
            <div key={ev.value} className="flex items-center justify-between p-4 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => toggleEvent(ev.value)}>
              <span className="text-sm text-zinc-600 dark:text-white/80">{ev.label}</span>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
              ${webhookEvents.includes(ev.value) ? 'bg-blue-600 border-blue-500' : 'border-zinc-300 dark:border-white/20 bg-zinc-100 dark:bg-white/5'}`}>
                {webhookEvents.includes(ev.value) && <CheckCircle className="w-3 h-3 text-foreground" />}
              </div>
            </div>
          ))}
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
