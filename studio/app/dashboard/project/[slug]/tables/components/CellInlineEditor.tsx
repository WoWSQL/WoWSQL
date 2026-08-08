'use client'

import { Check, X, Maximize2 } from 'lucide-react'

type CellInlineEditorProps = {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  multiline?: boolean
  showExpand?: boolean
  onExpand?: () => void
  panelOpen?: boolean
}

const actionBtn =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-40'

export function CellInlineEditor({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
  multiline = false,
  showExpand = false,
  onExpand,
  panelOpen = false,
}: CellInlineEditorProps) {
  if (panelOpen) {
    return (
    <div className="flex w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-md border border-blue-500/25 bg-blue-500/[0.06] px-2.5 py-1.5">
    <span className="truncate text-[11px] font-medium text-blue-600 dark:text-blue-300">
          Editing in side panel
        </span>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            className="shrink-0 text-[11px] font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Open
          </button>
        )}
      </div>
    )
  }

  const actionRail = (
    <div className="absolute inset-y-0 right-0 z-10 flex items-center gap-0.5 pr-1 pl-4 bg-gradient-to-l from-zinc-100 via-zinc-100/95 to-transparent dark:from-[#0c0c10] dark:via-[#0c0c10]/95">
      {showExpand && onExpand && (
        <button
          type="button"
          onClick={onExpand}
          disabled={saving}
          className={`${actionBtn} text-blue-500 hover:bg-blue-500/15`}
          title="Open side panel"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={`${actionBtn} text-blue-600 hover:bg-blue-500/15 dark:text-blue-400`}
        title="Save (Enter)"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className={`${actionBtn} text-red-500 hover:bg-red-500/15 dark:text-red-400`}
        title="Cancel (Esc)"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )

  const inputPad = showExpand ? 'pr-[5.75rem]' : 'pr-[3.5rem]'

  return (
    <div className="relative w-full min-w-0 max-w-full">
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onCancel()
            }
          }}
          rows={2}
          disabled={saving}
          autoFocus
          spellCheck={false}
          className={`w-full min-w-0 max-w-full resize-none rounded-md border border-blue-500/50 bg-white py-1.5 pl-2 text-[11px] font-mono leading-snug text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:bg-zinc-900 dark:text-zinc-100 ${inputPad}`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSave()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              onCancel()
            }
          }}
          disabled={saving}
          autoFocus
          className={`h-8 w-full min-w-0 max-w-full rounded-md border border-blue-500/50 bg-white py-0 pl-2 text-[11px] font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:bg-zinc-900 dark:text-zinc-100 ${inputPad}`}
        />
      )}
      {actionRail}
    </div>
  )
}
