'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Database as DatabaseIcon,
  Table as TableIcon,
  Code2 as FunctionIcon,
  Zap,
  Box,
  List,
  FileCode,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronDown,
  Key,
  MoreVertical,
  Trash2,
  X
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Sidebar } from '@/components/Sidebar'
import { SchemaVisualizer } from '@/components/SchemaVisualizer'
import { SchemaSelector } from '@/components/SchemaSelector'
import api from '@/lib/api'

interface Project {
  name: string
  slug: string
  db_name: string
}

interface TableInfo {
  name: string
  columns: ColumnInfo[]
  indexes: IndexInfo[]
  row_count?: number
}

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  key: string
  default: string | null
  extra: string
}

interface IndexInfo {
  name: string
  columns: string[]
  unique: boolean
}

export default function DatabasePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'schema' | 'tables' | 'functions' | 'triggers'>('schema')
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableDetails, setTableDetails] = useState<TableInfo | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [allTableSchemas, setAllTableSchemas] = useState<TableInfo[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTableName, setDeleteTableName] = useState('')
  const [deleteCascade, setDeleteCascade] = useState(false)
  const [confirmTableName, setConfirmTableName] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadProject()
    loadTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      loadTableDetails(selectedTable)
    }
  }, [selectedTable])

  const loadProject = async () => {
    try {
      const response = await api.get(`/api/v1/projects/${slug}`)
      setProject(response.data)
    } catch (err) {
      console.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const loadTables = async () => {
    try {
      const response = await api.get('/api/v1/db/tables', {
        headers: { 'X-Project-Slug': slug }
      })
      setTables(response.data)
      if (response.data.length > 0 && !selectedTable) {
        setSelectedTable(response.data[0])
      }

      // Load all table schemas for visualizer
      loadAllTableSchemas(response.data)
    } catch (err) {
      console.error('Failed to load tables')
    }
  }

  const loadAllTableSchemas = async (tableNames: string[]) => {
    try {
      const schemas = await Promise.all(
        tableNames.map(async (tableName) => {
          const response = await api.get(`/api/v1/db/tables/${tableName}`, {
            headers: { 'X-Project-Slug': slug }
          })
          return response.data
        })
      )
      setAllTableSchemas(schemas)
    } catch (err) {
      console.error('Failed to load table schemas', err)
    }
  }

  const loadTableDetails = async (tableName: string) => {
    setLoadingDetails(true)
    try {
      const response = await api.get(`/api/v1/db/tables/${tableName}`, {
        headers: { 'X-Project-Slug': slug }
      })
      setTableDetails(response.data)
    } catch (err) {
      console.error('Failed to load table details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const toggleTableExpand = (tableName: string) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName)
    } else {
      newExpanded.add(tableName)
    }
    setExpandedTables(newExpanded)
  }

  const filteredTables = tables.filter(t =>
    t.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] flex items-center justify-center transition-colors duration-300">
        <p className="text-zinc-900 dark:text-white">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] overflow-hidden flex transition-colors duration-300">
      {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,0,0,0.8)_70%,transparent_100%)] dark:[mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.8)_70%,transparent_100%)] animate-grid-flow" />
      </div>

      {/* Unified Sidebar */}
      <Sidebar projectSlug={slug} projectName={project.name} />

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-4 lg:p-8 transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
        {/* Header */}
        <div className="mb-6 animate-fade-in-up flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Database</h1>
            <p className="text-zinc-600 dark:text-white/60">Manage your PostgreSQL database schema</p>
          </div>
          <SchemaSelector 
            projectSlug={slug}
            onSchemaChange={(schemaName) => {
              // Reload tables when schema changes
              loadTables()
            }}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Schema Navigator */}
          <div className="w-full lg:w-80 glass-card border border-zinc-200 dark:border-white/10 rounded-xl flex flex-col">
            {/* Section Tabs */}
            <div className="border-b border-zinc-200 dark:border-white/10">
              <div className="p-4">
                <h2 className="text-sm font-semibold text-zinc-600 dark:text-white/60 uppercase mb-3">Database Management</h2>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveSection('schema')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition ${activeSection === 'schema'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5'
                      }`}
                  >
                    <DatabaseIcon className="w-4 h-4" />
                    <span className="text-sm">Schema Visualizer</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('tables')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition ${activeSection === 'tables'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5'
                      }`}
                  >
                    <TableIcon className="w-4 h-4" />
                    <span className="text-sm">Tables</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('functions')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition ${activeSection === 'functions'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5'
                      }`}
                  >
                    <FunctionIcon className="w-4 h-4" />
                    <span className="text-sm">Functions</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('triggers')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition ${activeSection === 'triggers'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5'
                      }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Triggers</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-zinc-200 dark:border-white/10">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-600 dark:text-white/50" />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-zinc-200 dark:border-white/20 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10"
                />
              </div>
            </div>

            {/* Tables List */}
            <div className="flex-1 overflow-y-auto p-2">
              {(activeSection === 'schema' || activeSection === 'tables') && (
                <div className="space-y-1">
                  {filteredTables.map((table) => (
                    <div key={table}>
                      <button
                        onClick={() => {
                          setSelectedTable(table)
                          toggleTableExpand(table)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition ${selectedTable === table
                            ? 'bg-purple-500/20 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10'
                            : 'text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5'
                          }`}
                      >
                        <div className="flex items-center space-x-2">
                          <TableIcon className="w-4 h-4" />
                          <span className="text-sm">{table}</span>
                        </div>
                        {expandedTables.has(table) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {expandedTables.has(table) && tableDetails && selectedTable === table && (
                        <div className="ml-6 mt-1 space-y-1">
                          {tableDetails.columns.map((col) => (
                            <div
                              key={col.name}
                              className="flex items-center space-x-2 px-3 py-1 text-xs text-zinc-600 dark:text-white/50"
                            >
                              {col.key === 'PRI' ? (
                                <Key className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <div className="w-3 h-3 rounded-full border border-zinc-200 dark:border-white/30" />
                              )}
                              <span>{col.name}</span>
                              <span className="text-zinc-600 dark:text-white/40">{col.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredTables.length === 0 && (
                    <div className="text-center py-8 text-zinc-600 dark:text-white/50">
                      <TableIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tables found</p>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'functions' && (
                <div className="text-center py-12 text-zinc-600 dark:text-white/50">
                  <FunctionIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No functions yet</p>
                  <p className="text-xs mt-2">Create stored procedures and functions</p>
                </div>
              )}

              {activeSection === 'triggers' && (
                <div className="text-center py-12 text-zinc-600 dark:text-white/50">
                  <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No triggers yet</p>
                  <p className="text-xs mt-2">Automate actions with triggers</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Details or Schema Visualizer */}
          <div className="flex-1 glass-card border border-zinc-200 dark:border-white/10 rounded-xl flex flex-col overflow-hidden">
            {activeSection === 'schema' ? (
              /* Schema Visualizer */
              <SchemaVisualizer
                tables={allTableSchemas}
                onTableClick={(tableName) => {
                  setSelectedTable(tableName)
                  setActiveSection('tables')
                }}
              />
            ) : selectedTable && tableDetails ? (
              <>
                {/* Header */}
                <div className="border-b border-zinc-200 dark:border-white/10 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{selectedTable}</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadTableDetails(selectedTable)}
                        className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>

                      {/* Table Actions Dropdown */}
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDropdown(!showDropdown)}
                          className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>

                        {showDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowDropdown(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 glass-card border border-zinc-200 dark:border-white/20 rounded-lg shadow-xl z-20 overflow-hidden">
                              <button
                                onClick={() => {
                                  setShowDropdown(false)
                                  router.push(`/dashboard/project/${slug}/database/${selectedTable}`)
                                }}
                                className="w-full px-4 py-2 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"
                              >
                                <TableIcon className="w-4 h-4" />
                                View Data
                              </button>
                              <button
                                onClick={() => {
                                  setShowDropdown(false)
                                  setDeleteTableName(selectedTable || '')
                                  setShowDeleteModal(true)
                                }}
                                className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Table
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-white/60">
                    {tableDetails.row_count || 0} rows
                  </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Columns */}
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center">
                          <List className="w-5 h-5 mr-2" />
                          Columns
                        </h3>
                        {/* Horizontal Scroll Container */}
                        <div className="bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/20 overflow-x-auto">
                          <table className="w-full min-w-[800px]">
                            <thead className="bg-zinc-100 dark:bg-white/5">
                              <tr className="border-b border-zinc-200 dark:border-white/10">
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-white/60 uppercase whitespace-nowrap min-w-[150px]">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-white/60 uppercase whitespace-nowrap min-w-[120px]">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-white/60 uppercase whitespace-nowrap min-w-[100px]">Nullable</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-white/60 uppercase whitespace-nowrap min-w-[80px]">Key</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-white/60 uppercase whitespace-nowrap min-w-[120px]">Default</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-white/60 uppercase whitespace-nowrap min-w-[120px]">Extra</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableDetails.columns.map((col, idx) => (
                                <tr key={idx} className="border-b border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5">
                                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white font-medium whitespace-nowrap">
                                    <div className="flex items-center">
                                      {col.key === 'PRI' && <Key className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0" />}
                                      <span>{col.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-white/60 font-mono whitespace-nowrap">{col.type}</td>
                                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                                    {col.nullable ? (
                                      <span className="text-zinc-600 dark:text-white/50">Yes</span>
                                    ) : (
                                      <span className="text-green-400">Not Null</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                                    {col.key && (
                                      <span className="px-2 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded text-xs">
                                        {col.key}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-white/50 font-mono whitespace-nowrap">
                                    {col.default || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-white/50 whitespace-nowrap">
                                    {col.extra || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Indexes */}
                      {tableDetails.indexes && tableDetails.indexes.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center">
                            <Box className="w-5 h-5 mr-2" />
                            Indexes
                          </h3>
                          <div className="bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/20 p-4">
                            <div className="space-y-2">
                              {tableDetails.indexes.map((idx, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-100 dark:bg-white/5 rounded">
                                  <div>
                                    <div className="text-sm text-zinc-900 dark:text-white font-medium">{idx.name}</div>
                                    <div className="text-xs text-zinc-600 dark:text-white/50 mt-1">
                                      Columns: {idx.columns.join(', ')}
                                    </div>
                                  </div>
                                  {idx.unique && (
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                      Unique
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : activeSection === 'tables' ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-zinc-600 dark:text-white/50">
                  <DatabaseIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Select a table</h3>
                  <p className="text-sm">Choose a table from the left to view its schema</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-zinc-600 dark:text-white/50">
                  <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                  <p className="text-sm">This feature is under development</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Table Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white dark:bg-black/80 backdrop-blur-sm">
          <div className="glass-card border border-zinc-200 dark:border-white/20 rounded-xl p-6 max-w-md w-full animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                Delete Table
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setConfirmTableName('')
                  setDeleteCascade(false)
                }}
                className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-red-400">
                  ⚠️ This action cannot be undone. This will permanently delete the table <span className="font-bold">{deleteTableName}</span> and all its data.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-white/80 mb-2">
                  Type <span className="font-mono bg-zinc-100 dark:bg-white/10 px-2 py-0.5 rounded">{deleteTableName}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmTableName}
                  onChange={(e) => setConfirmTableName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10"
                  placeholder="Enter table name"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cascade"
                  checked={deleteCascade}
                  onChange={(e) => setDeleteCascade(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-200 dark:border-white/20 bg-zinc-100 dark:bg-white/5 text-purple-600 focus:ring-purple-500/50"
                />
                <label htmlFor="cascade" className="text-sm text-zinc-600 dark:text-white/80">
                  Delete with CASCADE (remove dependent objects)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setConfirmTableName('')
                    setDeleteCascade(false)
                  }}
                  className="flex-1 border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5"
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (confirmTableName !== deleteTableName) {
                      alert('Table name does not match')
                      return
                    }

                    setDeleting(true)
                    try {
                      await api.delete(`/api/v1/db/tables/${deleteTableName}`, {
                        headers: { 'X-Project-Slug': slug },
                        params: { cascade: deleteCascade, schema: 'public' }
                      })

                      // Refresh tables list
                      await loadTables()
                      setSelectedTable(null)
                      setShowDeleteModal(false)
                      setConfirmTableName('')
                      setDeleteCascade(false)

                      // Show success message
                      alert(`Table "${deleteTableName}" deleted successfully`)
                    } catch (err: any) {
                      console.error('Failed to delete table', err)
                      alert(err.response?.data?.detail || 'Failed to delete table. It may have foreign key constraints.')
                    } finally {
                      setDeleting(false)
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-zinc-900 dark:text-white"
                  disabled={confirmTableName !== deleteTableName || deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Table'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

