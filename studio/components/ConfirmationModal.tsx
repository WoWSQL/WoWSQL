'use client'

import { X, AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  showCascade?: boolean
  cascade?: boolean
  onCascadeChange?: (cascade: boolean) => void
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  showCascade = false,
  cascade = false,
  onCascadeChange
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'text-red-400',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      border: 'border-red-500/30',
      bg: 'bg-red-500/10'
    },
    warning: {
      icon: 'text-amber-500 dark:text-amber-400',
      button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10'
    },
    info: {
      icon: 'text-violet-500 dark:text-violet-400',
      button: 'bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white',
      border: 'border-zinc-200 dark:border-white/10',
      bg: 'bg-violet-500/10'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/20 dark:bg-black/80 backdrop-blur-sm">
      <div className="glass-card border border-zinc-200 dark:border-white/20 rounded-xl p-6 max-w-md w-full animate-fade-in bg-white dark:bg-[#000000]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 dark:text-white/60 dark:hover:text-zinc-900 dark:text-white transition"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className={`${styles.bg} ${styles.border} border rounded-lg p-4`}>
            <p className="text-sm text-zinc-800 dark:text-white/90 whitespace-pre-line">
              {message}
            </p>
          </div>

          {showCascade && (
            <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg">
              <input
                type="checkbox"
                id="cascade-delete"
                checked={cascade}
                onChange={(e) => onCascadeChange?.(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-white/20 bg-white dark:bg-white/5 text-purple-600 focus:ring-purple-500/50 cursor-pointer"
                disabled={isLoading}
              />
              <label htmlFor="cascade-delete" className="text-sm text-zinc-700 dark:text-white/80 cursor-pointer flex-1">
                Delete with CASCADE (automatically delete related records)
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-white/10"
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 ${styles.button}`}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

