'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Fingerprint, Save, RefreshCw, Smartphone, Mail, Key } from 'lucide-react'
import api from '@/lib/api'
import { PageSkeleton } from '@/components/Skeleton'

export default function MFAPage() {
  const params = useParams()
  const slug = params.slug as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    mfa_enabled: false,
    mfa_required: false,
    email_otp_enabled: false,
    phone_otp_enabled: false,
  })

  useEffect(() => { loadConfig() }, [slug])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/status`)
      if (res.data.config) {
        const c = res.data.config
        setConfig({
          mfa_enabled: c.mfa_enabled ?? false,
          mfa_required: c.mfa_required ?? false,
          email_otp_enabled: c.email_otp_enabled ?? false,
          phone_otp_enabled: c.phone_otp_enabled ?? false,
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

  const methods = [
    { icon: Key, label: 'TOTP (Authenticator App)', desc: 'Time-based one-time passwords via apps like Google Authenticator or Authy', always: true },
    { icon: Mail, label: 'Email OTP', desc: 'One-time passwords sent via email', key: 'email_otp_enabled' as const },
    { icon: Smartphone, label: 'Phone OTP (SMS)', desc: 'One-time passwords sent via SMS', key: 'phone_otp_enabled' as const },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-sm font-semibold text-foreground">Multi-Factor Authentication</h1>
        <p className="text-zinc-600 dark:text-white/50 text-sm mt-1">Configure MFA settings and available methods for your users</p>
      </div>

      <section className="mb-8">
      <div className="border border-zinc-300 dark:border-white/10 rounded-md overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Enable Multi-Factor Authentication</p>
              <p className="text-xs text-zinc-600 dark:text-white/40 mt-0.5">Allow users to add a second factor to their account</p>
            </div>
            <button onClick={() => setConfig(c => ({ ...c, mfa_enabled: !c.mfa_enabled }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${config.mfa_enabled ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-white/20'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.mfa_enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div className="border-t border-zinc-300 dark:border-white/10 flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Require MFA for All Users</p>
              <p className="text-xs text-zinc-600 dark:text-white/40 mt-0.5">Users must set up MFA before they can access the application</p>
            </div>
            <button onClick={() => setConfig(c => ({ ...c, mfa_required: !c.mfa_required }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${config.mfa_required ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-white/20'}`}
              disabled={!config.mfa_enabled}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.mfa_required ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-foreground mb-4">MFA Methods</h2>
        <div className="border border-zinc-300 dark:border-white/10 rounded-md overflow-hidden divide-y divide-white/10">
          {methods.map(m => {
            const Icon = m.icon
            const enabled = m.always || (m.key && config[m.key])
            return (
              <div key={m.label} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-zinc-600 dark:text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-zinc-600 dark:text-white/40">{m.desc}</p>
                  </div>
                </div>
                {m.always ? (
                <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">Always Available</span>
                ) : m.key ? (
                  <button onClick={() => setConfig(c => ({ ...c, [m.key!]: !c[m.key!] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${config[m.key] ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-white/20'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config[m.key] ? 'translate-x-5' : ''}`} />
                  </button>
                ) : null}
              </div>
            )
          })}
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
