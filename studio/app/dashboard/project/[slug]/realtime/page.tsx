'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Radio, Copy, Plus, Trash2, AlertCircle, RefreshCw, Activity, Zap, ArrowRight, Database, Monitor, Code } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/Button'
import api from '@/lib/api'

interface Project {
  id: number
  name: string
  slug: string
  db_name: string
}

interface RealtimeTable {
  id: string
  schema: string
  table: string
  event_types: string[]
  created_at: string | null
}

interface RealtimeStats {
  enabled_tables_count: number
  active_subscriptions_count: number
  status: string
}

export default function RealtimePage() {
  const params = useParams()
  const slug = params.slug as string

  const [project, setProject] = useState<Project | null>(null)
  const [apiEndpoint, setApiEndpoint] = useState<string>('')
  const [anonKey, setAnonKey] = useState<string>('')
  const [enabledTables, setEnabledTables] = useState<RealtimeTable[]>([])
  const [availableTables, setAvailableTables] = useState<string[]>([])
  const [stats, setStats] = useState<RealtimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingTables, setLoadingTables] = useState(false)
  const [selectedTable, setSelectedTable] = useState('')
  const [enabling, setEnabling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    loadProject()
  }, [slug])

  useEffect(() => {
    if (project) {
      loadApiKeys()
      loadEnabledTables()
      loadStats()
    }
  }, [project])

  const loadProject = async () => {
    try {
      const response = await api.get(`/api/v1/projects/${slug}`)
      setProject(response.data)
    } catch (err: any) {
      console.error('Failed to load project:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadApiKeys = async () => {
    try {
      const response = await api.get(`/api/v1/projects/${slug}/api-keys`)
      setApiEndpoint(response.data.api_endpoint || '')
      setAnonKey(response.data.anon_key || '')
    } catch (err: any) {
      console.error('Failed to load API keys:', err)
    }
  }

  const loadEnabledTables = async () => {
    try {
      const response = await api.get('/api/v1/realtime/tables', {
        headers: { 'X-Project-Slug': slug }
      })
      const enabled = response.data.tables || []
      setEnabledTables(enabled)
      await loadAvailableTables(enabled)
    } catch (err: any) {
      console.error('Failed to load enabled tables:', err)
      await loadAvailableTables([])
    }
  }

  const loadAvailableTables = async (enabledTablesList: RealtimeTable[] = enabledTables) => {
    setLoadingTables(true)
    try {
      const response = await api.get('/api/v1/db/tables', {
        headers: { 'X-Project-Slug': slug }
      })
      const tables = response.data || []
      const enabledTableNames = enabledTablesList.map(t => t.table.toLowerCase())
      setAvailableTables(tables.filter((t: string) => !enabledTableNames.includes(t.toLowerCase())))
    } catch (err: any) {
      console.error('Failed to load available tables:', err)
      setAvailableTables([])
    } finally {
      setLoadingTables(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await api.get('/api/v1/realtime/stats', {
        headers: { 'X-Project-Slug': slug }
      })
      setStats(response.data)
    } catch (err: any) {
      console.error('Failed to load realtime stats:', err)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadEnabledTables(), loadStats(), loadApiKeys()])
    setTimeout(() => setRefreshing(false), 500)
  }

  const enableRealtimeForTable = async () => {
    if (!selectedTable || !project) {
      alert('Please select a table')
      return
    }

    setEnabling(true)
    try {
      await api.post(
        `/api/v1/realtime/enable?schema=public&table=${encodeURIComponent(selectedTable)}`,
        {},
        { headers: { 'X-Project-Slug': slug } }
      )
      await loadEnabledTables()
      await loadStats()
      setSelectedTable('')
    } catch (err: any) {
      console.error('Failed to enable realtime:', err)
      alert(err.response?.data?.detail || 'Failed to enable realtime for table')
    } finally {
      setEnabling(false)
    }
  }

  const disableRealtimeForTable = async (schemaName: string, tableName: string) => {
    if (!confirm(`Disable realtime for ${tableName}?`)) return

    try {
      await api.post(
        `/api/v1/realtime/disable?schema=${encodeURIComponent(schemaName)}&table=${encodeURIComponent(tableName)}`,
        {},
        { headers: { 'X-Project-Slug': slug } }
      )
      await loadEnabledTables()
      await loadStats()
    } catch (err: any) {
      console.error('Failed to disable realtime:', err)
      alert(err.response?.data?.detail || 'Failed to disable realtime for table')
    }
  }

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <Radio className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-zinc-900 dark:text-white">Loading realtime configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] overflow-hidden flex transition-colors duration-300">
            <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,0,0,0.8)_70%,transparent_100%)] dark:[mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.8)_70%,transparent_100%)] animate-grid-flow" />
      </div>

      <Sidebar projectSlug={slug} projectName={project.name} />

      <main className="relative z-10 flex-1 p-4 lg:p-8 transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Realtime</h1>
              <p className="text-zinc-600 dark:text-white/60">
                PostgreSQL-native realtime subscriptions in the{' '}
                <code className="text-emerald-400 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-sm">realtime</code> schema
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={refreshing}
              className="flex items-center space-x-2 border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* How Realtime Works - Visual Demo */}
          <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 mb-8 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>How Realtime Works</span>
            </h2>

            {/* Animated Flow Diagram */}
            <div className="relative mb-8">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                {/* Step 1: Your Project DB */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-blue-500/20 border border-zinc-200 dark:border-white/10 rounded-xl flex items-center justify-center mb-3 animate-pulse">
                    <Database className="w-7 h-7 text-blue-400" />
                  </div>
                  <p className="text-xs font-medium text-zinc-900 dark:text-white">Project DB</p>
                  <p className="text-[10px] text-zinc-600 dark:text-white/40 mt-1">Isolated data</p>
                </div>

                <div className="hidden md:flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded animate-[pulse_2s_ease-in-out_infinite]" />
                    <ArrowRight className="w-3 h-3 text-purple-400 animate-[pulse_2s_ease-in-out_infinite_0.5s]" />
                  </div>
                </div>

                {/* Step 2: PG Trigger */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-purple-500/20 border border-zinc-200 dark:border-white/10 rounded-xl flex items-center justify-center mb-3 animate-[pulse_2s_ease-in-out_infinite_0.3s]">
                    <Radio className="w-7 h-7 text-purple-400" />
                  </div>
                  <p className="text-xs font-medium text-zinc-900 dark:text-white">NOTIFY</p>
                  <p className="text-[10px] text-zinc-600 dark:text-white/40 mt-1">Trigger fires</p>
                </div>

                <div className="hidden md:flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-orange-500 rounded animate-[pulse_2s_ease-in-out_infinite_0.5s]" />
                    <ArrowRight className="w-3 h-3 text-orange-400 animate-[pulse_2s_ease-in-out_infinite_1s]" />
                  </div>
                </div>

                {/* Step 3: API Auth */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center mb-3 animate-[pulse_2s_ease-in-out_infinite_0.5s]">
                    <Zap className="w-7 h-7 text-orange-400" />
                  </div>
                  <p className="text-xs font-medium text-zinc-900 dark:text-white">API Key Auth</p>
                  <p className="text-[10px] text-zinc-600 dark:text-white/40 mt-1">SDK validates</p>
                </div>

                <div className="hidden md:flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-0.5 bg-gradient-to-r from-orange-500 to-green-500 rounded animate-[pulse_2s_ease-in-out_infinite_0.8s]" />
                    <ArrowRight className="w-3 h-3 text-green-400 animate-[pulse_2s_ease-in-out_infinite_1.2s]" />
                  </div>
                </div>

                {/* Step 4: Your App */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center mb-3 animate-[pulse_2s_ease-in-out_infinite_0.6s]">
                    <Monitor className="w-7 h-7 text-green-400" />
                  </div>
                  <p className="text-xs font-medium text-zinc-900 dark:text-white">Your App</p>
                  <p className="text-[10px] text-zinc-600 dark:text-white/40 mt-1">Live updates</p>
                </div>
              </div>
            </div>

            {/* Live Simulation */}
            <RealtimeSimulation />

            {/* Code Examples */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-zinc-600 dark:text-white/80 mb-4 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                Quick Start — Subscribe to Changes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-zinc-100 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-zinc-600 dark:text-white/60 font-mono">JavaScript / React</span>
                  </div>
                  <pre className="p-4 text-xs text-zinc-600 dark:text-white/80 overflow-x-auto"><code>{`import { createClient } from '@wowsql/realtime-js'

const wowsql = createClient(
  '${apiEndpoint || 'https://<project>.wowsql.com'}',
  '${anonKey || '<your-anon-key>'}'
)

// Subscribe to changes on a table
const channel = wowsql
  .channel('db-changes')
  .on('postgres_changes', {
    event: '*',       // INSERT | UPDATE | DELETE | *
    schema: 'public',
    table: 'messages',
  }, (payload) => {
    console.log('Change:', payload)
    // { type: 'INSERT', new: { id: 1, text: 'Hello!' } }
  })
  .subscribe()`}</code></pre>
                </div>
                <div className="bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-zinc-100 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-zinc-600 dark:text-white/60 font-mono">How it works</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-400 text-[10px] font-bold">1</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-white/70">Initialize the SDK with your <code className="text-emerald-400 bg-zinc-100 dark:bg-white/5 px-1 rounded">API endpoint</code> and <code className="text-emerald-400 bg-zinc-100 dark:bg-white/5 px-1 rounded">anon key</code></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-[10px] font-bold">2</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-white/70">Enable realtime on your table (installs a PG trigger scoped to <em>this project&apos;s DB only</em>)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-400 text-[10px] font-bold">3</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-white/70">Any INSERT, UPDATE, or DELETE fires <code className="text-emerald-400 bg-zinc-100 dark:bg-white/5 px-1 rounded">pg_notify()</code> inside your isolated database</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">4</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-white/70">The SDK authenticates via your API key and pushes events only to subscribers in <em>your project</em></p>
                    </div>
                    <div className="mt-3 p-2 bg-blue-500/10 border border-zinc-200 dark:border-white/10 rounded text-[10px] text-blue-300/80">
                      Each project has its own database — realtime events never leak between projects.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-white/60">Status</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white capitalize">{stats?.status || 'inactive'}</p>
                </div>
              </div>
            </div>

            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Radio className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-white/60">Enabled Tables</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats?.enabled_tables_count ?? enabledTables.length}</p>
                </div>
              </div>
            </div>

            <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-white/60">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats?.active_subscriptions_count ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SDK Connection — Project Isolated */}
          <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 mb-8 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center space-x-2 mb-4">
              <Code className="w-5 h-5 text-orange-400" />
              <span>SDK Connection</span>
              <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">Project Isolated</span>
            </h2>

            <p className="text-xs text-zinc-600 dark:text-white/50 mb-4">
              Connect to realtime using your project API key. Each project is fully isolated — subscribers only receive events from their own project database.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-600 dark:text-white/60 mb-1">Project API Endpoint</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-blue-400 bg-zinc-100 dark:bg-white/5 px-3 py-2 rounded border border-zinc-200 dark:border-white/10 truncate">
                    {apiEndpoint || `http://localhost:8000/api/v1`}
                  </code>
                  <button
                    onClick={() => handleCopy(apiEndpoint || 'http://localhost:8000/api/v1', 'endpoint')}
                    className="px-3 py-2 text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/20 rounded hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10 transition-colors"
                  >
                    {copiedField === 'endpoint' ? (
                      <span className="text-green-400 text-xs font-medium">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-600 dark:text-white/60 mb-1">Anon Key (public, safe for client-side)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-emerald-400 bg-zinc-100 dark:bg-white/5 px-3 py-2 rounded border border-zinc-200 dark:border-white/10 truncate font-mono">
                    {anonKey || 'Loading...'}
                  </code>
                  <button
                    onClick={() => handleCopy(anonKey, 'anon')}
                    className="px-3 py-2 text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/20 rounded hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10 transition-colors"
                  >
                    {copiedField === 'anon' ? (
                      <span className="text-green-400 text-xs font-medium">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-600 dark:text-white/60 mb-1">Project Slug</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-purple-400 bg-zinc-100 dark:bg-white/5 px-3 py-2 rounded border border-zinc-200 dark:border-white/10 truncate font-mono">
                    {slug}
                  </code>
                  <button
                    onClick={() => handleCopy(slug, 'slug')}
                    className="px-3 py-2 text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/20 rounded hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10 transition-colors"
                  >
                    {copiedField === 'slug' ? (
                      <span className="text-green-400 text-xs font-medium">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {!anonKey && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-zinc-600 dark:text-white/60">
                    API keys not generated yet. Go to <span className="text-amber-600 dark:text-amber-400">Settings &gt; API Keys</span> to generate your project keys.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Enabled Tables */}
          <div className="glass-card border border-zinc-200 dark:border-white/10 rounded-xl p-6 hover:border-zinc-200 dark:border-white/10 transition-all duration-300">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center space-x-2">
              <Radio className="w-5 h-5 text-purple-400" />
              <span>Enabled Tables</span>
              {enabledTables.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400">
                  {enabledTables.length}
                </span>
              )}
            </h2>
            {enabledTables.length === 0 ? (
              <div className="text-center py-8">
                <Radio className="w-12 h-12 text-zinc-600 dark:text-white/20 mx-auto mb-3" />
                <p className="text-zinc-600 dark:text-white/60">No tables enabled for realtime</p>
                <p className="text-xs text-zinc-600 dark:text-white/40 mt-1">
                  Enable a table above to start receiving realtime updates
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-white/10">
                      <th className="pb-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider">Table</th>
                      <th className="pb-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider">Schema</th>
                      <th className="pb-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider">Events</th>
                      <th className="pb-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider">Enabled At</th>
                      <th className="pb-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {enabledTables.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/5 transition-colors">
                        <td className="py-3 pr-4">
                          <code className="text-sm text-zinc-900 dark:text-white font-medium">{item.table}</code>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs text-zinc-600 dark:text-white/50 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded">{item.schema}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-1 flex-wrap">
                            {(item.event_types || ['INSERT', 'UPDATE', 'DELETE']).map((ev) => (
                              <span
                                key={ev}
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  ev === 'INSERT' ? 'bg-green-500/20 text-green-400' :
                                  ev === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {ev}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs text-zinc-600 dark:text-white/50">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => disableRealtimeForTable(item.schema, item.table)}
                            className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40 flex items-center space-x-1 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Disable</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


function RealtimeSimulation() {
  const [events, setEvents] = useState<Array<{ id: number; type: string; table: string; data: string; time: string }>>([])
  const [cursorA, setCursorA] = useState({ x: 30, y: 40 })
  const [cursorB, setCursorB] = useState({ x: 70, y: 60 })
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const eventIdRef = useRef(0)

  const sampleEvents = [
    { type: 'INSERT', table: 'messages', data: '{ "id": 42, "text": "Hello team!" }' },
    { type: 'UPDATE', table: 'users', data: '{ "id": 7, "status": "online" }' },
    { type: 'INSERT', table: 'messages', data: '{ "id": 43, "text": "Got it!" }' },
    { type: 'DELETE', table: 'tasks', data: '{ "id": 15 }' },
    { type: 'UPDATE', table: 'messages', data: '{ "id": 42, "read": true }' },
    { type: 'INSERT', table: 'tasks', data: '{ "id": 16, "title": "Deploy v2" }' },
  ]

  const startSimulation = () => {
    setIsRunning(true)
    setEvents([])
    eventIdRef.current = 0

    intervalRef.current = setInterval(() => {
      const sample = sampleEvents[eventIdRef.current % sampleEvents.length]
      const now = new Date()
      setEvents(prev => {
        const next = [{ ...sample, id: eventIdRef.current, time: now.toLocaleTimeString() }, ...prev]
        return next.slice(0, 6)
      })
      eventIdRef.current++

      setCursorA({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 })
      setCursorB({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 })
    }, 1800)
  }

  const stopSimulation = () => {
    setIsRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-600 dark:text-white/80">Live Simulation</h3>
        <button
          onClick={isRunning ? stopSimulation : startSimulation}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isRunning
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
          }`}
        >
          {isRunning ? 'Stop Demo' : 'Start Demo'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Collaborative Cursors View */}
        <div className="relative bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-lg h-48 overflow-hidden">
          <div className="absolute top-2 left-3 text-xs text-zinc-600 dark:text-white/40 font-mono">Collaborative View</div>
          {isRunning ? (
            <>
              {/* Cursor A */}
              <div
                className="absolute transition-all duration-700 ease-in-out"
                style={{ left: `${cursorA.x}%`, top: `${cursorA.y}%` }}
              >
                <svg width="16" height="20" viewBox="0 0 16 20" className="drop-shadow-lg">
                  <path d="M0 0L16 12L6 12L0 20Z" fill="#8B5CF6" />
                </svg>
                <span className="absolute top-5 left-1 text-[10px] bg-purple-600 text-zinc-900 dark:text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">User A</span>
              </div>
              {/* Cursor B */}
              <div
                className="absolute transition-all duration-700 ease-in-out"
                style={{ left: `${cursorB.x}%`, top: `${cursorB.y}%` }}
              >
                <svg width="16" height="20" viewBox="0 0 16 20" className="drop-shadow-lg">
                  <path d="M0 0L16 12L6 12L0 20Z" fill="#3B82F6" />
                </svg>
                <span className="absolute top-5 left-1 text-[10px] bg-blue-600 text-zinc-900 dark:text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">User B</span>
              </div>
              {/* Dot grid */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-600 dark:text-white/30 text-sm">
              Click &quot;Start Demo&quot; to see live cursors
            </div>
          )}
        </div>

        {/* Event Feed */}
        <div className="bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-lg h-48 overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-zinc-100 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-zinc-100 dark:bg-white/30'}`} />
            <span className="text-xs text-zinc-600 dark:text-white/60 font-mono">Event Stream</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {events.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-600 dark:text-white/30 text-xs">
                {isRunning ? 'Waiting for events...' : 'Start the demo to see events'}
              </div>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-zinc-100 dark:bg-white/5 animate-[fadeSlideIn_0.3s_ease-out]">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    ev.type === 'INSERT' ? 'bg-green-500/30 text-green-400' :
                    ev.type === 'UPDATE' ? 'bg-blue-500/30 text-blue-400' :
                    'bg-red-500/30 text-red-400'
                  }`}>{ev.type}</span>
                  <span className="text-[10px] text-zinc-600 dark:text-white/50 font-mono">{ev.table}</span>
                  <span className="text-[10px] text-zinc-600 dark:text-white/30 font-mono truncate flex-1">{ev.data}</span>
                  <span className="text-[10px] text-zinc-600 dark:text-white/20">{ev.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  )
}
