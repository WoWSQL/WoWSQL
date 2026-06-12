'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Copy, Check, Server, Lock } from 'lucide-react'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import api from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
// Inline plan helpers (subscription-plan module removed)
function getPlanSlug(plan: any): string {
  return plan?.plan_name?.toLowerCase() || plan?.name?.toLowerCase() || 'free'
}
function canCreateDedicatedProject(plan: any): boolean {
  const slug = getPlanSlug(plan)
  return slug === 'pro' || slug === 'scale'
}
function isBillingBlocked(_plan: any): boolean {
  return false
}
function getBillingWallMessage(_plan: any): string {
  return 'Plan upgrade required.'
}

interface CreateProjectFormProps {
  onSuccess?: (project: any) => void
  onCancel?: () => void
  showCancelButton?: boolean
  isModal?: boolean
}

function getPasswordStrength(pw: string): { label: string; color: string; pct: number } {
  if (!pw) return { label: '', color: '', pct: 0 }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', pct: 20 }
  if (score === 2) return { label: 'Fair', color: 'bg-orange-500', pct: 40 }
  if (score === 3) return { label: 'Good', color: 'bg-yellow-500', pct: 60 }
  if (score === 4) return { label: 'Strong', color: 'bg-green-500', pct: 80 }
  return { label: 'Very strong', color: 'bg-emerald-400', pct: 100 }
}

type ServerSizeOption = {
  id: string
  display_name: string
  ram_mb: number
  storage_gb: number
  vcpu: number
  price_monthly: number
  list_price_usd_per_hour?: number
  included_egress_gb_per_month?: number
}

