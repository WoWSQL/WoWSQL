'use client'

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Database,
  SortAsc,
  SortDesc,
  ChevronDown,
  Edit2,
  Check,
  X,
  Trash2,
  Lock,
  Unlock,
  Maximize2,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { formatCellForDisplay, columnLooksLikeJson } from '../utils/cellFormat'
import { CellValueExpandModal } from './CellValueExpandModal'

interface DataTableProps {
  tableData: any
  loadingData: boolean
  error: string
  selectedTable: string
  onRetry: () => void
  // Selection
  allRowsSelected: boolean
  headerCheckboxRef: React.RefObject<HTMLInputElement>
  onToggleSelectAll: () => void
  selectedRowIndices: Set<number>
  onToggleRowSelection: (idx: number) => void
  // Sorting
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  // Column features
  frozenColumns: Set<string>
  activeColumnDropdown: string | null
  editingColumn: string | null
  columnEditData: { name: string; type: string; nullable: string } | null
  setColumnEditData: (v: any) => void
  onToggleColumnDropdown: (name: string, e: React.MouseEvent) => void
  onSortFromDropdown: (name: string, dir: 'asc' | 'desc') => void
  onEditColumn: (name: string) => void
  onSaveColumnEdit: () => void
  setEditingColumn: (v: string | null) => void
  onDeleteColumn: (name: string) => void
  onToggleFreezeColumn: (name: string) => void
  // Resize
  columnWidths: Record<string, number>
  onResizeStart: (e: React.MouseEvent, name: string) => void
  getColumnWidth: (name: string) => number | 'auto'
  // Inline editing
  editingCell: { row: number; col: string } | null
  editValue: any
  setEditValue: (v: any) => void
  savingEdit: boolean
  onStartEditing: (row: number, col: string, value: any) => void
  onSaveEdit: (row: number, col: string) => void
  onCancelEditing: () => void
  // Pagination
  currentPage: number
  setCurrentPage: (p: number) => void
  pageSize: number
}

