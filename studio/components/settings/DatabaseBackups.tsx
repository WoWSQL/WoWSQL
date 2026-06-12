'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  HardDrive,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  AlertTriangle,
  Camera,
  Database,
} from 'lucide-react'
import { Button } from '@/components/Button'
import api from '@/lib/api'

interface Backup {
  id: string
  project_id: string
  backup_type: 'scheduled' | 'manual'
  /** pg_dump statuses: completed | in_progress | failed | restoring
   *  EBS statuses:     available | creating | failed | restoring | restored | deleted */
  status: string
  size_bytes: number | null
  size_gb: number | null
  started_at: string | null
  completed_at: string | null
  expires_at: string | null
  error_message: string | null
  backup_engine: 'ebs' | 'pg_dump'
  aws_snapshot_id?: string | null
  aws_region?: string | null
}

interface DatabaseBackupsProps {
  slug: string
}

function formatBytes(bytes: number | null, sizeGb: number | null): string {
  // Prefer size_gb for EBS snapshots (size_bytes may be 0 if size_gb is null)
  if (sizeGb && sizeGb > 0) return `${sizeGb} GB`
  if (!bytes || bytes === 0) return '—'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  // pg_dump statuses
  completed:   { icon: CheckCircle2, color: 'text-green-400',  label: 'Completed' },
  in_progress: { icon: Loader2,      color: 'text-blue-400',   label: 'In Progress' },
  failed:      { icon: XCircle,      color: 'text-red-400',    label: 'Failed' },
  restoring:   { icon: RotateCcw,    color: 'text-amber-400',  label: 'Restoring' },
  // EBS snapshot statuses
  available:   { icon: CheckCircle2, color: 'text-green-400',  label: 'Available' },
  creating:    { icon: Loader2,      color: 'text-blue-400',   label: 'Creating' },
  restored:    { icon: CheckCircle2, color: 'text-purple-400', label: 'Restored' },
  deleted:     { icon: XCircle,      color: 'text-zinc-400',   label: 'Deleted' },
}

/** Returns true when a backup is restorable */
function isRestorable(backup: Backup): boolean {
  return backup.status === 'completed' || backup.status === 'available'
}

/** Returns true when a backup/snapshot is still pending work (should trigger polling) */
function isActiveStatus(status: string): boolean {
  return ['in_progress', 'creating', 'restoring'].includes(status)
}

