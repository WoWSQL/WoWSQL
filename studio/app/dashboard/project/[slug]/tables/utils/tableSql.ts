/** Build PostgreSQL literals for simple dashboard-generated SQL (escape quotes only). */

export function formatPgLiteral(value: unknown, pgType: string | undefined): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'bigint') return value.toString()
  const t = (pgType || '').toLowerCase()
  const base = t.split('(')[0].trim()

  if (t.includes('json')) {
    const json = typeof value === 'string' ? value : JSON.stringify(value)
    return `'${json.replace(/'/g, "''")}'::jsonb`
  }

  if (typeof value === 'boolean' || base === 'boolean') {
    const b =
      value === true ||
      value === 'true' ||
      value === 't' ||
      value === '1' ||
      value === 1
    return b ? 'TRUE' : 'FALSE'
  }

  if (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    /^(smallint|integer|bigint|int2|int4|int8|serial|bigserial|smallserial|oid|real|double|numeric|decimal|float|money)/i.test(
      base
    )
  ) {
    return String(value)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  const s = String(value)
  return `'${s.replace(/'/g, "''")}'`
}

export function buildDeleteByPrimaryKeyQuery(
  tableName: string,
  pkColumns: string[],
  rows: Record<string, unknown>[],
  columnsMeta: { name: string; type: string }[]
): string {
  if (pkColumns.length === 0 || rows.length === 0) {
    return ''
  }
  const typeOf = (name: string) => columnsMeta.find((c) => c.name === name)?.type

  if (pkColumns.length === 1) {
    const pk = pkColumns[0]
    const vals = rows.map((row) => formatPgLiteral(row[pk], typeOf(pk))).join(', ')
    return `DELETE FROM "${tableName}" WHERE "${pk}" IN (${vals})`
  }

  const tupleSql = (row: Record<string, unknown>) =>
    `(${pkColumns.map((pk) => formatPgLiteral(row[pk], typeOf(pk))).join(',')})`
  const tuples = rows.map(tupleSql).join(',')
  const pkList = pkColumns.map((c) => `"${c}"`).join(',')
  return `DELETE FROM "${tableName}" WHERE (${pkList}) IN (${tuples})`
}

export function buildUpdateCellQuery(
  tableName: string,
  columnName: string,
  newValue: unknown,
  row: Record<string, unknown>,
  pkColumns: string[],
  columnsMeta: { name: string; type: string }[]
): string {
  const typeOf = (name: string) => columnsMeta.find((c) => c.name === name)?.type
  const setLit = formatPgLiteral(newValue, typeOf(columnName))
  const whereClause = pkColumns
    .map((pk) => `"${pk}" = ${formatPgLiteral(row[pk], typeOf(pk))}`)
    .join(' AND ')
  return `UPDATE "${tableName}" SET "${columnName}" = ${setLit} WHERE ${whereClause}`
}
