/** Short labels for PostgreSQL types in table headers (full type in title tooltip). */

export function formatColumnTypeShort(pgType: string | undefined): string {
  if (!pgType) return '—'
  let t = pgType.trim().toLowerCase()

  const replacements: Array<[string, string]> = [
    ['character varying', 'varchar'],
    ['timestamp with time zone', 'timestamptz'],
    ['timestamp without time zone', 'timestamp'],
    ['time with time zone', 'timetz'],
    ['time without time zone', 'time'],
    ['double precision', 'float8'],
    ['integer', 'int4'],
    ['bigint', 'int8'],
    ['smallint', 'int2'],
    ['boolean', 'bool'],
    ['real', 'float4'],
    ['numeric', 'numeric'],
    ['bytea', 'bytea'],
  ]

  for (const [from, to] of replacements) {
    if (t.startsWith(from)) {
      t = to + t.slice(from.length)
      break
    }
  }

  return t
}

export function estimateColumnWidth(col: { name: string; type?: string }): number {
  const nameLen = col.name.length
  const typeLabel = formatColumnTypeShort(col.type)
  const t = (col.type || '').toLowerCase()

  let minContent = Math.max(nameLen * 8 + 40, typeLabel.length * 7 + 36)
  if (/timestamp|timestamptz|date/i.test(t)) {
    minContent = Math.max(minContent, 200)
  } else if (/jsonb?/i.test(t)) {
    minContent = Math.max(minContent, 180)
  } else if (/varchar|text|character/i.test(t)) {
    minContent = Math.max(minContent, 160)
  }

  return Math.max(148, Math.min(320, minContent))
}
