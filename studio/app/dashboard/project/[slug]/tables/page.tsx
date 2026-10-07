'use client'

import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Database, Table as TableIcon, Radio, X } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { useToast } from '@/components/Toast'
import axios from 'axios'
import api from '@/lib/api'
import { PageSkeleton } from '@/components/Skeleton'
import { isPortaledSelectMenuTarget } from '@/components/AppSelect'
import type { Column, ConfirmationModalState } from './types'
import {
  getFullTypeString,
  typeNeedsParams,
  getTypeExample,
  pgInformationSchemaToUiColumn,
  pgUsingClauseForAlterType,
} from './utils/postgresTypes'
import { convertToJSON, convertToSQL, convertToCSV, downloadFile } from './utils/dataExport'
import { estimateColumnWidth } from './utils/columnDisplay'
import { buildDeleteByPrimaryKeyQuery, buildUpdateCellQuery, buildUpdateRowQuery } from './utils/tableSql'
import { useTableData } from './hooks/useTableData'
import { useRLS } from './hooks/useRLS'
import { usePostgresDataTypes } from './hooks/usePostgresDataTypes'
import {
  TablesSidebar, TableToolbar, DataTable,
  CreateTableModal, InsertRecordModal, EditRowModal, DeleteTableModal, DeleteColumnModal,
  EditTableModal, RLSModal,
} from './components'

export default function TablesPage() {
  return (
    <Suspense fallback={
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] flex items-center justify-center">
    <Database className="w-8 h-8 text-blue-500 animate-pulse" />
      </div>
    }>
      <TablesPageContent />
    </Suspense>
  )
}