export default function DatabaseBackups({ slug }: DatabaseBackupsProps) {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<Backup | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadBackups = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get(`/api/v1/projects/${slug}/backups`)
      const list: Backup[] = res.data || []
      setBackups(list)

      // Auto-poll while any backup is still in an active state
      const hasActive = list.some(b => isActiveStatus(b.status))
      if (hasActive) {
        pollTimerRef.current = setTimeout(() => loadBackups(true), 5000)
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.response?.data?.detail || 'Failed to load backups. Please try again.')
      }
      setBackups([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadBackups()
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    }
  }, [loadBackups])

  const handleCreateBackup = async () => {
    setCreating(true)
    setError(null)
    try {
      await api.post(`/api/v1/projects/${slug}/backups`)
      await loadBackups()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create backup')
    } finally {
      setCreating(false)
    }
  }

  const handleRestore = async (backup: Backup) => {
    setRestoringId(backup.id)
    setError(null)
    setConfirmRestore(null)
    try {
      await api.post(`/api/v1/projects/${slug}/backups/${backup.id}/restore`)
      // Kick off polling so status updates are reflected automatically
      await loadBackups(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Restore failed. Please try again.')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-purple-400" />
            Database Backups
          </h2>
          <p className="text-sm text-zinc-500 dark:text-white/60 mt-1">
            Daily automatic backups with 7-day retention. Create manual snapshots and restore at any point.
          </p>
        </div>
        <Button
          onClick={handleCreateBackup}
          disabled={creating}
          className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm text-sm shrink-0"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {creating ? 'Creating backup...' : 'Create Backup'}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg p-4 border border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Backup List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500 dark:text-white/40" />
        </div>
      ) : backups.length === 0 ? (
        <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-10 text-center">
          <HardDrive className="w-12 h-12 text-zinc-300 dark:text-white/20 mx-auto mb-4" />
          <h3 className="text-base font-medium text-zinc-600 dark:text-white/70 mb-2">No backups yet</h3>
          <p className="text-sm text-zinc-500 dark:text-white/40 mb-5">
            Automatic daily backups run at 4 AM UTC. You can also create one manually using the button above.
          </p>
          <Button
            onClick={handleCreateBackup}
            disabled={creating}
            className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white text-sm"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {creating ? 'Creating...' : 'Create First Backup'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {backups.map((backup) => {
            const cfg = statusConfig[backup.status] || { icon: AlertTriangle, color: 'text-zinc-400', label: backup.status }
            const StatusIcon = cfg.icon
            const isCurrentlyRestoring = restoringId === backup.id || backup.status === 'restoring'
            const isSpinning = backup.status === 'in_progress' || backup.status === 'creating' || backup.status === 'restoring'
            const canRestore = isRestorable(backup) && !isCurrentlyRestoring && restoringId === null

            return (
              <div
                key={backup.id}
                className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-white/20 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    {/* Status icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        backup.status === 'completed' || backup.status === 'available'
                          ? 'bg-green-500/10'
                          : backup.status === 'failed'
                          ? 'bg-red-500/10'
                          : backup.status === 'restored'
                          ? 'bg-purple-500/10'
                          : 'bg-blue-500/10'
                      }`}
                    >
                      <StatusIcon
                        className={`w-5 h-5 ${cfg.color} ${isSpinning ? 'animate-spin' : ''}`}
                      />
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          {formatDate(backup.started_at)}
                        </span>

                        {/* Type badge */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            backup.backup_type === 'manual'
                              ? 'bg-blue-500/15 text-blue-300'
                              : 'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-white/50'
                          }`}
                        >
                          {backup.backup_type === 'manual' ? 'Manual' : 'Scheduled'}
                        </span>

                        {/* Engine badge */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-white/40 border border-zinc-200 dark:border-white/10">
                          {backup.backup_engine === 'ebs' ? (
                            <><Camera className="w-3 h-3" /> EBS Snapshot</>
                          ) : (
                            <><Database className="w-3 h-3" /> pg_dump</>
                          )}
                        </span>

                        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 dark:text-white/40 flex-wrap">
                        <span>{formatBytes(backup.size_bytes, backup.size_gb)}</span>
                        {backup.completed_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(backup.completed_at)}
                          </span>
                        )}
                        {backup.aws_region && (
                          <span>{backup.aws_region}</span>
                        )}
                        {backup.expires_at && (
                          <span>Expires {formatDate(backup.expires_at)}</span>
                        )}
                      </div>

                      {backup.error_message && (
                        <p className="text-xs text-red-400 mt-1">{backup.error_message}</p>
                      )}

                      {/* Active-state progress hint */}
                      {isSpinning && (
                        <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {backup.status === 'restoring' ? 'Restoring database — this can take a few minutes...' : 'Processing — auto-refreshing every 5s...'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Restore button — shown for completed (pg_dump) and available (EBS) */}
                  {(backup.status === 'completed' || backup.status === 'available') && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canRestore}
                      onClick={() => setConfirmRestore(backup)}
                      className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-white/10 text-xs shrink-0"
                    >
                      {isCurrentlyRestoring ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {isCurrentlyRestoring ? 'Restoring...' : 'Restore'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full border border-zinc-200 dark:border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Restore Database</h3>
                <p className="text-xs text-zinc-500 dark:text-white/40">
                  {confirmRestore.backup_engine === 'ebs' ? 'EBS Snapshot restore' : 'pg_dump restore'}
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-500 dark:text-white/70 mb-2">
              This will replace your current database with the backup from:
            </p>
            <div className="rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-3 mb-4">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{formatDate(confirmRestore.started_at)}</p>
              <p className="text-xs text-zinc-500 dark:text-white/40 mt-0.5">
                {formatBytes(confirmRestore.size_bytes, confirmRestore.size_gb)} &middot; {confirmRestore.backup_type} backup
              </p>
            </div>
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 mb-5">
              <p className="text-xs text-amber-400 leading-relaxed">
                ⚠️ All data written <strong>after this backup</strong> will be permanently lost. Consider creating a fresh backup before restoring.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmRestore(null)}
                className="flex-1 border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRestore(confirmRestore)}
                className="flex-1 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
