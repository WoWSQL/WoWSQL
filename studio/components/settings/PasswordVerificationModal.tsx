'use client'

import { Shield, X } from 'lucide-react'
import { Input } from '@/components/Input'

interface PasswordVerificationModalProps {
    isOpen: boolean
    onClose: () => void
    onVerify: () => void
    password: string
    onPasswordChange: (value: string) => void
    error: string
    verifying: boolean
}

export function PasswordVerificationModal({
    isOpen,
    onClose,
    onVerify,
    password,
    onPasswordChange,
    error,
    verifying
}: PasswordVerificationModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card border border-amber-500/30 rounded-2xl max-w-md w-full p-6">
                <div className="flex items-start space-x-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Verify Your Password</h3>
                        <p className="text-sm text-zinc-500 dark:text-white/60">
                            Enter your account password to enable direct database connection
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-6">
                    <Input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && password && !verifying) {
                                onVerify()
                            }
                        }}
                        className="w-full"
                    />
                    {error && (
                        <p className="text-sm text-red-400 mt-2">{error}</p>
                    )}
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={verifying}
                        className="flex-1 px-4 py-3 border border-zinc-200 dark:border-white/20 hover:bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white rounded-lg font-medium transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onVerify}
                        disabled={!password || verifying}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-zinc-900 dark:text-white rounded-lg font-medium transition disabled:opacity-50"
                    >
                        {verifying ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                </div>
            </div>
        </div>
    )
}
