'use client'

import { useMemo } from 'react'
import { Plus, X, Edit2, Trash2, KeyRound } from 'lucide-react'
import { Button } from '@/components/Button'
import type { Column, PostgreSQLDataTypes } from '../types'
import { typeNeedsParams, getParamLabel, getTypeExample } from '../utils/postgresTypes'

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2.5rem'
}

function TypeSelect({ value, onChange, postgresDataTypes }: { value: string; onChange: (v: string) => void; postgresDataTypes: PostgreSQLDataTypes }) {
  const knownValues = useMemo(
    () =>
      new Set(
        [
          ...postgresDataTypes.numeric,
          ...postgresDataTypes.string,
          ...postgresDataTypes.datetime,
          ...postgresDataTypes.json,
          ...(postgresDataTypes.extension || []),
          ...postgresDataTypes.spatial,
          ...postgresDataTypes.other,
        ].map((t) => t.value)
      ),
    [postgresDataTypes]
  )
  const showCurrentFromDb = value && !knownValues.has(value)
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-zinc-200 dark:border-white/10 appearance-none cursor-pointer"
      style={selectStyle}>
      {showCurrentFromDb && (
        <option value={value}>
          {value} (current in DB)
        </option>
      )}
      <optgroup label="Numeric Types">{postgresDataTypes.numeric.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}</optgroup>
      <optgroup label="String Types">{postgresDataTypes.string.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}</optgroup>
      <optgroup label="Date/Time Types">{postgresDataTypes.datetime.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}</optgroup>
      <optgroup label="JSON">{postgresDataTypes.json.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}</optgroup>
      {(postgresDataTypes.extension || []).length > 0 && <optgroup label="Extension Types">{postgresDataTypes.extension.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}</optgroup>}
      {postgresDataTypes.spatial.length > 0 && <optgroup label="Spatial Types">{postgresDataTypes.spatial.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}</optgroup>}
      {postgresDataTypes.other.length > 0 && <optgroup label="Other Types">{postgresDataTypes.other.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}</optgroup>}
    </select>
  )
}

interface EditTableModalProps {
  selectedTable: string
  tableData: any
  /** Resolved PK column names (from API or column.key === 'PRI'). */
  primaryKeyColumns: string[]
  primaryKeyColumnToAdd: string | null
  setPrimaryKeyColumnToAdd: (v: string | null) => void
  editTableName: string
  setEditTableName: (v: string) => void
  columnsToEdit: Record<string, Column>
  columnsToAdd: Column[]
  columnsToRemove: string[]
  editingTable: boolean
  postgresDataTypes: PostgreSQLDataTypes
  onClose: () => void
  onApply: () => void
  onStartEditColumn: (name: string) => void
  onUpdateColumnEdit: (name: string, field: keyof Column, value: string) => void
  onCancelEditColumn: (name: string) => void
  onAddNewColumn: () => void
  onUpdateNewColumn: (idx: number, field: keyof Column, value: string) => void
  onRemoveNewColumn: (idx: number) => void
  onToggleColumnRemoval: (name: string) => void
}

