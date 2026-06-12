'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Server,
  HardDrive,
  Activity,
  Rocket,
  Check,
  AlertCircle,
  Wifi,
  Loader2,
  ExternalLink,
  Globe,
  Shield,
  Copy,
  ArrowUpRight,
  Database,
} from 'lucide-react'
import { Button } from '@/components/Button'
import api from '@/lib/api'

/* ─── Storage & Egress Upgrade widget ─── */
function StorageEgressUpgrade({
  slug,
  project,
  onRefresh,
}: {
  slug: string
  project: any
  onRefresh: () => void
}) {
  const [pricing, setPricing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [newStorage, setNewStorage] = useState<number | null>(null)
  const [newEgress, setNewEgress] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadPricing = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/resource-pricing`)
      setPricing(res.data)
      setNewStorage(res.data.current_storage_gb)
      setNewEgress(res.data.current_egress_gb)
    } catch (e: any) {
      setPricing(null)
      setLoadError(e.response?.data?.detail || e.message || 'Could not load resource pricing')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadPricing()
  }, [loadPricing])

  if (loading) {
    return (
      <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500 dark:text-white/40" />
      </div>
    )
  }
  if (!pricing && loadError) {
    return (
      <div className="glass-card border border-red-500/20 rounded-xl p-6 space-y-3">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-400" />
          Storage &amp; Egress
        </h3>
        <p className="text-sm text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {loadError}
        </p>
        <Button type="button" variant="secondary" onClick={() => loadPricing()}>
          Retry
        </Button>
      </div>
    )
  }
  if (!pricing) return null

  const canCustomize = pricing.allows_paid_resource_upgrades === true

  const storageCur: number = pricing.current_storage_gb
  const egressCur: number = pricing.current_egress_gb

  // Always include the currently saved value in steps so it stays visible + highlighted
  const rawStorageSteps: number[] = pricing.upgrade_options?.storage_steps_gb || [10, 20, 50, 100, 200, 500]
  const rawEgressSteps: number[] = pricing.upgrade_options?.egress_steps_gb || [50, 100, 200, 500, 1000]
  const storageSteps: number[] = Array.from(new Set([...rawStorageSteps, storageCur])).sort((a, b) => a - b)
  const egressSteps: number[] = Array.from(new Set([...rawEgressSteps, egressCur])).sort((a, b) => a - b)

  const storageChanged = newStorage !== null && newStorage !== storageCur
  const egressChanged = newEgress !== null && newEgress !== egressCur
  const hasChanges = storageChanged || egressChanged

  const extraStoragePreview = Math.max(0, (newStorage ?? storageCur) - pricing.base_storage_gb)
  const extraEgressPreview = Math.max(0, (newEgress ?? egressCur) - pricing.base_egress_gb)
  const additionalCost =
    (extraStoragePreview * pricing.overage_storage_price_cents_per_gb +
      extraEgressPreview * pricing.overage_egress_price_cents_per_gb) / 100

  const handleSave = async () => {
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const params: any = {}
      if (storageChanged) params.storage_limit_gb = newStorage
      if (egressChanged) params.egress_limit_gb = newEgress
      const patchRes = await api.patch(`/api/v1/projects/${slug}/resources`, null, { params })
      const note = patchRes.data?.billing_note
      setSuccessMsg(
        note
          ? 'Limits updated. ' + note
          : 'Resources updated. Add-on fees apply starting on your next subscription renewal.'
      )
      onRefresh()
      const res = await api.get(`/api/v1/projects/${slug}/resource-pricing`)
      setPricing(res.data)
      setNewStorage(res.data.current_storage_gb)
      setNewEgress(res.data.current_egress_gb)
    } catch (e: any) {
      setErrorMsg(e.response?.data?.detail || 'Failed to update resources')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-400" />
          Storage &amp; Egress
        </h3>
        {pricing.infrastructure_type === 'dedicated' && (
          <span className="text-xs text-zinc-500 dark:text-white/50 bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded">
            Server: {pricing.server_size}
          </span>
        )}
      </div>

      {pricing.billing_note && (
        <p className="text-xs text-zinc-500 dark:text-white/45 leading-relaxed border-l-2 border-zinc-200 dark:border-white/10 pl-3">
          {pricing.billing_note}
        </p>
      )}

      {!canCustomize && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 space-y-2">
          <p>
            Extra storage and egress add-ons are available on{' '}
            <strong className="text-zinc-900 dark:text-white">Pro</strong> and <strong className="text-zinc-900 dark:text-white">Scale</strong>{' '}
            only. Your plan is <strong className="text-zinc-900 dark:text-white capitalize">{pricing.effective_plan || 'free'}</strong>.
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-200 dark:text-amber-200/70">
            Current allocation: {pricing.current_storage_gb} GB storage · {pricing.current_egress_gb} GB egress / month
            (included limits for your tier).
          </p>
          <Link
            href="/dashboard/profile?tab=subscription"
            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 dark:text-amber-200 underline underline-offset-2 dark:hover:text-white text-sm font-medium"
          >
            View plans &amp; upgrade <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {canCustomize && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Storage selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-zinc-500 dark:text-white/70 font-medium">Database Storage</label>
            <span className="text-xs text-zinc-500 dark:text-white/40">
              Base: {pricing.base_storage_gb} GB included
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {storageSteps.map((gb) => {
              const isActive = (newStorage ?? storageCur) === gb
              const isCurrent = gb === storageCur
              const isBelow = gb < storageCur
              return (
                <button
                  key={gb}
                  onClick={() => !isBelow && setNewStorage(gb)}
                  disabled={isBelow}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition ${
                    isActive
                      ? 'border-zinc-200 dark:border-white/10 bg-purple-500/10 text-purple-300'
                      : isBelow
                        ? 'border-zinc-200 dark:border-white/5 bg-white/[0.02] text-zinc-500 dark:text-white/20 cursor-not-allowed'
                        : 'border-zinc-200 dark:border-white/10 bg-white/[0.03] text-zinc-500 dark:text-white/70 hover:border-zinc-200 dark:border-white/10 hover:text-zinc-900 dark:text-white'
                  }`}
                >
                  {gb} GB
                  {isCurrent && !isActive && (
                    <span className="block text-[10px] text-purple-400/70">current</span>
                  )}
                  {isActive && (
                    <span className="block text-[10px] text-purple-300">✓ selected</span>
                  )}
                  {!isCurrent && !isActive && gb > pricing.base_storage_gb && (
                    <span className="block text-[10px] text-zinc-500 dark:text-white/40">
                      +${(((gb - pricing.base_storage_gb) * pricing.overage_storage_price_cents_per_gb) / 100).toFixed(2)}/mo
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-zinc-500 dark:text-white/40">
            ${(pricing.overage_storage_price_cents_per_gb / 100).toFixed(2)}/GB/mo for extra storage
          </p>
        </div>

        {/* Egress selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-zinc-500 dark:text-white/70 font-medium">Monthly Egress</label>
            <span className="text-xs text-zinc-500 dark:text-white/40">
              Base: {pricing.base_egress_gb} GB included
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {egressSteps.map((gb) => {
              const isActive = (newEgress ?? egressCur) === gb
              const isCurrent = gb === egressCur
              const isBelow = gb < egressCur
              return (
                <button
                  key={gb}
                  onClick={() => !isBelow && setNewEgress(gb)}
                  disabled={isBelow}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition ${
                    isActive
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                      : isBelow
                        ? 'border-zinc-200 dark:border-white/5 bg-white/[0.02] text-zinc-500 dark:text-white/20 cursor-not-allowed'
                        : 'border-zinc-200 dark:border-white/10 bg-white/[0.03] text-zinc-500 dark:text-white/70 hover:border-cyan-500/30 hover:text-zinc-900 dark:text-white'
                  }`}
                >
                  {gb} GB
                  {isCurrent && !isActive && (
                    <span className="block text-[10px] text-cyan-400/70">current</span>
                  )}
                  {isActive && (
                    <span className="block text-[10px] text-cyan-300">✓ selected</span>
                  )}
                  {!isCurrent && !isActive && gb > pricing.base_egress_gb && (
                    <span className="block text-[10px] text-zinc-500 dark:text-white/40">
                      +${(((gb - pricing.base_egress_gb) * pricing.overage_egress_price_cents_per_gb) / 100).toFixed(2)}/mo
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-zinc-500 dark:text-white/40">
            ${(pricing.overage_egress_price_cents_per_gb / 100).toFixed(2)}/GB/mo for extra egress
          </p>
        </div>
      </div>
      )}

      {/* Cost summary + save */}
      {canCustomize && hasChanges && (
        <div className="flex items-center justify-between p-4 bg-purple-500/5 border border-zinc-200 dark:border-white/10 rounded-lg">
          <div>
            <p className="text-sm text-zinc-500 dark:text-white/80">
              Additional monthly cost:{' '}
              <span className="font-semibold text-zinc-900 dark:text-white">
                {additionalCost > 0 ? `$${additionalCost.toFixed(2)}` : '$0.00 (included)'}
              </span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-white/40 mt-0.5">
              {extraStoragePreview > 0 && `+${extraStoragePreview} GB storage`}
              {extraStoragePreview > 0 && extraEgressPreview > 0 && ' · '}
              {extraEgressPreview > 0 && `+${extraEgressPreview} GB egress`}
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200 mt-2">
              This add-on amount is charged on your <strong className="text-zinc-500 dark:text-white/90">next</strong> plan renewal,
              not mid-cycle. Higher limits apply right away for usage metering.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm px-6"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                Apply changes
              </span>
            )}
          </Button>
        </div>
      )}

      {successMsg && (
        <p className="text-sm text-green-400 flex items-center gap-1">
          <Check className="w-4 h-4" /> {successMsg}
        </p>
      )}
      {errorMsg && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </p>
      )}
    </div>
  )
}

