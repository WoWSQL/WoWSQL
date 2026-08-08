'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Mail, Save, RefreshCw, Eye, EyeOff, Send, CheckCircle, AlertCircle, Shield, ChevronDown, ChevronUp, Pencil, RotateCcw, Zap } from 'lucide-react'
import api from '@/lib/api'
import { AppSelect } from '@/components/AppSelect'
import { PageSkeleton } from '@/components/Skeleton'

const EMAIL_TEMPLATES = [
  {
    id: 'verification',
    label: 'Email Verification',
    desc: 'Sent when a user signs up to verify their email',
    defaultSubject: 'Verify Your Email - {{brand}}',
    vars: ['{{link}}', '{{user_name}}', '{{brand}}'],
    defaultBody: `<p>Hi {{user_name}},</p>
<p>Please verify your email address by clicking the link below:</p>
<p><a href="{{link}}">Verify Email Address</a></p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't create this account, please ignore this email.</p>`,
  },
  {
    id: 'password_reset',
    label: 'Password Reset',
    desc: 'Sent when a user requests a password reset',
    defaultSubject: 'Reset Your Password - {{brand}}',
    vars: ['{{link}}', '{{user_name}}', '{{brand}}'],
    defaultBody: `<p>Hi {{user_name}},</p>
<p>Someone requested a password reset for your {{brand}} account.</p>
<p><a href="{{link}}">Reset Password</a></p>
<p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  },
  {
    id: 'magic_link',
    label: 'Magic Link',
    desc: 'Sent for passwordless authentication',
    defaultSubject: 'Sign in to {{brand}}',
    vars: ['{{link}}', '{{user_name}}', '{{brand}}'],
    defaultBody: `<p>Hi {{user_name}},</p>
<p>Click the link below to sign in to your account:</p>
<p><a href="{{link}}">Sign In</a></p>
<p>This link expires in 1 hour and can only be used once.</p>`,
  },
  {
    id: 'invite',
    label: 'User Invitation',
    desc: 'Sent when an admin invites a new user',
    defaultSubject: "You've been invited to {{brand}}",
    vars: ['{{link}}', '{{user_name}}', '{{brand}}'],
    defaultBody: `<p>Hi {{user_name}},</p>
<p>You have been invited to join <strong>{{brand}}</strong>.</p>
<p><a href="{{link}}">Accept Invitation</a></p>
<p>If you weren't expecting this invitation, you can ignore this email.</p>`,
  },
  {
    id: 'otp',
    label: 'OTP Code',
    desc: 'Sent for one-time password login',
    defaultSubject: 'Your verification code - {{brand}}',
    vars: ['{{code}}', '{{brand}}'],
    defaultBody: `<p>Your verification code for <strong>{{brand}}</strong>:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px;font-family:monospace;">{{code}}</p>
<p>This code expires in 10 minutes. Do not share it with anyone.</p>`,
  },
]

interface TemplateOverride {
  subject: string
  body_html: string
  enabled: boolean
}

interface EmailConfig {
  email_provider: string
  email_from_address: string
  email_from_name: string
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_pass: string
  smtp_secure: string
  smtp_pass_set: boolean
  sendgrid_api_key: string
  sendgrid_api_key_set: boolean
  mailgun_api_key: string
  mailgun_api_key_set: boolean
  mailgun_domain: string
  ses_access_key: string
  ses_access_key_set: boolean
  ses_secret_key: string
  ses_region: string
  email_redirect_url: string
  email_templates: Record<string, TemplateOverride>
  platform_email_count: number
  platform_email_monthly_limit: number
  platform_email_quota_reset_at: string | null
}

const defaultConfig: EmailConfig = {
  email_provider: 'smtp',
  email_from_address: '',
  email_from_name: 'WOWSQL Auth',
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_pass: '',
  smtp_secure: 'tls',
  smtp_pass_set: false,
  sendgrid_api_key: '',
  sendgrid_api_key_set: false,
  mailgun_api_key: '',
  mailgun_api_key_set: false,
  mailgun_domain: '',
  ses_access_key: '',
  ses_access_key_set: false,
  ses_secret_key: '',
  ses_region: 'us-east-1',
  email_redirect_url: '',
  email_templates: {},
  platform_email_count: 0,
  platform_email_monthly_limit: 100,
  platform_email_quota_reset_at: null,
}

