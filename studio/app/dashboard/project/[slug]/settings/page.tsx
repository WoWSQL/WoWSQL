'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Copy, Check, Key, Database, Globe, RefreshCw, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import api from '@/lib/api'

export default function SettingsPage() {
  const params = useParams()
  const slug = params.slug as string || 'default'
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [showServiceKey, setShowServiceKey] = useState(false)
  const [showJwtSecret, setShowJwtSecret] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [slug])

  const loadSettings = async () => {
    try {
      const res = await api.get(`/api/v1/projects/${slug}/settings`)
      setSettings(res.data)
    } catch (err) {
      console.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setResetMessage('Password must be at least 8 characters')
      return
    }
    setResetting(true)
    try {
      const res = await api.post(`/api/v1/projects/${slug}/reset-db-password`, { password: newPassword })
      setResetMessage(res.data.message)
      setNewPassword('')
    } catch (err: any) {
      setResetMessage(err.response?.data?.detail || 'Failed to reset password')
    } finally {
      setResetting(false)
    }
  }

  const handleRegenerateKeys = async () => {
    setRegenerating(true)
    try {
      const res = await api.post(`/api/v1/projects/${slug}/regenerate-keys`)
      setSettings((prev: any) => ({
        ...prev,
        api: { ...prev.api, anon_key: res.data.anon_key, service_role_key: res.data.service_role_key }
      }))
      setShowRegenConfirm(false)
    } catch {
    } finally {
      setRegenerating(false)
    }
  }

  const CopyButton = ({ value, label }: { value: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(value, label)}
      className="p-1.5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors"
      title="Copy"
    >
      {copied === label ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
    </button>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050505]">
        <Sidebar projectSlug={slug} projectName="My Database" />
        <main className="lg:pl-20 p-6 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505]">
      <Sidebar projectSlug={slug} projectName="My Database" />
      <main className="lg:pl-20 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Project Settings</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">Connection details and API keys for your self-hosted instance</p>

          {/* API Keys */}
          <section className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">API Keys</h2>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Use these keys in your SDK or API calls. The anon key has restricted access (respects RLS), while the service role key bypasses all security.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Anon Key <span className="text-xs text-zinc-400 font-normal ml-1">(public — safe to expose in client apps)</span>
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-semibold uppercase">role: anon</span>
                </div>
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <code className="flex-1 text-xs text-zinc-800 dark:text-zinc-200 break-all font-mono leading-relaxed">
                    {settings?.api?.anon_key || '—'}
                  </code>
                  {settings?.api?.anon_key && <CopyButton value={settings.api.anon_key} label="anon" />}
                </div>
                <p className="text-xs text-zinc-400 mt-1">This key respects Row Level Security (RLS) policies. Safe to use in browsers and mobile apps.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Service Role Key <span className="text-xs text-red-400 font-normal ml-1">(secret — NEVER expose in client apps)</span>
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold uppercase">role: service_role</span>
                </div>
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-red-500/20 dark:border-red-500/20 rounded-lg p-3">
                  <code className="flex-1 text-xs text-zinc-800 dark:text-zinc-200 break-all font-mono leading-relaxed">
                    {showServiceKey ? (settings?.api?.service_role_key || '—') : '••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <button onClick={() => setShowServiceKey(!showServiceKey)} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors">
                    {showServiceKey ? <EyeOff className="w-4 h-4 text-zinc-400" /> : <Eye className="w-4 h-4 text-zinc-400" />}
                  </button>
                  {settings?.api?.service_role_key && <CopyButton value={settings.api.service_role_key} label="service" />}
                </div>
                <p className="text-xs text-red-400/70 mt-1">This key bypasses ALL Row Level Security. Only use in server-side code, never in browsers.</p>
              </div>

              <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-400">
                  Both keys are auto-generated JWTs signed with your JWT_SECRET. They differ in the <code className="bg-white/10 px-1 rounded">role</code> claim: 
                  the anon key carries <code className="bg-white/10 px-1 rounded">anon</code> and the service role key carries <code className="bg-white/10 px-1 rounded">service_role</code>. 
                  PostgREST uses this role to determine database permissions.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                {!showRegenConfirm ? (
                  <button onClick={() => setShowRegenConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-500 border border-orange-500/30 hover:bg-orange-500/10 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Regenerate API Keys
                  </button>
                ) : (
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Are you sure?</p>
                        <p className="text-xs text-zinc-400 mt-1">Regenerating API keys will invalidate all existing keys. Any clients using the old keys will stop working immediately.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleRegenerateKeys} disabled={regenerating}
                        className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
                        {regenerating ? 'Regenerating...' : 'Yes, Regenerate'}
                      </button>
                      <button onClick={() => setShowRegenConfirm(false)}
                        className="px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-300 border border-zinc-700 rounded-lg">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Connection Info */}
          <section className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">API Connection</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">API URL</label>
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <code className="flex-1 text-sm text-zinc-800 dark:text-zinc-200 font-mono">{settings?.api?.url || 'http://localhost:8080'}</code>
                  <CopyButton value={settings?.api?.url || 'http://localhost:8080'} label="api-url" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">REST Endpoint</label>
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <code className="flex-1 text-sm text-zinc-800 dark:text-zinc-200 font-mono">{(settings?.api?.url || 'http://localhost:8080') + '/rest/v1/'}</code>
                  <CopyButton value={(settings?.api?.url || 'http://localhost:8080') + '/rest/v1/'} label="rest-url" />
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Quick Start</p>
              <pre className="text-xs text-zinc-600 dark:text-zinc-400 overflow-x-auto whitespace-pre-wrap font-mono">{`curl '${settings?.api?.url || 'http://localhost:8080'}/rest/v1/your_table' \\
  -H "apikey: ${settings?.api?.anon_key ? settings.api.anon_key.slice(0, 20) + '...' : 'YOUR_ANON_KEY'}" \\
  -H "Authorization: Bearer ${settings?.api?.anon_key ? settings.api.anon_key.slice(0, 20) + '...' : 'YOUR_ANON_KEY'}"`}</pre>
            </div>
          </section>

          {/* Database Connection */}
          <section className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Database Connection</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Host</label>
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <code className="text-sm text-zinc-800 dark:text-zinc-200 font-mono">{settings?.database?.host || 'localhost'}</code>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Port</label>
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <code className="text-sm text-zinc-800 dark:text-zinc-200 font-mono">{settings?.database?.port || '5432'}</code>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Database</label>
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <code className="text-sm text-zinc-800 dark:text-zinc-200 font-mono">{settings?.database?.name || 'postgres'}</code>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">User</label>
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <code className="text-sm text-zinc-800 dark:text-zinc-200 font-mono">{settings?.database?.user || 'postgres'}</code>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Connection String</label>
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                <code className="flex-1 text-sm text-zinc-800 dark:text-zinc-200 break-all font-mono">{settings?.database?.connection_string || '—'}</code>
                {settings?.database?.connection_string && <CopyButton value={settings.database.connection_string} label="conn-str" />}
              </div>
            </div>
          </section>

          {/* Reset Password */}
          <section className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Reset Database Password</h2>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Change the PostgreSQL superuser password. You will need to update your .env file and restart containers after this change.
            </p>

            <div className="flex gap-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
                className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
              <button
                onClick={handleResetPassword}
                disabled={resetting || !newPassword}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {resetting ? 'Resetting...' : 'Reset'}
              </button>
            </div>
            {resetMessage && (
              <p className={`mt-3 text-sm ${resetMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                {resetMessage}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
