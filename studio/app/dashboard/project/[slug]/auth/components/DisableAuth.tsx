'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { AlertTriangle, Trash2, Users, Shield, Database, Loader2 } from 'lucide-react'

interface DisableAuthProps {
  onDisabled?: () => void
  onCancel?: () => void
}

export function DisableAuth({ onDisabled, onCancel }: DisableAuthProps) {
  const params = useParams()
  const slug = params.slug as string
  const [disabling, setDisabling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const requiredConfirmText = 'DELETE AUTH'

  const handleDisable = async () => {
    if (!confirmed) {
      setError('Please type "DELETE AUTH" to confirm')
      return
    }

    setDisabling(true)
    setError(null)

    try {
      await api.post(`/api/v1/projects/${slug}/auth/disable`)

      if (onDisabled) {
        onDisabled()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to disable authentication. Please try again.')
    } finally {
      setDisabling(false)
    }
  }

  const handleConfirmChange = (value: string) => {
    setConfirmText(value)
    setConfirmed(value === requiredConfirmText)
    if (error) setError(null)
  }

  const tablesToDelete = [
    'project_auth_config',
    'auth_users',
    'auth_sessions',
    'auth_providers_config',
    'auth_verification_tokens',
    'auth_audit_logs',
    'auth_roles',
    'auth_user_roles'
  ]

  return (
    <div className="ui-page p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-red-500/10 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h1 className="ui-page-title mb-2">Disable Authentication Services</h1>
        <p className="ui-page-desc max-w-xl mx-auto">
          This action will permanently delete all authentication data and cannot be undone.
        </p>
      </div>

      <div className="rounded-md border border-red-500/30 p-4 mb-4 bg-red-500/5">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-red-400 mb-1.5">Warning: This action is irreversible</h2>
            <ul className="ui-muted space-y-1 list-disc list-inside">
              <li>All user accounts will be permanently deleted</li>
              <li>All active sessions will be terminated</li>
              <li>All OAuth provider configurations will be removed</li>
              <li>All authentication logs and audit trails will be deleted</li>
              <li>All roles and permissions will be removed</li>
              <li>Users will no longer be able to sign in or sign up</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="ui-panel p-4 mb-4">
        <h2 className="ui-section-title mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-red-400 shrink-0" />
          Tables that will be deleted
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {tablesToDelete.map((table, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
              <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-xs text-foreground font-mono truncate">{table}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ui-panel p-4 mb-4">
        <h2 className="ui-section-title mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-red-400 shrink-0" />
          What will be lost
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { icon: Users, label: 'User Accounts', desc: 'All registered users and their profiles' },
            { icon: Shield, label: 'Sessions & Tokens', desc: 'All active sessions and refresh tokens' },
            { icon: Database, label: 'Auth Configuration', desc: 'JWT secrets, OAuth providers, settings' },
            { icon: Trash2, label: 'Audit Logs', desc: 'All authentication and security logs' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-md bg-muted/50 border border-border">
              <item.icon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="ui-muted">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ui-panel p-4 mb-4">
        <h2 className="ui-section-title mb-3">Confirm Deletion</h2>
        <p className="ui-page-desc mb-3">
          Type <span className="font-mono font-semibold text-foreground">DELETE AUTH</span> to confirm you want to disable authentication:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => handleConfirmChange(e.target.value)}
          placeholder="DELETE AUTH"
          className="ui-control w-full font-mono focus:border-red-500/50"
        />
        {confirmText && !confirmed && (
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            Text must match exactly: <span className="font-mono">DELETE AUTH</span>
          </p>
        )}
        {confirmed && (
          <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
            <span>✓</span> Confirmation text matches
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={disabling}
            className="inline-flex h-8 items-center px-3 text-xs font-medium border border-border rounded-md bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleDisable}
          disabled={disabling || !confirmed}
          className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabling ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Disabling...
            </>
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5" />
              Disable Authentication
            </>
          )}
        </button>
      </div>
    </div>
  )
}