export default function CreateProjectForm({ onSuccess, onCancel, showCancelButton = true, isModal = false }: CreateProjectFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dbPassword, setDbPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [connectionType, setConnectionType] = useState('api_and_direct')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const selectedRegion = 'ap-south-1'

  const [currentPlan, setCurrentPlan] = useState<any>(null)
  const [pricingPlans, setPricingPlans] = useState<any[]>([])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState(false)

  // Server sizes
  const [serverSizes, setServerSizes] = useState<ServerSizeOption[]>([])
  const [selectedSize, setSelectedSize] = useState<string>('shared')
  const [loadingSizes, setLoadingSizes] = useState(false)
  const [existingProjects, setExistingProjects] = useState<any[]>([])

  const planSlug = getPlanSlug(currentPlan)
  const isProUser = canCreateDedicatedProject(currentPlan)
  const hasIncludedProject = existingProjects.some((p: any) => p.is_included_in_plan)

  const strength = getPasswordStrength(dbPassword)

  useEffect(() => {
    loadCurrentPlan()
    loadPricingPlans()
    loadExistingProjects()
  }, [])

  const loadCurrentPlan = async () => {
    try {
      const res = await api.get('/api/v1/pricing/current-plan')
      setCurrentPlan(res.data)
    } catch { /* default free */ }
  }

  const loadPricingPlans = async () => {
    try {
      const res = await api.get('/api/v1/pricing/plans')
      setPricingPlans(res.data)
    } catch { /* ignore */ }
  }

  const loadExistingProjects = async () => {
    try {
      const res = await api.get('/api/v1/projects/')
      setExistingProjects(res.data || [])
    } catch {
      setExistingProjects([])
    }
  }

  const loadServerSizes = useCallback(async () => {
    if (!isProUser) return
    setLoadingSizes(true)
    try {
      const res = await api.get(`/api/v1/pricing/server-sizes?for_plan=${encodeURIComponent(planSlug)}`)
      setServerSizes(res.data?.server_sizes || [])
    } catch {
      setServerSizes([])
    } finally {
      setLoadingSizes(false)
    }
  }, [isProUser, planSlug])

  useEffect(() => {
    if (isProUser) {
      loadServerSizes()
      setSelectedSize('nano')
    } else {
      setSelectedSize('shared')
    }
  }, [isProUser, loadServerSizes])

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%^&*'
    let pw = ''
    for (let i = 0; i < 20; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length))
    setDbPassword(pw)
  }

  const copyPassword = () => {
    if (!dbPassword) return
    navigator.clipboard.writeText(dbPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUpgradeToPro = async () => {
    alert('Plan upgrades are currently being reconfigured. Please try again later.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Project name is required'); return }
    if (name.length > 50) { setError('Project name cannot exceed 50 characters'); return }
    if (!dbPassword) { setError('Please set a database password'); return }
    if (dbPassword.length < 8) { setError('Password must be at least 8 characters'); return }

    if (isBillingBlocked(currentPlan)) {
      setError(getBillingWallMessage(currentPlan))
      setShowUpgradeModal(true)
      return
    }

    setLoading(true)
    try {
      let response
      const useDedicated =
        isProUser && selectedSize !== 'shared' && serverSizes.some((s) => s.id === selectedSize)

      if (useDedicated) {
        response = await api.post('/api/v1/dedicated/create-dedicated', {
          name, description,
          db_password: dbPassword,
          server_size: selectedSize,
          db_access: true,
          connection_type: connectionType
        })
      } else if (isProUser && selectedSize === 'shared') {
        setError('Pro plans use dedicated servers. Pick a server size (Nano, Micro, Small, etc.).')
        setLoading(false)
        return
      } else {
        response = await api.post('/api/v1/projects/', {
          name, description,
          db_password: dbPassword,
          plan: 'free',
          connection_type: connectionType
        })
      }
      const project = response.data
      if (onSuccess) { onSuccess(project) } else { router.push(`/dashboard/project/${project.slug}`) }
    } catch (err: any) {
      if (err.response?.status === 403) {
        const detail = err.response?.data?.detail
        if (detail && typeof detail === 'object' && detail.error === 'Project limit reached') {
          setShowUpgradeModal(true)
          setError(`${detail.message} Upgrade to Pro for unlimited projects.`)
        } else {
          setError(typeof detail === 'string' ? detail : 'You do not have permission to perform this action.')
        }
      } else {
        const msg = err.response?.data?.detail || err.message || 'Failed to create project'
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedSizeData = serverSizes.find((s) => s.id === selectedSize)
  const isFirstIncluded = isProUser && !hasIncludedProject && selectedSize === 'nano'

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
        {!isModal && (
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Create a new project</h1>
            <p className="text-sm text-zinc-500 dark:text-white/50 mt-1">
              Your project will have its own dedicated instance and full Postgres database.
              An API will be set up so you can easily interact with your new database.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/[0.07] px-4 py-3">
            <p className="text-red-400 text-sm whitespace-pre-wrap">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-500 dark:text-white/70">Name</label>
<Input
        type="text"
        placeholder="Project name"
        value={name}
        onChange={(e) => { if (e.target.value.length <= 50) setName(e.target.value) }}
        maxLength={50}
        required
        autoComplete="off"
        className="bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/30 focus:border-zinc-200 dark:border-white/10 focus:ring-0 h-10"
      />
          </div>

          {/* Database Password */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-500 dark:text-white/70">Database Password</label>
            <div className="relative">
<Input
        type={showPassword ? 'text' : 'password'}
        placeholder="Type in a strong password"
        value={dbPassword}
        onChange={(e) => setDbPassword(e.target.value)}
        required
        minLength={8}
        className="bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/30 focus:border-zinc-200 dark:border-white/10 focus:ring-0 h-10 pr-20"
      />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button type="button" onClick={copyPassword} className="p-1 text-zinc-500 dark:text-white/40 hover:text-zinc-500 dark:text-white/70 transition" title="Copy">
                  {copied ? <Check className="w-4 h-4 text-purple-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 text-zinc-500 dark:text-white/40 hover:text-zinc-500 dark:text-white/70 transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {dbPassword ? (
              <div className="space-y-1">
                <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.pct}%` }} />
                </div>
                <p className="text-xs text-zinc-500 dark:text-white/40">
                  {strength.label && `This password is ${strength.label.toLowerCase()}.`}{' '}
                  <button type="button" onClick={generatePassword} className="text-purple-400 hover:text-purple-300 underline underline-offset-2">Generate a password</button>
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-white/40">
                <button type="button" onClick={generatePassword} className="text-purple-400 hover:text-purple-300 underline underline-offset-2">Generate a password</button>
              </p>
            )}
          </div>

          {/* Region */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-500 dark:text-white/70">Region</label>
            <div className="flex items-center gap-3 rounded-md border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 px-3 h-10">
              <span className="text-lg">🇮🇳</span>
              <span className="text-sm text-zinc-500 dark:text-white/80">Asia Pacific (Mumbai)</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-white/40">Select a region close to your users for the best performance.</p>
          </div>

          {/* Server Size */}
          <div className="space-y-3">
            <label className="text-sm text-zinc-500 dark:text-white/70">Server Size</label>

            {/* Shared (Free) — always visible */}
            <button
              type="button"
              onClick={() => { if (!isProUser) setSelectedSize('shared') }}
              className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
selectedSize === 'shared'
        ? 'border-zinc-200 dark:border-white/10 bg-purple-500/[0.06]'
        : isProUser
        ? 'border-zinc-200 dark:border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed'
        : 'border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 hover:border-zinc-200 dark:border-white/20'
              }`}
              disabled={isProUser}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedSize === 'shared' ? 'border-purple-500' : 'border-zinc-200 dark:border-white/20'
                  }`}>
                    {selectedSize === 'shared' && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Shared</span>
                    <span className="text-xs text-zinc-500 dark:text-white/40 ml-2">1GB Storage · 5GB Egress</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">Free</span>
                  <span className="text-xs text-zinc-500 dark:text-white/40 ml-1">$0/month</span>
                </div>
              </div>
              {isProUser && (
                <div className="flex items-center gap-1.5 mt-2 ml-7">
                  <Lock className="w-3 h-3 text-zinc-500 dark:text-white/30" />
                  <span className="text-[11px] text-zinc-500 dark:text-white/30">Pro plan uses dedicated servers</span>
                </div>
              )}
            </button>

            {/* Dedicated sizes — visible for Pro users, locked for free */}
            {isProUser ? (
              loadingSizes ? (
                <div className="text-center text-zinc-500 dark:text-white/40 text-sm py-4">Loading server sizes...</div>
              ) : (
                serverSizes.map((sz) => {
                  const isSelected = selectedSize === sz.id
                  const isFreeIncluded = isProUser && !hasIncludedProject && sz.id === 'nano'
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setSelectedSize(sz.id)}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
isSelected
        ? 'border-zinc-200 dark:border-white/10 bg-purple-500/[0.06]'
        : 'border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 hover:border-zinc-200 dark:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-purple-500' : 'border-zinc-200 dark:border-white/20'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-zinc-900 dark:text-white">{sz.display_name}</span>
                            <span className="text-xs text-zinc-500 dark:text-white/40 ml-2">
                              {sz.vcpu} vCPU · {sz.ram_mb >= 1024 ? `${(sz.ram_mb / 1024).toFixed(0)}GB` : `${sz.ram_mb}MB`} RAM · {sz.storage_gb}GB SSD · {sz.included_egress_gb_per_month || 50}GB Egress
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {isFreeIncluded ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">Included Free</span>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                                ${sz.list_price_usd_per_hour != null
                                  ? Number(sz.list_price_usd_per_hour).toFixed(4)
                                  : sz.price_monthly.toFixed(2)}
                              </span>
                              <span className="text-xs text-zinc-500 dark:text-white/40 ml-1">
                                {sz.list_price_usd_per_hour != null ? '/hour' : '/month'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )
            ) : (
              /* Free user teaser: show locked dedicated sizes */
              <div className="space-y-2">
                {[
                  { name: 'Nano', specs: '1 vCPU · 256MB RAM · 5GB SSD', price: 'Free with plan' },
                  { name: 'Micro', specs: '1 vCPU · 512MB RAM · 10GB SSD', price: '$0.018/hr' },
                  { name: 'Small', specs: '1 vCPU · 1GB RAM · 10GB SSD', price: '$0.036/hr' },
                ].map((sz) => (
                  <button
                    key={sz.name}
                    type="button"
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full text-left rounded-lg border border-zinc-200 dark:border-white/5 bg-white/[0.01] px-4 py-3 opacity-50 hover:opacity-70 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-zinc-200 dark:border-white/10" />
                        <div>
                          <span className="text-sm font-medium text-zinc-500 dark:text-white/60">{sz.name}</span>
                          <span className="text-xs text-zinc-500 dark:text-white/30 ml-2">{sz.specs}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 dark:text-white/30">{sz.price}</span>
                        <Lock className="w-3 h-3 text-zinc-500 dark:text-white/20" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 ml-7">
                      <span className="text-[11px] text-purple-400/70">Upgrade to Pro to unlock dedicated servers →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Cost summary for pro users */}
            {isProUser && selectedSizeData && (
              <div className="rounded-md border border-zinc-200 dark:border-white/5 bg-white/[0.02] px-4 py-2.5 text-xs text-zinc-500 dark:text-white/50">
                {isFirstIncluded ? (
                  <span className="text-purple-400">Your first Nano server is included in your plan at no extra cost.</span>
                ) : selectedSizeData.list_price_usd_per_hour != null ? (
                  <span>
                    This server costs <strong className="text-zinc-500 dark:text-white/80">${Number(selectedSizeData.list_price_usd_per_hour).toFixed(4)}/hour</strong> (~${(Number(selectedSizeData.list_price_usd_per_hour) * 730).toFixed(2)}/mo if 24/7). Billed by actual running hours on your next renewal.
                  </span>
                ) : (
                  <span>This server costs <strong className="text-zinc-500 dark:text-white/80">${selectedSizeData.price_monthly.toFixed(2)}/month</strong> and will be added to your next renewal bill.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-zinc-200 dark:border-white/5 pt-6">
          <div>
            {showCancelButton && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onCancel ? onCancel() : router.push('/dashboard')}
                className="border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-white/70 hover:bg-white/[0.05] hover:text-zinc-900 dark:text-white hover:border-zinc-200 dark:border-white/20 h-9 px-4 text-sm"
              >
                Cancel
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-zinc-500 dark:text-white/30 hidden sm:block">You can rename your project later.</p>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm h-9 px-5 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Creating project...' : 'Create new project'}
            </Button>
          </div>
        </div>
      </form>

      {/* Plan upgrade modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-100 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-xl max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">Upgrade your plan</h3>
            <p className="text-sm text-zinc-500 dark:text-white/50 mb-6">Unlock dedicated servers, backups, and more.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pricingPlans.map((plan) => {
                const isCurrent = plan.id === planSlug || (!isProUser && plan.id === 'free')
                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl border p-5 flex flex-col ${
                      isCurrent ? 'border-zinc-200 dark:border-white/10 bg-purple-500/[0.05]' : 'border-zinc-200 dark:border-white/10 bg-white/[0.02] hover:border-zinc-200 dark:border-white/20'
                    } transition-all`}
                  >
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-zinc-900 dark:text-white">{plan.name}</h4>
                        {isCurrent && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 uppercase tracking-wider">Current</span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                        ${plan.monthly_price.toFixed(0)}<span className="text-sm font-normal text-zinc-500 dark:text-white/40">/month</span>
                      </p>
                    </div>
                    {plan.description && <p className="text-xs text-zinc-500 dark:text-white/50 mb-3">{plan.description}</p>}
                    <ul className="space-y-1.5 text-xs text-zinc-500 dark:text-white/60 mb-4 flex-1">
                      {(plan.features || []).slice(0, 7).map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <div className="text-center text-xs text-purple-400 font-medium py-2 rounded-md border border-zinc-200 dark:border-white/10 bg-purple-500/[0.05]">Current plan</div>
                    ) : plan.id === 'free' ? (
                      <div className="text-center text-xs text-zinc-500 dark:text-white/30 py-2">Free tier</div>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => { setShowUpgradeModal(false); handleUpgradeToPro() }}
                        className="w-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm text-xs h-8"
                      >
                        Upgrade to {plan.name}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setShowUpgradeModal(false)} className="border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-white/60 hover:bg-white/[0.05] text-sm h-8 px-4">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
