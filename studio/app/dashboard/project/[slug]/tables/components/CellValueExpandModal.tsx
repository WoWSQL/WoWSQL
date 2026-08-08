'use client'

import { useState, useEffect } from 'react'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/Button'

function formatPreview(raw: string, isJson: boolean): string {
  const t = raw.trim()
  if (!t) return ''
  if (!isJson) return raw
  try {
    return JSON.stringify(JSON.parse(t), null, 2)
  } catch {
    return raw
  }
}

type CellValueExpandModalProps = {
  columnName: string
  rowIndex: number
  isJson?: boolean
  editValue: string
  setEditValue: (v: any) => void
  savingEdit: boolean
  editingCell: { row: number; col: string }
  onSaveEdit: (row: number, col: string) => void
  onCancelEditing: () => void
}

export function CellValueExpandModal({
  columnName,
  rowIndex,
  isJson = false,
  editValue,
  setEditValue,
  savingEdit,
  editingCell,
  onSaveEdit,
  onCancelEditing,
}: CellValueExpandModalProps) {
  const [tab, setTab] = useState<'edit' | 'view'>('edit')
  const charCount = String(editValue ?? '').length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancelEditing()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancelEditing])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onCancelEditing}
        aria-label="Close editor"
      />

      <aside
        className="relative z-10 flex h-full w-full max-w-[min(560px,92vw)] flex-col border-l border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#0a0a0b] shadow-[-24px_0_48px_-12px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cell-expand-editor-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-300 dark:border-zinc-800 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Update cell
            </p>
            <h2 id="cell-expand-editor-title" className="mt-1 text-base font-semibold text-foreground">
              <span className="text-blue-500 dark:text-blue-400">{columnName}</span>
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Row {rowIndex + 1} · {charCount.toLocaleString()} characters
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelEditing}
            className="shrink-0 rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex shrink-0 border-b border-zinc-300 dark:border-zinc-800 px-5 gap-1">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`px-3 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
              tab === 'edit'
                ? 'border-blue-500 text-foreground font-medium'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setTab('view')}
            className={`px-3 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
              tab === 'view'
                ? 'border-blue-500 text-foreground font-medium'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            Preview
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-5">
          {tab === 'edit' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-full w-full resize-none rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-[13px] font-mono leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 custom-scrollbar"
              spellCheck={false}
              disabled={savingEdit}
              autoFocus
            />
          ) : (
            <pre className="h-full overflow-auto rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-[13px] font-mono leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words custom-scrollbar">
              {formatPreview(String(editValue ?? ''), isJson)}
            </pre>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-300 dark:border-zinc-800 bg-zinc-50/90 px-5 py-4 dark:bg-zinc-900/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancelEditing}
            disabled={savingEdit}
            className="h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={savingEdit}
            onClick={() => onSaveEdit(editingCell.row, editingCell.col)}
            className="h-9 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {savingEdit ? 'Saving…' : 'Save changes'}
          </Button>
        </footer>
      </aside>
    </div>
  )
}
