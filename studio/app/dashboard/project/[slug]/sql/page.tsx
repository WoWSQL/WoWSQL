'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Play, Plus, Code, BarChart3, Save, Trash2, Clock, X, FileText, List
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Sidebar } from '@/components/Sidebar'
import api from '@/lib/api'

interface QueryTab {
  id: string
  name: string
  query: string
  created_at: Date
  last_run?: Date
  isUnsaved?: boolean
  lastModified: Date
}

interface SavedQuery {
  id: string
  name: string
  query: string
  created_at: Date
  last_run?: Date
}

interface Project {
  name: string
  slug: string
}

interface SchemaInfo {
  name: string
  table_count: number
}

export default function SQLEditorPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [schemas, setSchemas] = useState<SchemaInfo[]>([])
  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [queryTabs, setQueryTabs] = useState<QueryTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultsTab, setResultsTab] = useState<'results' | 'chart'>('results')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveQueryName, setSaveQueryName] = useState('')
  const [showSavedQueriesSidebar, setShowSavedQueriesSidebar] = useState(true)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get active tab
  const activeTab = queryTabs.find(t => t.id === activeTabId)

  // Load project details
  useEffect(() => {
    loadProject()
    loadSchemas()
    loadSavedQueries()
    loadQueryTabs()
  }, [slug])

  const loadProject = async () => {
    try {
      const response = await api.get(`/api/v1/projects/${slug}`)
      setProject(response.data)
    } catch (err) {
      console.error('Failed to load project')
    }
  }

  const loadSchemas = async () => {
    try {
      const response = await api.get('/api/v1/db/schemas', {
        headers: { 'X-Project-Slug': slug }
      })
      setSchemas(response.data)
    } catch (err) {
      console.error('Failed to load schemas')
    }
  }

  const loadSavedQueries = () => {
    const saved = localStorage.getItem(`wowbase_queries_${slug}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSavedQueries(parsed.map((q: any) => ({
          ...q,
          created_at: new Date(q.created_at),
          last_run: q.last_run ? new Date(q.last_run) : undefined
        })))
      } catch (e) {
        console.error('Failed to load queries')
      }
    }
  }

  const loadQueryTabs = () => {
    const saved = localStorage.getItem(`wowbase_query_tabs_${slug}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const tabs = parsed.map((q: any) => ({
          ...q,
          created_at: new Date(q.created_at),
          last_run: q.last_run ? new Date(q.last_run) : undefined,
          lastModified: new Date(q.lastModified)
        }))
        setQueryTabs(tabs)
        if (tabs.length > 0) {
          setActiveTabId(tabs[0].id)
        }
      } catch (e) {
        console.error('Failed to load query tabs')
        createNewQueryTab()
      }
    } else {
      createNewQueryTab()
    }
  }

  // Auto-save whenever tabs change
  useEffect(() => {
    if (queryTabs.length > 0) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(`wowbase_query_tabs_${slug}`, JSON.stringify(queryTabs))
      }, 1000) // Auto-save after 1 second of inactivity
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [queryTabs, slug])

  const createNewQueryTab = () => {
    const newTab: QueryTab = {
      id: `tab_${Date.now()}`,
      name: `Query ${queryTabs.length + 1}`,
      query: '-- Write your PostgreSQL query here\n-- Press CTRL+Enter to run\n\n',
      created_at: new Date(),
      isUnsaved: true,
      lastModified: new Date()
    }
    setQueryTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    setResults(null)
    setError('')
  }

  const closeTab = (tabId: string) => {
    const tabIndex = queryTabs.findIndex(t => t.id === tabId)
    if (tabIndex === -1) return

    const newTabs = queryTabs.filter(t => t.id !== tabId)
    
    // If closing active tab, switch to another tab
    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        // Switch to previous tab or first tab
        const newActiveTab = newTabs[Math.max(0, tabIndex - 1)]
        setActiveTabId(newActiveTab.id)
      } else {
        // No tabs left, create a new one
        createNewQueryTab()
        return
      }
    }
    
    setQueryTabs(newTabs)
  }

  const updateActiveTabQuery = (newQuery: string) => {
    if (!activeTabId) return
    
    setQueryTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, query: newQuery, isUnsaved: true, lastModified: new Date() }
        : tab
    ))
  }

  const switchTab = (tabId: string) => {
    setActiveTabId(tabId)
    setResults(null)
    setError('')
  }

  const saveQueryToLibrary = () => {
    if (!saveQueryName.trim() || !activeTab?.query.trim()) {
      alert('Please enter a query name')
      return
    }

    const newQuery: SavedQuery = {
      id: `saved_${Date.now()}`,
      name: saveQueryName.trim(),
      query: activeTab.query,
      created_at: new Date()
    }

    const updatedQueries = [...savedQueries, newQuery]
    setSavedQueries(updatedQueries)
    localStorage.setItem(`wowbase_queries_${slug}`, JSON.stringify(updatedQueries))
    
    // Mark current tab as saved
    setQueryTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, name: saveQueryName.trim(), isUnsaved: false }
        : tab
    ))
    
    setShowSaveDialog(false)
    setSaveQueryName('')
  }

  const loadSavedQuery = (savedQuery: SavedQuery) => {
    const newTab: QueryTab = {
      id: `tab_${Date.now()}`,
      name: savedQuery.name,
      query: savedQuery.query,
      created_at: new Date(),
      isUnsaved: false,
      lastModified: new Date()
    }
    setQueryTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    setResults(null)
    setError('')
  }

  const deleteSavedQuery = (id: string) => {
    if (!confirm('Are you sure you want to delete this saved query?')) return
    
    const updatedQueries = savedQueries.filter(q => q.id !== id)
    setSavedQueries(updatedQueries)
    localStorage.setItem(`wowbase_queries_${slug}`, JSON.stringify(updatedQueries))
  }

  const executeQuery = async () => {
    if (!activeTab) return

    const cleanQuery = activeTab.query
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim()

    if (!cleanQuery) {
      setError('Please enter a SQL query')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await api.post(
        '/api/v1/db/execute',
        {
          query: activeTab.query,
          schema: selectedSchema
        },
        {
          headers: {
            'X-Project-Slug': slug
          }
        }
      )
      setResults(response.data)
      setResultsTab('results')

      // Update last run time
      setQueryTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, last_run: new Date() }
          : tab
      ))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to execute query')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      executeQuery()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      setShowSaveDialog(true)
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault()
      createNewQueryTab()
    }
  }

  if (!project) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] flex items-center justify-center transition-colors duration-300">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-zinc-500 dark:text-white/60">Loading...</p>
    </div>
  }

  return (
    <div className="h-screen bg-zinc-50 dark:bg-[#000000] overflow-hidden transition-colors duration-300">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,0,0,0.8)_70%,transparent_100%)] dark:[mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.8)_70%,transparent_100%)] animate-grid-flow" />
      </div>

      {/* Unified Sidebar */}
      <Sidebar projectSlug={slug} projectName={project.name} />

      {/* Main Container */}
      <div className="relative z-10 h-full flex transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
        {/* Saved Queries Sidebar */}
        {showSavedQueriesSidebar && (
          <div className="w-80 flex-shrink-0 glass-card border-r border-zinc-200 dark:border-white/10 flex-col hidden md:flex">
            <div className="p-4 border-b border-zinc-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Saved Queries</h3>
                <button 
                  onClick={() => setShowSaveDialog(true)}
                  className="p-1.5 hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 rounded text-purple-400"
                  title="Save current query (Ctrl+S)"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm" size="sm" onClick={createNewQueryTab}>
                <Plus className="w-4 h-4 mr-2" />
                New query
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {savedQueries.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Code className="w-12 h-12 text-zinc-600 dark:text-white/50 mx-auto mb-3" />
                  <p className="text-sm text-zinc-600 dark:text-white/60 mb-2">No saved queries yet</p>
                  <p className="text-xs text-zinc-600 dark:text-white/50">
                    Save your frequently used queries for quick access
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {savedQueries.map((savedQuery) => (
                    <div
                      key={savedQuery.id}
                      className="group p-3 rounded-md cursor-pointer transition hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 border border-transparent"
                      onClick={() => loadSavedQuery(savedQuery)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                            {savedQuery.name}
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-white/50 mt-1 line-clamp-2 font-mono">
                            {savedQuery.query.substring(0, 60)}...
                          </p>
                          <div className="flex items-center space-x-3 mt-2 text-xs text-zinc-600 dark:text-white/50">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {savedQuery.created_at.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSavedQuery(savedQuery.id)
                          }}
                          className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-900/30 rounded text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-white/10">
              <div className="text-xs text-zinc-600 dark:text-white/50 space-y-1">
                <p>💡 Shortcuts:</p>
                <p>• CTRL+Enter - Run query</p>
                <p>• CTRL+S - Save to library</p>
                <p>• CTRL+N - New query</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Query Tabs */}
          <div className="glass-card border-b border-zinc-200 dark:border-white/10 flex items-center overflow-x-auto">
            <div className="flex items-center flex-1 min-w-0">
              {queryTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`group flex items-center gap-2 px-4 py-3 border-r border-zinc-200 dark:border-white/10 cursor-pointer transition min-w-[150px] max-w-[200px] ${
                    activeTabId === tab.id
                      ? 'bg-zinc-100 dark:bg-white/5 border-b-2 border-b-purple-500'
                      : 'hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5'
                  }`}
                  onClick={() => switchTab(tab.id)}
                >
                  <FileText className="w-4 h-4 text-zinc-600 dark:text-white/60 flex-shrink-0" />
                  <span className="text-sm text-zinc-900 dark:text-white truncate flex-1">
                    {tab.name}
                    {tab.isUnsaved && <span className="text-purple-400 ml-1">*</span>}
                  </span>
                  {queryTabs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        closeTab(tab.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-200 dark:hover:bg-white/20 dark:bg-white/10 rounded text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top Toolbar */}
          <div className="glass-card border-b border-zinc-200 dark:border-white/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSavedQueriesSidebar(!showSavedQueriesSidebar)}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 rounded text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white"
                title="Toggle saved queries"
              >
                <List className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-white/60">Auto-saved</span>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5"
              >
                <Save className="w-4 h-4 mr-2" />
                Save to Library
              </Button>
            </div>
          </div>

          {/* SQL Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 relative">
              <textarea
                value={activeTab?.query || ''}
                onChange={(e) => updateActiveTabQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-full p-4 font-mono text-sm bg-white dark:bg-black/50 text-zinc-900 dark:text-white border-0 focus:outline-none resize-none"
                placeholder="-- Write your PostgreSQL query here&#10;-- Press CTRL+Enter to run"
                spellCheck={false}
              />
            </div>

            {/* Results Section */}
            <div className="h-96 border-t border-zinc-200 dark:border-white/10 flex flex-col glass-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-white/10 gap-3">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setResultsTab('results')}
                    className={`px-3 py-1.5 text-sm font-medium ${
                      resultsTab === 'results'
                        ? 'text-zinc-900 dark:text-white border-b-2 border-purple-500'
                        : 'text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Results
                  </button>
                  <button
                    onClick={() => setResultsTab('chart')}
                    className={`px-3 py-1.5 text-sm font-medium ${
                      resultsTab === 'chart'
                        ? 'text-zinc-900 dark:text-white border-b-2 border-purple-500'
                        : 'text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Chart
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-zinc-600 dark:text-white/60">Schema</span>
                  <select
                    value={selectedSchema}
                    onChange={(e) => setSelectedSchema(e.target.value)}
                    className="px-2 py-1 text-xs border border-zinc-200 dark:border-white/20 rounded bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-200 dark:border-white/10"
                  >
                    {schemas.map((s) => (
                      <option key={s.name} value={s.name}>{s.name} ({s.table_count})</option>
                    ))}
                  </select>

                  <Button
                    onClick={executeQuery}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm text-zinc-900 dark:text-white ml-2"
                    size="sm"
                  >
                    {loading ? 'Running...' : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Run
                        <span className="ml-2 text-xs opacity-75">CTRL ↵</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Results Content */}
              <div className="flex-1 overflow-auto p-4">
                {error ? (
                  <div className="text-red-400 text-sm font-mono">{error}</div>
                ) : results ? (
                  resultsTab === 'results' ? (
                    <div className="overflow-x-auto">
                      {results.type === 'select' && results.data && results.data.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-100 dark:bg-white/5">
                            <tr>
                              {results.columns.map((col: string, idx: number) => (
                                <th key={idx} className="px-4 py-2 text-left font-medium text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-white/10">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {results.data.map((row: any, rowIdx: number) => (
                              <tr key={rowIdx} className="hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5">
                                {results.columns.map((col: string, colIdx: number) => (
                                  <td key={colIdx} className="px-4 py-2 border-b border-zinc-200 dark:border-white/10 font-mono text-xs text-zinc-600 dark:text-white/70">
                                    {row[col] !== null ? String(row[col]) : <span className="text-zinc-600 dark:text-white/50 italic">null</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : results.type === 'select' && results.data && results.data.length === 0 ? (
                        <div className="text-yellow-400 text-sm">
                          Query returned 0 rows.
                        </div>
                      ) : results.type === 'mutation' ? (
                        <div className="text-green-400 text-sm">
                          ✓ {results.message}
                        </div>
                      ) : results.type === 'batch' ? (
                        <div className="space-y-3">
                          <div className="text-green-400 text-sm font-medium">
                            ✓ {results.message}
                          </div>
                          {results.results && results.results.length > 0 && (
                            <div className="space-y-1">
                              {results.results.map((r: any, idx: number) => (
                                <div key={idx} className="text-xs font-mono text-zinc-500 dark:text-white/40 flex items-center gap-2">
                                  <span className="text-green-500">✓</span>
                                  <span className="text-zinc-400 dark:text-white/30">Statement {idx + 1}:</span>
                                  {r.type === 'select' ? (
                                    <span>{r.row_count} row(s) returned</span>
                                  ) : (
                                    <span>{r.rows_affected} row(s) affected</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-zinc-600 dark:text-white/50 text-sm">No results to display</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-600 dark:text-white/50">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Chart visualization coming soon</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center text-zinc-600 dark:text-white/50 py-8">
                    <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click Run to execute your query.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Query Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-white dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md border border-zinc-200 dark:border-white/20">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">Save Query to Library</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-zinc-900 dark:text-white">Query Name</label>
                <Input
                  value={saveQueryName}
                  onChange={(e) => setSaveQueryName(e.target.value)}
                  placeholder="e.g., Get all users"
                  autoFocus
                  className="bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-zinc-900 dark:text-white">SQL Preview</label>
                <div className="bg-zinc-100 dark:bg-white/5 p-3 rounded-md max-h-32 overflow-y-auto border border-zinc-200 dark:border-white/10">
                  <code className="text-xs font-mono text-zinc-600 dark:text-white/70">{activeTab?.query.substring(0, 200)}...</code>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={saveQueryToLibrary} className="flex-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1 border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
