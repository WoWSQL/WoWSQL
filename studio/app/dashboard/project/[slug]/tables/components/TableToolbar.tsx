import { useRef } from 'react'
import { Filter, SortAsc, SortDesc, Plus, Trash2, Copy, FileDown, ChevronDown, X, Edit2, Check, Shield, ShieldCheck, ShieldAlert, Radio } from 'lucide-react'
import { Button } from '@/components/Button'
import type { FilterItem, RLSPolicy } from '../types'

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
  // Copy/Export
  showCopyMenu: boolean
  setShowCopyMenu: (v: boolean) => void
  showExportMenu: boolean
  setShowExportMenu: (v: boolean) => void
  onCopyAsJSON: () => void
  onCopyAsSQL: () => void
  onExportAsJSON: () => void
  onExportAsSQL: () => void
  onExportAsCSV: () => void
  // Filter/Sort
  showFilterMenu: boolean
  setShowFilterMenu: (v: boolean) => void
  showSortMenu: boolean
  setShowSortMenu: (v: boolean) => void
  filters: FilterItem[]
  onAddFilter: () => void
  onUpdateFilter: (idx: number, field: string, value: string) => void
  onRemoveFilter: (idx: number) => void
  onClearFilters: () => void
  onApplyFilters: () => void
  onSortSelection: (col: string) => void
  onToggleFilterMenu: () => void
  onToggleSortMenu: () => void
  onInsertRow: () => void
  // refs
  sortMenuRef: React.RefObject<HTMLDivElement>
  filterMenuRef: React.RefObject<HTMLDivElement>
  copyMenuRef: React.RefObject<HTMLDivElement>
  exportMenuRef: React.RefObject<HTMLDivElement>
}

