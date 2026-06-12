import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { TableInfo, SchemaInfo, Project, Column, PostgreSQLDataTypes, FilterItem, ConfirmationModalState } from '../types'
import { getFullTypeString, typeNeedsParams, getTypeExample } from '../utils/postgresTypes'

type ToastType = 'success' | 'error' | 'info' | 'warning'

function filterValueIsEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string' && v.trim() === '') return true
  return false
}

/** Operators that require a non-empty value (skip blanks so we do not bind '' to int/uuid columns). */
const OPERATORS_NEEDING_VALUE = new Set([
  'equals',
  'not_equals',
  'greater',
  'less',
  'like',
])

function columnTypeFor(columns: Column[] | undefined, name: string): string | undefined {
  return columns?.find((c) => c.name === name)?.type
}

type ParsedFilter = { column: string; operator: string; value: unknown }

/**
 * Validate + coerce filter value against Postgres column type.
 * Returns ok:false when the value cannot match (e.g. "q" on integer id) — show "No match found".
 */
function parseFilterValueForColumn(
  raw: string,
  pgType: string | undefined,
  operator: string
): { ok: true; value: string | number | boolean } | { ok: false; message: string } {
  if (operator === 'like') return { ok: true, value: raw }
  const t = (pgType || '').toLowerCase()
  const s = raw.trim()
  const baseName = (pgType || 'unknown').split('(')[0].trim()

  if (!t) {
    return { ok: true, value: raw }
  }

  if (/^(smallint|integer|bigint|int2|int4|int8|serial|bigserial|smallserial|oid)\b/i.test(t)) {
    if (!/^-?\d+$/.test(s)) {
      return {
        ok: false,
        message: `No match found — "${raw}" is not a valid whole number for column type ${baseName}.`,
      }
    }
    return { ok: true, value: parseInt(s, 10) }
  }

  if (/^(numeric|decimal|real|double|float4|float8|money)\b/i.test(t)) {
    const n = parseFloat(s)
    if (Number.isNaN(n)) {
      return {
        ok: false,
        message: `No match found — "${raw}" is not a valid number for column type ${baseName}.`,
      }
    }
    return { ok: true, value: n }
  }

  if (/^boolean\b/i.test(t)) {
    const x = s.toLowerCase()
    if (['true', 't', '1', 'yes', 'y'].includes(x)) return { ok: true, value: true }
    if (['false', 'f', '0', 'no', 'n'].includes(x)) return { ok: true, value: false }
    return {
      ok: false,
      message: `No match found — "${raw}" is not a valid boolean (use true/false or 1/0).`,
    }
  }

  if (/^uuid\b/i.test(t)) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
    ) {
      return { ok: false, message: `No match found — "${raw}" is not a valid UUID.` }
    }
    return { ok: true, value: s }
  }

  return { ok: true, value: raw }
}

type BuildApiFiltersResult =
  | { ok: true; filters: ParsedFilter[] }
  | { ok: false; message: string }

/** Map UI filters to POST /db/tables/:name/query (parameterized filters; avoids raw WHERE). */
function buildApiFilters(filters: FilterItem[], columns?: Column[]): BuildApiFiltersResult {
  const out: ParsedFilter[] = []
  for (const f of filters) {
    if (!f.column || !String(f.column).trim()) continue
    const col = String(f.column).trim()
    const pgType = columnTypeFor(columns, col)

    if (f.operator === 'is_null') {
      out.push({ column: col, operator: 'is', value: null })
      continue
    }
    if (f.operator === 'not_null') {
      out.push({ column: col, operator: 'is_not', value: null })
      continue
    }

    if (!OPERATORS_NEEDING_VALUE.has(f.operator)) continue
    if (filterValueIsEmpty(f.value)) continue

    const raw = String(f.value)

    if (f.operator === 'like') {
      out.push({ column: col, operator: 'like', value: raw })
      continue
    }

    const apiOp =
      f.operator === 'not_equals'
        ? 'neq'
        : f.operator === 'greater'
          ? 'gt'
          : f.operator === 'less'
            ? 'lt'
            : 'eq'

    const parsed = parseFilterValueForColumn(raw, pgType, f.operator)
    if (!parsed.ok) return { ok: false, message: parsed.message }
    out.push({ column: col, operator: apiOp, value: parsed.value })
  }
  return { ok: true, filters: out }
}

