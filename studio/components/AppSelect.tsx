'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Marker for portaled select menus — parent outside-click handlers must ignore these. */
export const PORTALED_SELECT_MENU_ATTR = 'data-portaled-select-menu'

export function isPortaledSelectMenuTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(`[${PORTALED_SELECT_MENU_ATTR}]`)
}

export type AppSelectOption = {
  value: string
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
}

export type AppSelectGroup = {
  label: string
  options: AppSelectOption[]
}

type AppSelectProps = {
  value: string
  onChange: (value: string) => void
  options?: AppSelectOption[]
  groups?: AppSelectGroup[]
  placeholder?: string
  /** Force search on/off. Default: on when total options > 8 */
  searchable?: boolean
  searchPlaceholder?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  triggerClassName?: string
  menuMinWidth?: number
  'aria-label'?: string
}

/**
 * Shared dropdown — same visual language as PostgresTypePicker / FancySelect.
 * Drop-in replacement for native <select> (value + onChange string contract).
 */
export function AppSelect({
  value,
  onChange,
  options = [],
  groups,
  placeholder = 'Select…',
  searchable,
  searchPlaceholder = 'Search…',
  disabled = false,
  size = 'md',
  className,
  triggerClassName,
  menuMinWidth = 200,
  'aria-label': ariaLabel,
}: AppSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const resolvedGroups: AppSelectGroup[] = useMemo(() => {
    if (groups && groups.length > 0) return groups.filter((g) => g.options.length > 0)
    return options.length > 0 ? [{ label: '', options }] : []
  }, [groups, options])

  const flatOptions = useMemo(() => resolvedGroups.flatMap((g) => g.options), [resolvedGroups])
  const selected = flatOptions.find((o) => o.value === value)
  const enableSearch = searchable ?? flatOptions.length > 8

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return resolvedGroups
    return resolvedGroups
      .map((g) => ({
        ...g,
        options: g.options.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            o.value.toLowerCase().includes(q) ||
            (o.description || '').toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.options.length > 0)
  }, [resolvedGroups, query])

  const updateMenuPos = () => {
    const el = buttonRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.max(rect.width, menuMinWidth)
    const preferredTop = rect.bottom + 6
    const menuMaxH = 320
    const spaceBelow = window.innerHeight - preferredTop
    const top =
      spaceBelow < Math.min(menuMaxH, 200) && rect.top > menuMaxH
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
    if (!enableSearch) return
    const id = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [open, enableSearch])

  const pick = (next: string) => {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  const sm = size === 'sm'

  const menu =
    open && menuPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            {...{ [PORTALED_SELECT_MENU_ATTR]: '' }}
            className="fixed z-[220] overflow-hidden rounded-md border border-zinc-300 bg-white shadow-xl shadow-black/25 dark:border-white/10 dark:bg-[#171717]"
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
            role="listbox"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {enableSearch && (
              <div className="border-b border-zinc-200 px-2.5 py-2 dark:border-white/[0.06]">
                <div className="flex h-8 items-center gap-2 rounded-md border border-zinc-300 bg-zinc-50 px-2.5 dark:border-white/10 dark:bg-[#101010]">
                  <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-full w-full bg-transparent text-xs text-foreground outline-none placeholder:text-zinc-500"
                  />
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto custom-scrollbar py-1.5">
              {filteredGroups.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-zinc-500">
                  {query.trim() ? `No matches for “${query}”` : 'No options'}
                </p>
              ) : (
                filteredGroups.map((group, gi) => (
                  <div key={group.label || `g-${gi}`} className="px-1.5 pb-1">
                    {group.label ? (
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        {group.label}
                      </p>
                    ) : null}
                    {group.options.map((option) => {
                      const isSelected = option.value === value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          disabled={option.disabled}
                          onClick={() => {
                            if (option.disabled) return
                            pick(option.value)
                          }}
                          className={cn(
                            'flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
                            option.disabled && 'cursor-not-allowed opacity-50',
                            !option.disabled && isSelected && 'bg-zinc-100 dark:bg-white/[0.08]',
                            !option.disabled && !isSelected && 'hover:bg-zinc-50 dark:hover:bg-white/[0.05]'
                          )}
                        >
                          {option.icon ? (
                            <span className="mt-0.5 shrink-0 text-zinc-400">{option.icon}</span>
                          ) : null}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium text-foreground">{option.label}</span>
                            {option.description ? (
                              <span className="mt-0.5 block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                {option.description}
                              </span>
                            ) : null}
                          </span>
                          {isSelected && !option.disabled ? (
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          ) : null}
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
    <div className={cn('relative', className)} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2 rounded-md border bg-zinc-50 text-left text-foreground transition-colors dark:bg-[#1c1c1c]',
          sm ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-xs',
          disabled
            ? 'cursor-not-allowed opacity-60'
            : open
              ? 'border-blue-500/50 ring-2 ring-blue-500/15'
              : 'border-zinc-300 hover:border-zinc-400 dark:border-white/15 dark:hover:border-white/25',
          triggerClassName
        )}
      >
        {selected?.icon ? <span className="shrink-0 text-zinc-400">{selected.icon}</span> : null}
        <span
          className={cn(
            'min-w-0 flex-1 truncate font-medium',
            !selected && 'font-normal text-zinc-400'
          )}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {menu}
    </div>
  )
}
