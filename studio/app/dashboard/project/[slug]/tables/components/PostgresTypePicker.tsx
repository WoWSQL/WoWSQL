'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Hash, Search, Type, Braces, Calendar } from 'lucide-react'
import { PORTALED_SELECT_MENU_ATTR } from '@/components/AppSelect'
import type { PostgreSQLDataType, PostgreSQLDataTypes } from '../types'

type TypeGroup = { label: string; types: PostgreSQLDataType[] }

function typeGlyph(value: string): ReactNode {
  const v = value.toUpperCase()
  if (['JSON', 'JSONB'].includes(v)) return <Braces className="h-3.5 w-3.5" />
  if (['DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ', 'INTERVAL'].some((t) => v.includes(t))) {
    return <Calendar className="h-3.5 w-3.5" />
  }
  if (
    ['INT', 'SERIAL', 'NUMERIC', 'DECIMAL', 'FLOAT', 'REAL', 'DOUBLE', 'BIGINT', 'SMALLINT', 'MONEY'].some((t) =>
      v.includes(t)
    )
  ) {
    return <Hash className="h-3.5 w-3.5" />
  }
  return <Type className="h-3.5 w-3.5" />
}

function typeDescription(t: PostgreSQLDataType): string {
  if (t.example && t.example.toUpperCase() !== t.value.toUpperCase()) return t.example
  if (t.param_label) return t.param_label
  return ''
}

/**
 * Searchable PostgreSQL type picker (Edit Table design).
 * Same value/onChange contract as a native <select>.
 */
export function PostgresTypePicker({
  value,
  onChange,
  postgresDataTypes,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  postgresDataTypes: PostgreSQLDataTypes
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const groups: TypeGroup[] = useMemo(
    () =>
      [
        { label: 'Numeric Types', types: postgresDataTypes.numeric },
        { label: 'String Types', types: postgresDataTypes.string },
        { label: 'Date/Time Types', types: postgresDataTypes.datetime },
        { label: 'JSON', types: postgresDataTypes.json },
        { label: 'Extension Types', types: postgresDataTypes.extension || [] },
        { label: 'Spatial Types', types: postgresDataTypes.spatial },
        { label: 'Other Types', types: postgresDataTypes.other },
      ].filter((g) => g.types.length > 0),
    [postgresDataTypes]
  )

  const knownValues = useMemo(() => new Set(groups.flatMap((g) => g.types.map((t) => t.value))), [groups])
  const showCurrentFromDb = Boolean(value && !knownValues.has(value))

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((g) => ({
        ...g,
        types: g.types.filter(
          (t) => t.value.toLowerCase().includes(q) || typeDescription(t).toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.types.length > 0)
  }, [groups, query])

  const updateMenuPos = () => {
    const el = buttonRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.max(rect.width, 240)
    const preferredTop = rect.bottom + 6
    const menuMaxH = 320
    const spaceBelow = window.innerHeight - preferredTop
    const top =
      spaceBelow < Math.min(menuMaxH, 220) && rect.top > menuMaxH
        ? Math.max(8, rect.top - menuMaxH - 6)
        : preferredTop
    const left = Math.min(rect.left, window.innerWidth - width - 8)
    setMenuPos({ top, left: Math.max(8, left), width })
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }
    updateMenuPos()
    const onScrollOrResize = () => updateMenuPos()
    window.addEventListener('resize', onScrollOrResize)
    // Capture scroll from nested panels (create/edit table sidebars)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    const id = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [open])

  const pick = (next: string) => {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  const menu =
    open && menuPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            {...{ [PORTALED_SELECT_MENU_ATTR]: '' }}
            className="fixed z-[80] overflow-hidden rounded-md border border-zinc-300 bg-white shadow-xl shadow-black/25 dark:border-white/10 dark:bg-[#171717]"
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
            role="listbox"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-2.5 py-2 dark:border-white/[0.06]">
              <div className="flex h-8 items-center gap-2 rounded-md border border-zinc-300 bg-zinc-50 px-2.5 dark:border-white/10 dark:bg-[#101010]">
                <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search types..."
                  className="h-full w-full bg-transparent text-xs text-foreground outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar py-1.5">
              {showCurrentFromDb && !query.trim() && (
                <div className="px-1.5 pb-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Current in database
                  </p>
                  <button
                    type="button"
                    role="option"
                    aria-selected={true}
                    onClick={() => pick(value)}
                    className="flex w-full items-center gap-2.5 rounded-md bg-blue-500/10 px-2.5 py-2 text-left"
                  >
                    <span className="text-zinc-400">{typeGlyph(value)}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{value}</span>
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  </button>
                </div>
              )}

              {filteredGroups.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-zinc-500">No types match “{query}”</p>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.label} className="px-1.5 pb-1">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      {group.label}
                    </p>
                    {group.types.map((t) => {
                      const selected = t.value === value
                      const desc = typeDescription(t)
                      return (
                        <button
                          key={t.value}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => pick(t.value)}
                          className={`flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
                            selected
                              ? 'bg-zinc-100 dark:bg-white/[0.08]'
                              : 'hover:bg-zinc-50 dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <span className="mt-0.5 shrink-0 text-zinc-400">{typeGlyph(t.value)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium text-foreground">{t.value}</span>
                            {desc ? (
                              <span className="mt-0.5 block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                {desc}
                              </span>
                            ) : null}
                          </span>
                          {selected ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> : null}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-9 w-full items-center gap-2 rounded-md border bg-zinc-50 px-3 text-left text-xs text-foreground transition-colors dark:bg-[#1c1c1c] ${
          disabled
            ? 'cursor-not-allowed opacity-60'
            : open
              ? 'border-blue-500/50 ring-2 ring-blue-500/15'
              : 'border-zinc-300 hover:border-zinc-400 dark:border-white/15 dark:hover:border-white/25'
        }`}
      >
        <span className="shrink-0 text-zinc-400">{typeGlyph(value || 'TEXT')}</span>
        <span className="min-w-0 flex-1 truncate font-medium">{value || 'Select type'}</span>
        {showCurrentFromDb && (
          <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-300">
            current
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {menu}
    </div>
  )
}