export function TableToolbar(props: TableToolbarProps) {
  const {
    selectedTable, tableData, editingTableName, tableNameEditValue, setTableNameEditValue,
    savingTableName, onStartEditingTableName, onSaveTableName, onCancelEditingTableName,
    rlsEnabled, rlsPolicies, onManageRLS, realtimeEnabled, onToggleRealtime,
    sortColumn, sortDirection, onClearSort,
    hasSelection, selectedCount, onDeleteSelection,
    showCopyMenu, setShowCopyMenu, showExportMenu, setShowExportMenu,
    onCopyAsJSON, onCopyAsSQL, onExportAsJSON, onExportAsSQL, onExportAsCSV,
    showFilterMenu, setShowFilterMenu, showSortMenu, setShowSortMenu,
    filters, onAddFilter, onUpdateFilter, onRemoveFilter, onClearFilters, onApplyFilters,
    onSortSelection, onToggleFilterMenu, onToggleSortMenu, onInsertRow,
    sortMenuRef, filterMenuRef, copyMenuRef, exportMenuRef,
  } = props

  return (
    <div className="glass-card border-b border-zinc-200 dark:border-white/10 px-4 flex items-center justify-between sticky top-0 z-30 bg-white/80 dark:bg-black/50 backdrop-blur-md h-16 gap-3 overflow-visible">
      <div className="flex items-center space-x-2 flex-shrink-0 overflow-hidden">
        {editingTableName ? (
          <div className="flex items-center space-x-2">
            <input type="text" value={tableNameEditValue} onChange={(e) => setTableNameEditValue(e.target.value)}
              className="px-2 py-1 bg-zinc-100 dark:bg-white/5 border border-blue-500 rounded text-zinc-900 dark:text-white text-sm font-medium focus:outline-none focus:border-blue-400"
              autoFocus onKeyDown={(e) => { if (e.key === 'Enter') onSaveTableName(); if (e.key === 'Escape') onCancelEditingTableName() }}
              disabled={savingTableName} />
            <button onClick={onSaveTableName} className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50 flex-shrink-0" disabled={savingTableName}><Check className="w-4 h-4" /></button>
            <button onClick={onCancelEditingTableName} className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50 flex-shrink-0" disabled={savingTableName}><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={onStartEditingTableName} className="text-sm font-medium text-zinc-900 dark:text-white hover:text-purple-400 transition-colors flex items-center space-x-1 group flex-shrink-0 whitespace-nowrap" title="Click to rename table">
            <span className="truncate max-w-[200px]">{selectedTable}</span>
            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        {tableData && <span className="text-xs text-zinc-600 dark:text-white/50 flex-shrink-0 whitespace-nowrap">{tableData.total} rows</span>}
        <div className="flex items-center gap-2 flex-shrink-0">
          {rlsEnabled ? (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-medium text-green-400">RLS Enabled</span>
              <span className="text-xs text-green-400/60">({rlsPolicies.length})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-md">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-medium text-orange-400">RLS Disabled</span>
            </div>
          )}
          <Button variant="outline" size="sm" className="border-zinc-200 dark:border-white/10 text-purple-400 hover:bg-purple-500/20 gap-2 flex-shrink-0 whitespace-nowrap" onClick={onManageRLS}>
            <Shield className="w-4 h-4" /><span>Manage RLS</span>
          </Button>
          {realtimeEnabled ? (
            <button onClick={onToggleRealtime} className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-md hover:bg-green-500/30 transition-colors cursor-pointer">
              <Radio className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-medium text-green-400">Realtime On</span>
            </button>
          ) : (
            <button onClick={onToggleRealtime} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer">
              <Radio className="w-3.5 h-3.5 text-zinc-600 dark:text-white/40" />
              <span className="text-xs font-medium text-zinc-600 dark:text-white/40">Realtime Off</span>
            </button>
          )}
        </div>
        {sortColumn && (
          <Button variant="outline" size="sm" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 bg-blue-500/20 border-zinc-200 dark:border-white/10 text-xs flex-shrink-0" onClick={onClearSort}>
            {sortDirection === 'asc' ? <SortAsc className="w-3 h-3 mr-1" /> : <SortDesc className="w-3 h-3 mr-1" />}
            {sortColumn} <X className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0 flex-nowrap">
        {hasSelection ? (
          <div className="flex items-center space-x-2 flex-nowrap">
            <Button variant="outline" size="sm" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 gap-2 flex-shrink-0 whitespace-nowrap" onClick={onDeleteSelection}>
              <Trash2 className="w-4 h-4" /><span>Delete {selectedCount} row{selectedCount !== 1 ? 's' : ''}</span>
            </Button>
            <div className="relative flex-shrink-0" ref={copyMenuRef}>
              <Button variant="outline" size="sm" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 gap-2 whitespace-nowrap" onClick={(e) => { e.stopPropagation(); setShowCopyMenu(!showCopyMenu) }}>
                <Copy className="w-4 h-4" /><span>Copy</span><ChevronDown className={`w-3 h-3 transition-transform ${showCopyMenu ? 'rotate-180' : ''}`} />
              </Button>
              {showCopyMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/80 dark:bg-black/90 backdrop-blur-xl border border-zinc-200 dark:border-white/20 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                  <button onClick={onCopyAsJSON} className="w-full px-4 py-2.5 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"><Copy className="w-4 h-4" /> Copy as JSON</button>
                  <button onClick={onCopyAsSQL} className="w-full px-4 py-2.5 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"><Copy className="w-4 h-4" /> Copy as SQL</button>
                </div>
              )}
            </div>
            <div className="relative flex-shrink-0" ref={exportMenuRef}>
              <Button variant="outline" size="sm" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 gap-2 whitespace-nowrap" onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu) }}>
                <FileDown className="w-4 h-4" /><span>Export</span><ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/80 dark:bg-black/90 backdrop-blur-xl border border-zinc-200 dark:border-white/20 rounded-lg shadow-xl z-50 overflow-visible animate-fade-in">
                  <button onClick={onExportAsJSON} className="w-full px-4 py-2.5 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"><FileDown className="w-4 h-4" /> Export as JSON</button>
                  <button onClick={onExportAsSQL} className="w-full px-4 py-2.5 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"><FileDown className="w-4 h-4" /> Export as SQL</button>
                  <button onClick={onExportAsCSV} className="w-full px-4 py-2.5 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"><FileDown className="w-4 h-4" /> Export as CSV</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 flex-nowrap">
            <div className="relative flex-shrink-0" ref={filterMenuRef}>
              <Button variant="outline" size="sm" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 gap-2 whitespace-nowrap" onClick={onToggleFilterMenu} disabled={!tableData}>
                <Filter className="w-4 h-4" /><span>Filter{filters.length > 0 ? ` (${filters.length})` : ''}</span>
              </Button>
              {showFilterMenu && tableData && (
                <div className="absolute right-0 top-full mt-2 w-[320px] bg-white/80 dark:bg-black/90 backdrop-blur-xl border border-zinc-200 dark:border-white/20 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">Filters</span>
                    <button onClick={() => setShowFilterMenu(false)} className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  {filters.length === 0 ? (
                    <div className="px-4 py-4 text-center text-zinc-600 dark:text-white/60 flex-1 flex items-center justify-center"><p className="text-sm">No filters added</p></div>
                  ) : (
                    <div className="px-4 py-3 space-y-2 max-h-[320px] overflow-auto custom-scrollbar border-b border-zinc-200 dark:border-white/10 min-w-[320px]">
                      {filters.map((filter, idx) => (
                        <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-1 items-center bg-zinc-100 dark:bg-white/5 p-2 rounded-lg border border-zinc-200 dark:border-white/10 min-w-0 w-full">
                          <select value={filter.column} onChange={(e) => onUpdateFilter(idx, 'column', e.target.value)} className="flex-[0_0_80px] max-w-[80px] min-w-[50px] px-2 py-1 bg-white/80 dark:bg-black/70 border border-zinc-200 dark:border-white/10 rounded text-xs text-zinc-900 dark:text-white focus:outline-none">
                            {tableData.columns.map((col: any) => <option key={col.name} value={col.name}>{col.name}</option>)}
                          </select>
                          <select value={filter.operator} onChange={(e) => onUpdateFilter(idx, 'operator', e.target.value)} className="flex-[0_0_50px] max-w-[50px] min-w-[40px] px-2 py-1 bg-white/80 dark:bg-black/70 border border-zinc-200 dark:border-white/10 rounded text-xs text-zinc-900 dark:text-white focus:outline-none">
                            <option value="equals">=</option><option value="not_equals">!=</option>
                            <option value="greater">&gt;</option><option value="less">&lt;</option>
                            <option value="like">LIKE</option><option value="is_null">IS NULL</option><option value="not_null">IS NOT NULL</option>
                          </select>
                          {filter.operator !== 'is_null' && filter.operator !== 'not_null' && (
                            <input type="text" value={filter.value} onChange={(e) => onUpdateFilter(idx, 'value', e.target.value)}
                              className="flex-[1_1_140px] min-w-[110px] px-2 py-1 bg-white/80 dark:bg-black/70 border border-zinc-200 dark:border-white/10 rounded text-xs text-zinc-900 dark:text-white focus:outline-none" placeholder="Value" />
                          )}
                          <button onClick={() => onRemoveFilter(idx)} className="text-red-400 hover:text-red-300 flex-shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-4 py-3 border-t border-zinc-200 dark:border-white/10 flex justify-between gap-2">
                    {filters.length === 0 ? (
                      <Button onClick={onAddFilter} variant="outline" size="sm" className="w-full border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 text-xs gap-2">
                        <Plus className="w-3 h-3" /><span>Add Filter</span>
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 text-xs" onClick={onClearFilters}>Clear All</Button>
                        <Button size="sm" className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm text-xs flex-1" onClick={onApplyFilters}>Apply Filters</Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative" ref={sortMenuRef}>
              <Button variant="outline" size="sm" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 gap-2" onClick={onToggleSortMenu} disabled={!tableData}>
                <SortAsc className="w-4 h-4" /><span>Sort</span>
              </Button>
              {showSortMenu && tableData && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white/80 dark:bg-black/90 backdrop-blur-xl border border-zinc-200 dark:border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-white/60">Sort column</div>
                  <div className="max-h-60 overflow-auto custom-scrollbar">
                    {tableData.columns.map((col: any) => (
                      <button key={col.name} onClick={() => onSortSelection(col.name)} className="w-full px-3 py-2 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center justify-between transition">
                        <span className="truncate">{col.name}</span>
                        {sortColumn === col.name && <span className="text-xs text-blue-300 uppercase">{sortDirection}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 gap-2 flex-shrink-0 whitespace-nowrap" onClick={onInsertRow} disabled={!tableData}>
              <Plus className="w-4 h-4" /><span>Insert Row</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
