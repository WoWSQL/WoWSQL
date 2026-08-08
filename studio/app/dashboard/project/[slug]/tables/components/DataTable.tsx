'use client'

import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  SortAsc,
  SortDesc,
  ChevronDown,
  Edit2,
  Check,
  X,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { PageSkeleton } from '@/components/Skeleton'
import { formatCellForDisplay, columnLooksLikeJson } from '../utils/cellFormat'
import { formatColumnTypeShort } from '../utils/columnDisplay'
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
  getColumnWidth: (name: string) => number
  // Cell / row editing (side panels)
  editingCell: { row: number; col: string } | null
  editValue: any
  setEditValue: (v: any) => void
  savingEdit: boolean
  onStartEditing: (row: number, col: string, value: any) => void
  onSaveEdit: (row: number, col: string) => void
  onCancelEditing: () => void
  onEditRow: (rowIndex: number) => void
  // Pagination
  currentPage: number
  setCurrentPage: (p: number) => void
  pageSize: number
}

export function DataTable(props: DataTableProps) {
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
    onStartEditing, onSaveEdit, onCancelEditing, onEditRow,
    currentPage, setCurrentPage, pageSize,
  } = props

  // Full skeleton only on first load / table switch (no data yet).
  // Keep the grid visible while filter/sort/page refreshes so the panel doesn't flash.
  if (loadingData && !tableData) {
    return (
      <div className="flex-1 p-6">
        <PageSkeleton variant="table" className="p-0" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={onRetry} variant="outline" className="border-zinc-300 dark:border-white/20 text-foreground hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10">Retry</Button>
        </div>
      </div>
    )
  }

  if (!tableData) return null

  let expandedModal: ReactNode = null
  if (typeof document !== 'undefined' && editingCell) {
    const expandedCol = tableData.columns.find((c: { name: string }) => c.name === editingCell.col)
    expandedModal = createPortal(
      <CellValueExpandModal
        columnName={editingCell.col}
        rowIndex={editingCell.row}
        isJson={columnLooksLikeJson(expandedCol?.type)}
        editValue={typeof editValue === 'string' ? editValue : String(editValue ?? '')}
        setEditValue={setEditValue}
        savingEdit={savingEdit}
        editingCell={editingCell}
        onSaveEdit={onSaveEdit}
        onCancelEditing={onCancelEditing}
      />,
      document.body
    )
  }

  return (
    <>
      {expandedModal}
      {tableData.filterMessage && (
        <div className="mb-3 mx-1 px-4 py-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-100 text-sm shrink-0">
          {tableData.filterMessage}
        </div>
      )}
      <div className="flex-1 overflow-auto w-full custom-scrollbar min-w-0">
        <table className="w-full border-collapse table-fixed isolate" style={{ minWidth: `${Math.max(900, tableData.columns.length * 160)}px` }}>
        <thead className="sticky top-0 z-20 bg-zinc-50 dark:bg-[#0c0c0e] border-b border-zinc-300 dark:border-zinc-800">
            <tr>
            <th className="w-20 min-w-[80px] max-w-[80px] border-r border-zinc-300 dark:border-zinc-800 px-2 py-2.5 align-middle">
              <div className="flex items-center justify-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-zinc-400 accent-blue-500 dark:border-zinc-500"
                  checked={allRowsSelected}
                  ref={headerCheckboxRef}
                  onChange={onToggleSelectAll}
                  aria-label="Select all rows"
                />
                {/* Spacer matches row edit-icon width so header checkbox lines up with row checkboxes */}
                <span className="inline-flex h-7 w-7 shrink-0" aria-hidden />
              </div>
              </th>
              {tableData.columns.map((col: any, idx: number) => {
                const isFrozen = frozenColumns.has(col.name)
                const isEditing = editingColumn === col.name
                const widthPx = getColumnWidth(col.name)
                const typeShort = formatColumnTypeShort(col.type)
                let leftOffset = 0
                if (isFrozen) {
                  leftOffset = 80
                  for (let i = 0; i < idx; i++) {
                    if (frozenColumns.has(tableData.columns[i].name)) {
                      leftOffset += getColumnWidth(tableData.columns[i].name)
                    }
                  }
                }
                return (
                  <th
                    key={idx}
                    className={`border-r border-zinc-300 dark:border-zinc-800 px-3 py-2 text-left relative group align-top ${isFrozen ? 'sticky z-30 bg-zinc-50 dark:bg-[#0c0c0e]' : ''}`}
                    style={{
                      width: widthPx,
                      minWidth: widthPx,
                      maxWidth: widthPx,
                      ...(isFrozen ? { left: leftOffset } : {}),
                    }}
                    data-column-menu
                  >
                    {isEditing ? (
                      <div className="relative min-w-0 max-w-full overflow-hidden">
                        <input
                          type="text"
                          value={columnEditData?.name || ''}
                          onChange={(e) => setColumnEditData(columnEditData ? { ...columnEditData, name: e.target.value } : null)}
                          className="h-8 w-full min-w-0 max-w-full rounded-md border border-blue-500/50 bg-white py-0 pl-2 pr-[3.25rem] text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:bg-zinc-900 dark:text-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onSaveColumnEdit()
                            if (e.key === 'Escape') { setEditingColumn(null); setColumnEditData(null) }
                          }}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-1 pl-3 bg-gradient-to-l from-zinc-50 via-zinc-50/95 to-transparent dark:from-[#0c0c0e] dark:via-[#0c0c0e]/95">
                        <button type="button" onClick={onSaveColumnEdit} className="flex h-7 w-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-500/15 dark:text-blue-400"><Check className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => { setEditingColumn(null); setColumnEditData(null) }} className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-500/15 dark:text-red-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-1 pr-1">
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div
                            className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100 truncate leading-tight"
                            title={col.name}
                          >
                            {col.name}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5 min-w-0">
                            <span
                              className="inline-block max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-mono leading-none text-zinc-500 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-800"
                              title={col.type}
                            >
                              {typeShort}
                            </span>
                            {col.key === 'PRI' && (
                              <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 bg-amber-500/15">
                                PK
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                          {sortColumn === col.name && (
                            sortDirection === 'asc'
                            ? <SortAsc className="w-3.5 h-3.5 text-blue-500" />
                            : <SortDesc className="w-3.5 h-3.5 text-blue-500" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => onToggleColumnDropdown(col.name, e)}
                            className="rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-200/80 hover:text-zinc-600 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeColumnDropdown === col.name ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                    )}
                    <div
                      onMouseDown={(e) => onResizeStart(e, col.name)}
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-500/40 transition-colors"
                      aria-hidden
                    />
                    {activeColumnDropdown === col.name && !isEditing && (
                    <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-black/90 backdrop-blur-xl border border-zinc-300 dark:border-white/20 rounded-md shadow-xl z-50 overflow-hidden animate-fade-in" data-column-menu>
                    <div className="border-b border-zinc-300 dark:border-white/10">
                          <div className="px-3 py-2 text-xs text-zinc-600 dark:text-white/50 font-medium">Sort</div>
                          <button onClick={() => onSortFromDropdown(col.name, 'asc')} className="w-full px-4 py-2 text-sm text-left text-foreground hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"><SortAsc className="w-4 h-4" /> Sort Ascending</button>
                          <button onClick={() => onSortFromDropdown(col.name, 'desc')} className="w-full px-4 py-2 text-sm text-left text-foreground hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"><SortDesc className="w-4 h-4" /> Sort Descending</button>
                        </div>
                        <button onClick={() => onEditColumn(col.name)} className="w-full px-4 py-2 text-sm text-left text-foreground hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2"><Edit2 className="w-4 h-4" /> Edit Column</button>
                        <button onClick={() => onToggleFreezeColumn(col.name)} className="w-full px-4 py-2 text-sm text-left text-foreground hover:bg-zinc-200 dark:hover:bg-white/10 transition flex items-center gap-2">
                          {isFrozen ? <><Unlock className="w-4 h-4" /> Unfreeze Column</> : <><Lock className="w-4 h-4" /> Freeze Column</>}
                        </button>
                        <div className="border-t border-zinc-300 dark:border-white/10" />
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
                <tr key={rowIdx} className={`group transition-colors ${isRowSelected ? 'bg-blue-500/5' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'}`}>
                <td className="w-20 min-w-[80px] max-w-[80px] border-r border-b border-zinc-300 dark:border-zinc-800 px-2 py-2 align-middle">
                  <div className="flex h-8 items-center justify-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 rounded border-zinc-400 accent-blue-500 dark:border-zinc-500"
                      checked={isRowSelected}
                      onChange={() => onToggleRowSelection(rowIdx)}
                      aria-label={`Select row ${rowIdx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => onEditRow(rowIdx)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-200 hover:text-zinc-700 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      title="Edit row"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
                      const widthPx = getColumnWidth(col.name)
                      let leftOffset = 0
                      if (isFrozen) {
                        leftOffset = 80
                        for (let i = 0; i < colIdx; i++) {
                          if (frozenColumns.has(tableData.columns[i].name)) {
                            leftOffset += getColumnWidth(tableData.columns[i].name)
                          }
                        }
                      }

                      return (
                        <td
                          key={colIdx}
                          className={`border-r border-b border-zinc-300 dark:border-zinc-800 align-middle px-3 py-2 ${
                            isCellEditing
                            ? `ring-2 ring-inset ring-blue-500/35 bg-blue-500/[0.04] ${isFrozen ? 'z-30' : 'z-20'}`
                              : ''
                            } ${isFrozen ? 'sticky z-10 bg-white dark:bg-[#0a0a0b]' : ''} ${isFrozen && isCellEditing ? 'bg-blue-500/[0.06] dark:bg-[#0f0d14]' : ''}`}
                          style={{
                            width: widthPx,
                            minWidth: widthPx,
                            maxWidth: widthPx,
                            ...(isFrozen ? { left: leftOffset } : {}),
                          }}
                          onDoubleClick={() => !isCellEditing && onStartEditing(rowIdx, col.name, cellValue)}
                        >
                          {isCellEditing ? (
                            <div className="flex w-full min-w-0 items-center rounded-md border border-blue-500/25 bg-blue-500/[0.06] px-2.5 py-1.5">
                              <span className="truncate text-[11px] font-medium text-blue-600 dark:text-blue-300">
                                Editing in side panel…
                              </span>
                            </div>
                          ) : (
                            <div className="relative min-w-0 max-w-full group/cell">
                              <div
                                className="truncate pr-5 text-[13px] font-mono text-zinc-700 dark:text-zinc-300"
                                title={fullText.length > 40 ? fullText : undefined}
                              >
                                {cellValue !== null && cellValue !== undefined ? (
                                <span className={isJsonCol ? 'text-blue-600/90 dark:text-blue-200/90' : ''}>{displayText}</span>
                                ) : (
                                  <span className="text-zinc-400 dark:text-zinc-500 italic">null</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onStartEditing(rowIdx, col.name, cellValue)
                                }}
                                className="absolute right-0 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 opacity-0 transition-opacity hover:text-zinc-700 group-hover/cell:opacity-100 dark:text-zinc-500 dark:hover:text-zinc-200"
                                title="Edit cell"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
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
      <div className="border-t border-zinc-300 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 px-4 py-2.5 flex items-center justify-between text-sm shrink-0">
          <div className="text-zinc-600 dark:text-white/60">Showing {(currentPage * pageSize) + 1} to {Math.min((currentPage + 1) * pageSize, tableData.total)} of {tableData.total} rows</div>
          <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setCurrentPage(currentPage - 1)} className="border-zinc-300 dark:border-white/20 text-foreground hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed">Previous</Button>
            <span className="text-zinc-600 dark:text-white/60">Page {currentPage + 1} of {Math.ceil(tableData.total / pageSize)}</span>
            <Button variant="outline" size="sm" disabled={(currentPage + 1) * pageSize >= tableData.total} onClick={() => setCurrentPage(currentPage + 1)} className="border-zinc-300 dark:border-white/20 text-foreground hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed">Next</Button>
          </div>
        </div>
      )}
    </>
  )
}
