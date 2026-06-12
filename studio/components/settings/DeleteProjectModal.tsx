'use client'

import { Trash2, AlertTriangle, X } from 'lucide-react'
import { Input } from '@/components/Input'

interface DeleteProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onDelete: () => void
    projectName: string
    confirmText: string
    onConfirmTextChange: (value: string) => void
    password: string
    onPasswordChange: (value: string) => void
    passwordError: string
    deleting: boolean
}

export function DeleteProjectModal({
    isOpen,
    onClose,
    onDelete,
    projectName,
    confirmText,
    onConfirmTextChange,
    password,
    onPasswordChange,
    passwordError,
    deleting
}: DeleteProjectModalProps) {
    if (!isOpen) return null

    const isConfirmValid = confirmText === projectName

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card border border-red-500/30 rounded-2xl max-w-md w-full p-6">
                <div className="flex items-start space-x-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Delete Project</h3>
                        <p className="text-sm text-zinc-500 dark:text-white/60">
                            This action cannot be undone. This will permanently delete your project and all associated data.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-300 mb-2">
                        <strong>⚠️ Warning:</strong> This will permanently delete:
                    </p>
                    <ul className="text-sm text-red-300/80 space-y-1 ml-4">
                        <li>• All database tables and data</li>
                        <li>• API keys and access credentials</li>
                        <li>• Project configuration and settings</li>
                        <li>• All backups and snapshots</li>
                    </ul>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-500 dark:text-white/70 mb-2">
                            Type <span className="font-mono text-zinc-900 dark:text-white">{projectName}</span> to confirm
                        </label>
                        <Input
                            type="text"
                            placeholder={projectName}
                            value={confirmText}
                            onChange={(e) => onConfirmTextChange(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-500 dark:text-white/70 mb-2">
                            Enter your password to confirm
                        </label>
                        <Input
                            type="password"
                            placeholder="Your account password"
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            className="w-full"
                        />
                        {passwordError && (
                            <p className="text-sm text-red-400 mt-2">{passwordError}</p>
                        )}
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 px-4 py-3 border border-zinc-200 dark:border-white/20 hover:bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white rounded-lg font-medium transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={!isConfirmValid || !password || deleting}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-zinc-900 dark:text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center"
                    >
                        {deleting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-900 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Project
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
