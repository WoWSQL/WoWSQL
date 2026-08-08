/** Table cell display: avoid `[object Object]` for JSON/JSONB and nested structures. */

const DEFAULT_MAX = 240

export function formatCellForDisplay(value: unknown, maxLen: number = DEFAULT_MAX): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    try {
      const s = JSON.stringify(value)
      if (s.length > maxLen) return `${s.slice(0, maxLen)}…`
      return s
    } catch {
      return String(value)
    }
  }
  if (typeof value === 'bigint') return value.toString()
  const s = String(value)
  return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s
}

export function columnLooksLikeJson(pgType: string | undefined): boolean {
  return !!(pgType && /jsonb?/i.test(pgType))
}

export function columnLooksLikeTimestamp(pgType: string | undefined): boolean {
  return !!(pgType && /timestamp|timestamptz|date/i.test(pgType))
}

/** Prefer side-panel editor when inline editing would be cramped or hard to read. */
export function shouldUseExpandedCellEditor(
  pgType: string | undefined,
  valueText: string,
): boolean {
  const len = valueText.length
  if (columnLooksLikeJson(pgType)) {
    return len > 80 || valueText.includes('\n')
  }
  if (columnLooksLikeTimestamp(pgType)) {
    return len > 20
  }
  return len > 64 || valueText.includes('\n')
}
