import { Search, Plus, RefreshCw, Table as TableIcon, MoreVertical, Edit2, Copy, Settings, Shield, Trash2, Database } from 'lucide-react'
import { useRef, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/Button'
import { AppSelect } from '@/components/AppSelect'
import { Skeleton } from '@/components/Skeleton'
import type { TableInfo, SchemaInfo } from '../types'

const TABLE_MENU_WIDTH = 200
const TABLE_MENU_HEIGHT_ESTIMATE = 300
const TABLE_MENU_GAP = 4

function computeTableMenuPos(rect: DOMRect, menuHeight = TABLE_MENU_HEIGHT_ESTIMATE) {
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const openUpwards = spaceBelow < menuHeight + TABLE_MENU_GAP && spaceAbove > spaceBelow

  let top = openUpwards
    ? rect.top - menuHeight - TABLE_MENU_GAP
    : rect.bottom + TABLE_MENU_GAP
  top = Math.min(Math.max(8, top), Math.max(8, window.innerHeight - menuHeight - 8))

  let left = rect.right - TABLE_MENU_WIDTH
  left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - TABLE_MENU_WIDTH - 8))

  return { top, left }
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

  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)

  const openTableMenu = (e: React.MouseEvent, tableName: string) => {
    e.stopPropagation()
    if (showTableDropdown === tableName) {
      setShowTableDropdown(null)
      setDropdownPos(null)
      return
    }
    const btn = e.currentTarget as HTMLButtonElement
    menuButtonRefs.current[tableName] = btn
    setDropdownPos(computeTableMenuPos(btn.getBoundingClientRect()))
    setShowTableDropdown(tableName)
  }

  // Lock final position before paint so the menu never flashes below then jumps above
  useLayoutEffect(() => {
    if (!showTableDropdown || !dropdownPos) return
    const menuEl = menuRef.current
    const btn = menuButtonRefs.current[showTableDropdown]
    if (!menuEl || !btn) return

    const next = computeTableMenuPos(btn.getBoundingClientRect(), menuEl.offsetHeight)
    if (next.top !== dropdownPos.top || next.left !== dropdownPos.left) {
      setDropdownPos(next)
    }
  }, [showTableDropdown, dropdownPos])

  return (
    <div className="w-60 glass-card border-r border-zinc-300 dark:border-white/10 flex-col hidden md:flex">
      <div className="p-4 border-b border-zinc-300 dark:border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground truncate">Tables</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} className="border-zinc-300 dark:border-white/20 text-foreground hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      {/* Schema selector */}
      <div className="px-4 py-3 border-b border-zinc-300 dark:border-white/10">
        <label className="text-xs font-medium text-zinc-600 dark:text-white/50 uppercase tracking-wider mb-1.5 block">Schema</label>
        <AppSelect
          size="sm"
          value={selectedSchema}
          onChange={setSelectedSchema}
          aria-label="Schema"
          searchable={schemas.length > 8}
          searchPlaceholder="Search schemas…"
          options={schemas.map((s) => ({
            value: s.name,
            label: s.name,
            description: `${s.table_count} table${s.table_count === 1 ? '' : 's'}`,
            icon: <Database className="h-3.5 w-3.5" />,
          }))}
        />
      </div>
      <div className="p-4 border-b border-zinc-300 dark:border-white/10">
        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm" size="sm" onClick={onNewTable}>
          <Plus className="w-4 h-4 mr-2" /> New table
        </Button>
      </div>
      <div className="p-4 border-b border-zinc-300 dark:border-white/10">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-600 dark:text-white/40" />
          <input type="text" placeholder="Search tables..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-zinc-300 dark:border-white/20 rounded-md bg-zinc-100 dark:bg-white/5 text-foreground placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-300 dark:border-white/10" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-5/6 rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-4/5 rounded-md" />
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="p-4 text-center text-zinc-600 dark:text-white/60">{searchTerm ? 'No tables found' : 'No tables yet'}</div>
        ) : (
          <div className="py-2">
            {filteredTables.map((table) => (
              <div key={table.name} className={`relative group ${selectedTable === table.name ? 'bg-blue-500/20 border-l-2 border-blue-500' : ''}`}>
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
                        className="px-2 py-1 bg-zinc-100 dark:bg-white/10 border border-zinc-300 dark:border-white/10 rounded text-sm text-foreground focus:outline-none focus:border-blue-500 flex-1 min-w-0"
                        onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <span className="text-sm font-medium text-foreground truncate">{table.name}</span>
                    )}
                  </div>
                  <button
                    ref={(el) => { menuButtonRefs.current[table.name] = el }}
                    onClick={(e) => openTableMenu(e, table.name)}
                    className="p-1 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    data-table-menu
                  >
                    <MoreVertical className="w-4 h-4 text-zinc-600 dark:text-white/60" />
                  </button>
                </div>
                {showTableDropdown === table.name && dropdownPos && typeof document !== 'undefined' && createPortal(
                  <div
                    ref={menuRef}
                    className="bg-white dark:bg-zinc-900 backdrop-blur-xl border border-zinc-300 dark:border-white/20 rounded-md shadow-xl z-[99999] overflow-hidden"
                    data-table-menu
                    style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: TABLE_MENU_WIDTH, maxWidth: 'calc(100vw - 16px)' }}
                  >
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); setSelectedTable(table.name); setRenamingTable(table.name); setRenamingTableValue(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-foreground hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                      <Edit2 className="w-4 h-4" /> Rename Table
                    </button>
                    <button onClick={() => { onCopyTableName(table.name); setDropdownPos(null) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-foreground hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                      <Copy className="w-4 h-4" /> Copy Name
                    </button>
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); onEditTable(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-foreground hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Edit Table
                    </button>
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); setSelectedTable(table.name); onDuplicateTable(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-foreground hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                      <Copy className="w-4 h-4" /> Duplicate Table
                    </button>
                    <div className="border-t border-zinc-300 dark:border-white/10" />
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); onManageRLS(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-foreground hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Manage RLS Policies
                    </button>
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); onCreateRLSPolicy(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-blue-400 hover:bg-blue-500/10 transition flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Create RLS Policy
                    </button>
                    <div className="border-t border-zinc-300 dark:border-white/10" />
                    <button onClick={() => { setShowTableDropdown(null); setDropdownPos(null); onDeleteTable(table.name) }}
                      className="w-full px-4 py-2.5 text-sm text-left text-red-400 hover:bg-red-500/10 transition flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete Table
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
