'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Save, RefreshCw, Eye, EyeOff, CheckCircle, AlertCircle, Smartphone } from 'lucide-react'
import api from '@/lib/api'
import { AppSelect } from '@/components/AppSelect'
import { PageSkeleton } from '@/components/Skeleton'

type SmsProvider = '' | 'twilio' | 'fast2sms' | 'msg91'

interface SmsConfig {
  phone_otp_enabled: boolean
  sms_provider: SmsProvider
  sms_configured: boolean
  twilio_account_sid: string
  twilio_auth_token: string
  twilio_auth_token_set: boolean
  twilio_from_number: string
  twilio_messaging_service_sid: string
  fast2sms_api_key: string
  fast2sms_api_key_set: boolean
  fast2sms_sender_id: string
  fast2sms_route: string
  msg91_auth_key: string
  msg91_auth_key_set: boolean
  msg91_sender_id: string
  msg91_template_id: string
  sms_otp_template: string
}

const EMPTY: SmsConfig = {
  phone_otp_enabled: false,
  sms_provider: '',
  sms_configured: false,
  twilio_account_sid: '',
  twilio_auth_token: '',
  twilio_auth_token_set: false,
  twilio_from_number: '',
  twilio_messaging_service_sid: '',
  fast2sms_api_key: '',
  fast2sms_api_key_set: false,
  fast2sms_sender_id: '',
  fast2sms_route: 'q',
  msg91_auth_key: '',
  msg91_auth_key_set: false,
  msg91_sender_id: '',
  msg91_template_id: '',
  sms_otp_template: '',
}

