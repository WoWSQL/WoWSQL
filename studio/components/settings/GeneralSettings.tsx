'use client'

import { Database, Trash2 } from 'lucide-react'
import { Button } from '@/components/Button'

interface GeneralSettingsProps {
    project: any
    onDeleteClick: () => void
}

export function GeneralSettings({ project, onDeleteClick }: GeneralSettingsProps) {
    return (
        <div className="space-y-6">
            {/* Project Info */}
            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <Database className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Project Information</h2>
                        <p className="text-sm text-zinc-500 dark:text-white/60">Basic details about your project</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-500 dark:text-white/70 mb-2">Project Name</label>
                        <div className="glass-input border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5">
                            {project?.name}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-500 dark:text-white/70 mb-2">Project Slug</label>
                        <div className="glass-input border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 font-mono">
                            {project?.slug}
                        </div>
                    </div>

                    {project?.description && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-500 dark:text-white/70 mb-2">Description</label>
                            <div className="glass-input border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5">
                                {project.description}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card border border-red-500/30 rounded-xl p-6 hover:border-red-500/50 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <Trash2 className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Danger Zone</h2>
                        <p className="text-sm text-zinc-500 dark:text-white/60">Irreversible and destructive actions</p>
                    </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-300 mb-2">
                        <strong>Warning:</strong> Deleting this project will permanently remove all data, including:
                    </p>
                    <ul className="text-sm text-red-300/80 space-y-1 ml-4">
                        <li>• All database tables and data</li>
                        <li>• API keys and access credentials</li>
                        <li>• Project configuration and settings</li>
                        <li>• All backups and snapshots</li>
                    </ul>
                </div>

                <Button
                    onClick={onDeleteClick}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                </Button>
            </div>
        </div>
    )
}
