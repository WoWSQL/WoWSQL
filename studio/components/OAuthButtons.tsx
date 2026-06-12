'use client'

import { useState, useEffect, useRef } from 'react'
import api from '@/lib/api'

interface OAuthConfig {
  google: { enabled: boolean; client_id: string | null }
  github: { enabled: boolean; client_id: string | null }
}

interface OAuthButtonsProps {
  mode: 'login' | 'signup'
  onError?: (error: string) => void
  className?: string
}

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

// GitHub Icon SVG
const GitHubIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
    />
  </svg>
)

export function OAuthButtons({ mode, onError, className = '' }: OAuthButtonsProps) {
  const [config, setConfig] = useState<OAuthConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    // Prevent double fetch in React Strict Mode
    if (hasFetched.current) return
    hasFetched.current = true

    // Fetch OAuth config from backend
    const fetchConfig = async () => {
      try {
        const response = await api.get('/api/v1/auth/oauth/config')
        setConfig(response.data)
      } catch (err) {
        console.error('Failed to fetch OAuth config:', err)
        // Don't show OAuth buttons if config fetch fails
        setConfig(null)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const getRedirectUri = () => {
    // Get the current origin for the redirect URI
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`
    }
    return ''
  }

  const handleGoogleLogin = () => {
    if (!config?.google.client_id) {
      onError?.('Google OAuth is not configured')
      return
    }

    setLoadingProvider('google')
    
    const redirectUri = getRedirectUri()
    const scope = 'openid email profile'
    const responseType = 'code'
    const state = JSON.stringify({ provider: 'google', mode })
    
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', config.google.client_id)
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
    googleAuthUrl.searchParams.set('response_type', responseType)
    googleAuthUrl.searchParams.set('scope', scope)
    googleAuthUrl.searchParams.set('state', encodeURIComponent(state))
    googleAuthUrl.searchParams.set('access_type', 'offline')
    googleAuthUrl.searchParams.set('prompt', 'consent')

    window.location.href = googleAuthUrl.toString()
  }

  const handleGitHubLogin = () => {
    if (!config?.github.client_id) {
      onError?.('GitHub OAuth is not configured')
      return
    }

    setLoadingProvider('github')
    
    const redirectUri = getRedirectUri()
    const scope = 'user:email'
    const state = JSON.stringify({ provider: 'github', mode })
    
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
    githubAuthUrl.searchParams.set('client_id', config.github.client_id)
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri)
    githubAuthUrl.searchParams.set('scope', scope)
    githubAuthUrl.searchParams.set('state', encodeURIComponent(state))

    window.location.href = githubAuthUrl.toString()
  }

  // Don't render anything while loading or if no OAuth providers are enabled
  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="h-11 rounded-lg border border-slate-700/70 bg-slate-800/35 animate-pulse"></div>
        <div className="h-11 rounded-lg border border-slate-700/70 bg-slate-800/35 animate-pulse"></div>
      </div>
    )
  }

  if (!config || (!config.google.enabled && !config.github.enabled)) {
    return null
  }

  const actionText = mode === 'login' ? 'Sign in' : 'Sign up'

  return (
    <div className={`space-y-3 ${className}`}>
      {config.google.enabled && (
        <button
          onClick={handleGoogleLogin}
          disabled={loadingProvider === 'google'}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-slate-200 transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] hover:border-zinc-300 dark:hover:border-zinc-200 dark:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingProvider === 'google' ? (
            <div className="w-5 h-5 border-2 border-zinc-200 dark:border-white/50 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <GoogleIcon />
          )}
          <span>{actionText} with Google</span>
        </button>
      )}

      {config.github.enabled && (
        <button
          onClick={handleGitHubLogin}
          disabled={loadingProvider === 'github'}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-slate-200 transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] hover:border-zinc-300 dark:hover:border-zinc-200 dark:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingProvider === 'github' ? (
            <div className="w-5 h-5 border-2 border-zinc-200 dark:border-white/50 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <GitHubIcon />
          )}
          <span>{actionText} with GitHub</span>
        </button>
      )}
    </div>
  )
}

// Divider component for separating OAuth and email login
export function OAuthDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-200 dark:border-white/10 transition-colors duration-300"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white dark:bg-[#0a0a0a] px-3 text-[0.7rem] tracking-wide text-zinc-400 dark:text-white/20 transition-colors duration-300">
          or continue with email
        </span>
      </div>
    </div>
  )
}