type Plan = { plan_id?: string; plan_name?: string; name?: string; status?: string }

type EcsSize = {
  id: string
  display_name: string
  ram_mb: number
  storage_gb: number
  vcpu: number
  price_monthly: number
  list_price_usd_per_hour?: number
  billable_hours_per_month?: number
  included_egress_gb_per_month?: number
  aws_region?: string
}

type Estimate = {
  server_size: string
  display_name: string
  rate_per_hour_usd: number | null
  estimated_monthly_usd: number | null
  billable_hours_per_month: number
  included_egress_gb_per_month: number
  aws_region?: string
}

interface DedicatedInfraSettingsProps {
  slug: string
  project: any
  usage: any
  loadingUsage: boolean
  currentPlan: Plan | null
  regions: { code: string; name: string }[]
  currentProjectRegion: string
  currentRDSInstance: any
  onRefresh: () => void
  onRequestPlanUpgrade: (server: EcsSize) => void
}

export function DedicatedInfraSettings({
  slug,
  project,
  usage,
  loadingUsage,
  currentPlan,
  regions,
  currentProjectRegion,
  currentRDSInstance,
  onRefresh,
  onRequestPlanUpgrade,
}: DedicatedInfraSettingsProps) {
  const [ecsSizes, setEcsSizes] = useState<EcsSize[]>([])
  const [loadingEcs, setLoadingEcs] = useState(true)
  const [selected, setSelected] = useState<EcsSize | null>(null)
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loadingEstimate, setLoadingEstimate] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dbAccessEnabled, setDbAccessEnabled] = useState(false)
  const [dbAccessCheckbox, setDbAccessCheckbox] = useState(false)
  const [togglingDbAccess, setTogglingDbAccess] = useState(false)
  const [connInfo, setConnInfo] = useState<any>(null)
  const [loadingConn, setLoadingConn] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [stackStatus, setStackStatus] = useState<any>(null)
  const [billingPreview, setBillingPreview] = useState<any>(null)
  const [migrationPolling, setMigrationPolling] = useState<{
    active: boolean
    status: string | null
    error: string | null
  }>({ active: false, status: null, error: null })

  const currentServerSize = stackStatus?.server_size

  const planSlug =
    (currentPlan?.plan_name || currentPlan?.name || 'pro')
      .toLowerCase()
      .replace(/\s+/g, '_') || 'pro'
  const hasSubscription =
    currentPlan && currentPlan.plan_id !== 'free' && currentPlan.status === 'active'
  const isDedicated =
    project?.infrastructure_type === 'dedicated' || project?.deployment_type === 'dedicated'
  const isRds = project?.deployment_type === 'rds'

  const loadEcsSizes = useCallback(async () => {
    setLoadingEcs(true)
    try {
      const res = await api.get(
        `/api/v1/pricing/server-sizes?for_plan=${encodeURIComponent(planSlug)}`
      )
      const list = res.data?.server_sizes || []
      setEcsSizes(list)
    } catch {
      setEcsSizes([])
    } finally {
      setLoadingEcs(false)
    }
  }, [planSlug])

  useEffect(() => {
    loadEcsSizes()
  }, [loadEcsSizes])

  useEffect(() => {
    if (!isDedicated) return
    const loadDedicatedInfo = async () => {
      setLoadingConn(true)
      try {
        const [connRes, statusRes, billingRes] = await Promise.all([
          api.get(`/api/v1/infrastructure/${slug}/connection`),
          api.get(`/api/v1/infrastructure/${slug}/status`),
          api.get(`/api/v1/billing/dedicated/renewal-preview/${slug}`).catch(() => null),
        ])
        setConnInfo(connRes.data)
        setStackStatus(statusRes.data)
        setDbAccessEnabled(connRes.data?.db_access_enabled || false)
        if (billingRes?.data) setBillingPreview(billingRes.data)
      } catch {}
      setLoadingConn(false)
    }
    loadDedicatedInfo()
  }, [isDedicated, slug])

  // Resume polling if the project is mid-migration when the page loads
  useEffect(() => {
    const inFlight = project?.migration_status === 'provisioning' || project?.migration_status === 'migrating'
    if (inFlight && !migrationPolling.active) {
      setMigrationPolling({ active: true, status: project.migration_status, error: null })
      _startMigrationPoller()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.migration_status])

  const openSelect = async (server: EcsSize) => {
    setError(null)
    if (false) return
    if (isDedicated && server.id === currentServerSize) return
    if (!hasSubscription) {
      onRequestPlanUpgrade(server)
      return
    }
    if (isRds) {
      setError('This project uses AWS RDS. Use RDS billing tools or contact support to change instance size.')
      return
    }
    setSelected(server)
    setLoadingEstimate(true)
    setShowConfirm(true)
    try {
      const res = await api.get('/api/v1/pricing/dedicated-estimate', {
        params: { server_size: server.id },
      })
      setEstimate(res.data)
    } catch (e: any) {
      setEstimate(null)
      setError(e.response?.data?.detail || 'Could not load estimate')
    } finally {
      setLoadingEstimate(false)
    }
  }

  const runMigration = async () => {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/v1/pricing/upgrade', {
        project_slug: slug,
        server_size: selected.id,
        db_access: dbAccessCheckbox,
      })
      setShowConfirm(false)
      setSelected(null)
      setEstimate(null)
      // Start polling for migration status (backend returns 202)
      setMigrationPolling({ active: true, status: 'provisioning', error: null })
      _startMigrationPoller()
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Migration failed')
    } finally {
      setSubmitting(false)
    }
  }

  const _startMigrationPoller = useCallback(() => {
    let attempts = 0
    const maxAttempts = 120 // up to ~10 minutes at 5 s intervals

    const poll = async () => {
      try {
        const res = await api.get(`/api/v1/pricing/upgrade-status/${slug}`)
        const { migration_status, migration_error } = res.data
        setMigrationPolling({ active: true, status: migration_status, error: migration_error ?? null })

        if (migration_status === 'completed') {
          setMigrationPolling({ active: false, status: 'completed', error: null })
          onRefresh()
          return
        }
        if (migration_status === 'failed') {
          setMigrationPolling({ active: false, status: 'failed', error: migration_error ?? 'Migration failed' })
          setError(migration_error ?? 'Migration failed on the server. Check logs.')
          return
        }
      } catch {
        // ignore transient poll errors
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(poll, 5000)
      } else {
        setMigrationPolling({ active: false, status: null, error: null })
        setError('Migration is taking longer than expected. Please refresh the page.')
      }
    }

    setTimeout(poll, 3000) // first poll after 3 s
  }, [slug, onRefresh])

  const egress = usage?.egress
  const egressPct = Math.min(100, egress?.percentage ?? 0)

  /** True when this project is on shared infra and the user has an active Pro+ sub */
  const canUpgradeNow = !isDedicated && !isRds && hasSubscription

  const handleToggleDbAccess = async () => {
    setTogglingDbAccess(true)
    setError(null)
    try {
      const res = await api.put(`/api/v1/infrastructure/${slug}/db-access`, {
        enabled: !dbAccessEnabled,
      })
      setDbAccessEnabled(res.data.db_access_enabled)
      setConnInfo((prev: any) => ({
        ...prev,
        db_access_enabled: res.data.db_access_enabled,
        public_ip: res.data.public_ip,
        pgbouncer_port: res.data.pgbouncer_port,
      }))
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to toggle DB access')
    } finally {
      setTogglingDbAccess(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-white/60">Egress (this month)</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {loadingUsage
                  ? '…'
                  : egress
                    ? `${egress.transfer_gb?.toFixed(3) ?? '0'} / ${egress.included_gb ?? '?'} GB`
                    : '—'}
              </p>
            </div>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-white/10 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all"
              style={{ width: `${egressPct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-white/50 mt-2">
            API response bytes toward your plan data-transfer pool (egress + ingress).
          </p>
        </div>

        <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-white/60">Database storage</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {usage?.storage ? (
                  usage.storage.display_in_mb ? (
                    <>
                      {usage.storage.used_mb} MB / {usage.storage.limit_gb} GB
                    </>
                  ) : (
                    <>
                      {usage.storage.used_gb} / {usage.storage.limit_gb} GB
                    </>
                  )
                ) : (
                  '…'
                )}
              </p>
            </div>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-white/10 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${usage?.storage?.percentage ?? 0}%` }}
            />
          </div>
        </div>

        <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-white/60">API requests (month)</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {usage?.requests
                  ? `${(usage.requests.this_month || 0).toLocaleString()} / ${(
                      usage.requests.limit_per_month || 0
                    ).toLocaleString()}`
                  : '…'}
              </p>
            </div>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-white/10 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${usage?.requests?.percentage ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Storage & Egress (paid add-ons) — directly under usage so it is easy to find ── */}
      <StorageEgressUpgrade slug={slug} project={project} onRefresh={onRefresh} />

      {/* ── Current Month Billing (dedicated only) ── */}
      {isDedicated && billingPreview && (
        <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Current Month Billing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-100 dark:bg-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-500 dark:text-white/50 mb-1">Running Hours</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {Number(billingPreview.running_hours || 0).toFixed(0)}
                <span className="text-sm font-normal text-zinc-500 dark:text-white/40 ml-1">hrs</span>
              </p>
            </div>
            <div className="bg-zinc-100 dark:bg-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-500 dark:text-white/50 mb-1">Hourly Rate</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                ${Number(billingPreview.rate_per_hour_usd || 0).toFixed(4)}
                <span className="text-sm font-normal text-zinc-500 dark:text-white/40 ml-1">/hr</span>
              </p>
            </div>
            <div className="bg-zinc-100 dark:bg-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-500 dark:text-white/50 mb-1">Compute Cost</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {project?.is_included_in_plan
                  ? <span className="text-green-400 text-base">Included in Pro</span>
                  : `$${Number(billingPreview.compute_cost_usd || 0).toFixed(2)}`
                }
              </p>
            </div>
            <div className="bg-zinc-100 dark:bg-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-500 dark:text-white/50 mb-1">Total (with overage)</p>
              <p className="text-xl font-bold text-purple-300">
                {project?.is_included_in_plan
                  ? `$${(Number(billingPreview.usage?.storage_overage_usd || 0) + Number(billingPreview.usage?.egress_overage_usd || 0)).toFixed(2)}`
                  : `$${Number(billingPreview.total_usd || 0).toFixed(2)}`
                }
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-white/40 mt-3">
            Billing period: {billingPreview.period_start} to {billingPreview.period_end}. Dedicated compute, storage/egress
            add-ons, and overages are rolled into your <strong className="text-zinc-500 dark:text-white/60">next</strong> Dodo subscription
            renewal—not charged as separate mid-cycle invoices here.
          </p>
        </div>
      )}

      <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
          <Server className="w-5 h-5 text-purple-400" />
          Deployment region
        </h3>
        <p className="text-sm text-zinc-500 dark:text-white/60">
          {regions.find((r) => r.code === currentProjectRegion)?.name || currentProjectRegion}
          {isRds && currentRDSInstance ? ' · AWS RDS' : ' · Shared control plane'}
        </p>
      </div>

      {isRds && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-900 dark:text-amber-200 text-sm">
          This project is on <strong>AWS RDS</strong>. Dedicated ECS sizes below apply to shared → ECS
          migrations only. Manage RDS instance size from your existing RDS purchase flow.
        </div>
      )}

      {/* ── Migration in-progress banner ── */}
      {migrationPolling.active && (
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-zinc-200 dark:border-white/10 rounded-xl p-5 flex items-start gap-4">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              {migrationPolling.status === 'provisioning'
                ? 'Provisioning your dedicated Postgres…'
                : 'Migrating data to dedicated Postgres…'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-white/50 mt-1">
              This can take 5–10 minutes. You can safely leave this page — we&apos;ll continue in the background.
            </p>
          </div>
        </div>
      )}

      {/* ── Migration completed banner ── */}
      {!migrationPolling.active && migrationPolling.status === 'completed' && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/40 rounded-xl p-5 flex items-start gap-4">
          <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Migration completed successfully!</p>
            <p className="text-xs text-zinc-500 dark:text-white/50 mt-1">Your project is now running on a dedicated Postgres instance.</p>
          </div>
        </div>
      )}

      {/* ── Upgrade banner for shared projects ── */}
      {!isDedicated && !isRds && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-zinc-200 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Rocket className="w-6 h-6 text-purple-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                Move this project to a dedicated instance
              </h3>
              <p className="text-sm text-zinc-500 dark:text-white/60 mb-4">
                Your project is currently on the <strong className="text-zinc-900 dark:text-white">shared</strong> Postgres pool.
                Upgrading moves the <strong className="text-zinc-900 dark:text-white">same project</strong> — same slug, same API keys, same data — to
                your own isolated EKS Postgres. No new project is created.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { icon: '🔒', title: 'Isolated compute', desc: 'Dedicated CPU & RAM, no noisy-neighbours' },
                  { icon: '⚡', title: 'Predictable performance', desc: 'No shared connection limits' },
                  { icon: '📦', title: 'Same project, zero disruption', desc: 'Slug, API keys & data carry over automatically' },
                ].map((item) => (
                  <div key={item.title} className="bg-zinc-100 dark:bg-white/5 rounded-lg p-3 border border-zinc-200 dark:border-white/10">
                    <p className="text-base mb-1">{item.icon}</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-white/50 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>

              {!hasSubscription ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    You need an active <strong className="text-zinc-900 dark:text-white">Pro</strong> or higher subscription to upgrade to dedicated.
                  </div>
                  <a
                    href="/dashboard/profile?tab=subscription"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-zinc-900 dark:text-white text-sm font-medium rounded-lg transition"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Upgrade plan
                  </a>
                </div>
              ) : (
                <p className="text-xs text-green-300 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  You have an active Pro subscription — select a server size below to migrate this project.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isDedicated && (
        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-900 dark:text-green-200 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            This project is on a <strong className="ml-1">dedicated ECS</strong> stack
            {currentServerSize && <span className="ml-1">({currentServerSize})</span>}.
          </div>

          {/* DB Access Toggle */}
          <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  {dbAccessEnabled ? (
                    <Globe className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Shield className="w-5 h-5 text-zinc-500 dark:text-white/60" />
                  )}
                </div>
                <div>
                  <p className="text-zinc-900 dark:text-white font-medium">Public DB access (PgBouncer port 6432)</p>
                  <p className="text-xs text-zinc-500 dark:text-white/50">
                    {dbAccessEnabled
                      ? 'Internet clients can connect to your database via PgBouncer.'
                      : 'Only the control plane (VPC) can reach your database.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleDbAccess}
                disabled={togglingDbAccess}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  dbAccessEnabled ? 'bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500' : 'bg-zinc-200 dark:bg-white/20'
                }`}
              >
                {togglingDbAccess ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-900 dark:text-white absolute left-1/2 -translate-x-1/2" />
                ) : (
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      dbAccessEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Connection Details */}
          {loadingConn ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500 dark:text-white/40" />
            </div>
          ) : connInfo ? (
            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-500 dark:text-white/80 uppercase tracking-wider">
                Connection details
              </h3>
              {[
                { label: 'Host (private)', value: connInfo.host },
                ...(connInfo.db_access_enabled && connInfo.public_ip
                  ? [{ label: 'Host (public)', value: connInfo.public_ip }]
                  : []),
                { label: 'Port (PgBouncer)', value: String(connInfo.pgbouncer_port || connInfo.port) },
                { label: 'Database', value: connInfo.database },
                { label: 'User', value: connInfo.user },
                { label: 'Password', value: connInfo.password },
                ...(connInfo.region ? [{ label: 'Region', value: connInfo.region }] : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-white/50">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <code className="text-zinc-500 dark:text-white/90 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded text-xs font-mono">
                      {row.label === 'Password' ? '••••••••' : row.value}
                    </code>
                    <button
                      onClick={() => copyToClipboard(row.value, row.label)}
                      className="text-zinc-500 dark:text-white/30 hover:text-zinc-500 dark:text-white/70 transition"
                      title={`Copy ${row.label}`}
                    >
                      {copied === row.label ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {connInfo.db_access_enabled && connInfo.public_ip && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-zinc-200 dark:border-white/10 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-200 font-mono break-all">
                    psql &quot;postgresql://{connInfo.user}:***@{connInfo.public_ip}:{connInfo.pgbouncer_port || connInfo.port}/{connInfo.database}&quot;
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center space-x-2">
          <Rocket className="w-6 h-6 text-purple-400" />
          <span>Server Sizes</span>
        </h2>
        <p className="text-sm text-zinc-500 dark:text-white/60 mb-4">
          {isDedicated
            ? 'Scale your dedicated Postgres instance to a different size.'
            : canUpgradeNow
              ? 'Choose a size to upgrade this project from shared to dedicated. Your data is migrated automatically.'
              : 'Upgrade to a Pro plan first, then select a server size to move this project to dedicated.'}
        </p>

        <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {loadingEcs ? (
            <div className="col-span-full flex justify-center py-12 text-zinc-500 dark:text-white/60">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : ecsSizes.length === 0 ? (
            <div className="col-span-full text-center text-zinc-500 dark:text-white/60 py-8">
              No ECS sizes for your plan. Upgrade or contact support.
            </div>
          ) : (
            ecsSizes.map((server) => {
              const isCurrent = isDedicated && server.id === currentServerSize
              const isIncludedInPlan = isCurrent && project?.is_included_in_plan
              return (
              <button
                key={server.id}
                type="button"
                onClick={() => openSelect(server)}
                disabled={isCurrent}
                className={`text-left glass-card border rounded-xl p-6 transition relative ${
                  isCurrent
                    ? 'border-green-500/50 opacity-70 cursor-not-allowed'
                    : 'border-zinc-200 dark:border-white/10 hover:border-zinc-200 dark:border-white/10'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
                    <Check className="w-3 h-3" /> {isIncludedInPlan ? 'Included in Pro' : 'Current'}
                  </span>
                )}
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">{server.display_name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-500 dark:text-white/80">
                    <span>RAM</span>
                    <span>{server.ram_mb >= 1024 ? `${(server.ram_mb / 1024).toFixed(1)} GB` : `${server.ram_mb} MB`}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 dark:text-white/80">
                    <span>Storage</span>
                    <span>{server.storage_gb} GB</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 dark:text-white/80">
                    <span>vCPU</span>
                    <span>{server.vcpu}</span>
                  </div>
                  {server.included_egress_gb_per_month != null && (
                    <div className="flex justify-between text-zinc-500 dark:text-white/80">
                      <span>Egress</span>
                      <span>{server.included_egress_gb_per_month} GB / mo</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-zinc-200 dark:border-white/10">
                    <span className="text-zinc-500 dark:text-white/60">Per hour</span>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {project?.is_included_in_plan && isCurrent
                        ? <span className="text-green-400 text-lg">Included in Pro</span>
                        : server.list_price_usd_per_hour != null
                          ? `$${Number(server.list_price_usd_per_hour).toFixed(4)}`
                          : `$${Number(server.price_monthly).toFixed(2)}/mo`
                      }
                    </span>
                  </div>
                  {!isCurrent && server.list_price_usd_per_hour != null && (
                    <p className="text-xs text-zinc-500 dark:text-white/40">
                      ~${(Number(server.list_price_usd_per_hour) * 730).toFixed(2)}/mo if running 24/7
                    </p>
                  )}
                </div>
                <div className="mt-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-zinc-900 dark:text-white text-sm font-medium text-center">
                  {isCurrent
                    ? isIncludedInPlan ? 'Included in Pro' : 'Current size'
                    : hasSubscription && !isRds
                      ? isDedicated ? 'Scale to this size' : 'Select & estimate'
                      : !hasSubscription ? 'Upgrade plan' : '—'}
                </div>
              </button>
              )
            })
          )}
        </div>
      </div>

      {showConfirm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-card border border-zinc-200 dark:border-white/20 rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              {isDedicated ? 'Confirm scale' : 'Upgrade project to dedicated'}
            </h3>
            <p className="text-zinc-500 dark:text-white/70 text-sm">
              {isDedicated ? (
                <>
                  Scale <strong className="text-zinc-900 dark:text-white">{slug}</strong> to a{' '}
                  <strong className="text-zinc-900 dark:text-white">{selected.display_name}</strong> server.
                </>
              ) : (
                <>
                  This will move your existing project <strong className="text-zinc-900 dark:text-white">{slug}</strong> from the
                  shared pool to a dedicated <strong className="text-zinc-900 dark:text-white">{selected.display_name}</strong> EKS
                  Postgres. Your <strong className="text-zinc-900 dark:text-white">same project slug, API keys, and all data</strong>{' '}
                  carry over — no new project is created.
                </>
              )}
            </p>
            {loadingEstimate ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : estimate ? (
              <div className="bg-zinc-100 dark:bg-white/5 rounded-lg p-4 text-sm space-y-3 text-zinc-500 dark:text-white/90">
                <div className="flex justify-between">
                  <span>Server</span>
                  <span className="font-medium">{estimate.display_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>RAM</span>
                  <span>{selected.ram_mb >= 1024 ? `${(selected.ram_mb / 1024).toFixed(1)} GB` : `${selected.ram_mb} MB`}</span>
                </div>
                <div className="flex justify-between">
                  <span>vCPU</span>
                  <span>{selected.vcpu}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage</span>
                  <span>{selected.storage_gb} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Egress included</span>
                  <span>{estimate.included_egress_gb_per_month ?? 50} GB / month</span>
                </div>
                <div className="flex justify-between">
                  <span>Region</span>
                  <span>{estimate.aws_region === 'ap-south-1' ? 'Mumbai (ap-south-1)' : estimate.aws_region || '—'}</span>
                </div>
                <div className="pt-3 border-t border-zinc-200 dark:border-white/10 space-y-2">
                  <div className="flex justify-between font-semibold text-zinc-900 dark:text-white text-base">
                    <span>Hourly rate</span>
                    <span className="text-purple-300">
                      ${estimate.rate_per_hour_usd != null
                        ? Number(estimate.rate_per_hour_usd).toFixed(4)
                        : Number(selected.list_price_usd_per_hour || 0).toFixed(4)
                      } / hour
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500 dark:text-white/50">
                    <span>Est. full month (730 hrs)</span>
                    <span>
                      ~${(Number(estimate.rate_per_hour_usd || selected.list_price_usd_per_hour || 0) * 730).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-white/40 mt-1">
                    You&apos;re billed only for actual running hours. Charges are added to your next subscription renewal.
                  </p>
                </div>
              </div>
            ) : null}

            {/* DB Access option */}
            <label className="flex items-center gap-3 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={dbAccessCheckbox}
                onChange={(e) => setDbAccessCheckbox(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-200 dark:border-white/20 bg-zinc-100 dark:bg-white/5 text-blue-500 focus:ring-blue-500/50"
              />
              <div>
                <span className="text-sm text-zinc-900 dark:text-white">Enable public DB access (API + DB connection)</span>
                <p className="text-xs text-zinc-500 dark:text-white/50">
                  Opens PgBouncer port 6432 to the internet. You can toggle this later in settings.
                </p>
              </div>
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false)
                  setSelected(null)
                  setEstimate(null)
                  setError(null)
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={runMigration}
                disabled={submitting || loadingEstimate || !estimate}
                className="bg-gradient-to-r from-purple-600 to-pink-600 min-w-[200px]"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
                    {isDedicated ? 'Scaling…' : 'Upgrading…'}
                  </span>
                ) : (
                  isDedicated ? 'Confirm & scale' : 'Confirm & upgrade'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
