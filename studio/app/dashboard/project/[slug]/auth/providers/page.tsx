'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  KeyRound, Globe, Plus, Trash2, RefreshCw, X, CheckCircle,
  ChevronRight, ChevronDown, Mail, Phone, Shield, Save, Lock,
  Wallet, Eye, EyeOff
} from 'lucide-react'
import api from '@/lib/api'
import { API_URL } from '@/lib/constants'
import { PageSkeleton } from '@/components/Skeleton'

interface AuthConfig {
  enabled: boolean
  email_password_enabled: boolean
  email_otp_enabled: boolean
  magic_link_enabled: boolean
  phone_otp_enabled: boolean
  anonymous_auth_enabled: boolean
  email_confirmation_required: boolean
  allow_signup: boolean
  manual_linking_enabled: boolean
  public_api_key: string | null
  secret_api_key: string | null
  [key: string]: any
}

interface OAuthProvider {
  provider_name: string
  enabled: boolean
  redirect_uri?: string | null
  scopes: string[]
  client_id?: string
}

// Provider icon: SVG path for real brand logos, fallback emoji for built-ins
const allProviders = [
{ id: 'email', name: 'Email', logo: '/auth-providers/email.png', emoji: null, configField: 'email_password_enabled', category: 'builtin', bg: 'transparent' },
{ id: 'magic_link', name: 'Magic Link', logo: '/auth-providers/magic_link.png', emoji: null, configField: 'magic_link_enabled', category: 'builtin', bg: 'transparent' },
{ id: 'phone', name: 'Phone', logo: '/auth-providers/phone.png', emoji: null, configField: 'phone_otp_enabled', category: 'builtin', bg: 'transparent' },
{ id: 'saml', name: 'SAML 2.0', logo: '/auth-providers/saml.png', emoji: null, configField: null, category: 'builtin', bg: 'transparent' },
{ id: 'web3', name: 'Web3 Wallet', logo: '/auth-providers/web3.png', emoji: null, configField: null, category: 'builtin', bg: 'transparent' },
{ id: 'apple', name: 'Apple', logo: '/auth-providers/apple.svg', emoji: null, category: 'social', defaultScopes: 'name email', bg: 'transparent' },
{ id: 'azure', name: 'Azure', logo: '/auth-providers/azure.svg', emoji: null, category: 'social', defaultScopes: 'openid profile email', bg: 'transparent' },
{ id: 'bitbucket', name: 'Bitbucket', logo: '/auth-providers/bitbucket.svg', emoji: null, category: 'social', defaultScopes: 'account email', bg: 'transparent' },
{ id: 'discord', name: 'Discord', logo: '/auth-providers/discord.svg', emoji: null, category: 'social', defaultScopes: 'identify email', bg: 'transparent' },
{ id: 'facebook', name: 'Facebook', logo: '/auth-providers/facebook.svg', emoji: null, category: 'social', defaultScopes: 'email public_profile', bg: 'transparent' },
{ id: 'figma', name: 'Figma', logo: '/auth-providers/figma.svg', emoji: null, category: 'social', defaultScopes: 'file_read', bg: '#000000' },
{ id: 'github', name: 'GitHub', logo: '/auth-providers/github.svg', emoji: null, category: 'social', defaultScopes: 'read:user user:email', bg: 'transparent' },
{ id: 'gitlab', name: 'GitLab', logo: '/auth-providers/gitlab.svg', emoji: null, category: 'social', defaultScopes: 'read_user email', bg: 'transparent' },
{ id: 'google', name: 'Google', logo: '/auth-providers/google.svg', emoji: null, category: 'social', defaultScopes: 'openid email profile', bg: '#ffffff' },
{ id: 'kakao', name: 'Kakao', logo: '/auth-providers/kakao.svg', emoji: null, category: 'social', defaultScopes: 'account_email profile_nickname', bg: '#FEE500' },
{ id: 'keycloak', name: 'Keycloak', logo: '/auth-providers/keycloak.svg', emoji: null, category: 'social', defaultScopes: 'openid email profile', bg: 'transparent' },
{ id: 'linkedin', name: 'LinkedIn', logo: '/auth-providers/linkedin.svg', emoji: null, category: 'social', defaultScopes: 'openid profile email', bg: 'transparent' },
{ id: 'notion', name: 'Notion', logo: '/auth-providers/notion.svg', emoji: null, category: 'social', defaultScopes: '', bg: '#ffffff' },
{ id: 'slack', name: 'Slack', logo: '/auth-providers/slack.svg', emoji: null, category: 'social', defaultScopes: 'openid profile email', bg: '#ffffff' },
{ id: 'spotify', name: 'Spotify', logo: '/auth-providers/spotify.svg', emoji: null, category: 'social', defaultScopes: 'user-read-email user-read-private', bg: '#191414' },
{ id: 'twitch', name: 'Twitch', logo: '/auth-providers/twitch.svg', emoji: null, category: 'social', defaultScopes: 'user:read:email', bg: 'transparent' },
{ id: 'twitter', name: 'Twitter / X', logo: '/auth-providers/twitter.svg', emoji: null, category: 'social', defaultScopes: 'tweet.read users.read', bg: '#000000' },
{ id: 'microsoft', name: 'Microsoft', logo: '/auth-providers/microsoft.svg', emoji: null, category: 'social', defaultScopes: 'openid profile email offline_access', bg: '#ffffff' },
{ id: 'workos', name: 'WorkOS', logo: '/auth-providers/workos.svg', emoji: null, category: 'social', defaultScopes: '', bg: 'transparent' },
{ id: 'zoom', name: 'Zoom', logo: '/auth-providers/zoom.svg', emoji: null, category: 'social', defaultScopes: 'user:read:email', bg: '#2D8CFF' },
]

