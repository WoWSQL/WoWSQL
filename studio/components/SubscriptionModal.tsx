'use client'

import { useState, useEffect } from 'react'
import { X, Check, Zap, Shield, Loader2 } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/constants'
import { initDodoCheckout } from '@/lib/dodo-payments'
import api from '@/lib/api'

interface Plan {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  max_projects: number
  dedicated_project_included: boolean
  infra_type: string
  database_storage_mb: number
  file_storage_mb: number
  bandwidth_gb: number
  has_daily_backups: boolean
  backup_retention_days: number
  has_edge_functions: boolean
  has_custom_domains: boolean
  has_authentication: boolean
  has_realtime_apis: boolean
  has_rest_mcp_apis: boolean
  has_priority_compute: boolean
  has_advanced_monitoring: boolean
  mcp_requests_per_minute: number
  support_tier: string
}

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan?: string
  currentBillingCycle?: string
  onSuccess?: () => void
}

function formatStorage(mb: number): string {
  if (mb >= 1024 * 1024) return `${(mb / (1024 * 1024)).toFixed(0)}TB`
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)}GB`
  return `${mb}MB`
}

function formatBandwidth(gb: number): string {
  if (gb >= 1024) return `${(gb / 1024).toFixed(0)}TB`
  return `${gb}GB`
}

function getSupportLabel(tier: string): string {
  switch (tier) {
    case 'priority_sla': return 'Priority & SLA support'
    case 'email': return 'Email support'
    default: return 'Community support'
  }
}

function getInfraLabel(plan: Plan): string {
  if (plan.infra_type === 'high_performance') return 'High-performance PostgreSQL instance'
  if (plan.infra_type === 'dedicated') return 'Dedicated PostgreSQL instance'
  return 'Shared PostgreSQL infrastructure'
}

function getDedicatedLabel(plan: Plan): string {
  if (plan.name === 'scale') return 'First high-performance dedicated project included'
  return 'First dedicated project included'
}

function getPlanFeatures(plan: Plan): string[] {
  const features: string[] = []

  if (plan.name === 'free') {
    features.push(`${plan.max_projects} Project`)
    features.push(getInfraLabel(plan))
    features.push(`${formatStorage(plan.database_storage_mb)} database storage`)
    features.push(`${formatBandwidth(plan.bandwidth_gb)} bandwidth`)
    features.push(`${formatStorage(plan.file_storage_mb)} file storage`)
    if (plan.has_authentication) features.push('Authentication')
    if (plan.has_realtime_apis) features.push('Realtime APIs')
    if (plan.has_rest_mcp_apis) features.push('REST & MCP APIs')
    features.push(getSupportLabel(plan.support_tier))
  } else if (plan.name === 'pro') {
    if (plan.dedicated_project_included) features.push(getDedicatedLabel(plan))
    features.push(getInfraLabel(plan))
    features.push(`${formatStorage(plan.database_storage_mb)} database storage`)
    features.push(`${formatStorage(plan.file_storage_mb)} file storage`)
    features.push(`${formatBandwidth(plan.bandwidth_gb)} bandwidth`)
    if (plan.has_daily_backups) features.push(`Daily backups (${plan.backup_retention_days}-day retention)`)
    if (plan.has_edge_functions) features.push('Edge Functions')
    if (plan.has_custom_domains) features.push('Custom domains')
    if (plan.has_authentication) features.push('Authentication')
    if (plan.has_realtime_apis) features.push('Realtime APIs')
    if (plan.has_rest_mcp_apis) features.push('REST & MCP APIs')
    features.push(`${plan.mcp_requests_per_minute} MCP requests/minute`)
    features.push(getSupportLabel(plan.support_tier))
  } else if (plan.name === 'scale') {
    if (plan.dedicated_project_included) features.push(getDedicatedLabel(plan))
    features.push(getInfraLabel(plan))
    features.push(`${formatStorage(plan.database_storage_mb)} database storage`)
    features.push(`${formatStorage(plan.file_storage_mb)} file storage`)
    features.push(`${formatBandwidth(plan.bandwidth_gb)} bandwidth`)
    if (plan.has_daily_backups) features.push(`Daily backups (${plan.backup_retention_days}-day retention)`)
    if (plan.has_priority_compute) features.push('Priority compute resources')
    if (plan.has_advanced_monitoring) features.push('Advanced monitoring')
    if (plan.has_edge_functions) features.push('Edge Functions')
    if (plan.has_custom_domains) features.push('Custom domains')
    if (plan.has_authentication) features.push('Authentication')
    if (plan.has_realtime_apis) features.push('Realtime APIs')
    if (plan.has_rest_mcp_apis) features.push('REST & MCP APIs')
    features.push(`${plan.mcp_requests_per_minute} MCP requests/minute`)
    features.push(getSupportLabel(plan.support_tier))
  }

  return features
}

export function SubscriptionModal({ isOpen, onClose, currentPlan = 'free', currentBillingCycle = 'monthly', onSuccess }: SubscriptionModalProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(currentBillingCycle === 'yearly' ? 'yearly' : 'monthly')
  const [loading, setLoading] = useState(false)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) fetchPlans()
  }, [isOpen])

  async function fetchPlans() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/v1/pricing/plans')
      setPlans(data.plans || [])
    } catch (e) {
      setError('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribe(plan: Plan) {
    setSubscribing(plan.name)
    setError(null)
    try {
      const { data } = await api.post('/api/v1/pricing/subscribe', {
        plan_name: plan.name,
        billing_cycle: billingCycle,
        return_url: `${window.location.origin}/dashboard/profile?billing=success`,
      })
      if (data.checkout_url) {
        initDodoCheckout({ checkout_url: data.checkout_url })
      } else {
        onSuccess?.()
        onClose()
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Subscription failed')
    } finally {
      setSubscribing(null)
    }
  }

  async function handleUpgrade(plan: Plan) {
    setSubscribing(plan.name)
    setError(null)
    try {
      const { data } = await api.post('/api/v1/pricing/upgrade', {
        new_plan_name: plan.name,
        return_url: `${window.location.origin}/dashboard/profile?billing=success`,
      })
      if (data.checkout_url) {
        initDodoCheckout({ checkout_url: data.checkout_url })
      } else {
        onSuccess?.()
        onClose()
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Upgrade failed')
    } finally {
      setSubscribing(null)
    }
  }

  async function handleDowngrade(plan: Plan) {
    setSubscribing(plan.name)
    setError(null)
    try {
      const { data } = await api.post('/api/v1/pricing/downgrade', {
        new_plan_name: plan.name,
      })
      onSuccess?.()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Downgrade failed')
    } finally {
      setSubscribing(null)
    }
  }

  async function handleCycleSwitch() {
    setSubscribing(currentPlan)
    setError(null)
    try {
      const { data } = await api.post('/api/v1/pricing/switch-cycle', {
        billing_cycle: billingCycle,
        return_url: `${window.location.origin}/dashboard/profile?billing=success`,
      })
      if (data.checkout_url) {
        initDodoCheckout({ checkout_url: data.checkout_url })
      } else {
        onSuccess?.()
        onClose()
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Billing cycle switch failed')
    } finally {
      setSubscribing(null)
    }
  }

  function getPrice(plan: Plan) {
    return billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
  }

  function getMonthlyEquivalent(plan: Plan) {
    if (billingCycle === 'yearly' && plan.price_yearly > 0) {
      return (plan.price_yearly / 12).toFixed(2)
    }
    return plan.price_monthly.toFixed(2)
  }

  if (!isOpen) return null

  const planOrder = ['free', 'pro', 'scale']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0a1628] rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-blue-500/20">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#0a1628] border-b border-zinc-200 dark:border-blue-500/20 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Choose your plan</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Select the plan that fits your needs</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-500 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-blue-500 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs text-blue-400 font-medium">Save 7%</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans
                .sort((a, b) => planOrder.indexOf(a.name) - planOrder.indexOf(b.name))
                .map((plan) => {
                  const isCurrent = plan.name === currentPlan
                  const isUpgrade = planOrder.indexOf(plan.name) > planOrder.indexOf(currentPlan)
                  const isDowngrade = planOrder.indexOf(plan.name) < planOrder.indexOf(currentPlan)
                  const isPro = plan.name === 'pro'
                  const features = getPlanFeatures(plan)

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-xl border p-6 flex flex-col bg-white dark:bg-[#0d1f3c] ${
                        isPro
                          ? 'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500/20'
                          : 'border-zinc-200 dark:border-blue-500/10'
                      }`}
                    >
                      {isPro && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                          Most popular
                        </div>
                      )}

                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          {plan.name === 'scale' && <Shield className="w-4 h-4 text-violet-500" />}
                          {plan.name === 'pro' && <Zap className="w-4 h-4 text-emerald-500" />}
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide text-sm">{plan.display_name}</h3>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                            ${getMonthlyEquivalent(plan)}
                          </span>
                          <span className="text-sm text-zinc-500">/mo</span>
                        </div>
                        {billingCycle === 'yearly' && plan.price_monthly > 0 && (
                          <p className="text-xs text-zinc-500 mt-1">
                            ${getPrice(plan).toFixed(2)}/year
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 italic">
                        {plan.description}
                      </p>

                      {/* Features */}
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                            <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Action Button */}
                      {isCurrent ? (
                        <div className="space-y-2">
                          <div className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-400 text-center border border-blue-500/20">
                            Current Plan ({currentBillingCycle === 'yearly' ? 'Yearly' : 'Monthly'})
                          </div>
                          {billingCycle !== currentBillingCycle && (
                            <button
                              onClick={handleCycleSwitch}
                              disabled={subscribing !== null}
                              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                            >
                              {subscribing === plan.name ? (
                                <span className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Processing...
                                </span>
                              ) : `Switch to ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`}
                            </button>
                          )}
                        </div>
                      ) : isUpgrade ? (
                        <button
                          onClick={() => currentPlan === 'free' ? handleSubscribe(plan) : handleUpgrade(plan)}
                          disabled={subscribing !== null}
                          className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                            isPro
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 text-white border border-transparent dark:border-blue-500/20'
                          } disabled:opacity-50`}
                        >
                          {subscribing === plan.name ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </span>
                          ) : currentPlan === 'free' ? 'Get Started' : 'Upgrade'}
                        </button>
                      ) : isDowngrade ? (
                        <button
                          onClick={() => plan.name === 'free' ? handleDowngrade(plan) : handleDowngrade(plan)}
                          disabled={subscribing !== null}
                          className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-800 transition-colors disabled:opacity-50"
                        >
                          {subscribing === plan.name ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </span>
                          ) : 'Downgrade'}
                        </button>
                      ) : null}
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
