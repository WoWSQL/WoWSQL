import type { ReactNode } from 'react'
import { Plus, X, Trash2, Lock, Shield } from 'lucide-react'
import { Button } from '@/components/Button'
import { AppSelect } from '@/components/AppSelect'
import type { Column, PostgreSQLDataTypes } from '../types'
import { typeNeedsParams, getParamLabel, getTypeExample } from '../utils/postgresTypes'
import { PostgresTypePicker } from './PostgresTypePicker'

const fieldClass =
  'w-full h-9 px-3 bg-zinc-50 dark:bg-white/[0.04] border border-zinc-300 dark:border-white/15 rounded-md text-xs text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/40 transition-colors'

function SidePanelShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidthClass = 'max-w-[640px]',
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer: ReactNode
  maxWidthClass?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Close panel"
      />
      <aside
        className={`relative z-10 flex h-full w-full ${maxWidthClass} flex-col border-l border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0c0c0e] shadow-[-24px_0_48px_-12px_rgba(0,0,0,0.45)] animate-in slide-in-from-right duration-300`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-panel-title"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-300 dark:border-white/10 px-5 py-4">
          <div className="min-w-0 pr-4">
            <h2 id="side-panel-title" className="text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 custom-scrollbar text-sm">{children}</div>

        <footer className="shrink-0 border-t border-zinc-300 dark:border-white/10 px-5 py-3.5">
          <div className="flex items-center justify-end gap-2">{footer}</div>
        </footer>
      </aside>
    </div>
  )
}

// ============ CREATE TABLE MODAL ============
interface CreateTableModalProps {
  newTableName: string; setNewTableName: (v: string) => void
  newTableDescription: string; setNewTableDescription: (v: string) => void
  enableRLS: boolean; setEnableRLS: (v: boolean) => void
  newTableColumns: Column[]; creatingTable: boolean
  postgresDataTypes: PostgreSQLDataTypes
  onClose: () => void; onCreate: () => void
  onAddColumn: () => void; onRemoveColumn: (idx: number) => void
  onUpdateColumn: (idx: number, field: keyof Column, value: string) => void
}