export function DataTable(props: DataTableProps) {
  const [expandedJsonEditor, setExpandedJsonEditor] = useState(false)

  const {
    tableData, loadingData, error, selectedTable, onRetry,
    allRowsSelected, headerCheckboxRef, onToggleSelectAll,
    selectedRowIndices, onToggleRowSelection,
    sortColumn, sortDirection, frozenColumns,
    activeColumnDropdown, editingColumn, columnEditData, setColumnEditData,
    onToggleColumnDropdown, onSortFromDropdown, onEditColumn, onSaveColumnEdit,
    setEditingColumn, onDeleteColumn, onToggleFreezeColumn,
    onResizeStart, getColumnWidth,
    editingCell, editValue, setEditValue, savingEdit,
    onStartEditing, onSaveEdit, onCancelEditing,
    currentPage, setCurrentPage, pageSize,
  } = props

  useEffect(() => {
    if (!editingCell) setExpandedJsonEditor(false)
  }, [editingCell])

  if (loadingData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-zinc-600 dark:text-white/60">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={onRetry} variant="outline" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5">Retry</Button>
        </div>
      </div>
    )
  }

  if (!tableData) return null

  const expandedColName =
    editingCell && expandedJsonEditor ? editingCell.col : null

  let expandedModal: ReactNode = null
  if (
    typeof document !== 'undefined' &&
    editingCell &&
    expandedJsonEditor &&
    expandedColName
  ) {
    expandedModal = createPortal(
      <CellValueExpandModal
        columnName={expandedColName}
        editValue={typeof editValue === 'string' ? editValue : String(editValue ?? '')}
        setEditValue={setEditValue}
        savingEdit={savingEdit}
        editingCell={editingCell}
        onSaveEdit={onSaveEdit}
        onCancelEditing={onCancelEditing}
        onClose={() => setExpandedJsonEditor(false)}
      />,
      document.body
    )
  }

  return (
    <>
      {expandedModal}
      {tableData.filterMessage && (
        <div className="mb-3 mx-1 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-100 text-sm shrink-0">
          {tableData.filterMessage}
        </div>
      )}
      <div className="flex-1 overflow-auto w-full max-w-[calc(100vw-250px)] custom-scrollbar min-w-0">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead className="glass-card sticky top-0">
            <tr>
              <th className="w-12 border-r border-b border-zinc-200 dark:border-white/10 p-3 align-middle">
                <input type="checkbox" className="rounded accent-blue-400" checked={allRowsSelected} ref={headerCheckboxRef} onChange={onToggleSelectAll} />
              </th>
              {tableData.columns.map((col: any, idx: number) => {
                const isFrozen = frozenColumns.has(col.name)
                const isEditing = editingColumn === col.name
                let leftOffset = 0
                if (isFrozen) {
                  leftOffset = 48 + 64
                  for (let i = 0; i < idx; i++) { if (frozenColumns.has(tableData.columns[i].name)) leftOffset += 120 }
                }
                return (
                  <th key={idx} className={`border-r border-b border-zinc-200 dark:border-white/10 p-3 text-left relative group ${isFrozen ? 'sticky bg-white dark:bg-black/80 z-10' : ''}`}
                    style={isFrozen ? { left: `${leftOffset}px`, width: typeof getColumnWidth(col.name) === 'number' ? `${getColumnWidth(col.name)}px` : undefined } : { width: typeof getColumnWidth(col.name) === 'number' ? `${getColumnWidth(col.name)}px` : undefined }}
                    data-column-menu>
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <input type="text" value={columnEditData?.name || ''} onChange={(e) => setColumnEditData(columnEditData ? { ...columnEditData, name: e.target.value } : null)}
                          className="flex-1 px-2 py-1 bg-zinc-100 dark:bg-white/5 border border-blue-500 rounded text-zinc-900 dark:text-white text-xs" autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') onSaveColumnEdit(); if (e.key === 'Escape') { setEditingColumn(null); setColumnEditData(null) } }} />
                        <button onClick={onSaveColumnEdit} className="p-1 text-green-400 hover:text-green-300"><Check className="w-3 h-3" /></button>
                        <button onClick={() => { setEditingColumn(null); setColumnEditData(null) }} className="p-1 text-red-400 hover:text-red-300"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-zinc-900 dark:text-white truncate">{col.name}</span>
                          <span className="text-xs text-zinc-600 dark:text-white/50 hidden sm:inline">{col.type}</span>
                          {sortColumn === col.name && (sortDirection === 'asc' ? <SortAsc className="w-3 h-3 text-blue-400 flex-shrink-0" /> : <SortDesc className="w-3 h-3 text-blue-400 flex-shrink-0" />)}
                        </div>
                        <button onClick={(e) => onToggleColumnDropdown(col.name, e)} className="p-1 hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <ChevronDown className={`w-3 h-3 text-zinc-600 dark:text-white/60 transition-transform ${activeColumnDropdown === col.name ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    )}
                    <div onMouseDown={(e) => onResizeStart(e, col.name)} className="absolute right-0 top-0 h-full w-1 bg-blue-500/0 hover:bg-blue-500/50 cursor-col-resize transition-colors" />
                    {activeColumnDropdown === col.name && !isEditing && (
                      <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-black/90 backdrop-blur-xl border border-zinc-200 dark:border-white/20 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in" data-column-menu>
                        <div className="border-b border-zinc-200 dark:border-white/10">
                          <div className="px-3 py-2 text-xs text-zinc-600 dark:text-white/50 font-medium">Sort</div>
                          <button onClick={() => onSortFromDropdown(col.name, 'asc')} className="w-full px-4 py-2 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"><SortAsc className="w-4 h-4" /> Sort Ascending</button>
                          <button onClick={() => onSortFromDropdown(col.name, 'desc')} className="w-full px-4 py-2 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"><SortDesc className="w-4 h-4" /> Sort Descending</button>
                        </div>
                        <button onClick={() => onEditColumn(col.name)} className="w-full px-4 py-2 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"><Edit2 className="w-4 h-4" /> Edit Column</button>
                        <button onClick={() => onToggleFreezeColumn(col.name)} className="w-full px-4 py-2 text-sm text-left text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                          {isFrozen ? <><Unlock className="w-4 h-4" /> Unfreeze Column</> : <><Lock className="w-4 h-4" /> Freeze Column</>}
                        </button>
                        <div className="border-t border-zinc-200 dark:border-white/10" />
                        <button onClick={() => onDeleteColumn(col.name)} className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete Column</button>
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {tableData.data.length === 0 ? (
              <tr><td colSpan={tableData.columns.length + 1} className="p-8 text-center text-zinc-600 dark:text-white/50">No data in this table</td></tr>
            ) : (
              tableData.data.map((row: any, rowIdx: number) => {
                const isRowSelected = selectedRowIndices.has(rowIdx)
                return (
                  <tr key={rowIdx} className={`hover:bg-zinc-200/80 dark:hover:bg-white/10 group transition-colors ${isRowSelected ? 'bg-zinc-200/60 dark:bg-white/10' : 'bg-white/50 dark:bg-white/5'}`}>
                    <td className="w-12 border-r border-b border-zinc-200 dark:border-white/10 p-3 align-middle">
                      <input type="checkbox" className="rounded accent-blue-400" checked={isRowSelected} onChange={() => onToggleRowSelection(rowIdx)} />
                    </td>
                    {tableData.columns.map((col: any, colIdx: number) => {
                      const isCellEditing = editingCell?.row === rowIdx && editingCell?.col === col.name
                      const cellValue = row[col.name]
                      const displayText = formatCellForDisplay(cellValue)
                      const fullText =
                        cellValue !== null && cellValue !== undefined
                          ? typeof cellValue === 'object'
                            ? JSON.stringify(cellValue)
                            : String(cellValue)
                          : ''
                      const isJsonCol = columnLooksLikeJson(col.type)
                      const isFrozen = frozenColumns.has(col.name)
                      let leftOffset = 0
                      if (isFrozen) {
                        leftOffset = 48 + 64
                        for (let i = 0; i < colIdx; i++) { if (frozenColumns.has(tableData.columns[i].name)) leftOffset += 120 }
                      }
                      return (
                        <td key={colIdx} className={`border-r border-b border-zinc-200 dark:border-white/10 p-3 align-middle ${isFrozen ? 'sticky bg-white dark:bg-black/80 z-10' : ''}`}
                          style={isFrozen ? { left: `${leftOffset}px`, width: typeof getColumnWidth(col.name) === 'number' ? `${getColumnWidth(col.name)}px` : undefined } : { width: typeof getColumnWidth(col.name) === 'number' ? `${getColumnWidth(col.name)}px` : undefined }}
                          onDoubleClick={() => !isCellEditing && onStartEditing(rowIdx, col.name, cellValue)}>
                          {isCellEditing ? (
                            <div className="flex items-start space-x-1 min-w-0">
                              {isJsonCol ? (
                                expandedJsonEditor ? (
                                  <div className="flex-1 flex items-center gap-2 px-2 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded text-zinc-600 dark:text-white/80 text-xs">
                                    <span className="truncate">Editing in expanded window…</span>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedJsonEditor(true)}
                                      className="text-blue-400 hover:text-blue-300 whitespace-nowrap"
                                    >
                                      Show again
                                    </button>
                                  </div>
                                ) : (
                                  <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') {
                                        e.preventDefault()
                                        onCancelEditing()
                                      }
                                    }}
                                    className="flex-1 min-h-[120px] min-w-0 px-2 py-1 bg-zinc-100 dark:bg-white/5 border border-blue-500 rounded text-zinc-900 dark:text-white text-xs font-mono"
                                    autoFocus
                                    disabled={savingEdit}
                                  />
                                )
                              ) : (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1 px-2 py-1 bg-zinc-100 dark:bg-white/5 border border-blue-500 rounded text-zinc-900 dark:text-white text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') onSaveEdit(rowIdx, col.name)
                                    if (e.key === 'Escape') onCancelEditing()
                                  }}
                                  disabled={savingEdit}
                                />
                              )}
                              <div className="flex flex-col gap-1 flex-shrink-0">
                                {isJsonCol && !expandedJsonEditor && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedJsonEditor(true)}
                                    className="p-1 text-blue-400 hover:text-blue-300"
                                    title="Expand editor"
                                    disabled={savingEdit}
                                  >
                                    <Maximize2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onSaveEdit(rowIdx, col.name)}
                                  className="p-1 text-green-400 hover:text-green-300"
                                  disabled={savingEdit}
                                  title="Save changes"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={onCancelEditing}
                                  className="p-1 text-red-400 hover:text-red-300"
                                  disabled={savingEdit}
                                  title="Cancel (Esc)"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group/cell min-w-0">
                              <div
                                className="text-sm font-mono text-zinc-600 dark:text-white/70 truncate max-w-xs"
                                title={fullText.length > 120 ? fullText : undefined}
                              >
                                {cellValue !== null && cellValue !== undefined ? (
                                  <span className={isJsonCol ? 'text-emerald-200/90' : ''}>{displayText}</span>
                                ) : (
                                  <span className="text-zinc-600 dark:text-white/40 italic">null</span>
                                )}
                              </div>
                              <Edit2 className="w-3 h-3 text-zinc-600 dark:text-white/40 opacity-0 group-hover/cell:opacity-100 ml-2 flex-shrink-0" />
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {tableData.total > 0 && (
        <div className="glass-card border-t border-zinc-200 dark:border-white/10 px-4 py-2 flex items-center justify-between text-sm">
          <div className="text-zinc-600 dark:text-white/60">Showing {(currentPage * pageSize) + 1} to {Math.min((currentPage + 1) * pageSize, tableData.total)} of {tableData.total} rows</div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setCurrentPage(currentPage - 1)} className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed">Previous</Button>
            <span className="text-zinc-600 dark:text-white/60">Page {currentPage + 1} of {Math.ceil(tableData.total / pageSize)}</span>
            <Button variant="outline" size="sm" disabled={(currentPage + 1) * pageSize >= tableData.total} onClick={() => setCurrentPage(currentPage + 1)} className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed">Next</Button>
          </div>
        </div>
      )}
    </>
  )
}
