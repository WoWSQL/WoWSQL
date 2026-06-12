'use client'

import { useState, useEffect } from 'react'
import { X, Minimize2, Save } from 'lucide-react'
import { Button } from '@/components/Button'

function formatJsonForView(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  try {
    return JSON.stringify(JSON.parse(t), null, 2)
  } catch {
    return raw
  }
}

type CellValueExpandModalProps = {
  columnName: string
  editValue: string
  setEditValue: (v: any) => void
  savingEdit: boolean
  editingCell: { row: number; col: string }
  onSaveEdit: (row: number, col: string) => void
  onCancelEditing: () => void
  onClose: () => void
}

export function CellValueExpandModal({
  columnName,
  editValue,
  setEditValue,
  savingEdit,
  editingCell,
  onSaveEdit,
  onCancelEditing,
  onClose,
}: CellValueExpandModalProps) {
  const [tab, setTab] = useState<'edit' | 'view'>('edit')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white/80 dark:bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cell-expand-editor-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl border border-zinc-200 dark:border-white/20 bg-zinc-100 dark:bg-[#0a0a0a] shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-white/10 shrink-0">
          <h2 id="cell-expand-editor-title" className="text-base font-medium text-zinc-900 dark:text-white">
            Editing value of: <span className="text-blue-300">{columnName}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5"
            title="Close expanded editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex border-b border-zinc-200 dark:border-white/10 shrink-0 px-2 gap-1">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`px-4 py-2 text-sm rounded-t-md transition-colors ${
              tab === 'edit'
                ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium'
                : 'text-zinc-600 dark:text-white/50 hover:text-zinc-500 dark:text-white/80'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setTab('view')}
            className={`px-4 py-2 text-sm rounded-t-md transition-colors ${
              tab === 'view'
                ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium'
                : 'text-zinc-600 dark:text-white/50 hover:text-zinc-500 dark:text-white/80'
            }`}
          >
            View
          </button>
        </div>
        <div className="flex-1 min-h-[min(420px,50vh)] overflow-auto p-4">
          {tab === 'edit' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full min-h-[360px] h-[50vh] px-3 py-2 rounded-lg bg-white/80 dark:bg-black/50 border border-zinc-200 dark:border-white/15 text-emerald-100/95 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              spellCheck={false}
              disabled={savingEdit}
              autoFocus
            />
          ) : (
            <pre className="whitespace-pre-wrap break-words text-sm font-mono text-orange-100/95 leading-relaxed p-3 rounded-lg bg-white/80 dark:bg-black/40 border border-zinc-200 dark:border-white/10 min-h-[360px] overflow-auto">
              {formatJsonForView(String(editValue ?? ''))}
            </pre>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 dark:border-white/10 shrink-0 bg-white/80 dark:bg-black/20">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
              disabled={savingEdit}
              onClick={() => {
                onSaveEdit(editingCell.row, editingCell.col)
                onClose()
              }}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save changes
            </Button>
            <button
              type="button"
              onClick={() => {
                onCancelEditing()
                onClose()
              }}
              className="text-sm text-zinc-600 dark:text-white/50 hover:text-zinc-500 dark:text-white/80 px-2"
              disabled={savingEdit}
            >
              <span className="text-zinc-600 dark:text-white/40 font-mono text-xs mr-1">Esc</span>
              Cancel changes
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-600 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5"
            title="Collapse to inline editor"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