export function CreateTableModal(props: CreateTableModalProps) {
  const {
    newTableName, setNewTableName, newTableDescription, setNewTableDescription,
    enableRLS, setEnableRLS, newTableColumns, creatingTable, postgresDataTypes,
    onClose, onCreate, onAddColumn, onRemoveColumn, onUpdateColumn,
  } = props

  const canCreate = !creatingTable && newTableColumns.length >= 3 && newTableName.trim().length > 0

  return (
    <SidePanelShell
      title="Create table"
      subtitle="Add a new table to the public schema."
      onClose={onClose}
      maxWidthClass="max-w-[720px]"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={creatingTable}
            className="h-8 px-3 text-xs rounded-md border-zinc-300 dark:border-white/15 text-foreground hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
          >
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            disabled={!canCreate}
            className="h-8 px-3 text-xs rounded-md bg-blue-500 hover:bg-blue-600 text-white shadow-sm disabled:opacity-50"
          >
            {creatingTable ? 'Creating…' : 'Create table'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Table name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className={fieldClass}
              placeholder="users"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Description <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              type="text"
              value={newTableDescription}
              onChange={(e) => setNewTableDescription(e.target.value)}
              className={fieldClass}
              placeholder="Stores application users"
            />
          </div>
        </section>

        <section className="border-y border-zinc-300 py-4 dark:border-white/10">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={enableRLS}
              onChange={(e) => setEnableRLS(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500/40 dark:border-zinc-600"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
                Row level security
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                When enabled, create an access policy before data is readable through the API.
              </span>
            </span>
          </label>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-foreground">Columns</h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                <code className="font-mono text-zinc-600 dark:text-zinc-300">id</code> and{' '}
                <code className="font-mono text-zinc-600 dark:text-zinc-300">created_at</code> are included by default.
              </p>
            </div>
            <button
              type="button"
              onClick={onAddColumn}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-300 px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add column
            </button>
          </div>

          <div className="overflow-hidden rounded-md border border-zinc-300 dark:border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="border-b border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04]">
                    <th className="text-left px-2.5 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 w-[28%]">Name</th>
                    <th className="text-left px-2.5 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 w-[22%]">Type</th>
                    <th className="text-left px-2.5 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 w-[18%]">Options</th>
                    <th className="text-left px-2.5 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 w-[14%]">Nullable</th>
                    <th className="text-left px-2.5 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 w-[14%]">Key</th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/10">
                  {newTableColumns.map((col, idx) => {
                    const isDefault = idx < 2
                    const needsParams = typeNeedsParams(col.type, postgresDataTypes)
                    return (
                      <tr key={idx} className="bg-white dark:bg-[#0c0c0e]">
                        <td className="px-2.5 py-1.5 align-middle">
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => onUpdateColumn(idx, 'name', e.target.value)}
                            disabled={isDefault}
                            className={`${fieldClass} font-mono ${isDefault ? 'opacity-70' : col.name.trim() === '' ? 'border-red-400/60' : ''}`}
                            placeholder="column_name"
                          />
                        </td>
                        <td className="px-2.5 py-1.5 align-middle">
                          <PostgresTypePicker
                            value={col.type}
                            onChange={(v) => onUpdateColumn(idx, 'type', v)}
                            disabled={isDefault}
                            postgresDataTypes={postgresDataTypes}
                          />
                        </td>
                        <td className="px-2.5 py-1.5 align-middle">
                          {needsParams ? (
                            <input
                              type="text"
                              value={col.typeParams || ''}
                              onChange={(e) => onUpdateColumn(idx, 'typeParams', e.target.value)}
                              placeholder={getParamLabel(col.type, postgresDataTypes)}
                              title={`Example: ${getTypeExample(col.type, postgresDataTypes)}`}
                              className={fieldClass}
                            />
                          ) : (
                            <span className="text-xs text-zinc-400 dark:text-zinc-600 px-1">—</span>
                          )}
                        </td>
                        <td className="px-2.5 py-1.5 align-middle">
                          <AppSelect
                            size="sm"
                            value={col.nullable || 'YES'}
                            onChange={(v) => onUpdateColumn(idx, 'nullable', v)}
                            disabled={isDefault}
                            aria-label="Nullable"
                            options={[
                              { value: 'YES', label: 'Yes' },
                              { value: 'NO', label: 'No' },
                            ]}
                          />
                        </td>
                        <td className="px-2.5 py-1.5 align-middle">
                          <AppSelect
                            size="sm"
                            value={col.key || ''}
                            onChange={(v) => onUpdateColumn(idx, 'key', v)}
                            disabled={isDefault}
                            aria-label="Key"
                            placeholder="None"
                            options={[
                              { value: '', label: 'None' },
                              { value: 'PRI', label: 'Primary' },
                            ]}
                          />
                        </td>
                        <td className="px-1.5 py-1.5 align-middle text-center">
                          {isDefault ? (
                            <span className="inline-flex h-8 w-8 items-center justify-center text-zinc-300 dark:text-zinc-600" title="Required column">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRemoveColumn(idx)}
                              disabled={newTableColumns.length <= 2}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              aria-label="Remove column"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {newTableColumns.length < 3 && (
            <p className="mt-3 text-xs text-amber-600/90 dark:text-amber-400/90">
              Add at least one more column to continue.
            </p>
          )}
        </section>
      </div>
    </SidePanelShell>
  )
}

// ============ INSERT RECORD MODAL ============
interface InsertRecordModalProps {
  selectedTable: string; tableData: any; insertData: Record<string, any>
  setInsertData: (v: Record<string, any>) => void; insertingRecord: boolean
  onClose: () => void; onInsert: () => void
}

export function InsertRecordModal({ selectedTable, tableData, insertData, setInsertData, insertingRecord, onClose, onInsert }: InsertRecordModalProps) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-stretch justify-end">
      <div className="glass-card shadow-2xl w-full sm:w-[520px] lg:w-[560px] overflow-y-auto custom-scrollbar flex flex-col bg-white dark:bg-[#0c0c0e]">
        <div className="px-5 py-4 border-b border-zinc-300 dark:border-white/10 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Insert into <span className="font-medium text-zinc-600 dark:text-zinc-300">{selectedTable}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4 flex-1 overflow-y-auto text-sm">
          {tableData?.columns.map((col: any) => {
            const defaultVal = (col.default || col.extra || '').toLowerCase()
            const colName = col.name?.toLowerCase() || ''
            const colType = col.type?.toLowerCase() || ''
            const isNullable = col.null === 'YES' || col.null === true

            // Skip auto-increment primary keys
            if (col.key === 'PRI' && col.extra?.includes('auto_increment')) return null
            // Skip UUID primary key columns (auto-generated by gen_random_uuid())
            if (col.key === 'PRI' && colType.includes('uuid')) return null
            // Skip any UUID column with a uuid default
            if (colType.includes('uuid') && (defaultVal.includes('uuid_generate_v4') || defaultVal.includes('gen_random_uuid'))) return null
            // Skip id column if it's UUID type (convention: auto-generated)
            if (colName === 'id' && colType.includes('uuid')) return null
            // Skip created_at / updated_at timestamp columns
            if ((colName === 'created_at' || colName === 'updated_at') && (colType.includes('timestamp') || colType.includes('date'))) return null
            // Skip columns with known auto-generation defaults
            if (defaultVal && defaultVal !== 'null' && (defaultVal.includes('current_timestamp') || defaultVal.includes('now()') || defaultVal.includes('gen_random_uuid') || defaultVal.includes('uuid_generate_v4'))) return null
            // Skip serial/identity columns
            if (defaultVal.includes('nextval(')) return null
            // Skip other columns with non-null defaults (DB will use the default)
            if (defaultVal && defaultVal !== 'null') return null
            return (
              <div key={col.name}>
                <label className="mb-1.5 flex items-baseline gap-2 text-xs font-medium text-foreground">
                  <span>{col.name}</span>
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">{col.type}</span>
                  {!isNullable && !defaultVal && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  value={insertData[col.name] || ''}
                  onChange={(e) => setInsertData({ ...insertData, [col.name]: e.target.value })}
                  className={fieldClass}
                  placeholder={isNullable ? 'Optional' : 'Required'}
                />
              </div>
            )
          })}
        </div>
        <div className="px-5 py-3.5 border-t border-zinc-300 dark:border-white/10 flex justify-end gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-8 px-3 text-xs rounded-md border-zinc-300 dark:border-white/15 text-foreground hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            disabled={insertingRecord}
          >
            Cancel
          </Button>
          <Button
            onClick={onInsert}
            className="h-8 px-3 text-xs rounded-md bg-blue-500 hover:bg-blue-600 text-white shadow-sm disabled:opacity-50"
            disabled={insertingRecord}
          >
            {insertingRecord ? 'Inserting...' : 'Insert Record'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============ EDIT ROW SIDE PANEL (Supabase-style) ============
interface EditRowModalProps {
  selectedTable: string
  tableData: any
  rowIndex: number
  editRowData: Record<string, any>
  setEditRowData: (v: Record<string, any>) => void
  savingRow: boolean
  onClose: () => void
  onSave: () => void
}

export function EditRowModal({
  selectedTable,
  tableData,
  rowIndex,
  editRowData,
  setEditRowData,
  savingRow,
  onClose,
  onSave,
}: EditRowModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Close panel"
      />
      <aside
        className="relative z-10 flex h-full w-full max-w-[min(560px,92vw)] flex-col border-l border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0c0c0e] shadow-[-24px_0_48px_-12px_rgba(0,0,0,0.45)] animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-300 dark:border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Update row in <span className="text-zinc-600 dark:text-zinc-300">{selectedTable}</span>
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Row {rowIndex + 1}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 space-y-4 custom-scrollbar text-sm">
          {tableData?.columns.map((col: any) => {
            const isPk = col.key === 'PRI'
            const value = editRowData[col.name] ?? ''
            return (
              <div key={col.name}>
                <label className="mb-1.5 flex flex-wrap items-baseline gap-2 text-xs font-medium text-foreground">
                  <span>{col.name}</span>
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">{col.type}</span>
                  {isPk && (
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 bg-amber-500/15">
                      Primary
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setEditRowData({ ...editRowData, [col.name]: e.target.value })}
                  disabled={isPk || savingRow}
                  className={`${fieldClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                  placeholder={isPk ? 'Primary key (read-only)' : 'Value'}
                />
              </div>
            )
          })}
        </div>

        <footer className="shrink-0 border-t border-zinc-300 dark:border-white/10 px-5 py-3.5">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-8 px-3 text-xs rounded-md border-zinc-300 dark:border-white/15 text-foreground hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              disabled={savingRow}
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              className="h-8 px-3 text-xs rounded-md bg-blue-500 hover:bg-blue-600 text-white shadow-sm disabled:opacity-50"
              disabled={savingRow}
            >
              {savingRow ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </footer>
      </aside>
    </div>
  )
}

// ============ DELETE TABLE MODAL ============
interface DeleteTableModalProps {
  selectedTable: string; confirmDeleteTableName: string; setConfirmDeleteTableName: (v: string) => void
  deleteTableCascade: boolean; setDeleteTableCascade: (v: boolean) => void
  deletingTable: boolean; onClose: () => void; onDelete: () => void
}

export function DeleteTableModal({ selectedTable, confirmDeleteTableName, setConfirmDeleteTableName, deleteTableCascade, setDeleteTableCascade, deletingTable, onClose, onDelete }: DeleteTableModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
    <div className="glass-card border border-zinc-300 dark:border-white/20 rounded-md p-6 max-w-md w-full animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400" /> Delete Table</h3>
          <button onClick={onClose} className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-foreground transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4">
            <p className="text-sm text-red-400">This action cannot be undone. This will permanently delete the table <span className="font-bold">{selectedTable}</span> and all its data.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-white/80 mb-2">Type <span className="font-mono bg-zinc-100 dark:bg-white/10 px-2 py-0.5 rounded">{selectedTable}</span> to confirm:</label>
            <input type="text" value={confirmDeleteTableName} onChange={(e) => setConfirmDeleteTableName(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/20 rounded-md text-foreground placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-300 dark:border-white/10" placeholder="Enter table name" />
          </div>
          <div className="flex items-center gap-2">
          <input type="checkbox" id="cascade" checked={deleteTableCascade} onChange={(e) => setDeleteTableCascade(e.target.checked)} className="w-4 h-4 rounded border-zinc-300 dark:border-white/20 bg-zinc-100 dark:bg-white/5 text-blue-600 focus:ring-blue-500/50" />
            <label htmlFor="cascade" className="text-sm text-zinc-600 dark:text-white/80">Delete with CASCADE (remove dependent objects)</label>
          </div>
          <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-300 dark:border-white/20 text-foreground hover:bg-zinc-200 dark:hover:bg-white/10" disabled={deletingTable}>Cancel</Button>
            <Button onClick={onDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-foreground" disabled={confirmDeleteTableName !== selectedTable || deletingTable}>
              {deletingTable ? 'Deleting...' : 'Delete Table'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ DELETE COLUMN MODAL ============
interface DeleteColumnModalProps {
  columnToDelete: string; onClose: () => void; onConfirm: () => void
}

export function DeleteColumnModal({ columnToDelete, onClose, onConfirm }: DeleteColumnModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
    <div className="glass-card border border-zinc-300 dark:border-white/20 rounded-md p-6 max-w-md w-full animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400" /> Delete Column</h3>
          <button onClick={onClose} className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-foreground transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4">
            <p className="text-sm text-red-400">This action cannot be undone. This will permanently delete the column <span className="font-bold">{columnToDelete}</span> and all its data.</p>
          </div>
          <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-300 dark:border-white/20 text-foreground hover:bg-zinc-200 dark:hover:bg-white/10">Cancel</Button>
            <Button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-foreground">Delete Column</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
