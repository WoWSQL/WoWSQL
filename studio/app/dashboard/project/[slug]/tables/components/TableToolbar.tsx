'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Filter, SortAsc, SortDesc, Plus, Trash2, Copy, FileDown, ChevronDown, X,
  Edit2, Check, Shield, ShieldCheck, ShieldAlert, Radio, Search, Columns3, Upload,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { AppSelect } from '@/components/AppSelect'
import type { FilterItem, RLSPolicy } from '../types'
import { FilterPanel } from './FilterPanel'
import { cn } from '@/lib/utils'

interface TableToolbarProps {
  selectedTable: string
  tableData: any
  editingTableName: boolean
  tableNameEditValue: string
  setTableNameEditValue: (v: string) => void
  savingTableName: boolean
  onStartEditingTableName: () => void
  onSaveTableName: () => void
  onCancelEditingTableName: () => void
  rlsEnabled: boolean
  rlsPolicies: RLSPolicy[]
  onManageRLS: () => void
  realtimeEnabled: boolean
  onToggleRealtime: () => void
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  onClearSort: () => void
  hasSelection: boolean
  selectedCount: number
  onDeleteSelection: () => void
  showCopyMenu: boolean
  setShowCopyMenu: (v: boolean) => void
  showExportMenu: boolean
  setShowExportMenu: (v: boolean) => void
  onCopyAsJSON: () => void
  onCopyAsSQL: () => void
  onExportAsJSON: () => void
  onExportAsSQL: () => void
  onExportAsCSV: () => void
  showFilterMenu: boolean
  setShowFilterMenu: (v: boolean) => void
  showSortMenu: boolean
  setShowSortMenu: (v: boolean) => void
  filters: FilterItem[]
  appliedFilters: FilterItem[]
  onAddFilter: () => void
  onUpdateFilter: (idx: number, field: string, value: string) => void
  onRemoveFilter: (idx: number) => void
  onRemoveAppliedFilter: (idx: number) => void
  onClearFilters: () => void
  onApplyFilters: () => void
  onDiscardFilterDraft: () => void
  onApplySort: (col: string, direction: 'asc' | 'desc') => void
  onToggleFilterMenu: () => void
  onToggleSortMenu: () => void
  onInsertRow: () => void
  onInsertColumn: () => void
  onImportCSV: (file: File) => void
  sortMenuRef: React.RefObject<HTMLDivElement>
  filterMenuRef: React.RefObject<HTMLDivElement>
  copyMenuRef: React.RefObject<HTMLDivElement>
  exportMenuRef: React.RefObject<HTMLDivElement>
}

const OPERATOR_CHIP: Record<string, string> = {
  equals: '=',
  not_equals: '≠',
  greater: '>',
  less: '<',
  like: 'like',
  is_null: 'is empty',
  not_null: 'is not empty',
}

function formatFilterChip(f: FilterItem): string {
  const op = OPERATOR_CHIP[f.operator] || f.operator
  if (f.operator === 'is_null' || f.operator === 'not_null') return `${f.column} ${op}`
  return `${f.column} ${op} ${f.value || '…'}`
}

const toolbarChip =
  'inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border shrink-0 whitespace-nowrap transition-colors'

const toolbarBtn =
  'h-8 px-3 text-xs font-medium gap-1.5 whitespace-nowrap shrink-0 border-zinc-300 dark:border-white/20 text-foreground hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10'

const tableActionBtn =
  'inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.07] disabled:opacity-40 disabled:pointer-events-none transition-colors'

const chipClass =
  'inline-flex items-center gap-1.5 max-w-full h-6 pl-2 pr-1 rounded border border-zinc-300 dark:border-white/15 bg-zinc-100 dark:bg-white/[0.06] text-[11px] font-medium text-zinc-800 dark:text-zinc-200'