const thirdPartyProviders = [
{ id: 'firebase', name: 'Firebase', logo: '/auth-providers/firebase.svg', bg: '#FFA000' },
{ id: 'clerk', name: 'Clerk', logo: '/auth-providers/clerk.svg', bg: '#6C47FF' },
{ id: 'workos_tp',name: 'WorkOS', logo: '/auth-providers/workos.svg', bg: '#6c47ff' },
{ id: 'auth0', name: 'Auth0', logo: '/auth-providers/auth0.svg', bg: '#EB5424' },
{ id: 'cognito', name: 'Amazon Cognito', logo: '/auth-providers/cognito.svg', bg: '#FF9900' },
]

// ─── Provider Icon ─────────────────────────────────────────────────────────
function ProviderIcon({ logo, emoji, bg, name, size = 36 }: {
  logo: string | null; emoji: string | null; bg: string; name: string; size?: number
}) {
  const needsDarkBg = name === 'Apple' || name === 'GitHub';
  const hasBg = bg !== 'transparent';

  return (
    <div
      className={`rounded-md flex items-center justify-center overflow-hidden flex-shrink-0 ${needsDarkBg ? 'dark:bg-white' : ''}`}
      style={{ width: size, height: size, ...(hasBg ? { background: bg } : {}) }}>
      {logo ? (
        <img
          src={logo}
          alt={name}
          className={`object-contain ${needsDarkBg || hasBg ? 'w-[60%] h-[60%]' : 'w-full h-full'}`}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.5) }}>{emoji}</span>
      )}
    </div>
  )
}

