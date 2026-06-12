import { Search, Plus, RefreshCw, Table as TableIcon, MoreVertical, Edit2, Copy, Settings, Shield, Trash2, Database, ChevronDown } from 'lucide-react'
import { useState, useRef } from 'react'
import { Button } from '@/components/Button'
import type { TableInfo, SchemaInfo } from '../types'

const SCHEMA_COLORS: Record<string, string> = {
  public: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  auth: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  storage: 'bg-blue-500/20 text-blue-400 border-zinc-200 dark:border-white/10',
  realtime: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

interface TablesSidebarProps {
  tables: TableInfo[]
  filteredTables: TableInfo[]
  selectedTable: string | null
  setSelectedTable: (name: string) => void
  searchTerm: string
  setSearchTerm: (v: string) => void
  loading: boolean
  schemas: SchemaInfo[]
  selectedSchema: string
  setSelectedSchema: (v: string) => void
  showTableDropdown: string | null
  setShowTableDropdown: (v: string | null) => void
  renamingTable: string | null
  setRenamingTable: (v: string | null) => void
  renamingTableValue: string
  setRenamingTableValue: (v: string) => void
  onRefresh: () => void
  onNewTable: () => void
  onRenameInline: (tableName: string, newName: string) => void
  onCopyTableName: (name: string) => void
  onEditTable: (name: string) => void
  onDuplicateTable: (name: string) => void
  onManageRLS: (name: string) => void
  onCreateRLSPolicy: (name: string) => void
  onDeleteTable: (name: string) => void
}

export function TablesSidebar(props: TablesSidebarProps) {
  const {
    filteredTables, selectedTable, setSelectedTable, searchTerm, setSearchTerm,
    loading, schemas, selectedSchema, setSelectedSchema,
    showTableDropdown, setShowTableDropdown, renamingTable, setRenamingTable,
    renamingTableValue, setRenamingTableValue, onRefresh, onNewTable,
    onRenameInline, onCopyTableName, onEditTable, onDuplicateTable,
    onManageRLS, onCreateRLSPolicy, onDeleteTable,
  } = props

  const [schemaDropdownOpen, setSchemaDropdownOpen] = useState(false)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; isUpwards?: boolean } | null>(null)
  const colorClass = SCHEMA_COLORS[selectedSchema] || 'bg-purple-500/20 text-purple-400 border-zinc-200 dark:border-white/10'

  const openTableMenu = (e: React.MouseEvent, tableName: string) => {
    e.stopPropagation()
    if (showTableDropdown === tableName) {
      setShowTableDropdown(null)
      setDropdownPos(null)
      return
    }
    const btn = e.currentTarget as HTMLButtonElement
    const rect = btn.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropdownHeight = 280 // Estimated height

    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      setDropdownPos({ top: rect.top - 4, left: rect.left - 160, isUpwards: true })
    } else {
      setDropdownPos({ top: rect.bottom + 4, left: rect.left - 160, isUpwards: false })
    }
    setShowTableDropdown(tableName)
  }

  return (
    <div className="w-60 glass-card border-r border-zinc-200 dark:border-white/10 flex-col hidden md:flex">
      <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Tables</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      {/* Schema selector */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/10">
        <label className="text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider mb-1.5 block">Schema</label>
        <div className="relative">
          <button
            onClick={() => setSchemaDropdownOpen(!schemaDropdownOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md border transition ${colorClass} hover:brightness-110`}
          >
            <span className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              {selectedSchema}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${schemaDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {schemaDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white/80 dark:bg-black/95 backdrop-blur-xl border border-zinc-200 dark:border-white/20 rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in">
              {schemas.map((s) => {
                const sc = SCHEMA_COLORS[s.name] || 'bg-purple-500/20 text-purple-400'
                return (
                  <button
                    key={s.name}
                    onClick={() => { setSelectedSchema(s.name); setSchemaDropdownOpen(false) }}
                    className={`w-full px-3 py-2.5 text-sm text-left flex items-center justify-between hover:bg-zinc-200 dark:hover:bg-white/10 transition ${
                      selectedSchema === s.name ? 'bg-zinc-100 dark:bg-white/5' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 text-zinc-900 dark:text-white">
                      <Database className="w-3.5 h-3.5 text-zinc-600 dark:text-white/50" />
                      {s.name}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${sc}`}>
                      {s.table_count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <div className="p-4 border-b border-zinc-200 dark:border-white/10">
        <Button className="w-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm" size="sm" onClick={onNewTable}>
          <Plus className="w-4 h-4 mr-2" /> New table
        </Button>
      </div>
      <div className="p-4 border-b border-zinc-200 dark:border-white/10">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-600 dark:text-white/40" />
          <input type="text" placeholder="Search tables..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-zinc-200 dark:border-white/20 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-200 dark:border-white/10" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-4 text-center text-zinc-600 dark:text-white/60">Loading...</div>
        ) : filteredTables.length === 0 ? (
          <div className="p-4 text-center text-zinc-600 dark:text-white/60">{searchTerm ? 'No tables found' : 'No tables yet'}</div>
        ) : (
          <div className="py-2">
            {filteredTables.map((table) => (
              <div key={table.name} className={`relative group ${selectedTable === table.name ? 'bg-purple-500/20 border-l-2 border-purple-500' : ''}`}>
                <div onClick={() => setSelectedTable(table.name)} className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-zinc-200 dark:hover:bg-white/10 transition cursor-pointer">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <TableIcon className="w-4 h-4 text-zinc-600 dark:text-white/60 flex-shrink-0" />
                    {renamingTable === table.name ? (
                      <input type="text" value={renamingTableValue}
                        onChange={(e) => setRenamingTableValue(e.target.value)}
                        onBlur={() => {
                          if (renamingTableValue.trim() && renamingTableValue !== table.name) {
                            onRenameInline(table.name, renamingTableValue.trim())
                          }
                          setRenamingTable(null); setRenamingTableValue('')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                          else if (e.key === 'Escape') { setRenamingTable(null); setRenamingTableValue('') }
                        }}
                        autoFocus
                        className="px-2 py-1 bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 rounded text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 flex-1 min-w-0"
                        onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{table.name}</span>
                    )}
                  </div>
                  <button onClick={(e) => openTableMenu(e, table.name)}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" data-table-menu>
                    <MoreVertical className="w-4 h-4 text-zinc-600 dark:text-white/60" />
                  </button>
                </div>
                {showTableDropdown === table.name && dropdownPos && (
                  <div
                    className={`bg-white dark:bg-zinc-900 backdrop-blur-xl border border-zinc-200 dark:border-white/20 rounded-lg shadow-xl z-[200] overflow-hidden animate-fade-in ${dropdownPos.isUpwards ? '-translate-y-full' : ''}`}
                    data-table-menu
                    style={{ position: 'fixed', top: dropdownPos.top, left: Math.max(8, dropdownPos.left), width: '200px', maxWidth: 'calc(100vw - 16px)' }}
                  >
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); setSelectedTable(table.name); setRenamingTable(table.name); setRenamingTableValue(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                      <Edit2 className="w-4 h-4" /> Rename Table
                    </button>
                    <button onClick={() => { onCopyTableName(table.name); setDropdownPos(null) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                      <Copy className="w-4 h-4" /> Copy Name
                    </button>
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); onEditTable(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Edit Table
                    </button>
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); setSelectedTable(table.name); onDuplicateTable(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                      <Copy className="w-4 h-4" /> Duplicate Table
                    </button>
                    <div className="border-t border-zinc-200 dark:border-white/10" />
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); onManageRLS(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Manage RLS Policies
                    </button>
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); onCreateRLSPolicy(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-purple-400 hover:bg-purple-500/10 transition flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Create RLS Policy
                    </button>
                    <div className="border-t border-zinc-200 dark:border-white/10" />
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); onDeleteTable(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-red-400 hover:bg-red-500/10 transition flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete Table
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