export function TableToolbar(props: TableToolbarProps) {
  const {
    selectedTable, tableData, editingTableName, tableNameEditValue, setTableNameEditValue,
    savingTableName, onStartEditingTableName, onSaveTableName, onCancelEditingTableName,
    rlsEnabled, rlsPolicies = [], onManageRLS, realtimeEnabled, onToggleRealtime,
    sortColumn, sortDirection, onClearSort,
    hasSelection, selectedCount, onDeleteSelection,
    showCopyMenu, setShowCopyMenu, showExportMenu, setShowExportMenu,
    onCopyAsJSON, onCopyAsSQL, onExportAsJSON, onExportAsSQL, onExportAsCSV,
    showFilterMenu, setShowFilterMenu, showSortMenu, setShowSortMenu,
    filters, appliedFilters = [], onAddFilter, onUpdateFilter, onRemoveFilter, onRemoveAppliedFilter,
    onClearFilters, onApplyFilters, onDiscardFilterDraft, onApplySort,
    onToggleFilterMenu, onToggleSortMenu, onInsertRow, onInsertColumn, onImportCSV,
    sortMenuRef, filterMenuRef, copyMenuRef, exportMenuRef,
  } = props

  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [sortPickCol, setSortPickCol] = useState<string>('')
  const [sortPickDir, setSortPickDir] = useState<'asc' | 'desc'>('asc')
  const insertMenuRef = useRef<HTMLDivElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showSortMenu) {
      setSortPickCol(sortColumn || tableData?.columns?.[0]?.name || '')
      setSortPickDir(sortDirection || 'asc')
    }
  }, [showSortMenu, sortColumn, sortDirection, tableData])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (showFilterMenu) {
        onDiscardFilterDraft()
        setShowFilterMenu(false)
      }
      setShowSortMenu(false)
      setShowInsertMenu(false)
      setShowCopyMenu(false)
      setShowExportMenu(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [
    showFilterMenu, onDiscardFilterDraft, setShowFilterMenu, setShowSortMenu,
    setShowCopyMenu, setShowExportMenu,
  ])

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node
      if (insertMenuRef.current && !insertMenuRef.current.contains(t)) {
        setShowInsertMenu(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  const closeFilterMenu = () => {
    onDiscardFilterDraft()
    setShowFilterMenu(false)
  }

  const columnHint =
    tableData?.columns?.slice(0, 3).map((c: { name: string }) => c.name).join(', ') || 'column'

  return (
    <div className="shrink-0 border-b border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0a0f]">
      {/* Meta row — table name + RLS / Realtime on the left (original layout) */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-200 dark:border-white/[0.06] overflow-x-auto">
        {editingTableName ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              value={tableNameEditValue}
              onChange={(e) => setTableNameEditValue(e.target.value)}
              className="h-8 px-2 bg-zinc-100 dark:bg-white/5 border border-blue-500 rounded-md text-foreground text-xs font-medium focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveTableName()
                if (e.key === 'Escape') onCancelEditingTableName()
              }}
              disabled={savingTableName}
            />
            <button type="button" onClick={onSaveTableName} disabled={savingTableName} className="p-1 text-blue-400 hover:text-blue-300 disabled:opacity-50">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={onCancelEditingTableName} disabled={savingTableName} className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartEditingTableName}
            className="h-8 text-xs font-medium text-foreground hover:text-blue-400 transition-colors flex items-center gap-1 group shrink-0"
            title="Click to rename table"
          >
            <span className="truncate max-w-[200px]">{selectedTable}</span>
            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        {tableData && (
          <span className="text-xs text-zinc-600 dark:text-white/50 shrink-0 whitespace-nowrap">
            {tableData.total} rows
          </span>
        )}

        {rlsEnabled ? (
          <div className={`${toolbarChip} bg-blue-500/20 border-blue-500/30 text-blue-400`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>RLS Enabled</span>
            <span className="text-blue-400/60">({rlsPolicies.length})</span>
          </div>
        ) : (
          <div className={`${toolbarChip} bg-orange-500/20 border-orange-500/30 text-orange-400`}>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>RLS Disabled</span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className={`${toolbarBtn} text-blue-500 dark:text-blue-400 hover:bg-blue-500/10`}
          onClick={onManageRLS}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Manage RLS</span>
        </Button>
        {realtimeEnabled ? (
          <button
            type="button"
            onClick={onToggleRealtime}
            className={`${toolbarChip} bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 cursor-pointer`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Realtime On</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleRealtime}
            className={`${toolbarChip} bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/20 text-zinc-600 dark:text-white/40 hover:bg-zinc-200 dark:hover:bg-white/10 cursor-pointer`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Realtime Off</span>
          </button>
        )}
      </div>

      {/* Table-owned toolbar */}
      <div className="flex flex-col bg-zinc-50/80 dark:bg-[#0c0c10]">
        {/* Filter entry — single filter control (opens popover) */}
        <div className="relative px-3 pt-2" ref={filterMenuRef}>
          <button
            type="button"
            disabled={!tableData}
            onClick={onToggleFilterMenu}
            className={cn(
              'w-full flex items-center gap-2 h-8 px-2.5 rounded-md border bg-white dark:bg-[#0a0a0f] text-left text-xs transition-colors disabled:opacity-50',
              appliedFilters.length > 0
                ? 'border-blue-500/40 text-blue-700 dark:text-blue-300'
                : 'border-zinc-300 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-white/20'
            )}
          >
            <Search className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <Filter className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span className="truncate">
              {appliedFilters.length > 0
                ? `${appliedFilters.length} filter${appliedFilters.length === 1 ? '' : 's'} applied — click to edit`
                : `Filter by ${columnHint}…`}
            </span>
          </button>
          {showFilterMenu && tableData && (
            <FilterPanel
              filters={filters}
              columns={tableData.columns}
              onAddFilter={onAddFilter}
              onUpdateFilter={onUpdateFilter}
              onRemoveFilter={onRemoveFilter}
              onClearFilters={onClearFilters}
              onApplyFilters={onApplyFilters}
              onClose={() => setShowFilterMenu(false)}
              onCancel={closeFilterMenu}
            />
          )}
        </div>

        {/* Applied filter + sort chips */}
        {(appliedFilters.length > 0 || sortColumn) && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2">
            {appliedFilters.map((f, idx) => (
              <span key={`f-${idx}-${f.column}-${f.operator}`} className={chipClass} title={formatFilterChip(f)}>
                <span className="truncate font-mono">{formatFilterChip(f)}</span>
                <button
                  type="button"
                  aria-label="Remove filter"
                  onClick={() => onRemoveAppliedFilter(idx)}
                  className="shrink-0 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {sortColumn && (
              <span className={chipClass}>
                <span className="font-mono truncate">
                  {sortColumn} {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
                <button
                  type="button"
                  aria-label="Clear sort"
                  onClick={onClearSort}
                  className="shrink-0 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {appliedFilters.length > 0 && (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-1"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Sort (right) + Insert */}
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          {hasSelection ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs rounded-md" onClick={onDeleteSelection}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete {selectedCount}
              </Button>
              <div className="relative" ref={copyMenuRef}>
                <button
                  type="button"
                  className={tableActionBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCopyMenu(!showCopyMenu)
                    setShowExportMenu(false)
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {showCopyMenu && (
                  <div className="absolute left-0 top-full mt-1 w-44 rounded-md border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#121218] shadow-lg z-50 overflow-hidden">
                    <button type="button" onClick={onCopyAsJSON} className="w-full px-3 py-2 text-xs text-left hover:bg-zinc-100 dark:hover:bg-white/[0.06]">Copy as JSON</button>
                    <button type="button" onClick={onCopyAsSQL} className="w-full px-3 py-2 text-xs text-left hover:bg-zinc-100 dark:hover:bg-white/[0.06]">Copy as SQL</button>
                  </div>
                )}
              </div>
              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  className={tableActionBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowExportMenu(!showExportMenu)
                    setShowCopyMenu(false)
                  }}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Export
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {showExportMenu && (
                  <div className="absolute left-0 top-full mt-1 w-44 rounded-md border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#121218] shadow-lg z-50 overflow-hidden">
                    <button type="button" onClick={onExportAsJSON} className="w-full px-3 py-2 text-xs text-left hover:bg-zinc-100 dark:hover:bg-white/[0.06]">Export as JSON</button>
                    <button type="button" onClick={onExportAsSQL} className="w-full px-3 py-2 text-xs text-left hover:bg-zinc-100 dark:hover:bg-white/[0.06]">Export as SQL</button>
                    <button type="button" onClick={onExportAsCSV} className="w-full px-3 py-2 text-xs text-left hover:bg-zinc-100 dark:hover:bg-white/[0.06]">Export as CSV</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div />
          )}

          {!hasSelection && (
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="relative" ref={sortMenuRef}>
                <button
                  type="button"
                  className={cn(tableActionBtn, sortColumn && 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400')}
                  onClick={onToggleSortMenu}
                  disabled={!tableData}
                >
                  {sortDirection === 'desc' && sortColumn ? (
                    <SortDesc className="w-3.5 h-3.5" />
                  ) : (
                    <SortAsc className="w-3.5 h-3.5" />
                  )}
                  Sort
                </button>
                {showSortMenu && tableData && (
                  <div className="absolute right-0 top-full mt-1 w-64 rounded-md border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#121218] shadow-xl z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-zinc-200 dark:border-white/10">
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {sortColumn
                          ? `Sorting by ${sortColumn}`
                          : 'No sorts applied to this view. Add a column below to sort the view.'}
                      </p>
                    </div>
                    <div className="p-3 space-y-2">
                      <label className="block text-[11px] font-medium text-zinc-500">Column</label>
                      <AppSelect
                        value={sortPickCol}
                        onChange={setSortPickCol}
                        options={(tableData.columns || []).map((col: { name: string }) => ({
                          value: col.name,
                          label: col.name,
                        }))}
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSortPickDir('asc')}
                          className={cn(
                            'flex-1 h-8 rounded-md border text-xs font-medium',
                            sortPickDir === 'asc'
                              ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'border-zinc-300 dark:border-white/10 text-zinc-600 dark:text-zinc-300'
                          )}
                        >
                          Ascending
                        </button>
                        <button
                          type="button"
                          onClick={() => setSortPickDir('desc')}
                          className={cn(
                            'flex-1 h-8 rounded-md border text-xs font-medium',
                            sortPickDir === 'desc'
                              ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'border-zinc-300 dark:border-white/10 text-zinc-600 dark:text-zinc-300'
                          )}
                        >
                          Descending
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={!sortPickCol}
                        onClick={() => {
                          if (!sortPickCol) return
                          onApplySort(sortPickCol, sortPickDir)
                          setShowSortMenu(false)
                        }}
                        className="w-full h-8 rounded-md text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40"
                      >
                        Apply sorting
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative shrink-0" ref={insertMenuRef}>
                <button
                  type="button"
                  disabled={!tableData}
                  onClick={() => {
                    setShowInsertMenu((v) => !v)
                    setShowSortMenu(false)
                    setShowFilterMenu(false)
                  }}
                  className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1.5 text-xs font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Insert
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>
                {showInsertMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-md border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#121218] shadow-xl z-50 overflow-hidden py-1">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                      onClick={() => {
                        setShowInsertMenu(false)
                        onInsertRow()
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 opacity-70" />
                      Insert row
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                      onClick={() => {
                        setShowInsertMenu(false)
                        onInsertColumn()
                      }}
                    >
                      <Columns3 className="w-3.5 h-3.5 opacity-70" />
                      Insert column
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                      onClick={() => {
                        setShowInsertMenu(false)
                        csvInputRef.current?.click()
                      }}
                    >
                      <Upload className="w-3.5 h-3.5 opacity-70" />
                      Import CSV
                    </button>
                  </div>
                )}
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onImportCSV(file)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