export function useTableData(slug: string, showToast: (msg: string, type?: ToastType) => void) {
  const router = useRouter()
  const searchParams = useSearchParams()
  /** Primitives — `searchParams` object identity changes most renders; using it in effect deps caused router/render storms. */
  const tableFromUrlParam = searchParams?.get('table') ?? null
  const searchParamsString = searchParams?.toString() ?? ''
  const [project, setProject] = useState<Project | null>(null)
  const [schemas, setSchemas] = useState<SchemaInfo[]>([])
  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [creatingTable, setCreatingTable] = useState(false)
  const [editingTable, setEditingTable] = useState(false)
  const [insertingRecord, setInsertingRecord] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(100)

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Filters
  const [filters, setFilters] = useState<FilterItem[]>([])

  /** While router.replace updates ?table=, searchParams can lag; don't let URL→state sync overwrite the clicked table. */
  const pendingTableFromClickRef = useRef<string | null>(null)
  /** Previous ?table= value — only apply URL→state when the param actually changed (back/forward / deep link), not when `tables` refetches. */
  const prevTableFromUrlRef = useRef<string | null>(null)
  /** Latest query string for router.replace (avoid unstable deps + keep current non-table params). */
  const searchParamsStringRef = useRef(searchParamsString)
  searchParamsStringRef.current = searchParamsString

  const selectedTableRef = useRef(selectedTable)
  selectedTableRef.current = selectedTable
  const tableFromUrlParamRef = useRef(tableFromUrlParam)
  tableFromUrlParamRef.current = tableFromUrlParam

  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const loadProject = useCallback(async () => {
    try {
      const response = await api.get(`/api/v1/projects/${slug}`)
      setProject(response.data)
    } catch (err) {
      console.error('Failed to load project')
    }
  }, [slug])

  const loadSchemas = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/db/schemas', {
        headers: { 'X-Project-Slug': slug }
      })
      setSchemas(response.data)
    } catch (err) {
      console.error('Failed to load schemas')
    }
  }, [slug])

  const loadTables = useCallback(async (preserveSelection: boolean = true, schemaOverride?: string) => {
    const schema = schemaOverride ?? selectedSchema
    try {
      const response = await api.get('/api/v1/db/tables', {
        headers: { 'X-Project-Slug': slug },
        params: { schema }
      })
      const tableNames = response.data
      setTables(tableNames.map((name: string) => ({ name })))

      const tableFromUrl = tableFromUrlParamRef.current
      const curSelected = selectedTableRef.current

      if (tableNames.length > 0) {
        let tableToSelect: string | null = null
        const pending = pendingTableFromClickRef.current

        if (preserveSelection) {
          // Pending click + current selection must win over stale ?table= while router.replace catches up.
          if (pending && tableNames.includes(pending)) {
            tableToSelect = pending
          } else if (curSelected && tableNames.includes(curSelected)) {
            tableToSelect = curSelected
          } else if (tableFromUrl && tableNames.includes(tableFromUrl)) {
            tableToSelect = tableFromUrl
          } else {
            tableToSelect = tableNames[0]
          }
        } else {
          tableToSelect = (tableFromUrl && tableNames.includes(tableFromUrl)) ? tableFromUrl : tableNames[0]
        }

        if (tableToSelect !== curSelected) {
          setFilters([])
          setCurrentPage(0)
          setSelectedTable(tableToSelect)
        }
      } else {
        setSelectedTable(null)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load tables')
    } finally {
      setLoading(false)
    }
  }, [slug, selectedSchema])

  useEffect(() => {
    setTableData(null)
  }, [selectedTable])

  /** Column metadata for filter typing; avoids putting tableData?.columns in loadTableData deps (would recreate callback every fetch and confuse callers). */
  const filterColumnsRef = useRef<Column[] | undefined>(undefined)
  filterColumnsRef.current = tableData?.columns as Column[] | undefined

  const loadAbortRef = useRef<AbortController | null>(null)

  const loadTableData = useCallback(async (tableName: string, loadRLSDataFn?: (name: string) => Promise<void>) => {
    loadAbortRef.current?.abort()
    const ac = new AbortController()
    loadAbortRef.current = ac
    const signal = ac.signal

    setLoadingData(true)
    setError('')
    try {
      const built = buildApiFilters(filters, filterColumnsRef.current)
      if (!built.ok) {
        const metaRes = await api.get(`/api/v1/db/tables/${tableName}`, {
          headers: { 'X-Project-Slug': slug },
          params: { limit: 0, offset: 0, schema: selectedSchema },
          signal,
        })
        setTableData({
          ...metaRes.data,
          data: [],
          total: 0,
          filterMessage: built.message,
        })
        if (signal.aborted) return
        if (loadRLSDataFn) await loadRLSDataFn(tableName)
        return
      }

      const apiFilters = built.filters
      const useFilteredQuery = apiFilters.length > 0

      if (!useFilteredQuery) {
        const params: Record<string, unknown> = {
          limit: pageSize,
          offset: currentPage * pageSize,
          schema: selectedSchema,
        }
        if (sortColumn) {
          params.sort = sortColumn
          params.direction = sortDirection
        }
        const response = await api.get(`/api/v1/db/tables/${tableName}`, {
          headers: { 'X-Project-Slug': slug },
          params,
          signal,
        })
        if (signal.aborted) return
        setTableData(response.data)
      } else {
        const queryBody: Record<string, unknown> = {
          filters: apiFilters,
          limit: pageSize,
          offset: currentPage * pageSize,
          schema: selectedSchema,
        }
        if (sortColumn) {
          queryBody.order_by = sortColumn
          queryBody.order_direction = sortDirection
        }
        const [queryRes, metaRes] = await Promise.all([
          api.post(`/api/v1/db/tables/${tableName}/query`, queryBody, {
            headers: { 'X-Project-Slug': slug },
            signal,
          }),
          api.get(`/api/v1/db/tables/${tableName}`, {
            headers: { 'X-Project-Slug': slug },
            params: { limit: 0, offset: 0, schema: selectedSchema },
            signal,
          }),
        ])
        if (signal.aborted) return
        const merged: Record<string, unknown> = {
          ...metaRes.data,
          data: queryRes.data.data,
          total: queryRes.data.total,
          limit: queryRes.data.limit,
          offset: queryRes.data.offset,
        }
        if (queryRes.data.filter_notice) merged.filterMessage = queryRes.data.filter_notice
        setTableData(merged)
      }
      if (loadRLSDataFn) await loadRLSDataFn(tableName)
    } catch (err: any) {
      const canceled =
        err?.code === 'ERR_CANCELED' ||
        err?.name === 'CanceledError' ||
        err?.name === 'AbortError' ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('cancel'))
      if (canceled) return
      setError(err.response?.data?.detail || 'Failed to load table data')
    } finally {
      if (loadAbortRef.current === ac) setLoadingData(false)
    }
  }, [slug, pageSize, currentPage, sortColumn, sortDirection, filters, selectedSchema])

  // Sync selected table → ?table= (do not depend on full searchParamsString — avoids replace loops on reorder/encoding).
  useEffect(() => {
    if (selectedTable && selectedTable !== tableFromUrlParam) {
      const params = new URLSearchParams(searchParamsStringRef.current)
      params.set('table', selectedTable)
      router.replace(`?${params.toString()}`, { scroll: false })
    } else if (!selectedTable && tableFromUrlParam) {
      const params = new URLSearchParams(searchParamsStringRef.current)
      params.delete('table')
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }, [selectedTable, tableFromUrlParam, router])

  const tablesNameKey = tables.map((t) => t.name).join('\0')

  // URL → state only when ?table= actually changes or initial deep link; never overwrite a fresh sidebar pick while URL lags.
  useEffect(() => {
    const tableFromUrl = tableFromUrlParam
    const urlParamChanged = prevTableFromUrlRef.current !== tableFromUrl
    prevTableFromUrlRef.current = tableFromUrl

    if (tableFromUrl && selectedTable && tableFromUrl === selectedTable) {
      if (pendingTableFromClickRef.current && tableFromUrl === pendingTableFromClickRef.current) {
        pendingTableFromClickRef.current = null
      }
      return
    }

    if (!tableFromUrl || !tables.some((t) => t.name === tableFromUrl)) return

    if (pendingTableFromClickRef.current) {
      if (tableFromUrl === pendingTableFromClickRef.current) {
        pendingTableFromClickRef.current = null
        return
      }
      if (selectedTable === pendingTableFromClickRef.current) {
        return
      }
    }

    if (tableFromUrl === selectedTable) return

    if (!urlParamChanged && selectedTable !== null) {
      return
    }

    pendingTableFromClickRef.current = null
    setFilters([])
    setCurrentPage(0)
    setSelectedTable(tableFromUrl)
  }, [tableFromUrlParam, tablesNameKey, selectedTable])

  // Refresh both tables list and current table data
  const refreshTablesAndData = useCallback(async (tableName: string | null, loadRLSDataFn?: (name: string) => Promise<void>) => {
    await loadTables(true) // Preserve current selection
    const tableToRefresh = tableName || selectedTable
    if (tableToRefresh) {
      await loadTableData(tableToRefresh, loadRLSDataFn)
    }
  }, [loadTables, loadTableData, selectedTable])

  const initialLoadDone = useRef(false)

  useEffect(() => {
    loadProject()
    loadSchemas()
    loadTables()
    initialLoadDone.current = true
  }, [])

  // Reload tables when selected schema changes (skip initial mount)
  useEffect(() => {
    if (!initialLoadDone.current) return
    setSelectedTable(null)
    setTableData(null)
    setLoading(true)
    loadTables(false, selectedSchema)
    loadSchemas()
  }, [selectedSchema])

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnName)
      setSortDirection('asc')
    }
  }

  const clearSort = () => { setSortColumn(null); setSortDirection('asc') }

  const addFilter = () => {
    setFilters([...filters, { column: tableData?.columns[0]?.name || '', operator: 'equals', value: '' }])
  }
  const updateFilter = (index: number, field: string, value: string) => {
    const updated = [...filters]
    updated[index] = { ...updated[index], [field]: value }
    setFilters(updated)
  }
  const removeFilter = (index: number) => { setFilters(filters.filter((_, i) => i !== index)) }
  const clearFilters = () => { setFilters([]); setCurrentPage(0) }
  const applyFilters = () => { setCurrentPage(0) }

  const updateSelectedTable = useCallback((tableName: string | null) => {
    pendingTableFromClickRef.current = tableName
    setFilters([])
    setCurrentPage(0)
    setSelectedTable(tableName)
  }, [])

  return {
    project, setProject,
    schemas, selectedSchema, setSelectedSchema, loadSchemas,
    tables, setTables, selectedTable, setSelectedTable: updateSelectedTable,
    tableData, setTableData, loading, loadingData, creatingTable, setCreatingTable,
    editingTable, setEditingTable, insertingRecord, setInsertingRecord,
    error, setError, searchTerm, setSearchTerm,
    currentPage, setCurrentPage, pageSize,
    sortColumn, setSortColumn, sortDirection, setSortDirection,
    filters, setFilters, filteredTables,
    loadProject, loadTables, loadTableData, refreshTablesAndData,
    handleSort, clearSort, addFilter, updateFilter, removeFilter, clearFilters, applyFilters,
  }
}
