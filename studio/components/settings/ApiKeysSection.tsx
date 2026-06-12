'use client'

import { useState } from 'react'
import { Key, Copy, Check, Eye, EyeOff, RefreshCw, AlertCircle, Shield } from 'lucide-react'
import { Button } from '@/components/Button'

interface ApiKeysSectionProps {
    apiKeys: any
    apiAccessEnabled: boolean
    regenerating: string | null
    copied: string | null
    onCopy: (text: string, type: string) => void
    onRegenerate: (keyType: 'anon' | 'service_role') => void
    onToggleAccess: () => void
    togglingAccess: boolean
    directConnectionEnabled: boolean
    onToggleDirectConnection: () => void
    showDbPassword: boolean
    onToggleDbPassword: () => void
    project: any
}

export function ApiKeysSection({
    apiKeys,
    apiAccessEnabled,
    regenerating,
    copied,
    onCopy,
    onRegenerate,
    onToggleAccess,
    togglingAccess,
    directConnectionEnabled,
    onToggleDirectConnection,
    showDbPassword,
    onToggleDbPassword,
    project
}: ApiKeysSectionProps) {
    const [showServiceKey, setShowServiceKey] = useState(false)

    return (
        <div className="space-y-6">
            {/* API Endpoint */}
            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                        <Key className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">API Endpoint</h2>
                        <p className="text-sm text-zinc-500 dark:text-white/60">Your project's API base URL</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="flex-1 glass-input border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 font-mono text-sm overflow-x-auto">
                        {apiKeys?.rest_url || apiKeys?.api_endpoint}
                    </div>
                    <button
                        onClick={() => onCopy(apiKeys?.rest_url || apiKeys?.api_endpoint || '', 'endpoint')}
                        className="p-2.5 hover:bg-zinc-100 dark:bg-white/10 rounded-md text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white transition border border-zinc-200 dark:border-white/20"
                    >
                        {copied === 'endpoint' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* API Keys */}
            {apiAccessEnabled && apiKeys && (
                <div className="space-y-6">
                    {/* Anon Key */}
                    <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                                    <Key className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Anonymous Key</h2>
                                    <p className="text-sm text-zinc-500 dark:text-white/60">Safe to use in client-side code</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onRegenerate('anon')}
                                disabled={regenerating === 'anon'}
                                className="px-3 py-2 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-100 dark:bg-white/20 text-zinc-900 dark:text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center space-x-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${regenerating === 'anon' ? 'animate-spin' : ''}`} />
                                <span>{regenerating === 'anon' ? 'Regenerating...' : 'Regenerate'}</span>
                            </button>
                        </div>

                        <div className="flex items-center space-x-2">
                            <div className="flex-1 glass-input border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 font-mono text-sm overflow-x-auto">
                                {apiKeys.anon_key}
                            </div>
                            <button
                                onClick={() => onCopy(apiKeys.anon_key, 'anon')}
                                className="p-2.5 hover:bg-zinc-100 dark:bg-white/10 rounded-md text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white transition border border-zinc-200 dark:border-white/20"
                            >
                                {copied === 'anon' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Service Role Key */}
                    <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-orange-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Service Role Key</h2>
                                    <p className="text-sm text-zinc-500 dark:text-white/60">Full database access - keep secret!</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onRegenerate('service_role')}
                                disabled={regenerating === 'service_role'}
                                className="px-3 py-2 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-100 dark:bg-white/20 text-zinc-900 dark:text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center space-x-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${regenerating === 'service_role' ? 'animate-spin' : ''}`} />
                                <span>{regenerating === 'service_role' ? 'Regenerating...' : 'Regenerate'}</span>
                            </button>
                        </div>

                        <div className="flex items-center space-x-2 mb-4">
                            <div className="flex-1 glass-input border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 font-mono text-sm overflow-x-auto relative">
                                {showServiceKey ? apiKeys.service_role_key : '•'.repeat(40)}
                                <button
                                    onClick={() => setShowServiceKey(!showServiceKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white"
                                >
                                    {showServiceKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <button
                                onClick={() => onCopy(apiKeys.service_role_key, 'service')}
                                className="p-2.5 hover:bg-zinc-100 dark:bg-white/10 rounded-md text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white transition border border-zinc-200 dark:border-white/20"
                            >
                                {copied === 'service' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-red-300 font-medium mb-1">
                                    This key has full database access. Never share it publicly or expose it in client-side code.
                                </p>
                                <p className="text-sm text-red-300">
                                    If leaked, regenerate a new key immediately using the button above.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* API Access Control */}
            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/30 transition-all duration-300">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">API Access Control</h2>
                <p className="text-sm text-zinc-500 dark:text-white/60 mb-4">
                    {apiAccessEnabled
                        ? 'Temporarily disable all API key access to your project database. This will delete all API keys.'
                        : 'Enable API key access to your project. This will generate new API keys for your project.'}
                </p>
                <Button
                    onClick={onToggleAccess}
                    disabled={togglingAccess}
                    variant="outline"
                    className={`${apiAccessEnabled
                            ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                            : 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                        }`}
                >
                    {togglingAccess
                        ? 'Processing...'
                        : apiAccessEnabled
                            ? 'Disable API Access'
                            : 'Enable API Access'}
                </Button>
            </div>

            {/* Direct Database Connection */}
            {project?.deployment_type === 'rds' && (
                <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-amber-500/30 transition-all duration-300">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Direct Database Connection</h2>
                            <p className="text-sm text-zinc-500 dark:text-white/60">Connect directly to your RDS instance</p>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                        <p className="text-sm text-amber-700 dark:text-amber-200 mb-2">
                            <strong>⚠️ Advanced Feature:</strong> Direct database connections bypass API security layers.
                        </p>
                        <ul className="text-sm text-amber-700 dark:text-amber-200 space-y-1 ml-4">
                            <li>• Use only for trusted applications and admin tools</li>
                            <li>• Requires password verification to enable</li>
                            <li>• Connection details will be visible once enabled</li>
                        </ul>
                    </div>

                    <Button
                        onClick={onToggleDirectConnection}
                        variant="outline"
                        className={`${directConnectionEnabled
                                ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                                : 'border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                            }`}
                    >
                        <Shield className="w-4 h-4 mr-2" />
                        {directConnectionEnabled ? 'Disable Direct Connection' : 'Enable Direct Connection'}
                    </Button>

                    {directConnectionEnabled && project && (
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-500 dark:text-white/70 mb-2">Host</label>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 glass-input border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 font-mono text-sm">
                                        {project.db_host}
                                    </div>
                                    <button
                                        onClick={() => onCopy(project.db_host, 'host')}
                                        className="p-2.5 hover:bg-zinc-100 dark:bg-white/10 rounded-md text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white transition border border-zinc-200 dark:border-white/20"
                                    >
                                        {copied === 'host' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-500 dark:text-white/70 mb-2">Port</label>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 glass-input border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 font-mono text-sm">
                                        {project.db_port}
                                    </div>
                                    <button
                                        onClick={() => onCopy(project.db_port?.toString() || '', 'port')}
                                        className="p-2.5 hover:bg-zinc-100 dark:bg-white/10 rounded-md text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white transition border border-zinc-200 dark:border-white/20"
                                    >
                                        {copied === 'port' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-500 dark:text-white/70 mb-2">Database Name</label>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 glass-input border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 font-mono text-sm">
                                        {project.db_name}
                                    </div>
                                    <button
                                        onClick={() => onCopy(project.db_name, 'dbname')}
                                        className="p-2.5 hover:bg-zinc-100 dark:bg-white/10 rounded-md text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white transition border border-zinc-200 dark:border-white/20"
                                    >
                                        {copied === 'dbname' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-500 dark:text-white/70 mb-2">Username</label>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 glass-input border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 font-mono text-sm">
                                        {project.db_user}
                                    </div>
                                    <button
                                        onClick={() => onCopy(project.db_user, 'user')}
                                        className="p-2.5 hover:bg-zinc-100 dark:bg-white/10 rounded-md text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white transition border border-zinc-200 dark:border-white/20"
                                    >
                                        {copied === 'user' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-500 dark:text-white/70 mb-2">Password</label>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 glass-input border border-zinc-200 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 font-mono text-sm relative">
                                        {showDbPassword ? project.db_password : '•'.repeat(20)}
                                        <button
                                            onClick={onToggleDbPassword}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white"
                                        >
                                            {showDbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => onCopy(project.db_password, 'password')}
                                        className="p-2.5 hover:bg-zinc-100 dark:bg-white/10 rounded-md text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:text-white transition border border-zinc-200 dark:border-white/20"
                                    >
                                        {copied === 'password' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
