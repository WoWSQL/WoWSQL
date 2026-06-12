import type { Column, PostgreSQLDataTypes } from '../types'

/** Column metadata from GET /db/tables/:name (information_schema + extras). */
export type ApiTableColumn = {
  name: string
  type: string
  null?: string
  character_maximum_length?: number | null
  datetime_precision?: number | null
  numeric_precision?: number | null
  numeric_scale?: number | null
}

/**
 * Map PostgreSQL information_schema.data_type (+ length/precision) to UI dropdown values
 * (same family as Table view / usePostgresDataTypes), not the first \\w+ of the string.
 */
export function pgInformationSchemaToUiColumn(col: ApiTableColumn): Pick<Column, 'type' | 'typeParams'> {
  const dt = (col.type || '').trim().toLowerCase()
  const charLen = col.character_maximum_length
  const dtPrec = col.datetime_precision
  const numPrec = col.numeric_precision
  const numScale = col.numeric_scale

  if (dt === 'timestamp with time zone' || dt === 'timestamptz') {
    return dtPrec != null && dtPrec > 0
      ? { type: 'TIMESTAMPTZ', typeParams: String(dtPrec) }
      : { type: 'TIMESTAMPTZ' }
  }
  if (dt === 'timestamp without time zone' || dt === 'timestamp') {
    return dtPrec != null && dtPrec > 0
      ? { type: 'TIMESTAMP', typeParams: String(dtPrec) }
      : { type: 'TIMESTAMP' }
  }
  if (dt === 'time with time zone' || dt === 'timetz') {
    return dtPrec != null && dtPrec > 0 ? { type: 'TIME', typeParams: String(dtPrec) } : { type: 'TIME' }
  }
  if (dt === 'time without time zone' || dt === 'time') {
    return dtPrec != null && dtPrec > 0 ? { type: 'TIME', typeParams: String(dtPrec) } : { type: 'TIME' }
  }
  if (dt === 'character varying' || dt === 'varchar') {
    return charLen != null && charLen > 0
      ? { type: 'VARCHAR', typeParams: String(charLen) }
      : { type: 'TEXT' }
  }
  if (dt === 'character' || dt === 'char') {
    return charLen != null && charLen > 0
      ? { type: 'CHAR', typeParams: String(charLen) }
      : { type: 'CHAR', typeParams: '1' }
  }
  if (dt === 'text') return { type: 'TEXT' }
  if (dt === 'boolean' || dt === 'bool') return { type: 'BOOLEAN' }
  if (dt === 'uuid') return { type: 'UUID' }
  if (dt === 'jsonb') return { type: 'JSONB' }
  if (dt === 'json') return { type: 'JSON' }
  if (dt === 'bigint' || dt === 'int8') return { type: 'BIGINT' }
  if (dt === 'integer' || dt === 'int' || dt === 'int4') return { type: 'INTEGER' }
  if (dt === 'smallint' || dt === 'int2') return { type: 'SMALLINT' }
  if (dt === 'double precision') return { type: 'DOUBLE PRECISION' }
  if (dt === 'real') return { type: 'REAL' }
  if (dt === 'numeric' || dt === 'decimal') {
    if (numPrec != null && numScale != null) {
      return { type: dt === 'decimal' ? 'DECIMAL' : 'NUMERIC', typeParams: `${numPrec},${numScale}` }
    }
    if (numPrec != null) {
      return { type: 'NUMERIC', typeParams: String(numPrec) }
    }
    return { type: 'NUMERIC' }
  }
  if (dt === 'date') return { type: 'DATE' }
  if (dt === 'money') return { type: 'MONEY' }
  if (dt === 'bytea') return { type: 'BYTEA' }
  if (dt === 'xml') return { type: 'XML' }

  const paren = col.type.match(/^(.+?)\((.+)\)\s*$/i)
  if (paren) {
    const base = paren[1].trim().toUpperCase().replace(/\s+/g, ' ')
    const inner = paren[2].trim()
    return { type: base, typeParams: inner }
  }

  return { type: col.type.trim().toUpperCase().replace(/\s+/g, ' ') }
}

export function getFullTypeString(col: Column): string {
  if (col.typeParams && col.typeParams.trim()) {
    return `${col.type}(${col.typeParams})`
  }
  return col.type
}

/** USING clause for ALTER COLUMN ... TYPE (PostgreSQL cast target is lowercased except double precision). */
export function pgUsingClauseForAlterType(quotedColName: string, col: Column): string {
  const full = getFullTypeString(col)
  const lower = full.toLowerCase()
  if (lower === 'double precision') {
    return `USING ${quotedColName}::double precision`
  }
  return `USING ${quotedColName}::${lower}`
}

export function typeNeedsParams(type: string, postgresDataTypes: PostgreSQLDataTypes): boolean {
  const allTypes = [
    ...postgresDataTypes.numeric,
    ...postgresDataTypes.string,
    ...postgresDataTypes.datetime,
    ...postgresDataTypes.json,
    ...(postgresDataTypes.extension || []),
    ...postgresDataTypes.spatial,
    ...postgresDataTypes.other,
  ]
  const typeDef = allTypes.find(t => t.value === type)
  return typeDef?.needs_params || false
}

export function getParamLabel(type: string, postgresDataTypes: PostgreSQLDataTypes): string {
  const allTypes = [
    ...postgresDataTypes.numeric,
    ...postgresDataTypes.string,
    ...postgresDataTypes.datetime,
    ...postgresDataTypes.json,
    ...(postgresDataTypes.extension || []),
    ...postgresDataTypes.spatial,
    ...postgresDataTypes.other,
  ]
  const typeDef = allTypes.find(t => t.value === type)
  return typeDef?.param_label || ''
}

export function getTypeExample(type: string, postgresDataTypes: PostgreSQLDataTypes): string {
  const allTypes = [
    ...postgresDataTypes.numeric,
    ...postgresDataTypes.string,
    ...postgresDataTypes.datetime,
    ...postgresDataTypes.json,
    ...(postgresDataTypes.extension || []),
    ...postgresDataTypes.spatial,
    ...postgresDataTypes.other,
  ]
  const typeDef = allTypes.find(t => t.value === type)
  return typeDef?.example || type
}