function TablesPageContent() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const { showToast } = useToast()

  const td = useTableData(slug, showToast)
  const rls = useRLS(slug, showToast, td.selectedSchema)
  const { postgresDataTypes, reloadDataTypes } = usePostgresDataTypes(slug)

  // Modal states
  const [showNewTableModal, setShowNewTableModal] = useState(false)
  const [showInsertModal, setShowInsertModal] = useState(false)
  const [showEditTableModal, setShowEditTableModal] = useState(false)
  /** When Edit Table targets another table, wait for its data before opening the panel. */
  const [pendingOpenEditTable, setPendingOpenEditTable] = useState(false)
  /** When opening Edit Table from a column header, pre-expand this column in the sidebar. */
  const pendingEditColumnRef = useRef<string | null>(null)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showCopyMenu, setShowCopyMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Refs
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const filterMenuRef = useRef<HTMLDivElement>(null)
  const copyMenuRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const headerCheckboxRef = useRef<HTMLInputElement>(null)

  // Row selection
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set())

  // New table form
  const [newTableName, setNewTableName] = useState('')
  const [newTableDescription, setNewTableDescription] = useState('')
  const [enableRLS, setEnableRLS] = useState(false)
  const [newTableColumns, setNewTableColumns] = useState<Column[]>([
    { name: 'id', type: 'UUID', nullable: 'NO', key: 'PRI' },
    { name: 'created_at', type: 'TIMESTAMPTZ', nullable: 'NO' }
  ])

  // Insert/edit states
  const [insertData, setInsertData] = useState<Record<string, any>>({})
  const [editTableName, setEditTableName] = useState('')
  const [columnsToAdd, setColumnsToAdd] = useState<Column[]>([])
  const [columnsToRemove, setColumnsToRemove] = useState<string[]>([])
  const [columnsToEdit, setColumnsToEdit] = useState<Record<string, Column>>({})

  // Cell / row editing (side panels)
  const [editingCell, setEditingCell] = useState<{ row: number, col: string } | null>(null)
  const [editValue, setEditValue] = useState<any>('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null)
  const [editRowData, setEditRowData] = useState<Record<string, any>>({})
  const [savingRow, setSavingRow] = useState(false)
  const [editingTableName, setEditingTableName] = useState(false)
  const [tableNameEditValue, setTableNameEditValue] = useState('')
  const [savingTableName, setSavingTableName] = useState(false)

  // Column states
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [activeColumnDropdown, setActiveColumnDropdown] = useState<string | null>(null)
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [columnEditData, setColumnEditData] = useState<{ name: string, type: string, nullable: string } | null>(null)
  const [frozenColumns, setFrozenColumns] = useState<Set<string>>(new Set())
  const [showDeleteColumnModal, setShowDeleteColumnModal] = useState(false)
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null)

  // Table context menu
  const [showTableDropdown, setShowTableDropdown] = useState<string | null>(null)
  const [renamingTable, setRenamingTable] = useState<string | null>(null)
  const [renamingTableValue, setRenamingTableValue] = useState('')

  // Realtime state
  const [realtimeEnabled, setRealtimeEnabled] = useState(false)
  const [showRealtimeModal, setShowRealtimeModal] = useState(false)
  const [togglingRealtime, setTogglingRealtime] = useState(false)

  // Delete table
  const [showDeleteTableModal, setShowDeleteTableModal] = useState(false)
  const [deleteTableCascade, setDeleteTableCascade] = useState(false)
  const [confirmDeleteTableName, setConfirmDeleteTableName] = useState('')
  const [deletingTable, setDeletingTable] = useState(false)

  // Confirmation modal
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    isOpen: false, message: '', onConfirm: () => {},
  })
  const [deleteCascade, setDeleteCascade] = useState(false)

  /** Prefer API `primary_key_columns` (composite PK); fallback to columns marked PRI. */
  const getPrimaryKeyColumnNames = useCallback((tableData: typeof td.tableData) => {
    if (!tableData) return [] as string[]
    const fromApi = (tableData as { primary_key_columns?: string[] }).primary_key_columns
    if (Array.isArray(fromApi) && fromApi.length > 0) return fromApi
    return tableData.columns.filter((c: { key?: string }) => c.key === 'PRI').map((c: { name: string }) => c.name)
  }, [])

  const [primaryKeyColumnToAdd, setPrimaryKeyColumnToAdd] = useState<string | null>(null)

  const allRowsSelected = !!td.tableData && td.tableData.data.length > 0 && selectedRowIndices.size === td.tableData.data.length
  const hasSelection = selectedRowIndices.size > 0


  // Outside click handler
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      // AppSelect / type picker menus portal to document.body — treat as inside.
      if (isPortaledSelectMenuTarget(event.target)) return
      if (
        (sortMenuRef.current && sortMenuRef.current.contains(target)) ||
        (filterMenuRef.current && filterMenuRef.current.contains(target)) ||
        (copyMenuRef.current && copyMenuRef.current.contains(target)) ||
        (exportMenuRef.current && exportMenuRef.current.contains(target))
      ) return
      setShowSortMenu(false)
      setShowFilterMenu((open) => {
        if (open) td.discardFilterDraft()
        return false
      })
      setShowCopyMenu(false)
      setShowExportMenu(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [td.discardFilterDraft])

  useEffect(() => { setShowSortMenu(false); setShowFilterMenu(false) }, [td.selectedTable])
  useEffect(() => { setSelectedRowIndices(new Set()) }, [td.tableData?.data])

  useEffect(() => {
    if (!headerCheckboxRef.current) return
    const rowsCount = td.tableData?.data?.length || 0
    const isIndeterminate = selectedRowIndices.size > 0 && selectedRowIndices.size < rowsCount
    headerCheckboxRef.current.indeterminate = isIndeterminate
  }, [selectedRowIndices, td.tableData])

  useEffect(() => {
    if (td.selectedTable) td.loadTableData(td.selectedTable, rls.loadRLSData)
  }, [td.selectedTable, td.selectedSchema, td.appliedFilters, td.sortColumn, td.sortDirection, td.currentPage, td.pageSize])

  useEffect(() => {
    if (!pendingOpenEditTable) return
    if (td.selectedTable && td.tableData && !td.loadingData) {
      const columnName = pendingEditColumnRef.current
      pendingEditColumnRef.current = null
      if (columnName) {
        const col = td.tableData.columns.find((c: any) => c.name === columnName)
        if (col) {
          const ui = pgInformationSchemaToUiColumn(col)
          setColumnsToEdit({
            [columnName]: {
              name: col.name,
              type: ui.type,
              typeParams: ui.typeParams,
              nullable: col.null === 'YES' ? 'YES' : 'NO',
            },
          })
        }
      }
      setShowEditTableModal(true)
      setPendingOpenEditTable(false)
    }
  }, [pendingOpenEditTable, td.selectedTable, td.tableData, td.loadingData])

  useEffect(() => {
    if (rls.showRLSModal && td.selectedTable) rls.loadRLSData(td.selectedTable)
  }, [rls.showRLSModal, td.selectedTable])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showTableDropdown && !target.closest('[data-table-menu]')) setShowTableDropdown(null)
      if (activeColumnDropdown && !target.closest('[data-column-menu]')) setActiveColumnDropdown(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTableDropdown, activeColumnDropdown])

  // Column resize
  const handleResizeStart = (e: React.MouseEvent, columnName: string) => {
    e.preventDefault(); setResizingColumn(columnName); setResizeStartX(e.clientX)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn) return
      const delta = e.clientX - resizeStartX
      const currentWidth = columnWidths[resizingColumn] ?? getColumnWidth(resizingColumn)
      setColumnWidths(prev => ({ ...prev, [resizingColumn]: Math.max(120, currentWidth + delta) }))
      setResizeStartX(e.clientX)
    }
    const handleMouseUp = () => setResizingColumn(null)
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp) }
    }
  }, [resizingColumn, resizeStartX])

  const getColumnWidth = (colName: string): number => {
    if (columnWidths[colName]) return columnWidths[colName]
    const col = td.tableData?.columns?.find((c: { name: string }) => c.name === colName)
    if (col) return estimateColumnWidth(col)
    return 160
  }

  // Row selection
  const toggleRowSelection = (rowIdx: number) => {
    setSelectedRowIndices(prev => {
      const next = new Set(prev); next.has(rowIdx) ? next.delete(rowIdx) : next.add(rowIdx); return next
    })
  }
  const toggleSelectAllRows = () => {
    if (!td.tableData) return
    if (allRowsSelected) { setSelectedRowIndices(new Set()); return }
    const next = new Set<number>()
    td.tableData.data.forEach((_: any, idx: number) => next.add(idx))
    setSelectedRowIndices(next)
  }

  // Copy/Export handlers
  const getSelectedRowsData = () => td.tableData ? Array.from(selectedRowIndices).map(idx => td.tableData.data[idx]) : []
  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${selectedRowIndices.size} row(s) copied as ${format.toUpperCase()}`, 'success')
      setShowCopyMenu(false); setSelectedRowIndices(new Set())
    }).catch(() => showToast('Failed to copy', 'error'))
  }
  const handleCopyAsJSON = () => copyToClipboard(convertToJSON(getSelectedRowsData()), 'JSON')
  const handleCopyAsSQL = () => td.selectedTable && copyToClipboard(convertToSQL(getSelectedRowsData(), td.selectedTable, td.tableData?.columns || []), 'SQL')
  const handleExportAsJSON = () => { const ts = new Date().toISOString().split('T')[0]; downloadFile(convertToJSON(getSelectedRowsData()), `${td.selectedTable}_${ts}.json`); showToast('Exported as JSON', 'success'); setShowExportMenu(false); setSelectedRowIndices(new Set()) }
  const handleExportAsSQL = () => { if (!td.selectedTable) return; const ts = new Date().toISOString().split('T')[0]; downloadFile(convertToSQL(getSelectedRowsData(), td.selectedTable, td.tableData?.columns || []), `${td.selectedTable}_${ts}.sql`); showToast('Exported as SQL', 'success'); setShowExportMenu(false); setSelectedRowIndices(new Set()) }
  const handleExportAsCSV = () => { const ts = new Date().toISOString().split('T')[0]; downloadFile(convertToCSV(getSelectedRowsData(), td.tableData?.columns || []), `${td.selectedTable}_${ts}.csv`); showToast('Exported as CSV', 'success'); setShowExportMenu(false); setSelectedRowIndices(new Set()) }


  // Delete selection
  const handleDeleteSelection = async () => {
    if (!td.selectedTable || selectedRowIndices.size === 0) return
    setDeleteCascade(false) // Reset cascade state
    setConfirmationModal({
      isOpen: true, title: 'Delete Rows',
      message: `Are you sure you want to delete ${selectedRowIndices.size} row(s)?`,
      variant: 'danger', isLoading: false,
      showCascade: true,
      cascade: deleteCascade,
      onCascadeChange: (cascade) => setDeleteCascade(cascade),
      onConfirm: async () => {
        try {
          setConfirmationModal(prev => ({ ...prev, isLoading: true }))
          const pkCols = getPrimaryKeyColumnNames(td.tableData)
          if (pkCols.length === 0) {
            showToast(
              'Cannot delete: no primary key. Use Edit table → Primary key to add one, or run SQL (ALTER TABLE … ADD PRIMARY KEY).',
              'error'
            )
            setConfirmationModal(prev => ({ ...prev, isOpen: false }))
            return
          }
          const selectedRows = Array.from(selectedRowIndices).map(idx => td.tableData!.data[idx])
          const useCascade = deleteCascade
          const deleteQuery = buildDeleteByPrimaryKeyQuery(
            td.selectedTable!,
            pkCols,
            selectedRows,
            td.tableData!.columns
          )
          const requestBody: any = {
            query: deleteQuery,
            schema: td.selectedSchema,
          }
          if (useCascade) {
            requestBody.cascade = true
          }
          await api.post('/api/v1/db/execute', requestBody, { headers: { 'X-Project-Slug': slug } })
          await td.loadTableData(td.selectedTable!); setSelectedRowIndices(new Set()); setConfirmationModal(prev => ({ ...prev, isOpen: false }))
          showToast(`${selectedRows.length} row(s) deleted${useCascade ? ' with CASCADE' : ''}`, 'success')
        } catch (err: any) {
          showToast(`Error: ${err.message}`, 'error'); setConfirmationModal(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  // Inline editing
  const startEditing = (row: number, col: string, value: any) => {
    const colMeta = td.tableData?.columns.find((c: { name: string }) => c.name === col)
    const t = (colMeta?.type || '').toLowerCase()
    let v: string | number = value ?? ''
    if (value !== null && value !== undefined && typeof value === 'object' && (t.includes('json') || Array.isArray(value))) {
      v = JSON.stringify(value, null, 2)
    } else if (value !== null && value !== undefined && typeof value === 'object') {
      v = JSON.stringify(value, null, 2)
    }
    setEditingCell({ row, col })
    setEditValue(v)
  }
  const cancelEditing = () => { setEditingCell(null); setEditValue('') }
  const saveEdit = async (rowIndex: number, columnName: string) => {
    if (!td.selectedTable || !td.tableData) return
    setSavingEdit(true)
    try {
      const row = td.tableData.data[rowIndex]
      const pkCols = getPrimaryKeyColumnNames(td.tableData)
      if (pkCols.length === 0) {
        showToast('No primary key — add one in Edit table or use SQL.', 'error')
        return
      }
      const colMeta = td.tableData.columns.find((c: { name: string }) => c.name === columnName)
      const t = (colMeta?.type || '').toLowerCase()
      let newVal: unknown = editValue
      if (t.includes('json') && typeof editValue === 'string') {
        try {
          newVal = JSON.parse(editValue)
        } catch {
          showToast('Invalid JSON', 'error')
          return
        }
      }
      const q = buildUpdateCellQuery(
        td.selectedTable,
        columnName,
        newVal,
        row,
        pkCols,
        td.tableData.columns
      )
      await api.post('/api/v1/db/execute', { query: q, schema: td.selectedSchema }, { headers: { 'X-Project-Slug': slug } })
      await td.loadTableData(td.selectedTable)
      setEditingCell(null)
      setEditValue('')
      showToast('Updated!', 'success')
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  const startEditingRow = (rowIndex: number) => {
    if (!td.tableData?.data?.[rowIndex]) return
    const row = td.tableData.data[rowIndex]
    const next: Record<string, any> = {}
    for (const col of td.tableData.columns) {
      const value = row[col.name]
      const t = (col.type || '').toLowerCase()
      if (value !== null && value !== undefined && typeof value === 'object') {
        next[col.name] = JSON.stringify(value, null, t.includes('json') ? 2 : 0)
      } else {
        next[col.name] = value ?? ''
      }
    }
    setEditingCell(null)
    setEditValue('')
    setEditingRowIndex(rowIndex)
    setEditRowData(next)
  }

  const cancelEditingRow = () => {
    setEditingRowIndex(null)
    setEditRowData({})
  }

  const saveRowEdit = async () => {
    if (editingRowIndex == null || !td.selectedTable || !td.tableData) return
    setSavingRow(true)
    try {
      const original = td.tableData.data[editingRowIndex]
      const pkCols = getPrimaryKeyColumnNames(td.tableData)
      if (pkCols.length === 0) {
        showToast('No primary key — add one in Edit table or use SQL.', 'error')
        return
      }

      const updates: Record<string, unknown> = {}
      for (const col of td.tableData.columns) {
        if (col.key === 'PRI') continue
        const t = (col.type || '').toLowerCase()
        let newVal: unknown = editRowData[col.name]
        if (newVal === '') newVal = null
        if (t.includes('json') && typeof newVal === 'string' && newVal.trim()) {
          try {
            newVal = JSON.parse(newVal)
          } catch {
            showToast(`Invalid JSON in ${col.name}`, 'error')
            return
          }
        }
        const originalVal = original[col.name]
        const originalCmp =
          originalVal !== null && originalVal !== undefined && typeof originalVal === 'object'
            ? JSON.stringify(originalVal)
            : originalVal ?? ''
        const nextCmp =
          newVal !== null && newVal !== undefined && typeof newVal === 'object'
            ? JSON.stringify(newVal)
            : newVal ?? ''
        if (String(originalCmp) !== String(nextCmp)) {
          updates[col.name] = newVal
        }
      }

      if (Object.keys(updates).length === 0) {
        showToast('No changes to save', 'success')
        cancelEditingRow()
        return
      }

      const q = buildUpdateRowQuery(
        td.selectedTable,
        updates,
        original,
        pkCols,
        td.tableData.columns
      )
      await api.post('/api/v1/db/execute', { query: q, schema: td.selectedSchema }, { headers: { 'X-Project-Slug': slug } })
      await td.loadTableData(td.selectedTable)
      cancelEditingRow()
      showToast('Row updated!', 'success')
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setSavingRow(false)
    }
  }

  // Table name editing
  const startEditingTableName = () => { if (!td.selectedTable) return; setTableNameEditValue(td.selectedTable); setEditingTableName(true) }
  const cancelEditingTableName = () => { setEditingTableName(false); setTableNameEditValue('') }
  const saveTableName = async () => {
    if (!td.selectedTable || !tableNameEditValue.trim() || tableNameEditValue === td.selectedTable) { cancelEditingTableName(); return }
    setSavingTableName(true)
    try {
      await api.post('/api/v1/db/execute', { query: `ALTER TABLE "${td.selectedTable}" RENAME TO "${tableNameEditValue.trim()}"`, schema: td.selectedSchema }, { headers: { 'X-Project-Slug': slug } })
      const newName = tableNameEditValue.trim()
      await td.loadTables()
      td.setSelectedTable(newName)
      // Refresh table data after rename
      await td.loadTableData(newName, rls.loadRLSData)
      setEditingTableName(false); setTableNameEditValue(''); showToast('Renamed!', 'success')
    } catch (err: any) { showToast(`Error: ${err.message}`, 'error') }
    finally { setSavingTableName(false) }
  }

  // Menu toggles
  const toggleFilterMenu = () => {
    if (!td.tableData) return
    if (showFilterMenu) {
      td.discardFilterDraft()
      setShowFilterMenu(false)
    } else {
      if (td.filters.length === 0) td.addFilter()
      setShowFilterMenu(true)
    }
    setShowSortMenu(false)
  }
  const toggleSortMenu = () => {
    if (!td.tableData) return
    setShowSortMenu((prev) => !prev)
    setShowFilterMenu((open) => {
      if (open) td.discardFilterDraft()
      return false
    })
  }
  const handleApplySort = (col: string, direction: 'asc' | 'desc') => {
    td.setSortColumn(col)
    td.setSortDirection(direction)
    setShowSortMenu(false)
  }

  const handleImportCSV = async (file: File) => {
    if (!td.selectedTable) return
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('delimiter', ',')
      form.append('has_header', 'true')
      form.append('create_table', 'false')
      await api.post(`/api/v1/import/${slug}/csv/${td.selectedTable}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await td.loadTableData(td.selectedTable, rls.loadRLSData)
      showToast('CSV imported successfully', 'success')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      showToast(typeof detail === 'string' ? detail : 'Failed to import CSV', 'error')
    }
  }

  // Insert
  const prepareInsertModal = () => {
    if (!td.tableData) return
    const initialData: Record<string, any> = {}
    td.tableData.columns.forEach((col: any) => { if (col.key !== 'PRI' || !col.extra?.includes('auto_increment')) initialData[col.name] = '' })
    setInsertData(initialData); setShowInsertModal(true)
  }


  // Column management
  const addColumn = () => setNewTableColumns([...newTableColumns, { name: '', type: 'TEXT', typeParams: '', nullable: 'YES' }])
  const removeColumn = (index: number) => { if (newTableColumns.length > 1) setNewTableColumns(newTableColumns.filter((_, i) => i !== index)) }
  const updateColumn = (index: number, field: keyof Column, value: string) => {
    const updated = [...newTableColumns]; updated[index] = { ...updated[index], [field]: value }
    if (field === 'type') {
      if (!typeNeedsParams(value, postgresDataTypes)) updated[index].typeParams = undefined
      else if (!updated[index].typeParams) { const m = getTypeExample(value, postgresDataTypes).match(/\((.+)\)/); if (m) updated[index].typeParams = m[1] }
    }
    setNewTableColumns(updated)
  }

  // Column dropdown handlers
  const toggleColumnDropdown = (col: string, e: React.MouseEvent) => { e.stopPropagation(); setActiveColumnDropdown(activeColumnDropdown === col ? null : col) }
  const handleSortFromDropdown = (col: string, dir: 'asc' | 'desc') => { td.setSortColumn(col); td.setSortDirection(dir); setActiveColumnDropdown(null) }
  const handleEditColumn = (col: string) => {
    setActiveColumnDropdown(null)
    openEditTableModal(undefined, col)
  }
  const handleSaveColumnEdit = async () => {
    if (!td.selectedTable || !editingColumn || !columnEditData) return
    try {
      if (columnEditData.name !== editingColumn) {
        await api.post('/api/v1/db/execute', { query: `ALTER TABLE "${td.selectedTable}" RENAME COLUMN "${editingColumn}" TO "${columnEditData.name}"`, schema: td.selectedSchema }, { headers: { 'X-Project-Slug': slug } })
        showToast('Column renamed', 'success')
      }
      await td.loadTableData(td.selectedTable); setEditingColumn(null); setColumnEditData(null)
    } catch (err: any) { showToast(`Error: ${err.message}`, 'error') }
  }
  const handleDeleteColumn = (col: string) => { setColumnToDelete(col); setShowDeleteColumnModal(true); setActiveColumnDropdown(null) }
  const confirmDeleteColumn = async () => {
    if (!td.selectedTable || !columnToDelete) return
    try {
      await api.post('/api/v1/db/execute', { query: `ALTER TABLE "${td.selectedTable}" DROP COLUMN "${columnToDelete}"`, schema: td.selectedSchema }, { headers: { 'X-Project-Slug': slug } })
      await td.loadTableData(td.selectedTable); setShowDeleteColumnModal(false); setColumnToDelete(null); showToast('Column deleted!', 'success')
    } catch (err: any) { showToast(`Error: ${err.message}`, 'error') }
  }
  const toggleFreezeColumn = (col: string) => { setFrozenColumns(prev => { const n = new Set(prev); n.has(col) ? n.delete(col) : n.add(col); return n }); setActiveColumnDropdown(null) }

  // Table context actions
  const handleRenameInline = async (oldName: string, newName: string) => {
    try {
      await api.post('/api/v1/db/execute', { query: `ALTER TABLE "${oldName}" RENAME TO "${newName}"`, schema: td.selectedSchema }, { headers: { 'X-Project-Slug': slug } })
      td.setTables(td.tables.map(t => t.name === oldName ? { name: newName } : t))
      td.setSelectedTable(newName); showToast(`Table renamed to "${newName}"`, 'success')
    } catch (err: any) { showToast(`Error: ${err.message}`, 'error') }
  }
  const handleCopyTableName = (name: string) => { navigator.clipboard.writeText(name); showToast('Copied!', 'success'); setShowTableDropdown(null) }
  const handleDuplicateTable = async (name: string) => {
    try {
      const newName = `${name}_copy`
      // Batch CREATE and INSERT operations
      await api.post('/api/v1/db/execute', { 
        queries: [
          `CREATE TABLE "${newName}" (LIKE "${name}" INCLUDING ALL)`,
          `INSERT INTO "${newName}" SELECT * FROM "${name}"`
        ],
        schema: td.selectedSchema,
      }, { headers: { 'X-Project-Slug': slug } })
      await td.loadTables(); 
      td.setSelectedTable(newName)
      // Refresh table data to show the duplicated table
      await td.loadTableData(newName, rls.loadRLSData)
      showToast(`Duplicated as "${newName}"`, 'success')
    } catch (err: any) { showToast(`Error: ${err.message}`, 'error') }
  }


  // Edit table modal handlers — open panel without forcing a table data refresh.
  const openEditTableModal = (tableName?: string, columnToEdit?: string) => {
    const target = tableName || td.selectedTable
    if (!target) return

    setEditTableName(target)
    setColumnsToAdd([])
    setColumnsToRemove([])
    setPrimaryKeyColumnToAdd(null)
    void reloadDataTypes()

    const seedColumnEdit = (columnName: string | undefined) => {
      if (!columnName || !td.tableData || td.selectedTable !== target) {
        setColumnsToEdit({})
        return
      }
      const col = td.tableData.columns.find((c: any) => c.name === columnName)
      if (!col) {
        setColumnsToEdit({})
        return
      }
      const ui = pgInformationSchemaToUiColumn(col)
      setColumnsToEdit({
        [columnName]: {
          name: col.name,
          type: ui.type,
          typeParams: ui.typeParams,
          nullable: col.null === 'YES' ? 'YES' : 'NO',
        },
      })
    }

    if (td.selectedTable === target && td.tableData) {
      seedColumnEdit(columnToEdit)
      setShowEditTableModal(true)
      return
    }

    // Editing a different table: select it, then open once its metadata is ready.
    pendingEditColumnRef.current = columnToEdit || null
    setColumnsToEdit({})
    setPendingOpenEditTable(true)
    if (td.selectedTable !== target) {
      td.setSelectedTable(target)
    }
  }
  const startEditingColumnInModal = (columnName: string) => {
    if (!td.tableData) return
    const col = td.tableData.columns.find((c: any) => c.name === columnName)
    if (!col) return
    const ui = pgInformationSchemaToUiColumn(col)
    setColumnsToEdit((prev) => ({
      ...prev,
      [columnName]: {
        name: col.name,
        type: ui.type,
        typeParams: ui.typeParams,
        nullable: col.null === 'YES' ? 'YES' : 'NO',
      },
    }))
  }
  const updateColumnEdit = (columnName: string, field: keyof Column, value: string) => {
    setColumnsToEdit((prev) => {
      const current = prev[columnName] || { name: columnName, type: 'TEXT', nullable: 'YES' }
      const updated: Column = { ...current, [field]: value }
      if (field === 'type') {
        if (!typeNeedsParams(value, postgresDataTypes)) updated.typeParams = undefined
        else if (!updated.typeParams) {
          const m = getTypeExample(value, postgresDataTypes).match(/\((.+)\)/)
          if (m) updated.typeParams = m[1]
        }
      }
      return { ...prev, [columnName]: updated }
    })
  }
  const cancelEditingColumnInModal = (name: string) => { const n = { ...columnsToEdit }; delete n[name]; setColumnsToEdit(n) }
  const addNewColumn = () => setColumnsToAdd([...columnsToAdd, { name: '', type: 'TEXT', typeParams: '', nullable: 'YES' }])
  const updateNewColumn = (index: number, field: keyof Column, value: string) => {
    const updated = [...columnsToAdd]; updated[index] = { ...updated[index], [field]: value }
    if (field === 'type') {
      if (!typeNeedsParams(value, postgresDataTypes)) updated[index].typeParams = undefined
      else if (!updated[index].typeParams) { const m = getTypeExample(value, postgresDataTypes).match(/\((.+)\)/); if (m) updated[index].typeParams = m[1] }
    }
    setColumnsToAdd(updated)
  }
  const removeNewColumn = (index: number) => setColumnsToAdd(columnsToAdd.filter((_, i) => i !== index))
  const toggleColumnRemoval = (name: string) => {
    if (columnsToRemove.includes(name)) setColumnsToRemove(columnsToRemove.filter(c => c !== name))
    else setColumnsToRemove([...columnsToRemove, name])
  }

  // Create table
  const handleCreateTable = async () => {
    if (!newTableName.trim()) { showToast('Please enter a table name', 'warning'); return }
    const invalid = newTableColumns.filter(c => !c.name.trim())
    if (invalid.length > 0) { showToast('All columns must have a name', 'warning'); return }
    const names = newTableColumns.map(c => c.name.toLowerCase())
    const dups = names.filter((n, i) => names.indexOf(n) !== i)
    if (dups.length > 0) { showToast(`Duplicate column: ${dups[0]}`, 'warning'); return }
    td.setCreatingTable(true)
    try {
      const colDefs = newTableColumns.map(col => {
        let def = `"${col.name}" ${getFullTypeString(col)}`
        if (col.nullable === 'NO') def += ' NOT NULL'
        if (col.type === 'UUID' && col.name === 'id') def += ' DEFAULT gen_random_uuid()'
        else if (col.type.includes('TIMESTAMP') && (col.name === 'created_at' || col.name === 'updated_at')) def += ' DEFAULT CURRENT_TIMESTAMP'
        if (col.key === 'PRI') def += ' PRIMARY KEY'
        return def
      }).join(', ')
      // Batch table creation operations
      const batchQueries = [`CREATE TABLE "${newTableName.trim()}" (${colDefs})`]
      if (enableRLS) batchQueries.push(`ALTER TABLE "${newTableName.trim()}" ENABLE ROW LEVEL SECURITY`)
      if (newTableDescription.trim()) batchQueries.push(`COMMENT ON TABLE "${newTableName.trim()}" IS '${newTableDescription.trim().replace(/'/g, "''")}'`)
      await api.post('/api/v1/db/execute', { queries: batchQueries, schema: td.selectedSchema }, { headers: { 'X-Project-Slug': slug } })
      await td.loadTables(); 
      const newTable = newTableName.trim()
      td.setSelectedTable(newTable)
      // Refresh table data to show the new table structure
      await td.loadTableData(newTable, rls.loadRLSData)
      setShowNewTableModal(false); setNewTableName(''); setNewTableDescription('')
      setEnableRLS(false); setNewTableColumns([{ name: 'id', type: 'UUID', nullable: 'NO', key: 'PRI' }, { name: 'created_at', type: 'TIMESTAMPTZ', nullable: 'NO' }])
      showToast(enableRLS ? 'Table created with RLS!' : 'Table created!', 'success')
    } catch (err: any) { showToast(`Error: ${err.message}`, 'error') }
    finally { td.setCreatingTable(false) }
  }


  // Insert record
  const handleInsertRecord = async () => {
    if (!td.selectedTable) return
    td.setInsertingRecord(true)
    try {
      const columnsWithDefaults = td.tableData?.columns.filter((col: any) => {
        const d = col.default?.toLowerCase() || '', n = col.name?.toLowerCase() || '', t = col.type?.toLowerCase() || ''
        if (t.includes('uuid') && (d.includes('uuid_generate_v4') || d.includes('gen_random_uuid'))) return true
        if ((n.includes('created_at') || n.includes('updated_at')) && (d.includes('current_timestamp') || d.includes('now()'))) return true
        if (d && d !== 'null') return true
        return false
      }).map((col: any) => col.name.toLowerCase()) || []

      const userColumns = Object.keys(insertData).filter(key => {
        if (columnsWithDefaults.includes(key.toLowerCase()) && (!insertData[key] || insertData[key] === '')) return false
        return insertData[key] !== '' && insertData[key] !== null
      })
      if (userColumns.length === 0) { showToast('Please enter at least one field', 'warning'); td.setInsertingRecord(false); return }
      const columnsStr = userColumns.map(c => `"${c}"`).join(', ')
      const valuesStr = userColumns.map(col => {
        const val = insertData[col]
        if (val === null || val === '') return 'NULL'
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
        return val
      }).join(', ')
      await api.post('/api/v1/db/execute', { query: `INSERT INTO "${td.selectedTable}" (${columnsStr}) VALUES (${valuesStr})`, schema: td.selectedSchema }, { headers: { 'X-Project-Slug': slug } })
      await td.loadTableData(td.selectedTable); setShowInsertModal(false); setInsertData({}); showToast('Inserted!', 'success')
    } catch (err: any) { showToast(`Error: ${err.message}`, 'error') }
    finally { td.setInsertingRecord(false) }
  }

  // Edit table apply
  const handleEditTable = async () => {
    if (!td.selectedTable) return
    let currentTableName = td.selectedTable
    td.setEditingTable(true)
    try {
      // Batch all ALTER TABLE operations
      const batchQueries: string[] = []

      // Table rename (must be first)
      if (editTableName.trim() && editTableName !== td.selectedTable) {
        batchQueries.push(`ALTER TABLE "${td.selectedTable}" RENAME TO "${editTableName.trim()}"`)
        currentTableName = editTableName.trim()
      }

      // Column renames (must happen before adds/drops / type changes)
      for (const [originalName, editedCol] of Object.entries(columnsToEdit)) {
        if (!editedCol.name.trim()) continue
        if (editedCol.name !== originalName) {
          batchQueries.push(`ALTER TABLE "${currentTableName}" RENAME COLUMN "${originalName}" TO "${editedCol.name.trim()}"`)
        }
      }

      // Type + nullability for edited columns (after renames so we use final column names)
      if (td.tableData) {
        for (const [originalName, editedCol] of Object.entries(columnsToEdit)) {
          const finalName = editedCol.name.trim() || originalName
          const origCol = td.tableData.columns.find((c: { name: string }) => c.name === originalName)
          if (!origCol) continue

          const origUi = pgInformationSchemaToUiColumn(origCol)
          const origForCompare: Column = {
            name: origCol.name,
            type: origUi.type,
            typeParams: origUi.typeParams,
            nullable: origCol.null === 'YES' ? 'YES' : 'NO',
          }
          const origFull = getFullTypeString(origForCompare)
          const newFull = getFullTypeString(editedCol)
          if (origFull !== newFull) {
            const qtbl = `"${currentTableName.replace(/"/g, '""')}"`
            const qcol = `"${finalName.replace(/"/g, '""')}"`
            const usingSql = pgUsingClauseForAlterType(qcol, editedCol)
            batchQueries.push(`ALTER TABLE ${qtbl} ALTER COLUMN ${qcol} TYPE ${newFull} ${usingSql}`)
          }

          const origNull = origCol.null === 'YES'
          const newNull = editedCol.nullable === 'YES'
          if (origNull !== newNull) {
            const qtbl = `"${currentTableName.replace(/"/g, '""')}"`
            const qcol = `"${finalName.replace(/"/g, '""')}"`
            if (newNull) batchQueries.push(`ALTER TABLE ${qtbl} ALTER COLUMN ${qcol} DROP NOT NULL`)
            else batchQueries.push(`ALTER TABLE ${qtbl} ALTER COLUMN ${qcol} SET NOT NULL`)
          }
        }
      }

      // Add columns
      for (const col of columnsToAdd) {
        if (!col.name.trim()) continue
        let def = `"${col.name.trim()}" ${getFullTypeString(col)}`
        if (col.nullable === 'NO') def += ' NOT NULL'
        batchQueries.push(`ALTER TABLE "${currentTableName}" ADD COLUMN ${def}`)
      }

      // Drop columns (must be last before adding PK)
      for (const colName of columnsToRemove) {
        batchQueries.push(`ALTER TABLE "${currentTableName}" DROP COLUMN "${colName}"`)
      }

      if (primaryKeyColumnToAdd?.trim()) {
        const pkc = primaryKeyColumnToAdd.trim()
        batchQueries.push(`ALTER TABLE "${currentTableName}" ADD PRIMARY KEY ("${pkc.replace(/"/g, '""')}")`)
      }

      // Execute all operations in a single batch
      if (batchQueries.length > 0) {
        await api.post('/api/v1/db/execute', { queries: batchQueries, schema: td.selectedSchema }, { headers: { 'X-Project-Slug': slug } })
      }

      await td.loadTables()
      td.setSelectedTable(currentTableName)
      // Refresh table data to show updated structure (new columns, renamed columns, etc.)
      await td.loadTableData(currentTableName, rls.loadRLSData)
      setShowEditTableModal(false)
      setColumnsToEdit({})
      setPrimaryKeyColumnToAdd(null)
      showToast('Table updated!', 'success')
    } catch (err: any) { showToast(`Error: ${err.message}`, 'error') }
    finally { td.setEditingTable(false) }
  }

  // Delete table
  const handleDeleteTable = async () => {
    if (confirmDeleteTableName !== td.selectedTable) { showToast('Name does not match', 'warning'); return }
    setDeletingTable(true)
    try {
      await api.delete(`/api/v1/db/tables/${td.selectedTable}`, { headers: { 'X-Project-Slug': slug }, params: { cascade: deleteTableCascade, schema: td.selectedSchema } })
      await td.loadTables(); const name = td.selectedTable; td.setSelectedTable(null); setShowDeleteTableModal(false); setConfirmDeleteTableName(''); setDeleteTableCascade(false)
      showToast(`Table "${td.selectedTable}" deleted`, 'success')
    } catch (err: any) { showToast(err.response?.data?.detail || 'Failed to delete table', 'error') }
    finally { setDeletingTable(false) }
  }

  // RLS management callbacks
  const onManageRLS = async (tableName?: string) => {
    const name = tableName || td.selectedTable
    if (tableName) td.setSelectedTable(tableName)
    rls.setShowRLSModal(true)
    if (name) await rls.loadRLSData(name)
  }
  const onCreateRLSPolicy = async (tableName: string) => {
    td.setSelectedTable(tableName)
    await rls.loadRLSData(tableName)
    rls.setEditingPolicy(null)
    rls.setNewPolicy({ policy_name: '', command: 'SELECT', using_expression: '', with_check_expression: '', roles: ['authenticated'] })
    rls.setShowRLSPanel(true); rls.setShowRLSModal(true)
  }

  // Realtime helpers — debounced + abort so rapid table switches do not spam /realtime/tables (429 + render storms).
  const realtimeStatusAbortRef = useRef<AbortController | null>(null)

  const checkRealtimeStatus = useCallback(async (tableName: string) => {
    realtimeStatusAbortRef.current?.abort()
    const ac = new AbortController()
    realtimeStatusAbortRef.current = ac
    const signal = ac.signal
    try {
      const response = await api.get('/api/v1/realtime/tables', {
        headers: { 'X-Project-Slug': slug },
        signal,
      })
      const tables = response.data?.tables || []
      const found = tables.some((t: any) => t.table?.toLowerCase() === tableName.toLowerCase())
      setRealtimeEnabled(found)
    } catch (err) {
      if (axios.isCancel(err)) return
      setRealtimeEnabled(false)
    }
  }, [slug])

  useEffect(() => {
    if (!td.selectedTable) {
      realtimeStatusAbortRef.current?.abort()
      setRealtimeEnabled(false)
      return
    }
    const name = td.selectedTable
    const t = window.setTimeout(() => {
      checkRealtimeStatus(name)
    }, 450)
    return () => {
      clearTimeout(t)
      realtimeStatusAbortRef.current?.abort()
    }
  }, [td.selectedTable, checkRealtimeStatus])

  const handleToggleRealtime = async () => {
    if (!td.selectedTable) return
    setTogglingRealtime(true)
    try {
      if (realtimeEnabled) {
        await api.post(
          `/api/v1/realtime/disable?schema=public&table=${encodeURIComponent(td.selectedTable)}`,
          {},
          { headers: { 'X-Project-Slug': slug } }
        )
        setRealtimeEnabled(false)
        showToast(`Realtime disabled for ${td.selectedTable}`, 'success')
      } else {
        await api.post(
          `/api/v1/realtime/enable?schema=public&table=${encodeURIComponent(td.selectedTable)}`,
          {},
          { headers: { 'X-Project-Slug': slug } }
        )
        setRealtimeEnabled(true)
        showToast(`Realtime enabled for ${td.selectedTable}`, 'success')
      }
      setShowRealtimeModal(false)
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to toggle realtime', 'error')
    } finally {
      setTogglingRealtime(false)
    }
  }

  // Loading guard
  if (!td.project) {
  return <PageSkeleton variant="editor" projectSlug={slug} />
  }

  return (
  <div className="h-screen bg-zinc-50 dark:bg-[#0a0a0f] overflow-hidden transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,0,0,0.8)_70%,transparent_100%)] dark:[mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.8)_70%,transparent_100%)] animate-grid-flow" />
      </div>

      <Sidebar projectSlug={slug} projectName={td.project.name} />

      <div className="h-full flex transition-all duration-300 relative z-10" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
        <TablesSidebar
          tables={td.tables} filteredTables={td.filteredTables} selectedTable={td.selectedTable}
          setSelectedTable={td.setSelectedTable} searchTerm={td.searchTerm} setSearchTerm={td.setSearchTerm}
          loading={td.loading}
          schemas={td.schemas} selectedSchema={td.selectedSchema} setSelectedSchema={td.setSelectedSchema}
          showTableDropdown={showTableDropdown} setShowTableDropdown={setShowTableDropdown}
          renamingTable={renamingTable} setRenamingTable={setRenamingTable}
          renamingTableValue={renamingTableValue} setRenamingTableValue={setRenamingTableValue}
          onRefresh={td.loadTables} onNewTable={() => { reloadDataTypes(); setShowNewTableModal(true) }}
          onRenameInline={handleRenameInline} onCopyTableName={handleCopyTableName}
          onEditTable={openEditTableModal} onDuplicateTable={handleDuplicateTable}
          onManageRLS={onManageRLS} onCreateRLSPolicy={onCreateRLSPolicy}
          onDeleteTable={(name) => { td.setSelectedTable(name); setShowDeleteTableModal(true) }}
        />

        <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#0a0a0f] min-w-0 transition-colors duration-300">
          {td.selectedTable ? (
            <>
              <TableToolbar
                selectedTable={td.selectedTable} tableData={td.tableData}
                editingTableName={editingTableName} tableNameEditValue={tableNameEditValue}
                setTableNameEditValue={setTableNameEditValue} savingTableName={savingTableName}
                onStartEditingTableName={startEditingTableName} onSaveTableName={saveTableName}
                onCancelEditingTableName={cancelEditingTableName}
                rlsEnabled={rls.rlsEnabled} rlsPolicies={rls.rlsPolicies} onManageRLS={() => onManageRLS()}
                realtimeEnabled={realtimeEnabled} onToggleRealtime={() => setShowRealtimeModal(true)}
                sortColumn={td.sortColumn} sortDirection={td.sortDirection} onClearSort={td.clearSort}
                hasSelection={hasSelection} selectedCount={selectedRowIndices.size}
                onDeleteSelection={handleDeleteSelection}
                showCopyMenu={showCopyMenu} setShowCopyMenu={setShowCopyMenu}
                showExportMenu={showExportMenu} setShowExportMenu={setShowExportMenu}
                onCopyAsJSON={handleCopyAsJSON} onCopyAsSQL={handleCopyAsSQL}
                onExportAsJSON={handleExportAsJSON} onExportAsSQL={handleExportAsSQL} onExportAsCSV={handleExportAsCSV}
                showFilterMenu={showFilterMenu} setShowFilterMenu={setShowFilterMenu}
                showSortMenu={showSortMenu} setShowSortMenu={setShowSortMenu}
                filters={td.filters} appliedFilters={td.appliedFilters}
                onAddFilter={td.addFilter} onUpdateFilter={td.updateFilter}
                onRemoveFilter={td.removeFilter} onRemoveAppliedFilter={td.removeAppliedFilter}
                onClearFilters={td.clearFilters} onApplyFilters={td.applyFilters}
                onDiscardFilterDraft={td.discardFilterDraft}
                onApplySort={handleApplySort}
                onToggleFilterMenu={toggleFilterMenu}
                onToggleSortMenu={toggleSortMenu}
                onInsertRow={prepareInsertModal}
                onInsertColumn={() => openEditTableModal()}
                onImportCSV={handleImportCSV}
                sortMenuRef={sortMenuRef} filterMenuRef={filterMenuRef}
                copyMenuRef={copyMenuRef} exportMenuRef={exportMenuRef}
              />
              <DataTable
                tableData={td.tableData} loadingData={td.loadingData} error={td.error}
                selectedTable={td.selectedTable} onRetry={() => td.loadTableData(td.selectedTable!)}
                allRowsSelected={allRowsSelected} headerCheckboxRef={headerCheckboxRef}
                onToggleSelectAll={toggleSelectAllRows} selectedRowIndices={selectedRowIndices}
                onToggleRowSelection={toggleRowSelection}
                sortColumn={td.sortColumn} sortDirection={td.sortDirection}
                frozenColumns={frozenColumns} activeColumnDropdown={activeColumnDropdown}
                editingColumn={editingColumn} columnEditData={columnEditData} setColumnEditData={setColumnEditData}
                onToggleColumnDropdown={toggleColumnDropdown} onSortFromDropdown={handleSortFromDropdown}
                onEditColumn={handleEditColumn} onSaveColumnEdit={handleSaveColumnEdit}
                setEditingColumn={setEditingColumn} onDeleteColumn={handleDeleteColumn}
                onToggleFreezeColumn={toggleFreezeColumn}
                columnWidths={columnWidths} onResizeStart={handleResizeStart} getColumnWidth={getColumnWidth}
                editingCell={editingCell} editValue={editValue} setEditValue={setEditValue}
                savingEdit={savingEdit} onStartEditing={startEditing} onSaveEdit={saveEdit} onCancelEditing={cancelEditing}
                onEditRow={startEditingRow}
                currentPage={td.currentPage} setCurrentPage={td.setCurrentPage} pageSize={td.pageSize}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <TableIcon className="w-16 h-16 text-zinc-600 dark:text-white/30 mx-auto mb-4" />
                <h3 className="text-sm font-medium mb-2 text-foreground">Select a table</h3>
                <p className="text-zinc-600 dark:text-white/60">Choose a table from the sidebar to view and edit data</p>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Global styles */}
      <style dangerouslySetInnerHTML={{__html: `
        select option { background-color: rgb(17 24 39) !important; color: white !important; }
        select optgroup { background-color: rgb(17 24 39) !important; color: rgb(156 163 175) !important; font-weight: 600; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}} />

      {showNewTableModal && (
        <CreateTableModal
          newTableName={newTableName} setNewTableName={setNewTableName}
          newTableDescription={newTableDescription} setNewTableDescription={setNewTableDescription}
          enableRLS={enableRLS} setEnableRLS={setEnableRLS}
          newTableColumns={newTableColumns} creatingTable={td.creatingTable}
          postgresDataTypes={postgresDataTypes}
          onClose={() => { setShowNewTableModal(false); setNewTableName(''); setNewTableDescription(''); setEnableRLS(true); setNewTableColumns([{ name: 'id', type: 'UUID', nullable: 'NO', key: 'PRI' }, { name: 'created_at', type: 'TIMESTAMPTZ', nullable: 'NO' }]) }}
          onCreate={handleCreateTable} onAddColumn={addColumn} onRemoveColumn={removeColumn} onUpdateColumn={updateColumn}
        />
      )}

      {showInsertModal && td.selectedTable && (
        <InsertRecordModal
          selectedTable={td.selectedTable} tableData={td.tableData}
          insertData={insertData} setInsertData={setInsertData} insertingRecord={td.insertingRecord}
          onClose={() => setShowInsertModal(false)} onInsert={handleInsertRecord}
        />
      )}

      {editingRowIndex != null && td.selectedTable && td.tableData && (
        <EditRowModal
          selectedTable={td.selectedTable}
          tableData={td.tableData}
          rowIndex={editingRowIndex}
          editRowData={editRowData}
          setEditRowData={setEditRowData}
          savingRow={savingRow}
          onClose={cancelEditingRow}
          onSave={saveRowEdit}
        />
      )}

      {showEditTableModal && td.selectedTable && td.tableData && (
        <EditTableModal
          selectedTable={td.selectedTable} tableData={td.tableData}
          primaryKeyColumns={getPrimaryKeyColumnNames(td.tableData)}
          primaryKeyColumnToAdd={primaryKeyColumnToAdd}
          setPrimaryKeyColumnToAdd={setPrimaryKeyColumnToAdd}
          editTableName={editTableName} setEditTableName={setEditTableName}
          columnsToEdit={columnsToEdit} columnsToAdd={columnsToAdd} columnsToRemove={columnsToRemove}
          editingTable={td.editingTable} postgresDataTypes={postgresDataTypes}
          onClose={() => { setShowEditTableModal(false); setColumnsToEdit({}); setPrimaryKeyColumnToAdd(null) }}
          onApply={handleEditTable}
          onStartEditColumn={startEditingColumnInModal} onUpdateColumnEdit={updateColumnEdit}
          onCancelEditColumn={cancelEditingColumnInModal}
          onAddNewColumn={addNewColumn} onUpdateNewColumn={updateNewColumn} onRemoveNewColumn={removeNewColumn}
          onToggleColumnRemoval={toggleColumnRemoval}
        />
      )}

      {showDeleteTableModal && td.selectedTable && (
        <DeleteTableModal
          selectedTable={td.selectedTable}
          confirmDeleteTableName={confirmDeleteTableName} setConfirmDeleteTableName={setConfirmDeleteTableName}
          deleteTableCascade={deleteTableCascade} setDeleteTableCascade={setDeleteTableCascade}
          deletingTable={deletingTable}
          onClose={() => { setShowDeleteTableModal(false); setConfirmDeleteTableName(''); setDeleteTableCascade(false) }}
          onDelete={handleDeleteTable}
        />
      )}

      {showDeleteColumnModal && columnToDelete && (
        <DeleteColumnModal
          columnToDelete={columnToDelete}
          onClose={() => { setShowDeleteColumnModal(false); setColumnToDelete(null) }}
          onConfirm={confirmDeleteColumn}
        />
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        variant={confirmationModal.variant}
        isLoading={confirmationModal.isLoading}
        showCascade={confirmationModal.showCascade}
        cascade={confirmationModal.cascade}
        onCascadeChange={confirmationModal.onCascadeChange}
      />

      {rls.showRLSModal && td.selectedTable && (
        <RLSModal
          selectedTable={td.selectedTable} rlsEnabled={rls.rlsEnabled} rlsPolicies={rls.rlsPolicies}
          loadingRLS={rls.loadingRLS} showRLSPanel={rls.showRLSPanel} setShowRLSPanel={rls.setShowRLSPanel}
          editingPolicy={rls.editingPolicy} setEditingPolicy={rls.setEditingPolicy}
          newPolicy={rls.newPolicy} setNewPolicy={rls.setNewPolicy} tableData={td.tableData}
          onClose={() => { rls.setShowRLSModal(false); rls.setEditingPolicy(null); rls.setShowRLSPanel(false) }}
          onToggleRLS={(enable) => rls.toggleRLS(enable, td.selectedTable!)}
          onCreatePolicy={() => rls.createRLSPolicy(td.selectedTable!)}
          onUpdatePolicy={() => rls.updateRLSPolicy(td.selectedTable!)}
          onDeletePolicy={(name) => {
            setConfirmationModal({
              isOpen: true, title: 'Delete Policy', message: `Delete policy "${name}"?`,
              variant: 'danger', isLoading: false,
              onConfirm: async () => { await rls.deleteRLSPolicy(name, td.selectedTable!); setConfirmationModal(prev => ({ ...prev, isOpen: false })) }
            })
          }}
          getRLSSuggestions={() => rls.getRLSSuggestions(td.tableData)}
        />
      )}

      {/* Realtime Enable/Disable Modal */}
      {showRealtimeModal && td.selectedTable && (
        <div className="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="glass-card border border-zinc-300 dark:border-white/20 rounded-md p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                {realtimeEnabled ? 'Disable' : 'Enable'} realtime for {td.selectedTable}
              </h3>
              <button onClick={() => setShowRealtimeModal(false)} className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {realtimeEnabled ? (
              <div className="mb-6">
                <p className="text-zinc-600 dark:text-white/70 text-sm mb-3">
                Realtime is currently <span className="text-blue-400 font-medium">enabled</span> for this table.
                </p>
                <p className="text-zinc-600 dark:text-white/50 text-sm">
                  Disabling realtime will remove the trigger that broadcasts changes. Existing subscribers will stop receiving updates.
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-zinc-600 dark:text-white/70 text-sm mb-3">
                  Once realtime has been enabled, the table will broadcast any changes to authorized subscribers.
                </p>
                <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-md p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-xs font-bold">1</span>
                    </div>
                    <div>
                    <p className="text-foreground text-sm font-medium">Trigger Installation</p>
                    <p className="text-zinc-600 dark:text-white/50 text-xs">A PostgreSQL trigger will be installed on this table</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs font-bold">2</span>
                    </div>
                    <div>
                    <p className="text-foreground text-sm font-medium">Change Detection</p>
                    <p className="text-zinc-600 dark:text-white/50 text-xs">INSERT, UPDATE, and DELETE events will be captured</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs font-bold">3</span>
                </div>
                <div>
                <p className="text-foreground text-sm font-medium">Live Broadcast</p>
                <p className="text-zinc-600 dark:text-white/50 text-xs">Changes are broadcast via NOTIFY to connected subscribers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
      <button
      onClick={() => setShowRealtimeModal(false)}
      className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-white/20 text-foreground rounded-md hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-sm font-medium"
      >
      Cancel
    </button>
    <button
    onClick={handleToggleRealtime}
    disabled={togglingRealtime}
    className={`flex-1 px-4 py-2.5 rounded-md text-foreground text-sm font-medium transition-colors disabled:opacity-50 ${
    realtimeEnabled
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
  }`}
  >
  {togglingRealtime
  ? (realtimeEnabled ? 'Disabling...' : 'Enabling...')
  : (realtimeEnabled ? 'Disable realtime' : 'Enable realtime')
}
</button>
</div>
</div>
</div>
)}
</div>
)
}