export default function AuthSmsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showSecrets, setShowSecrets] = useState(false)
  const [config, setConfig] = useState<SmsConfig>(EMPTY)

  useEffect(() => { loadConfig() }, [slug])

  const loadConfig = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/status`)
      const c = res.data?.config || {}
      setConfig({
        phone_otp_enabled: !!c.phone_otp_enabled,
        sms_provider: (c.sms_provider || '') as SmsProvider,
        sms_configured: !!c.sms_configured,
        twilio_account_sid: c.twilio_account_sid || '',
        twilio_auth_token: '',
        twilio_auth_token_set: !!c.twilio_auth_token_set,
        twilio_from_number: c.twilio_from_number || '',
        twilio_messaging_service_sid: c.twilio_messaging_service_sid || '',
        fast2sms_api_key: '',
        fast2sms_api_key_set: !!c.fast2sms_api_key_set,
        fast2sms_sender_id: c.fast2sms_sender_id || '',
        fast2sms_route: c.fast2sms_route || 'q',
        msg91_auth_key: '',
        msg91_auth_key_set: !!c.msg91_auth_key_set,
        msg91_sender_id: c.msg91_sender_id || '',
        msg91_template_id: c.msg91_template_id || '',
        sms_otp_template: c.sms_otp_template || '',
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load SMS config')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const payload: Record<string, any> = {
        phone_otp_enabled: config.phone_otp_enabled,
        sms_provider: config.sms_provider || null,
        twilio_account_sid: config.twilio_account_sid || null,
        twilio_from_number: config.twilio_from_number || null,
        twilio_messaging_service_sid: config.twilio_messaging_service_sid || null,
        fast2sms_sender_id: config.fast2sms_sender_id || null,
        fast2sms_route: config.fast2sms_route || 'q',
        msg91_sender_id: config.msg91_sender_id || null,
        msg91_template_id: config.msg91_template_id || null,
        sms_otp_template: config.sms_otp_template || null,
      }
      if (config.twilio_auth_token.trim()) payload.twilio_auth_token = config.twilio_auth_token.trim()
      if (config.fast2sms_api_key.trim()) payload.fast2sms_api_key = config.fast2sms_api_key.trim()
      if (config.msg91_auth_key.trim()) payload.msg91_auth_key = config.msg91_auth_key.trim()

      await api.patch(`/api/v1/projects/${slug}/auth/config`, payload)
      setSaved(true)
      await loadConfig()
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save SMS config')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSkeleton variant="form" />

  const fieldClass =
    'w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-white/15 bg-white dark:bg-white/5 text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          SMS / Phone OTP
        </h1>
        <p className="text-zinc-600 dark:text-white/50 text-sm mt-1">
          Bring your own SMS provider. Enable Phone on{' '}
          <Link href={`/dashboard/project/${slug}/auth/providers`} className="text-blue-500 hover:underline">
            Providers
          </Link>
          , then add Twilio, Fast2SMS, or MSG91 credentials here.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="mb-8 border border-zinc-300 dark:border-white/10 rounded-md overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-zinc-600 dark:text-white/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Enable Phone OTP</p>
              <p className="text-xs text-zinc-600 dark:text-white/40 mt-0.5">
                Allows `/auth/v1/otp/send` with a phone number once an SMS provider is configured
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfig((c) => ({ ...c, phone_otp_enabled: !c.phone_otp_enabled }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${config.phone_otp_enabled ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-white/20'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.phone_otp_enabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        <div className="border-t border-zinc-300 dark:border-white/10 px-4 py-3 text-xs text-zinc-600 dark:text-white/50">
          Status:{' '}
          {config.sms_configured ? (
            <span className="text-emerald-500 font-medium">SMS provider ready ({config.sms_provider})</span>
          ) : (
            <span className="text-amber-500 font-medium">Provider credentials missing</span>
          )}
        </div>
      </section>

      <section className="mb-8 space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-white/70 mb-2">SMS Provider</label>
          <AppSelect
            value={config.sms_provider}
            onChange={(v) => setConfig((c) => ({ ...c, sms_provider: v as SmsProvider }))}
            aria-label="SMS provider"
            options={[
              { value: '', label: 'Select provider…' },
              { value: 'twilio', label: 'Twilio' },
              { value: 'fast2sms', label: 'Fast2SMS' },
              { value: 'msg91', label: 'MSG91' },
            ]}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowSecrets((s) => !s)}
            className="text-xs text-zinc-500 hover:text-foreground inline-flex items-center gap-1"
          >
            {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showSecrets ? 'Hide secrets' : 'Show secrets'}
          </button>
        </div>

        {config.sms_provider === 'twilio' && (
          <div className="space-y-3 border border-zinc-300 dark:border-white/10 rounded-md p-4">
            <p className="text-xs text-zinc-500">Use Account SID + Auth Token, plus either a From number or Messaging Service SID.</p>
            <input className={fieldClass} placeholder="Account SID" value={config.twilio_account_sid}
              onChange={(e) => setConfig((c) => ({ ...c, twilio_account_sid: e.target.value }))} />
            <input className={fieldClass} type={showSecrets ? 'text' : 'password'}
              placeholder={config.twilio_auth_token_set ? 'Auth Token (saved — enter to replace)' : 'Auth Token'}
              value={config.twilio_auth_token}
              onChange={(e) => setConfig((c) => ({ ...c, twilio_auth_token: e.target.value }))} />
            <input className={fieldClass} placeholder="From number (+1…)" value={config.twilio_from_number}
              onChange={(e) => setConfig((c) => ({ ...c, twilio_from_number: e.target.value }))} />
            <input className={fieldClass} placeholder="Messaging Service SID (optional)" value={config.twilio_messaging_service_sid}
              onChange={(e) => setConfig((c) => ({ ...c, twilio_messaging_service_sid: e.target.value }))} />
          </div>
        )}

        {config.sms_provider === 'fast2sms' && (
          <div className="space-y-3 border border-zinc-300 dark:border-white/10 rounded-md p-4">
            <p className="text-xs text-zinc-500">India-focused. Use route <code className="font-mono">q</code> for quick SMS or <code className="font-mono">dlt</code> with an approved sender.</p>
            <input className={fieldClass} type={showSecrets ? 'text' : 'password'}
              placeholder={config.fast2sms_api_key_set ? 'API key (saved — enter to replace)' : 'API key'}
              value={config.fast2sms_api_key}
              onChange={(e) => setConfig((c) => ({ ...c, fast2sms_api_key: e.target.value }))} />
            <input className={fieldClass} placeholder="Sender ID (optional)" value={config.fast2sms_sender_id}
              onChange={(e) => setConfig((c) => ({ ...c, fast2sms_sender_id: e.target.value }))} />
            <AppSelect
              value={config.fast2sms_route}
              onChange={(v) => setConfig((c) => ({ ...c, fast2sms_route: v }))}
              aria-label="Fast2SMS route"
              options={[
                { value: 'q', label: 'Quick (q)' },
                { value: 'dlt', label: 'DLT (dlt)' },
              ]}
            />
          </div>
        )}

        {config.sms_provider === 'msg91' && (
          <div className="space-y-3 border border-zinc-300 dark:border-white/10 rounded-md p-4">
            <p className="text-xs text-zinc-500">Template must include an OTP variable (we send <code className="font-mono">otp</code> / <code className="font-mono">var</code>).</p>
            <input className={fieldClass} type={showSecrets ? 'text' : 'password'}
              placeholder={config.msg91_auth_key_set ? 'Auth key (saved — enter to replace)' : 'Auth key'}
              value={config.msg91_auth_key}
              onChange={(e) => setConfig((c) => ({ ...c, msg91_auth_key: e.target.value }))} />
            <input className={fieldClass} placeholder="Template ID (required)" value={config.msg91_template_id}
              onChange={(e) => setConfig((c) => ({ ...c, msg91_template_id: e.target.value }))} />
            <input className={fieldClass} placeholder="Sender ID (optional)" value={config.msg91_sender_id}
              onChange={(e) => setConfig((c) => ({ ...c, msg91_sender_id: e.target.value }))} />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-white/70 mb-2">
            SMS message template <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <textarea
            className={`${fieldClass} font-mono min-h-[80px]`}
            placeholder="Your verification code is {{otp}}. Expires in {{minutes}} minutes."
            value={config.sms_otp_template}
            onChange={(e) => setConfig((c) => ({ ...c, sms_otp_template: e.target.value }))}
          />
          <p className="mt-1 text-xs text-zinc-500">Placeholders: <code className="font-mono">{'{{otp}}'}</code>, <code className="font-mono">{'{{code}}'}</code>, <code className="font-mono">{'{{minutes}}'}</code></p>
        </div>
      </section>

      <section className="mb-8 rounded-md border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-foreground mb-2">Client usage</p>
        <pre className="text-xs font-mono text-zinc-600 dark:text-white/60 whitespace-pre-wrap overflow-x-auto">{`POST /auth/v1/otp/send
{ "phone": "+919876543210", "purpose": "login" }

POST /auth/v1/otp/verify
{ "phone": "+919876543210", "otp": "123456", "purpose": "login" }`}</pre>
        <p className="mt-2 text-xs text-zinc-500">
          Email OTP and magic link are unchanged: use <code className="font-mono">email</code> on <code className="font-mono">/otp/*</code> and <code className="font-mono">/magic-link/*</code>.
        </p>
      </section>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-xs text-emerald-500 inline-flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Saved
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}
