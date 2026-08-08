'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, X, Edit2, Trash2, KeyRound } from 'lucide-react'
import { Button } from '@/components/Button'
import { AppSelect } from '@/components/AppSelect'
import type { Column, PostgreSQLDataTypes } from '../types'
import { typeNeedsParams, getParamLabel, getTypeExample } from '../utils/postgresTypes'
import { PostgresTypePicker } from './PostgresTypePicker'

const fieldClass =
  'w-full h-9 px-3 bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-300 dark:border-white/15 rounded-md text-foreground text-xs focus:outline-none focus:border-blue-500/50'

/** Supabase-style label (left) + control (right) row */
function FieldRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2 border-b border-zinc-200 py-4 last:border-b-0 dark:border-white/[0.06] sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6 sm:items-start">
      <div className="pt-1.5">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {hint ? <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 pr-4">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
  description,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  description?: string
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          {icon}
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** In-place Supabase-style column editor (stays where the row was clicked) */
function UpdateColumnCard({
  originalName,
  isPrimaryKey,
  editedCol,
  postgresDataTypes,
  onUpdate,
  onCancel,
}: {
  originalName: string
  isPrimaryKey: boolean
  editedCol: Column
  postgresDataTypes: PostgreSQLDataTypes
  onUpdate: (field: keyof Column, value: string) => void
  onCancel: () => void
}) {
  return (
    <div className="rounded-md border border-zinc-300 bg-white dark:border-white/10 dark:bg-[#121212]">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-white/[0.06]">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Update column <span className="text-zinc-900 dark:text-white">{originalName}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            Changes apply when you click Apply Changes below.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label={`Close editor for ${originalName}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4">
        <p className="pt-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          General
        </p>
        <FieldRow
          label="Name"
          hint="Recommended to use lowercase and underscores, e.g. column_name"
        >
          <input
            type="text"
            value={editedCol.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            className={fieldClass}
            placeholder="column_name"
          />
        </FieldRow>

        <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Data type
        </p>
        <FieldRow label="Type">
          <PostgresTypePicker
            value={editedCol.type}
            onChange={(v) => onUpdate('type', v)}
            postgresDataTypes={postgresDataTypes}
          />
        </FieldRow>
        {typeNeedsParams(editedCol.type, postgresDataTypes) && (
          <FieldRow
            label={getParamLabel(editedCol.type, postgresDataTypes) || 'Parameters'}
            hint={`Example: ${getTypeExample(editedCol.type, postgresDataTypes)}`}
          >
            <input
              type="text"
              value={editedCol.typeParams || ''}
              onChange={(e) => onUpdate('typeParams', e.target.value)}
              className={fieldClass}
              placeholder={getParamLabel(editedCol.type, postgresDataTypes)}
            />
          </FieldRow>
        )}

        <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Constraints
        </p>
        {isPrimaryKey && (
          <div className="border-b border-zinc-200 py-3 dark:border-white/[0.06]">
            <p className="text-xs font-medium text-foreground">Is Primary Key</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              This column is part of the table primary key. Key changes are managed separately.
            </p>
            <span className="mt-2 inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium text-blue-500 bg-blue-500/15">
              PRIMARY KEY
            </span>
          </div>
        )}
        <Toggle
          checked={(editedCol.nullable || 'YES') === 'YES'}
          onChange={(next) => onUpdate('nullable', next ? 'YES' : 'NO')}
          label="Allow Nullable"
          description="Allow the column to assume a NULL value if no value is provided"
        />
      </div>
    </div>
  )
}

interface EditTableModalProps {
  selectedTable: string
  tableData: any
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
    selectedTable,
    tableData,
    primaryKeyColumns,
    primaryKeyColumnToAdd,
    setPrimaryKeyColumnToAdd,
    editTableName,
    setEditTableName,
    columnsToEdit,
    columnsToAdd,
    columnsToRemove,
    editingTable,
    postgresDataTypes,
    onClose,
    onApply,
    onStartEditColumn,
    onUpdateColumnEdit,
    onCancelEditColumn,
    onAddNewColumn,
    onUpdateNewColumn,
    onRemoveNewColumn,
    onToggleColumnRemoval,
  } = props

  const scrollRef = useRef<HTMLDivElement>(null)
  const savedScrollTop = useRef(0)
  const [entered, setEntered] = useState(false)
  const [closing, setClosing] = useState(false)

  const hasChanges =
    (editTableName.trim() !== selectedTable && editTableName.trim() !== '') ||
    columnsToAdd.length > 0 ||
    columnsToRemove.length > 0 ||
    Object.keys(columnsToEdit).length > 0 ||
    !!primaryKeyColumnToAdd?.trim()

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  const requestClose = () => {
    if (closing || editingTable) return
    setClosing(true)
    setEntered(false)
    window.setTimeout(() => onClose(), 220)
  }

  // Keep scroll position when expanding/collapsing a column editor (no jump to top).
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = savedScrollTop.current
  }, [columnsToEdit])

  const rememberScrollAndEdit = (name: string) => {
    if (scrollRef.current) savedScrollTop.current = scrollRef.current.scrollTop
    onStartEditColumn(name)
  }

  const rememberScrollAndCancel = (name: string) => {
    if (scrollRef.current) savedScrollTop.current = scrollRef.current.scrollTop
    onCancelEditColumn(name)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className={`absolute inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity duration-200 ${
          entered && !closing ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={requestClose}
        aria-label="Close panel"
      />

      <aside
        className={`relative z-10 flex h-full w-full max-w-[min(820px,94vw)] flex-col border-l border-zinc-300 bg-white shadow-[-24px_0_48px_-12px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out dark:border-white/10 dark:bg-[#0c0c0e] ${
          entered && !closing ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-table-title"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-300 px-6 py-4 dark:border-white/10">
          <div className="min-w-0 pr-4">
            <h2 id="edit-table-title" className="text-sm font-semibold tracking-tight text-foreground">
              Edit Table: <span className="font-medium text-zinc-600 dark:text-zinc-300">{selectedTable}</span>
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Rename the table, edit columns, or add and remove fields.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          ref={scrollRef}
          onScroll={(e) => {
            savedScrollTop.current = e.currentTarget.scrollTop
          }}
          className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6 text-sm custom-scrollbar"
        >
          {primaryKeyColumns.length === 0 && (
            <div className="space-y-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                Primary key
              </h3>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Deletes and inline cell edits need a PRIMARY KEY. Tables created without one, or with only UNIQUE
                constraints, won&apos;t show a key here until you add it.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Add PRIMARY KEY on column
                </label>
                <AppSelect
                  className="min-w-0 flex-1"
                  value={primaryKeyColumnToAdd || ''}
                  onChange={(v) => setPrimaryKeyColumnToAdd(v || null)}
                  placeholder="Select column…"
                  searchable
                  searchPlaceholder="Search columns…"
                  aria-label="Primary key column"
                  options={[
                    { value: '', label: 'Select column…' },
                    ...tableData.columns
                      .filter((c: { name: string }) => !columnsToRemove.includes(c.name))
                      .map((c: { name: string }) => ({ value: c.name, label: c.name })),
                  ]}
                />
              </div>
            </div>
          )}

          <Section title="Rename Table" icon={<Edit2 className="h-3.5 w-3.5 text-zinc-500" />}>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                New Table Name
              </label>
              <input
                type="text"
                value={editTableName}
                onChange={(e) => setEditTableName(e.target.value)}
                className={`${fieldClass} text-sm`}
                placeholder="Enter new table name"
              />
            </div>
          </Section>

          <Section
            title="Edit Existing Columns"
            icon={<Edit2 className="h-3.5 w-3.5 text-zinc-500" />}
            description="Click a column to update it in place — the editor opens where you clicked."
          >
            <div className="flex flex-col gap-2">
              {tableData.columns.map((col: { name: string; type: string; key?: string }) => {
                if (columnsToRemove.includes(col.name)) return null

                const edited = columnsToEdit[col.name]
                if (edited) {
                  return (
                    <UpdateColumnCard
                      key={col.name}
                      originalName={col.name}
                      isPrimaryKey={col.key === 'PRI' || primaryKeyColumns.includes(col.name)}
                      editedCol={edited}
                      postgresDataTypes={postgresDataTypes}
                      onUpdate={(field, value) => onUpdateColumnEdit(col.name, field, value)}
                      onCancel={() => rememberScrollAndCancel(col.name)}
                    />
                  )
                }

                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => rememberScrollAndEdit(col.name)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-zinc-300 bg-zinc-50 px-4 py-3 text-left transition-colors hover:border-blue-500/40 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-xs font-medium text-foreground">{col.name}</span>
                        {col.key === 'PRI' && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-blue-500 bg-blue-500/15">
                            PRIMARY KEY
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        {col.type}
                      </span>
                    </div>
                    <Edit2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title="Add New Columns" icon={<Plus className="h-3.5 w-3.5 text-zinc-500" />}>
            {columnsToAdd.length > 0 && (
              <div className="mb-3 flex flex-col gap-3">
                {columnsToAdd.map((col, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-zinc-300 bg-white px-4 dark:border-white/10 dark:bg-[#121212]"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-200 py-3 dark:border-white/[0.06]">
                      <p className="text-xs font-semibold text-foreground">New column</p>
                      <button
                        type="button"
                        onClick={() => onRemoveNewColumn(idx)}
                        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Remove new column"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <FieldRow label="Name" hint="Use lowercase and underscores">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => onUpdateNewColumn(idx, 'name', e.target.value)}
                        className={fieldClass}
                        placeholder="column_name"
                      />
                    </FieldRow>
                    <FieldRow label="Type">
                      <PostgresTypePicker
                        value={col.type}
                        onChange={(v) => onUpdateNewColumn(idx, 'type', v)}
                        postgresDataTypes={postgresDataTypes}
                      />
                    </FieldRow>
                    {typeNeedsParams(col.type, postgresDataTypes) && (
                      <FieldRow label={getParamLabel(col.type, postgresDataTypes) || 'Parameters'}>
                        <input
                          type="text"
                          value={col.typeParams || ''}
                          onChange={(e) => onUpdateNewColumn(idx, 'typeParams', e.target.value)}
                          placeholder={getParamLabel(col.type, postgresDataTypes)}
                          className={fieldClass}
                        />
                      </FieldRow>
                    )}
                    <Toggle
                      checked={(col.nullable || 'YES') === 'YES'}
                      onChange={(next) => onUpdateNewColumn(idx, 'nullable', next ? 'YES' : 'NO')}
                      label="Allow Nullable"
                      description="Allow the column to assume a NULL value if no value is provided"
                    />
                  </div>
                ))}
              </div>
            )}
            <Button
              onClick={onAddNewColumn}
              variant="outline"
              size="sm"
              className="h-8 rounded-md border-zinc-300 px-3 text-xs text-foreground hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/[0.06]"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Column
            </Button>
          </Section>

          <Section
            title="Remove Columns"
            icon={<Trash2 className="h-3.5 w-3.5 text-zinc-500" />}
            description="Select columns to remove from the table."
          >
            <div className="flex flex-col gap-2">
              {tableData.columns.map((col: { name: string; type: string; key?: string }) => (
                <label
                  key={col.name}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors ${
                    columnsToRemove.includes(col.name)
                      ? 'border-red-500/40 bg-red-500/10'
                      : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={columnsToRemove.includes(col.name)}
                    onChange={() => onToggleColumnRemoval(col.name)}
                    className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-white/20"
                  />
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{col.name}</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{col.type}</span>
                    {col.key === 'PRI' && (
                      <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">
                        PRIMARY KEY
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {columnsToRemove.length > 0 && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-200">
                  Warning: Removing columns will permanently delete all data in those columns. This action cannot be
                  undone.
                </p>
              </div>
            )}
          </Section>
        </div>

        <footer className="shrink-0 border-t border-zinc-300 px-6 py-3.5 dark:border-white/10">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={requestClose}
              className="h-8 rounded-md border-zinc-300 px-3 text-xs text-foreground hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/[0.06]"
              disabled={editingTable}
            >
              Cancel
            </Button>
            <Button
              onClick={onApply}
              className="h-8 rounded-md bg-blue-500 px-3 text-xs text-white shadow-sm hover:bg-blue-600 disabled:opacity-50"
              disabled={editingTable || !hasChanges}
            >
              {editingTable ? 'Applying...' : 'Apply Changes'}
            </Button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