export default function ProvidersPage() {
  const params = useParams()
  const slug = params.slug as string
  const [tab, setTab] = useState<'wowsql' | 'thirdparty'>('wowsql')
  const [config, setConfig] = useState<AuthConfig | null>(null)
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [authEnabled, setAuthEnabled] = useState(false)
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)
  const [savingField, setSavingField] = useState<string | null>(null)
  const [providerForms, setProviderForms] = useState<Record<string, { client_id: string; client_secret: string; redirect_uri: string; scopes: string }>>({})
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [activeTPDropdown, setActiveTPDropdown] = useState<'top' | 'empty' | null>(null)

  const [signupToggles, setSignupToggles] = useState({
    allow_signup: true,
    manual_linking_enabled: false,
    anonymous_auth_enabled: false,
    email_confirmation_required: true,
  })
  const [savingToggles, setSavingToggles] = useState(false)

  const connectDomain = useMemo(() => {
    // Self-hosted: OAuth callbacks go through the local Kong gateway
    if (process.env.NEXT_PUBLIC_SELF_HOSTED === 'true') {
      try {
        return new URL(API_URL).host
      } catch {
        return 'localhost:8080'
      }
    }
    const envDomain = process.env.NEXT_PUBLIC_CONNECT_DOMAIN
    if (envDomain && envDomain.trim()) return envDomain.trim()
    return 'wowsqlconnect.com'
  }, [])

  const oauthCallbackBase = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SELF_HOSTED === 'true') {
      return `${API_URL}/auth/v1/oauth`
    }
    return `https://${slug}.${connectDomain}/auth/v1/oauth`
  }, [slug, connectDomain])

  useEffect(() => { loadData() }, [slug])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.tp-dropdown-container')) setActiveTPDropdown(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/auth/status`)
      const d = res.data
      setAuthEnabled(!!d.enabled)
      if (d.config) {
        setConfig(d.config)
        setSignupToggles({
          allow_signup: d.config.allow_signup ?? true,
          manual_linking_enabled: d.config.manual_linking_enabled ?? false,
          anonymous_auth_enabled: d.config.anonymous_auth_enabled ?? false,
          email_confirmation_required: d.config.email_confirmation_required ?? true,
        })
      }
      setOauthProviders(d.oauth_providers || [])
    } catch { setAuthEnabled(false) }
    finally { setLoading(false) }
  }

  const isProviderEnabled = (providerId: string) => {
    const p = allProviders.find(ap => ap.id === providerId)
    if (p?.configField && config) return !!config[p.configField]
    const oauth = oauthProviders.find(op => op.provider_name === providerId)
    return oauth?.enabled ?? false
  }

  const handleToggleBuiltin = async (providerId: string) => {
    const p = allProviders.find(ap => ap.id === providerId)
    if (!p?.configField) return
    const newVal = !config?.[p.configField]
    setSavingField(providerId)
    try {
      await api.patch(`/api/v1/projects/${slug}/auth/config`, { [p.configField]: newVal })
      await loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update.')
    } finally { setSavingField(null) }
  }

  const handleSaveOAuthProvider = async (providerId: string) => {
    const form = providerForms[providerId]
    const existing = oauthProviders.find(op => op.provider_name === providerId)
    if (!form?.client_id) {
      alert('Client ID is required.')
      return
    }
    if (!form?.client_secret && !existing) {
      alert('Client Secret is required for new providers.')
      return
    }
    setSavingField(providerId)
    const p = allProviders.find(ap => ap.id === providerId)
    try {
      const payload: any = {
        provider_name: providerId,
        client_id: form.client_id,
        enabled: true,
        redirect_uri: form.redirect_uri || undefined,
        scopes: form.scopes ? form.scopes.split(',').map((s: string) => s.trim()).filter(Boolean) : (p as any)?.defaultScopes?.split(' ') || [],
      }
      if (form.client_secret) {
        payload.client_secret = form.client_secret
      } else {
        payload.client_secret = '___keep_existing___'
      }
      await api.post(`/api/v1/projects/${slug}/auth/oauth-providers`, payload)
      await loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save provider.')
    } finally { setSavingField(null) }
  }

  const handleRemoveOAuthProvider = async (providerId: string) => {
    if (!confirm(`Disable "${providerId}" provider?`)) return
    setSavingField(providerId)
    try {
      await api.delete(`/api/v1/projects/${slug}/auth/oauth-providers/${providerId}`)
      await loadData()
      setExpandedProvider(null)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove.')
    } finally { setSavingField(null) }
  }

  const handleSaveSignupToggles = async () => {
    setSavingToggles(true)
    try {
      await api.patch(`/api/v1/projects/${slug}/auth/config`, signupToggles)
      await loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save changes.')
    } finally { setSavingToggles(false) }
  }

  const getProviderForm = (id: string) => {
    if (!providerForms[id]) {
      const existing = oauthProviders.find(op => op.provider_name === id)
      const p = allProviders.find(ap => ap.id === id)
      const defaultRedirectUri = `${oauthCallbackBase}/${id}/callback`
      return {
        client_id: existing?.client_id || '',
        client_secret: '',
        redirect_uri: existing?.redirect_uri || defaultRedirectUri,
        scopes: (p as any)?.defaultScopes || '',
      }
    }
    return providerForms[id]
  }

  const updateProviderForm = (id: string, field: string, value: string) => {
    setProviderForms(prev => ({
      ...prev,
      [id]: { ...getProviderForm(id), [field]: value }
    }))
  }

  if (loading) {
  return <PageSkeleton variant="form" />
  }

  if (!authEnabled) {
    return (
      <div className="ui-page flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Shield className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="ui-page-title mb-1">Authentication Not Enabled</h2>
          <p className="ui-page-desc">Enable authentication for this project first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ui-page p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="ui-page-title">Sign In / Providers</h1>
        <p className="ui-page-desc mt-1">Configure authentication providers and login methods</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button onClick={() => setTab('wowsql')}
          className={`h-8 px-3 text-xs font-medium border-b-2 transition-colors -mb-px ${tab === 'wowsql' ? 'border-blue-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          WowSQL Auth
        </button>
        <button onClick={() => setTab('thirdparty')}
          className={`h-8 px-3 text-xs font-medium border-b-2 transition-colors -mb-px ${tab === 'thirdparty' ? 'border-blue-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          Third-Party Auth
        </button>
      </div>

      {/* ===== WowSQL Auth Tab ===== */}
      {tab === 'wowsql' && (
        <div className="space-y-6">
          {/* User Signups Section */}
          <section>
            <h2 className="ui-section-title mb-3">User Signups</h2>
            <div className="ui-panel overflow-hidden">
              {[
                { key: 'allow_signup', label: 'Allow new users to sign up', desc: 'If disabled, new users will not be able to sign up' },
                { key: 'manual_linking_enabled', label: 'Allow manual linking', desc: 'Enable manual linking APIs for your project' },
                { key: 'anonymous_auth_enabled', label: 'Allow anonymous sign-ins', desc: 'Enable anonymous sign-ins for your project' },
                { key: 'email_confirmation_required', label: 'Confirm email', desc: 'Users must confirm their email before first sign in' },
              ].map((item, i) => (
                <div key={item.key} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="ui-muted mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setSignupToggles(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${signupToggles[item.key as keyof typeof signupToggles] ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-white/20'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${signupToggles[item.key as keyof typeof signupToggles] ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              ))}
              <div className="border-t border-border px-4 py-3 flex justify-end">
                <button onClick={handleSaveSignupToggles} disabled={savingToggles}
                  className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 shadow-sm">
                  {savingToggles ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save changes
                </button>
              </div>
            </div>
          </section>

          {/* Auth Providers List */}
          <section>
            <h2 className="ui-section-title mb-3">Auth Providers</h2>
            <div className="ui-panel overflow-hidden divide-y divide-border">
              {allProviders.map(provider => {
                const enabled = isProviderEnabled(provider.id)
                const isExpanded = expandedProvider === provider.id
                const isSocial = provider.category === 'social'
                const existingOAuth = oauthProviders.find(op => op.provider_name === provider.id)
                const form = getProviderForm(provider.id)

                return (
                  <div key={provider.id}>
                    {/* Provider Row */}
                    <div
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <ProviderIcon
                          logo={(provider as any).logo}
                          emoji={(provider as any).emoji}
                          bg={(provider as any).bg || '#1a1a1a'}
                          name={provider.name}
                        />
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-foreground truncate block">{provider.name}</span>
                          {provider.category === 'social' && (
                            <p className="ui-muted mt-0.5">OAuth 2.0</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {enabled ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                            <CheckCircle className="w-3 h-3" /> Enabled
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                            Disabled
                          </span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded Config Panel */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-muted/30 border-t border-border">
                        <div className="pt-3 space-y-3">
                          {/* Built-in providers: simple toggle */}
                          {!isSocial && provider.configField && (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-foreground">Enable {provider.name}</p>
                                <p className="ui-muted mt-0.5">Toggle {provider.name.toLowerCase()} authentication</p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleBuiltin(provider.id) }}
                                disabled={savingField === provider.id}
                                className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-white/20'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-5' : ''}`} />
                              </button>
                            </div>
                          )}

                          {/* Social/OAuth providers: credentials form */}
                          {isSocial && (
                            <div className="space-y-3">
                              <div>
                                <label className="ui-label mb-1.5 block">Client ID</label>
                                <input type="text" value={form.client_id}
                                  onChange={e => updateProviderForm(provider.id, 'client_id', e.target.value)}
                                  className="ui-control w-full"
                                  placeholder={`Your ${provider.name} Client ID`} />
                              </div>
                              <div>
                                <label className="ui-label mb-1.5 block">Client Secret</label>
                                <div className="relative">
                                  <input type={showSecret[provider.id] ? 'text' : 'password'} value={form.client_secret}
                                    onChange={e => updateProviderForm(provider.id, 'client_secret', e.target.value)}
                                    className="ui-control w-full pr-9"
                                    placeholder={existingOAuth ? '••••••••••• (leave blank to keep)' : `Your ${provider.name} Client Secret`} />
                                  <button type="button" onClick={() => setShowSecret(p => ({ ...p, [provider.id]: !p[provider.id] }))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showSecret[provider.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="ui-label mb-1.5 block">Redirect URI</label>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 ui-control font-mono truncate select-all cursor-text bg-muted/50">
                                    {form.redirect_uri}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(form.redirect_uri).then(() => {
                                      const el = document.getElementById(`copy-${provider.id}`)
                                      if (el) { el.textContent = 'Copied!'; setTimeout(() => { el.textContent = 'Copy' }, 1500) }
                                    })}
                                    className="inline-flex h-8 items-center px-3 text-xs font-medium border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap shrink-0">
                                    <span id={`copy-${provider.id}`}>Copy</span>
                                  </button>
                                </div>
                                <p className="ui-muted mt-1">
                                  Register this URI in your {provider.name} OAuth app settings.
                                </p>
                              </div>
                              <div>
                                <label className="ui-label mb-1.5 block">Scopes</label>
                                <input type="text" value={form.scopes}
                                  onChange={e => updateProviderForm(provider.id, 'scopes', e.target.value)}
                                  className="ui-control w-full"
                                  placeholder={(provider as any).defaultScopes || 'Space-separated scopes'} />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button onClick={() => handleSaveOAuthProvider(provider.id)}
                                  disabled={savingField === provider.id}
                                  className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 shadow-sm">
                                  {savingField === provider.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                  {existingOAuth ? 'Update' : 'Enable'} {provider.name}
                                </button>
                                {existingOAuth && (
                                  <button onClick={() => handleRemoveOAuthProvider(provider.id)}
                                    disabled={savingField === provider.id}
                                    className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-md transition-colors disabled:opacity-50">
                                    <Trash2 className="w-3.5 h-3.5" /> Disable
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Non-configurable built-in */}
                          {!isSocial && !provider.configField && (
                            <p className="text-sm text-muted-foreground">This provider is not yet available. Coming soon.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      )}

      {/* ===== Third-Party Auth Tab ===== */}
      {tab === 'thirdparty' && (
        <div>
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="min-w-0">
              <h2 className="ui-section-title flex items-center gap-2">
                Third-Party Auth
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-md border border-blue-500/20">
                  Coming Soon
                </span>
              </h2>
              <p className="ui-page-desc mt-1">
                Billing is based on the number of monthly active users (MAUs) requesting your API throughout the billing period.{' '}
                <a href="#" className="underline hover:text-foreground">Learn more</a>
              </p>
            </div>
            <div className="relative flex items-center gap-2 tp-dropdown-container shrink-0">
              <button className="inline-flex h-8 items-center px-3 text-xs font-medium border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
                Docs
              </button>
              <button
                onClick={() => setActiveTPDropdown(activeTPDropdown === 'top' ? null : 'top')}
                className="inline-flex h-8 items-center gap-1 px-3 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm whitespace-nowrap">
                Add provider <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {activeTPDropdown === 'top' && (
                <div className="absolute right-0 top-full mt-1 w-52 ui-panel shadow-xl z-50 overflow-hidden bg-card">
                  <p className="px-3 py-2 ui-label uppercase tracking-wider">Select provider</p>
                  {thirdPartyProviders.map(tp => (
                    <button key={tp.id}
                      onClick={() => { setActiveTPDropdown(null); alert(`${tp.name} integration coming soon.`) }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        <ProviderIcon logo={tp.logo} emoji={null} bg={tp.bg} name={tp.name} size={24} />
                        {tp.name}
                      </div>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">Soon</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Empty state */}
          <div className="ui-panel p-10 flex flex-col items-center justify-center text-center">
            <div className="w-9 h-9 rounded-md bg-muted border border-border flex items-center justify-center mb-3">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="ui-section-title mb-1">Add an authentication provider</h3>
            <p className="ui-page-desc max-w-sm mb-4">
              Use third-party authentication systems based on JWTs to access your project.
            </p>
            <div className="relative tp-dropdown-container">
              <button
                onClick={() => setActiveTPDropdown(activeTPDropdown === 'empty' ? null : 'empty')}
                className="inline-flex h-8 items-center gap-1 px-3 text-xs font-medium border border-border rounded-md text-foreground hover:bg-muted whitespace-nowrap">
                Add provider <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {activeTPDropdown === 'empty' && (
                <div className="absolute top-full mt-1 w-52 ui-panel shadow-xl z-50 overflow-hidden text-left bg-card" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                  <p className="px-3 py-2 ui-label uppercase tracking-wider">Select provider</p>
                  {thirdPartyProviders.map(tp => (
                    <button key={tp.id}
                      onClick={() => { setActiveTPDropdown(null); alert(`${tp.name} integration coming soon.`) }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        <ProviderIcon logo={tp.logo} emoji={null} bg={tp.bg} name={tp.name} size={24} />
                        {tp.name}
                      </div>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">Soon</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
