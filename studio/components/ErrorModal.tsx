'use client'

import { XCircle, AlertTriangle, CheckCircle2, X, RefreshCw } from 'lucide-react'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  error: {
    message: string
    aws_error_code?: string
    suggestion?: string
    refund?: {
      success: boolean
      refund_id?: string
      amount?: number
      status?: string
      message?: string
    }
  }
  onRetry?: () => void
}

export function ErrorModal({ isOpen, onClose, error, onRetry }: ErrorModalProps) {
  if (!isOpen) return null

  const isFreeTierError = error.message?.toLowerCase().includes('free plan') || 
                          error.message?.toLowerCase().includes('free tier')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto glass-card border-2 border-red-500/30 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 px-6 py-4 flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Operation Failed</h2>
              <p className="text-sm text-zinc-500 dark:text-white/60">
                {isFreeTierError ? 'AWS Account Limitation' : 'RDS Modification Error'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-300 mb-1">Error Details</h3>
                <p className="text-zinc-500 dark:text-white/80 text-sm leading-relaxed">{error.message}</p>
                {error.aws_error_code && (
                  <p className="text-zinc-500 dark:text-white/50 text-xs mt-2">
                    Error Code: <code className="bg-zinc-100 dark:bg-white/10 px-2 py-0.5 rounded">{error.aws_error_code}</code>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Refund Information */}
          {error.refund?.success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-300 text-lg mb-2">
                    💰 Automatic Refund Initiated
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-green-500/20">
                      <span className="text-zinc-500 dark:text-white/60 text-sm">Refund ID</span>
                      <code className="text-green-300 font-mono text-sm bg-green-500/10 px-3 py-1 rounded">
                        {error.refund.refund_id}
                      </code>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-500/20">
                      <span className="text-zinc-500 dark:text-white/60 text-sm">Amount</span>
                      <span className="text-green-300 font-bold text-lg">₹{error.refund.amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-zinc-500 dark:text-white/60 text-sm">Status</span>
                      <span className="text-green-300 font-medium capitalize">{error.refund.status}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-500/5 rounded-lg">
                    <p className="text-zinc-500 dark:text-white/70 text-sm">
                      <strong className="text-green-300">Good news!</strong> Your money will be refunded within <strong>5-7 business days</strong> to your original payment method.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestion */}
          {error.suggestion && (
            <div className="bg-blue-500/10 border border-zinc-200 dark:border-white/10 rounded-xl p-4">
              <h3 className="font-semibold text-blue-300 mb-2 flex items-center space-x-2">
                <span>💡</span>
                <span>What should you do?</span>
              </h3>
              <p className="text-zinc-500 dark:text-white/70 text-sm leading-relaxed">{error.suggestion}</p>
            </div>
          )}

          {/* Free Tier Specific Help */}
          {isFreeTierError && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <h3 className="font-semibold text-amber-700 dark:text-amber-200 mb-3">⚡ How to Fix This</h3>
              <ul className="space-y-2 text-sm text-zinc-500 dark:text-white/70">
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                  <span>Upgrade your AWS account from free tier to a standard account</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                  <span>Try selecting a <code className="bg-zinc-100 dark:bg-white/10 px-1 rounded">db.t3.micro</code> or <code className="bg-zinc-100 dark:bg-white/10 px-1 rounded">db.t2.micro</code> instance (free tier eligible)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                  <span>Contact AWS support to enable larger instance types</span>
                </li>
              </ul>
              <div className="mt-3">
                <a
                  href="https://aws.amazon.com/premiumsupport/plans/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:text-amber-200 text-sm font-medium hover:underline"
                >
                  Learn more about AWS account plans →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-zinc-100 dark:bg-white/5 border-t border-zinc-200 dark:border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-zinc-500 dark:text-white/70 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-white/5 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
          <div className="flex items-center space-x-3">
            <a
              href="/support"
              className="px-6 py-2.5 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-white/10 rounded-lg transition-colors font-medium border border-zinc-200 dark:border-white/20"
            >
              Contact Support
            </a>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-zinc-900 dark:text-white rounded-lg transition-all font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Different Instance</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

