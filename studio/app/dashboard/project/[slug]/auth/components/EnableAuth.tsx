'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { KeyRound, Shield, Users, Sparkles, Loader2 } from 'lucide-react'

interface EnableAuthProps {
  onEnabled?: () => void
}

export function EnableAuth({ onEnabled }: EnableAuthProps) {
  const params = useParams()
  const slug = params.slug as string
  const [enabling, setEnabling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jwtSecret, setJwtSecret] = useState('')
  const [generateSecret, setGenerateSecret] = useState(true)

  const generateJWTSecret = () => {
    const array = new Uint8Array(48)
    crypto.getRandomValues(array)
    const secret = btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    return secret
  }

  const handleEnable = async () => {
    if (!generateSecret && jwtSecret.length < 32) {
      setError('JWT secret must be at least 32 characters long')
      return
    }

    setEnabling(true)
    setError(null)

    try {
      const secret = generateSecret ? generateJWTSecret() : jwtSecret

      await api.post(`/api/v1/projects/${slug}/auth/enable`, {
        jwt_secret: secret,
        oauth_providers: {}
      })

      if (onEnabled) {
        onEnabled()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to enable authentication. Please try again.')
    } finally {
      setEnabling(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-blue-500/10 mb-4">
          <Shield className="w-6 h-6 text-blue-400" />
        </div>
        <h1 className="ui-page-title mb-2">Enable Authentication Services</h1>
        <p className="ui-page-desc max-w-xl mx-auto">
          Enable authentication for your project to manage users, roles, sessions, and OAuth providers.
          This will create the necessary auth tables in your database.
        </p>
      </div>

      <div className="ui-panel p-4 mb-4">
        <h2 className="ui-section-title mb-3 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-400 shrink-0" />
          JWT Secret Configuration
        </h2>
        <p className="ui-page-desc mb-3">
          The JWT secret is used to sign and verify authentication tokens. Keep this secure and never share it publicly.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="generate-secret"
              checked={generateSecret}
              onChange={(e) => setGenerateSecret(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="generate-secret" className="text-xs text-foreground cursor-pointer">
              Generate secure JWT secret automatically (recommended)
            </label>
          </div>

          {!generateSecret && (
            <div>
              <label className="ui-label mb-1.5 block">
                JWT Secret (minimum 32 characters)
              </label>
              <input
                type="text"
                value={jwtSecret}
                onChange={(e) => setJwtSecret(e.target.value)}
                placeholder="Enter your JWT secret key..."
                className="ui-control w-full font-mono"
              />
              <p className="ui-muted mt-1">
                {jwtSecret.length < 32 ? (
                  <span className="text-amber-600 dark:text-amber-400">Minimum 32 characters required</span>
                ) : (
                  <span className="text-blue-500 dark:text-blue-400">Secret length is valid</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="ui-panel p-4 mb-4">
        <h2 className="ui-section-title mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          What will be created?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { icon: Users, label: 'User Management', desc: 'auth_users table for user accounts' },
            { icon: Shield, label: 'Sessions & Security', desc: 'auth_sessions and security tables' },
            { icon: KeyRound, label: 'OAuth Providers', desc: 'Support for social logins' },
            { icon: Sparkles, label: 'Roles & Permissions', desc: 'Role-based access control' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-md bg-muted/50 border border-border">
              <item.icon className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="ui-muted">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleEnable}
          disabled={enabling || (!generateSecret && jwtSecret.length < 32)}
          className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {enabling ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Enabling...
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5" />
              Enable Authentication
            </>
          )}
        </button>
      </div>
    </div>
  )
}
