'use client'

import { Cpu, HardDrive, Activity, Server, Rocket, Check, AlertCircle } from 'lucide-react'

interface ComputeAndDiskProps {
    usage: any
    project: any
    currentRDSInstance: any
    regions: any[]
    currentProjectRegion: string
    migrationInProgress: boolean
    currentPlan: any
    serverTypes: any[]
    loadingServers: boolean
    onServerClick: (server: any) => void
    upgradingServer: boolean
}

export function ComputeAndDisk({
    usage,
    project,
    currentRDSInstance,
    regions,
    currentProjectRegion,
    migrationInProgress,
    currentPlan,
    serverTypes,
    loadingServers,
    onServerClick,
    upgradingServer
}: ComputeAndDiskProps) {
    return (
        <div className="space-y-8">
            {/* Resource Usage */}
            <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Cpu className="w-6 h-6 text-blue-400" />
                    <span>Resource Usage</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* RAM Usage */}
                    <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <Cpu className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-zinc-500 dark:text-white/60">RAM</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                    {usage && usage.ram ? (
                                        `${usage.ram.used_mb}MB / ${usage.ram.limit_mb}MB`
                                    ) : 'Loading...'}
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-white/10 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${usage ? usage.ram.percentage : 0}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-white/50 mt-2">
                            {usage ? `${usage.ram.percentage}% used` : 'Loading...'}
                        </p>
                    </div>

                    {/* Storage Usage */}
                    <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                <HardDrive className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-zinc-500 dark:text-white/60">Database Storage</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                    {usage && usage.storage ? (
                                        usage.storage.display_in_mb
                                            ? `${usage.storage.used_mb}MB / ${usage.storage.limit_gb}GB`
                                            : `${usage.storage.used_gb}GB / ${usage.storage.limit_gb}GB`
                                    ) : 'Loading...'}
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-white/10 rounded-full h-2">
                            <div
                                className="bg-purple-500 h-2 rounded-full transition-all"
                                style={{ width: `${usage ? usage.storage.percentage : 0}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-white/50 mt-2">
                            {usage ? `${usage.storage.percentage}% used` : 'Loading...'}
                        </p>
                    </div>

                    {/* Requests Usage */}
                    <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-zinc-500 dark:text-white/60">Requests/Month</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                    {usage && usage.requests ? (() => {
                                        const limit = usage.requests.limit_per_month || 50000;
                                        const limitDisplay = limit >= 1000000
                                            ? `${(limit / 1000000).toFixed(0)}M`
                                            : limit >= 1000
                                                ? `${(limit / 1000).toFixed(0)}K`
                                                : limit.toString();
                                        return `${(usage.requests.this_month || 0).toLocaleString()} / ${limitDisplay}`;
                                    })() : 'Loading...'}
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-white/10 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${usage && usage.requests ? usage.requests.percentage : 0}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-white/50 mt-2">
                            {usage && usage.requests ? `${usage.requests.percentage}% used` : 'Loading...'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Deployment region (read-only; set at project creation) */}
            <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Server className="w-6 h-6 text-purple-400" />
                    <span>Deployment Region</span>
                </h2>
                <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
                    <p className="text-sm text-zinc-500 dark:text-white/60">
                        Deployment region: <span className="text-zinc-900 dark:text-white font-semibold">
                            {regions.find(r => r.code === currentProjectRegion)?.name || currentProjectRegion}
                            {project?.deployment_type === 'rds' && currentRDSInstance ? ' (AWS RDS)' : ' (Shared)'}
                        </span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-white/50 mt-1">Region is set at project creation and cannot be changed here. You can only change server size below.</p>
                </div>
            </div>

            {/* Server Configuration Cards */}
            <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Rocket className="w-6 h-6 text-purple-400" />
                    <span>Available Instances</span>
                </h2>

                <p className="text-sm text-zinc-500 dark:text-white/60 mb-4">
                    Showing instances for <span className="text-zinc-900 dark:text-white font-semibold">
                        {regions.find(r => r.code === currentProjectRegion)?.name || currentProjectRegion} (current region)
                    </span>
                </p>

                {migrationInProgress && (
                    <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>Server selection is disabled while migration is in progress</span>
                        </p>
                    </div>
                )}

                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${migrationInProgress ? 'opacity-50 pointer-events-none' : ''}`}>
                    {loadingServers ? (
                        <div className="col-span-full text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            <p className="text-zinc-500 dark:text-white/60 mt-2">Loading server configurations...</p>
                        </div>
                    ) : serverTypes.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <AlertCircle className="w-12 h-12 text-amber-600 dark:text-amber-500 mx-auto mb-4" />
                            <p className="text-zinc-900 dark:text-white font-semibold">No server types available</p>
                            <p className="text-zinc-500 dark:text-white/60 text-sm mt-1">Please contact support</p>
                        </div>
                    ) : serverTypes.slice(0, 6).map((server) => {
                        const hasSubscription = currentPlan && currentPlan.plan_id !== 'free' && currentPlan.status === 'active'
                        const isCurrentInstance = project?.deployment_type === 'rds' && currentRDSInstance
                            ? server.instance_type === currentRDSInstance.instance_type &&
                            server.region === currentRDSInstance.region
                            : false

                        return (
                            <div
                                key={server.instance_type}
                                onClick={() => !isCurrentInstance && !migrationInProgress && onServerClick(server)}
                                className={`relative rounded-xl p-6 transition-all ${isCurrentInstance
                                    ? 'bg-zinc-100 dark:bg-white/5 border-2 border-purple-500 cursor-default'
                                    : migrationInProgress
                                        ? 'glass-card border border-zinc-200 dark:border-white/10 opacity-50 cursor-not-allowed'
                                        : 'glass-card border border-zinc-200 dark:border-white/10 hover:border-zinc-200 dark:border-white/30 cursor-pointer'
                                    } ${upgradingServer || migrationInProgress ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                {isCurrentInstance && (
                                    <div className="absolute -top-3 left-4">
                                        <span className="px-3 py-1 bg-green-500 text-zinc-900 dark:text-white text-xs font-semibold rounded-full flex items-center space-x-1">
                                            <Check className="w-3 h-3" />
                                            <span>Current</span>
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{server.display_name}</h3>
                                    {isCurrentInstance && (
                                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-zinc-900 dark:text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500 dark:text-white/60 text-sm">RAM</span>
                                        <span className="text-zinc-900 dark:text-white font-semibold">
                                            {server.ram_mb >= 1024 ? `${(server.ram_mb / 1024).toFixed(1)}GB` : `${server.ram_mb}MB`}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500 dark:text-white/60 text-sm">Storage</span>
                                        <span className="text-zinc-900 dark:text-white font-semibold">{server.storage_gb}GB</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500 dark:text-white/60 text-sm">vCPU</span>
                                        <span className="text-zinc-900 dark:text-white font-semibold">{server.vcpu}</span>
                                    </div>
                                </div>
                                <div className="border-t border-zinc-200 dark:border-white/10 pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-zinc-500 dark:text-white/60 text-sm">Price</span>
                                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">${server.price_monthly.toFixed(2)}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-white/50">/month</p>
                                    {!isCurrentInstance && (
                                        <div className="mt-4">
                                            <div className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-zinc-900 dark:text-white text-sm font-medium text-center">
                                                Click to Purchase
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