export function EditTableModal(props: EditTableModalProps) {
  const {
    selectedTable, tableData, primaryKeyColumns, primaryKeyColumnToAdd, setPrimaryKeyColumnToAdd,
    editTableName, setEditTableName,
    columnsToEdit, columnsToAdd, columnsToRemove, editingTable,
    postgresDataTypes, onClose, onApply,
    onStartEditColumn, onUpdateColumnEdit, onCancelEditColumn,
    onAddNewColumn, onUpdateNewColumn, onRemoveNewColumn, onToggleColumnRemoval,
  } = props

  const hasChanges =
    (editTableName.trim() !== selectedTable && editTableName.trim() !== '') ||
    columnsToAdd.length > 0 ||
    columnsToRemove.length > 0 ||
    Object.keys(columnsToEdit).length > 0 ||
    !!primaryKeyColumnToAdd?.trim()

  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-stretch justify-end">
      <div className="glass-card shadow-2xl w-full sm:w-[950px] overflow-y-auto custom-scrollbar flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Table: {selectedTable}</h2>
          <button onClick={onClose} className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {primaryKeyColumns.length === 0 && (
            <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                <span>Primary key</span>
              </h3>
              <p className="text-zinc-600 dark:text-white/60 text-sm">
                Deletes and inline cell edits need a PRIMARY KEY. Tables created without one, or with only UNIQUE
                constraints, won&apos;t show a key here until you add it.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <label className="text-sm text-zinc-600 dark:text-white/70 shrink-0">Add PRIMARY KEY on column</label>
                <select
                  value={primaryKeyColumnToAdd || ''}
                  onChange={(e) => setPrimaryKeyColumnToAdd(e.target.value || null)}
                  className="flex-1 min-w-0 px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Select column…</option>
                  {tableData.columns
                    .filter((c: { name: string }) => !columnsToRemove.includes(c.name))
                    .map((c: { name: string }) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Column values must be unique and non-null. If the table already has duplicate or NULLs, PostgreSQL will
                reject this until you fix data.
              </p>
            </div>
          )}

          {/* Rename Table */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center space-x-2"><Edit2 className="w-5 h-5" /><span>Rename Table</span></h3>
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-white/70 mb-2">New Table Name</label>
              <input type="text" value={editTableName} onChange={(e) => setEditTableName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10" placeholder="Enter new table name" />
            </div>
          </div>

          {/* Edit Existing Columns */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center space-x-2"><Edit2 className="w-5 h-5" /><span>Edit Existing Columns</span></h3>
            {Object.keys(columnsToEdit).length === 0 ? (
              <p className="text-zinc-600 dark:text-white/50 text-sm mb-4">No columns being edited. Click on a column below to edit it.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {Object.entries(columnsToEdit).map(([originalName, editedCol]) => (
                  <div key={originalName} className="flex flex-col lg:flex-row gap-3 items-start lg:items-center bg-zinc-100 dark:bg-white/5 rounded-lg p-3 border border-zinc-200 dark:border-white/10">
                    <div className="flex-1 w-full lg:w-auto min-w-[150px]">
                      <input type="text" value={editedCol.name} onChange={(e) => onUpdateColumnEdit(originalName, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10" placeholder="Column name" />
                    </div>
                    <div className="w-full lg:w-auto min-w-[160px]"><TypeSelect value={editedCol.type} onChange={(v) => onUpdateColumnEdit(originalName, 'type', v)} postgresDataTypes={postgresDataTypes} /></div>
                    {typeNeedsParams(editedCol.type, postgresDataTypes) && (
                      <div className="w-full lg:w-auto min-w-[200px]">
                        <input type="text" value={editedCol.typeParams || ''} onChange={(e) => onUpdateColumnEdit(originalName, 'typeParams', e.target.value)} placeholder={getParamLabel(editedCol.type, postgresDataTypes)}
                          className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10" title={`Example: ${getTypeExample(editedCol.type, postgresDataTypes)}`} />
                      </div>
                    )}
                    <div className="w-full lg:w-auto min-w-[120px]">
                      <select value={editedCol.nullable || 'YES'} onChange={(e) => onUpdateColumnEdit(originalName, 'nullable', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-zinc-200 dark:border-white/10 appearance-none cursor-pointer" style={selectStyle}>
                        <option value="YES">Nullable</option>
                        <option value="NO">Not Null</option>
                      </select>
                    </div>
                    <div className="w-full lg:w-auto flex justify-start lg:justify-center">
                      <button onClick={() => onCancelEditColumn(originalName)} className="p-2 text-red-400 hover:text-red-300 flex-shrink-0 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <p className="text-zinc-600 dark:text-white/50 text-sm mb-3">Click on a column below to edit it:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                {tableData.columns.map((col: any) => {
                  if (columnsToEdit[col.name] || columnsToRemove.includes(col.name)) return null
                  return (
                    <button key={col.name} onClick={() => onStartEditColumn(col.name)}
                      className="text-left px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg hover:border-amber-500/50 hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10 transition-all text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-900 dark:text-white font-medium">{col.name}</span>
                        <Edit2 className="w-3 h-3 text-zinc-600 dark:text-white/40" />
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-white/50 mt-1">{col.type}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Add New Columns */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center space-x-2"><Plus className="w-5 h-5" /><span>Add New Columns</span></h3>
            {columnsToAdd.length === 0 ? (
              <p className="text-zinc-600 dark:text-white/50 text-sm mb-4">No columns to add</p>
            ) : (
              <div className="space-y-3 mb-4">
                {columnsToAdd.map((col, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-start lg:items-center bg-zinc-100 dark:bg-white/5 rounded-lg p-3 border border-zinc-200 dark:border-white/10">
                    <div className="sm:col-span-2 lg:col-span-1">
                      <input type="text" value={col.name} onChange={(e) => onUpdateNewColumn(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10" placeholder="Column name" />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1"><TypeSelect value={col.type} onChange={(v) => onUpdateNewColumn(idx, 'type', v)} postgresDataTypes={postgresDataTypes} /></div>
                    {typeNeedsParams(col.type, postgresDataTypes) && (
                      <div className="sm:col-span-2 lg:col-span-1">
                        <input type="text" value={col.typeParams || ''} onChange={(e) => onUpdateNewColumn(idx, 'typeParams', e.target.value)} placeholder={getParamLabel(col.type, postgresDataTypes)}
                          className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10" />
                      </div>
                    )}
                    <div className="sm:col-span-1 lg:col-span-1">
                      <select value={col.nullable || 'YES'} onChange={(e) => onUpdateNewColumn(idx, 'nullable', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-zinc-200 dark:border-white/10 appearance-none cursor-pointer" style={selectStyle}>
                        <option value="YES">Nullable</option>
                        <option value="NO">Not Null</option>
                      </select>
                    </div>
                    <div className="sm:col-span-1 lg:col-span-1 flex justify-start">
                      <button onClick={() => onRemoveNewColumn(idx)} className="p-2 text-red-400 hover:text-red-300 flex-shrink-0 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button onClick={onAddNewColumn} variant="outline" size="sm" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10"><Plus className="w-4 h-4 mr-2" /> Add Column</Button>
          </div>

          {/* Remove Columns */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center space-x-2"><Trash2 className="w-5 h-5" /><span>Remove Columns</span></h3>
            <p className="text-zinc-600 dark:text-white/50 text-sm mb-4">Select columns to remove from the table</p>
            <div className="space-y-2">
              {tableData.columns.map((col: any) => (
                <label key={col.name} className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${columnsToRemove.includes(col.name) ? 'bg-red-500/10 border-red-500/50' : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:border-zinc-200 dark:border-white/30'}`}>
                  <input type="checkbox" checked={columnsToRemove.includes(col.name)} onChange={() => onToggleColumnRemoval(col.name)} className="w-4 h-4 rounded border-zinc-200 dark:border-white/20" />
                  <div className="flex-1">
                    <span className="text-zinc-900 dark:text-white font-medium">{col.name}</span>
                    <span className="text-zinc-600 dark:text-white/50 ml-2 text-xs">{col.type}</span>
                    {col.key === 'PRI' && <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">PRIMARY KEY</span>}
                  </div>
                </label>
              ))}
            </div>
            {columnsToRemove.length > 0 && (
              <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-amber-700 dark:text-amber-200 text-sm">Warning: Removing columns will permanently delete all data in those columns. This action cannot be undone.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-white/10 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10" disabled={editingTable}>Cancel</Button>
          <Button onClick={onApply} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={editingTable || !hasChanges}>
            {editingTable ? 'Applying...' : 'Apply Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
