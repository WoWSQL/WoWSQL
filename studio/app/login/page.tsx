'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, Database } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import api from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isFirstSetup, setIsFirstSetup] = useState(false)
  const hasChecked = useRef(false)

  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true

    const check = async () => {
      try {
        await api.get('/api/v1/auth/me')
        router.replace('/dashboard/project/default')
        return
      } catch {}

      try {
        const res = await api.get('/api/v1/auth/setup-status')
        if (!res.data.registered) {
          setIsFirstSetup(true)
        }
      } catch {}

      setCheckingAuth(false)
    }
    check()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isFirstSetup) {
        await api.post('/api/v1/auth/register', { email, password })
      } else {
        await api.post('/api/v1/auth/login', { email, password })
      }
      router.push('/dashboard/project/default')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-violet-600/20 to-pink-600/20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="relative z-10 text-center px-12">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-violet-500/25">
              <Database className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">WoWSQL</h1>
          <p className="text-xl text-zinc-300 mb-2">Self-Hosted Edition</p>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Your own PostgreSQL backend with REST API, Auth, Storage, and Realtime — running entirely on your machine.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <div className="lg:hidden mb-6 flex justify-center">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 flex items-center justify-center">
                <Database className="w-7 h-7 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isFirstSetup ? 'Create Admin Account' : 'Welcome back'}
            </h2>
            <p className="text-zinc-400 mt-1">
              {isFirstSetup
                ? 'Set up your admin credentials to get started'
                : 'Sign in to your self-hosted instance'}
            </p>
          </div>

          {isFirstSetup && (
            <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-300 text-sm">
                First time setup — create your admin account. This will be the only account for this instance.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isFirstSetup ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                isFirstSetup ? 'Create Admin Account' : 'Sign in'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="text-center text-zinc-500 text-xs space-y-1">
              <p>WoWSQL Self-Hosted Edition</p>
              <p>All data stays on your machine. No cloud connection.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
