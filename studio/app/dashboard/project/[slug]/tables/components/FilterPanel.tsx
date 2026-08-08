'use client'

import { Filter, Plus, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { AppSelect } from '@/components/AppSelect'
import type { FilterItem } from '../types'

const FILTER_OPERATORS = [
  { value: 'equals', label: 'equals (=)' },
  { value: 'not_equals', label: 'not equals (≠)' },
  { value: 'greater', label: 'greater than (>)' },
  { value: 'less', label: 'less than (<)' },
  { value: 'like', label: 'contains (like)' },
  { value: 'is_null', label: 'is empty' },
  { value: 'not_null', label: 'is not empty' },
] as const

const fieldClass =
'h-9 w-full rounded-md border border-zinc-300/80 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:text-zinc-100'

type FilterPanelProps = {
  filters: FilterItem[]
  columns: Array<{ name: string; type?: string }>
  onAddFilter: () => void
  onUpdateFilter: (idx: number, field: string, value: string) => void
  onRemoveFilter: (idx: number) => void
  onClearFilters: () => void
  onApplyFilters: () => void
  /** Close after apply — keep current draft (already copied to applied). */
  onClose: () => void
  /** Cancel / X — discard draft and close. */
  onCancel: () => void
}

export function FilterPanel({
  filters,
  columns,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onClearFilters,
  onApplyFilters,
  onClose,
  onCancel,
}: FilterPanelProps) {
  const handleApply = () => {
    onApplyFilters()
    onClose()
  }

  return (
  <div className="absolute left-0 top-full z-50 mt-1 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-md border border-zinc-300 bg-white shadow-xl shadow-black/20 dark:border-zinc-700 dark:bg-[#0c0c0e]">
  <header className="flex items-start justify-between gap-3 border-b border-zinc-300 px-3 py-2.5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-blue-500" />
            <h3 className="text-xs font-semibold text-foreground">Filter rows</h3>
            {filters.length > 0 && (
            <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                {filters.length} active
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Close filters"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="max-h-[min(360px,50vh)] overflow-y-auto custom-scrollbar px-4 py-4">
        {filters.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-700">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
          <Filter className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">No filters yet</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Add a condition on any column to filter your data.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddFilter}
              className="mt-4 h-9 gap-2 border-zinc-300 dark:border-zinc-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add condition
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filters.map((filter, idx) => {
              const needsValue = filter.operator !== 'is_null' && filter.operator !== 'not_null'
              return (
                <div
                  key={idx}
                  className="rounded-md border border-zinc-300 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                      Condition {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveFilter(idx)}
                      className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                      title="Remove condition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        Column
                      </label>
                      <AppSelect
                        value={filter.column}
                        onChange={(v) => onUpdateFilter(idx, 'column', v)}
                        options={columns.map((col) => ({ value: col.name, label: col.name }))}
                      />
                    </div>

                    <div className={needsValue ? 'grid grid-cols-2 gap-2' : ''}>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                          Operator
                        </label>
                        <AppSelect
                          value={filter.operator}
                          onChange={(v) => onUpdateFilter(idx, 'operator', v)}
                          searchable={false}
                          options={FILTER_OPERATORS.map((op) => ({ value: op.value, label: op.label }))}
                        />
                      </div>

                      {needsValue && (
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            Value
                          </label>
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => onUpdateFilter(idx, 'value', e.target.value)}
                            className={fieldClass}
                            placeholder="Enter value…"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            <button
              type="button"
              onClick={onAddFilter}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 py-2.5 text-xs font-medium text-zinc-600 transition-colors hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-blue-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another condition
            </button>
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-zinc-300 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        {filters.length > 0 ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Clear all
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-9 px-3">
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="h-9 bg-blue-600 px-4 text-white hover:bg-blue-500"
          >
            Apply filters
          </Button>
        </div>
      </footer>
    </div>
  )
}