export default function EmailsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [config, setConfig] = useState<EmailConfig>(defaultConfig)
  const [showPass, setShowPass] = useState<Record<string, boolean>>({})
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateResult, setTemplateResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null)

  useEffect(() => { loadConfig() }, [slug])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/status`)
      if (res.data.config) {
        const c = res.data.config
        const rawTemplates = c.email_templates || {}
        const parsedTemplates: Record<string, TemplateOverride> = {}
        for (const t of EMAIL_TEMPLATES) {
          if (rawTemplates[t.id]) {
            parsedTemplates[t.id] = {
              subject: rawTemplates[t.id].subject || t.defaultSubject,
              body_html: rawTemplates[t.id].body_html || t.defaultBody,
              enabled: rawTemplates[t.id].enabled !== false,
            }
          }
        }
        setConfig({
          email_provider: c.email_provider || 'smtp',
          email_from_address: c.email_from_address || '',
          email_from_name: c.email_from_name || 'WOWSQL Auth',
          smtp_host: c.smtp_host || '',
          smtp_port: c.smtp_port || 587,
          smtp_user: c.smtp_user || '',
          smtp_pass: '',
          smtp_secure: c.smtp_secure || 'tls',
          smtp_pass_set: c.smtp_pass_set || false,
          sendgrid_api_key: '',
          sendgrid_api_key_set: c.sendgrid_api_key_set || false,
          mailgun_api_key: '',
          mailgun_api_key_set: c.mailgun_api_key_set || false,
          mailgun_domain: c.mailgun_domain || '',
          ses_access_key: '',
          ses_access_key_set: c.ses_access_key_set || false,
          ses_secret_key: '',
          ses_region: c.ses_region || 'us-east-1',
          email_redirect_url: c.email_redirect_url || '',
          email_templates: parsedTemplates,
          platform_email_count: c.platform_email_count ?? 0,
          platform_email_monthly_limit: c.platform_email_monthly_limit ?? 100,
          platform_email_quota_reset_at: c.platform_email_quota_reset_at || null,
        })
      }
    } catch { }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    setTestResult(null)
    try {
      const payload: Record<string, any> = {
        email_provider: config.email_provider,
        email_from_address: config.email_from_address,
        email_from_name: config.email_from_name,
        email_redirect_url: config.email_redirect_url,
      }

      if (config.email_provider === 'smtp') {
        payload.smtp_host = config.smtp_host
        payload.smtp_port = config.smtp_port
        payload.smtp_user = config.smtp_user
        payload.smtp_secure = config.smtp_secure
        if (config.smtp_pass) payload.smtp_pass = config.smtp_pass
      } else if (config.email_provider === 'sendgrid') {
        if (config.sendgrid_api_key) payload.sendgrid_api_key = config.sendgrid_api_key
      } else if (config.email_provider === 'mailgun') {
        if (config.mailgun_api_key) payload.mailgun_api_key = config.mailgun_api_key
        payload.mailgun_domain = config.mailgun_domain
      } else if (config.email_provider === 'ses') {
        if (config.ses_access_key) payload.ses_access_key = config.ses_access_key
        if (config.ses_secret_key) payload.ses_secret_key = config.ses_secret_key
        payload.ses_region = config.ses_region
      }

      await api.patch(`/api/v1/projects/${slug}/auth/config`, payload)
      await loadConfig()
      setTestResult({ ok: true, msg: 'Settings saved successfully' })
    } catch (err: any) {
      setTestResult({ ok: false, msg: err.response?.data?.detail || 'Failed to save.' })
    } finally { setSaving(false) }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const payload: Record<string, any> = {
        email_provider: config.email_provider,
        email_from_address: config.email_from_address,
        email_from_name: config.email_from_name,
      }
      if (config.email_provider === 'smtp') {
        payload.smtp_host = config.smtp_host
        payload.smtp_port = config.smtp_port
        payload.smtp_user = config.smtp_user
        payload.smtp_pass = config.smtp_pass
        payload.smtp_secure = config.smtp_secure
      } else if (config.email_provider === 'sendgrid') {
        payload.sendgrid_api_key = config.sendgrid_api_key
      }

      const res = await api.post(`/api/v1/projects/${slug}/auth/test-smtp`, payload)
      setTestResult({ ok: true, msg: res.data.message || 'Test email sent!' })
    } catch (err: any) {
      setTestResult({ ok: false, msg: err.response?.data?.detail || 'Test failed' })
    } finally { setTesting(false) }
  }

  const toggleShow = (field: string) => setShowPass(p => ({ ...p, [field]: !p[field] }))

  const getTemplateOverride = (id: string): TemplateOverride => {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === id)!
    return config.email_templates[id] ?? {
      subject: tpl.defaultSubject,
      body_html: tpl.defaultBody,
      enabled: false,
    }
  }

  const handleSaveTemplate = async (id: string) => {
    setSavingTemplate(true)
    setTemplateResult(null)
    try {
      const override = getTemplateOverride(id)
      const updated = { ...config.email_templates, [id]: override }
      await api.patch(`/api/v1/projects/${slug}/auth/config`, { email_templates: updated })
      setConfig(c => ({ ...c, email_templates: updated }))
      setEditingTemplate(null)
      setTemplateResult({ id, ok: true, msg: 'Template saved!' })
    } catch (err: any) {
      setTemplateResult({ id, ok: false, msg: err.response?.data?.detail || 'Failed to save template.' })
    } finally { setSavingTemplate(false) }
  }

  const handleResetTemplate = async (id: string) => {
    const updated = { ...config.email_templates }
    delete updated[id]
    try {
      await api.patch(`/api/v1/projects/${slug}/auth/config`, { email_templates: updated })
      setConfig(c => ({ ...c, email_templates: updated }))
      setEditingTemplate(null)
      setTemplateResult({ id, ok: true, msg: 'Reset to default.' })
    } catch (err: any) {
      setTemplateResult({ id, ok: false, msg: err.response?.data?.detail || 'Reset failed.' })
    }
  }

  const updateOverrideField = (id: string, field: keyof TemplateOverride, value: string | boolean) => {
    setConfig(c => ({
      ...c,
      email_templates: {
        ...c.email_templates,
        [id]: { ...getTemplateOverride(id), [field]: value },
      },
    }))
  }

  const inp = 'ui-control w-full'

  if (loading) return <PageSkeleton variant="form" />

  return (
    <div className="ui-page p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="ui-page-title">Email Configuration</h1>
        <p className="ui-page-desc mt-1">Configure how your project sends emails to end-users (verification, password reset, OTP, etc.)</p>
      </div>

      {/* Provider Selection */}
      <section className="mb-6">
        <h2 className="ui-section-title mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400 shrink-0" />
          Email Provider
        </h2>
        <div className="ui-panel p-4 space-y-4">
          <div>
            <label className="ui-label mb-1.5 block">Provider</label>
            <AppSelect
              value={config.email_provider}
              onChange={(v) => setConfig((c) => ({ ...c, email_provider: v }))}
              searchable={false}
              options={[
                { value: 'smtp', label: 'SMTP (Custom server)' },
                { value: 'sendgrid', label: 'SendGrid' },
                { value: 'mailgun', label: 'Mailgun' },
                { value: 'ses', label: 'Amazon SES' },
              ]}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="ui-label mb-1.5 block">From Address</label>
              <input type="email" value={config.email_from_address} onChange={e => setConfig(c => ({ ...c, email_from_address: e.target.value }))}
                className={inp} placeholder="noreply@your-domain.com" />
            </div>
            <div>
              <label className="ui-label mb-1.5 block">From Name</label>
              <input type="text" value={config.email_from_name} onChange={e => setConfig(c => ({ ...c, email_from_name: e.target.value }))}
                className={inp} placeholder="Your App Name" />
            </div>
          </div>

          <div>
            <label className="ui-label mb-1.5 block">Redirect URL (after email actions)</label>
            <input type="url" value={config.email_redirect_url} onChange={e => setConfig(c => ({ ...c, email_redirect_url: e.target.value }))}
              className={inp} placeholder="https://your-app.com/auth/callback" />
          </div>
        </div>
      </section>

      {/* SMTP Credentials */}
      {config.email_provider === 'smtp' && (
        <section className="mb-6">
          <h2 className="ui-section-title mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400 shrink-0" />
            SMTP Credentials
          </h2>
          <div className="ui-panel p-4 space-y-3">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="ui-label mb-1.5 block">SMTP Host</label>
                <input type="text" value={config.smtp_host} onChange={e => setConfig(c => ({ ...c, smtp_host: e.target.value }))}
                  className={inp} placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="ui-label mb-1.5 block">Port</label>
                <input type="number" value={config.smtp_port} onChange={e => setConfig(c => ({ ...c, smtp_port: parseInt(e.target.value) || 587 }))}
                  className={inp} placeholder="587" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="ui-label mb-1.5 block">Username</label>
                <input type="text" value={config.smtp_user} onChange={e => setConfig(c => ({ ...c, smtp_user: e.target.value }))}
                  className={inp} placeholder="your-email@gmail.com" />
              </div>
              <div>
                <label className="ui-label mb-1.5 block">
                Password {config.smtp_pass_set && !config.smtp_pass && <span className="text-blue-400 text-[10px] ml-1">(saved)</span>}
                </label>
                <div className="relative">
                  <input type={showPass.smtp ? 'text' : 'password'} value={config.smtp_pass}
                    onChange={e => setConfig(c => ({ ...c, smtp_pass: e.target.value }))}
                    className={inp + ' pr-10'} placeholder={config.smtp_pass_set ? '••••••••' : 'Enter password'} />
                  <button onClick={() => toggleShow('smtp')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white">
                    {showPass.smtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="ui-label mb-1.5 block">Security</label>
              <AppSelect
                value={config.smtp_secure}
                onChange={(v) => setConfig((c) => ({ ...c, smtp_secure: v }))}
                searchable={false}
                options={[
                  { value: 'ssl', label: 'TLS (port 465)' },
                  { value: 'tls', label: 'STARTTLS (port 587)' },
                  { value: 'none', label: 'None (port 25)' },
                ]}
              />
            </div>
          </div>
        </section>
      )}

      {/* SendGrid */}
      {config.email_provider === 'sendgrid' && (
        <section className="mb-6">
          <h2 className="ui-section-title mb-3">SendGrid Credentials</h2>
          <div className="ui-panel p-4 space-y-3">
            <div>
              <label className="ui-label mb-1.5 block">
              API Key {config.sendgrid_api_key_set && !config.sendgrid_api_key && <span className="text-blue-400 text-[10px] ml-1">(saved)</span>}
              </label>
              <div className="relative">
                <input type={showPass.sendgrid ? 'text' : 'password'} value={config.sendgrid_api_key}
                  onChange={e => setConfig(c => ({ ...c, sendgrid_api_key: e.target.value }))}
                  className={inp + ' pr-10'} placeholder={config.sendgrid_api_key_set ? '••••••••' : 'SG.xxxxxxxx'} />
                <button onClick={() => toggleShow('sendgrid')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white">
                  {showPass.sendgrid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Mailgun */}
      {config.email_provider === 'mailgun' && (
        <section className="mb-6">
          <h2 className="ui-section-title mb-3">Mailgun Credentials</h2>
          <div className="ui-panel p-4 space-y-3">
            <div>
              <label className="ui-label mb-1.5 block">
              API Key {config.mailgun_api_key_set && !config.mailgun_api_key && <span className="text-blue-400 text-[10px] ml-1">(saved)</span>}
              </label>
              <div className="relative">
                <input type={showPass.mailgun ? 'text' : 'password'} value={config.mailgun_api_key}
                  onChange={e => setConfig(c => ({ ...c, mailgun_api_key: e.target.value }))}
                  className={inp + ' pr-10'} placeholder={config.mailgun_api_key_set ? '••••••••' : 'key-xxxxxxxx'} />
                <button onClick={() => toggleShow('mailgun')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white">
                  {showPass.mailgun ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="ui-label mb-1.5 block">Domain</label>
              <input type="text" value={config.mailgun_domain} onChange={e => setConfig(c => ({ ...c, mailgun_domain: e.target.value }))}
                className={inp} placeholder="mg.your-domain.com" />
            </div>
          </div>
        </section>
      )}

      {/* Amazon SES */}
      {config.email_provider === 'ses' && (
        <section className="mb-6">
          <h2 className="ui-section-title mb-3">Amazon SES Credentials</h2>
          <div className="ui-panel p-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="ui-label mb-1.5 block">
                Access Key {config.ses_access_key_set && !config.ses_access_key && <span className="text-blue-500 dark:text-blue-400 text-[10px] ml-1">(saved)</span>}
                </label>
                <input type="text" value={config.ses_access_key} onChange={e => setConfig(c => ({ ...c, ses_access_key: e.target.value }))}
                  className={inp} placeholder={config.ses_access_key_set ? '••••••••' : 'AKIA...'} />
              </div>
              <div>
                <label className="ui-label mb-1.5 block">Secret Key</label>
                <div className="relative">
                  <input type={showPass.ses ? 'text' : 'password'} value={config.ses_secret_key}
                    onChange={e => setConfig(c => ({ ...c, ses_secret_key: e.target.value }))}
                    className={inp + ' pr-10'} placeholder="Enter secret key" />
                  <button onClick={() => toggleShow('ses')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white">
                    {showPass.ses ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="ui-label mb-1.5 block">Region</label>
              <AppSelect
                value={config.ses_region}
                onChange={(v) => setConfig((c) => ({ ...c, ses_region: v }))}
                searchable={false}
                options={[
                  { value: 'us-east-1', label: 'US East (N. Virginia)' },
                  { value: 'us-west-2', label: 'US West (Oregon)' },
                  { value: 'eu-west-1', label: 'EU West (Ireland)' },
                  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
                  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
                ]}
              />
            </div>
          </div>
        </section>
      )}

      {/* Save + Test */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button onClick={handleSave} disabled={saving}
          className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 shadow-sm">
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Settings
        </button>
        <button onClick={handleTest} disabled={testing}
          className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium border border-border rounded-md bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50">
          {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send Test Email
        </button>
        {testResult && (
          <div className={`flex items-center gap-1.5 text-xs ${testResult.ok ? 'text-blue-500 dark:text-blue-400' : 'text-red-400'}`}>
            {testResult.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {testResult.msg}
          </div>
        )}
      </div>

      {/* Email Templates */}
      <section>
        <h2 className="ui-section-title mb-1">Email Templates</h2>

        {/* Platform email quota banner — only shown when no custom provider is set */}
        {(() => {
          const hasCustomProvider = (
            (config.email_provider === 'smtp' && config.smtp_pass_set) ||
            (config.email_provider === 'sendgrid' && config.sendgrid_api_key_set) ||
            (config.email_provider === 'mailgun' && config.mailgun_api_key_set) ||
            (config.email_provider === 'ses' && config.ses_access_key_set)
          )
          if (hasCustomProvider) return null
          const used = config.platform_email_count
          const limit = config.platform_email_monthly_limit
          const pct = Math.min(Math.round((used / limit) * 100), 100)
          const isNearLimit = pct >= 80
          const isAtLimit = used >= limit
          const resetDate = config.platform_email_quota_reset_at
            ? new Date(config.platform_email_quota_reset_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : null
          return (
            <div className={`mb-4 rounded-md border p-4 ${isAtLimit
              ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
              : isNearLimit
                ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                : 'bg-zinc-50 dark:bg-white/5 border-zinc-300 dark:border-white/10'
            }`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 shrink-0 ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-zinc-500 dark:text-white/50'}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      WowSQL Default Email Usage
                    </p>
                    <p className="ui-muted mt-0.5">
                      {isAtLimit
                        ? 'Monthly limit reached. Configure a custom email provider to continue sending.'
                        : `${used} / ${limit} emails used this month${resetDate ? ` · Resets ${resetDate}` : ''}`
                      }
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${isAtLimit
                  ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                  : isNearLimit
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-white/60'
                }`}>
                  {pct}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-white/10 rounded-full h-1.5">
                <div
                className={`h-1.5 rounded-full transition-all ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {!isAtLimit && (
                <p className="text-[11px] text-zinc-500 dark:text-white/30 mt-2">
                  Configure a custom SMTP / SendGrid / Mailgun / SES provider above to send unlimited emails.
                </p>
              )}
            </div>
          )
        })()}
        <p className="ui-muted mb-3">
          Customize the emails sent to your users. Use <code className="bg-muted px-1 py-0.5 rounded-md text-[11px]">{'{{variable}}'}</code> placeholders to insert dynamic content. When disabled, WoWSQL default templates are used.
        </p>
        <div className="ui-panel overflow-hidden divide-y divide-border">
          {EMAIL_TEMPLATES.map(t => {
            const override = getTemplateOverride(t.id)
            const isCustomized = !!config.email_templates[t.id]
            const isExpanded = expandedTemplate === t.id
            const isEditing = editingTemplate === t.id
            const result = templateResult?.id === t.id ? templateResult : null

            return (
              <div key={t.id}>
                {/* Header row */}
                <div
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setExpandedTemplate(isExpanded ? null : t.id)
                    if (isExpanded) setEditingTemplate(null)
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{t.label}</p>
                        {isCustomized && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium">Custom</span>
                        )}
                      </div>
                      <p className="ui-muted truncate">{t.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result && (
                    <span className={`text-xs flex items-center gap-1 ${result.ok ? 'text-blue-500' : 'text-red-400'}`}>
                        {result.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {result.msg}
                      </span>
                    )}
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-zinc-400 dark:text-white/30" />
                      : <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-white/30" />
                    }
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-muted/30 border-t border-border">
                    <div className="pt-3 space-y-3">

                      {/* Variable hints */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="ui-muted self-center">Variables:</span>
                        {t.vars.map(v => (
                        <code key={v} className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 font-mono border border-zinc-300 dark:border-white/10">
                            {v}
                          </code>
                        ))}
                      </div>

                      {isEditing ? (
                        <>
                          {/* Subject editor */}
                          <div>
                            <label className="ui-label mb-1.5 block">Subject Line</label>
                            <input
                              type="text"
                              value={override.subject}
                              onChange={e => updateOverrideField(t.id, 'subject', e.target.value)}
                              className={inp}
                              placeholder={t.defaultSubject}
                            />
                          </div>

                          {/* Body editor */}
                          <div>
                            <label className="ui-label mb-1.5 block">Email Body (HTML)</label>
                            <textarea
                              value={override.body_html}
                              onChange={e => updateOverrideField(t.id, 'body_html', e.target.value)}
                              rows={10}
                              className={inp + ' font-mono text-xs resize-y'}
                              placeholder={t.defaultBody}
                              spellCheck={false}
                            />
                            <p className="text-[11px] text-zinc-500 dark:text-white/30 mt-1">
                              Basic HTML is supported. WoWSQL will wrap this in the default branded layout.
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleSaveTemplate(t.id)}
                              disabled={savingTemplate}
                              className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50 shadow-sm"
                            >
                              {savingTemplate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              Save Template
                            </button>
                            <button
                              onClick={() => { setEditingTemplate(null); setTemplateResult(null) }}
                              className="inline-flex h-8 items-center px-3 text-xs font-medium border border-border rounded-md bg-background text-foreground hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                            {isCustomized && (
                              <button
                                onClick={() => handleResetTemplate(t.id)}
                                className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-md border border-red-500/20 transition-colors ml-auto"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset to Default
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Preview (read-only) */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="ui-muted w-14 shrink-0">Subject:</span>
                              <span className="text-xs text-foreground font-mono bg-muted px-2 py-1 rounded-md border border-border flex-1 truncate">
                                {override.subject}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="ui-muted w-14 shrink-0 pt-1">Body:</span>
                              <div className="flex-1 text-xs text-muted-foreground font-mono bg-muted px-2 py-2 rounded-md border border-border max-h-32 overflow-y-auto whitespace-pre-wrap">
                                {override.body_html}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingTemplate(t.id); setTemplateResult(null) }}
                            className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium border border-border rounded-md bg-background text-foreground hover:bg-muted transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            {isCustomized ? 'Edit Template' : 'Customize Template'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="ui-muted mt-2">
          Custom templates only apply when custom emails are enabled (custom SMTP/SendGrid/Mailgun/SES configured above).
        </p>
      </section>
    </div>
  )
}
