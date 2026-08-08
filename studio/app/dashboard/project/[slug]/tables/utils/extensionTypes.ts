import type { PostgreSQLDataType } from '../types'

/** Known PostgreSQL extension → column types for the table editor UI. */
export const EXTENSION_TYPE_CATALOG: Record<string, PostgreSQLDataType[]> = {
  vector: [
    {
      value: 'VECTOR',
      needs_params: true,
      param_label: 'Dimensions (e.g., 1536)',
      example: 'VECTOR(1536)',
    },
    {
      value: 'HALFVEC',
      needs_params: true,
      param_label: 'Dimensions (e.g., 1536)',
      example: 'HALFVEC(1536)',
    },
    {
      value: 'SPARSEVEC',
      needs_params: true,
      param_label: 'Dimensions (e.g., 1536)',
      example: 'SPARSEVEC(1536)',
    },
  ],
  postgis: [
    { value: 'GEOMETRY', needs_params: false },
    { value: 'GEOGRAPHY', needs_params: false },
  ],
  citext: [{ value: 'CITEXT', needs_params: false }],
  hstore: [{ value: 'HSTORE', needs_params: false }],
  cube: [{ value: 'CUBE', needs_params: false }],
  ltree: [{ value: 'LTREE', needs_params: false }],
}

export function mergeExtensionTypesForInstalled(
  apiExtensionTypes: PostgreSQLDataType[],
  installedExtensions: Array<{ name: string }>,
): PostgreSQLDataType[] {
  const existing = new Set(apiExtensionTypes.map((t) => t.value))
  const merged = [...apiExtensionTypes]

  for (const ext of installedExtensions) {
    const catalog = EXTENSION_TYPE_CATALOG[ext.name.toLowerCase()]
    if (!catalog) continue
    for (const typeDef of catalog) {
      if (!existing.has(typeDef.value)) {
        merged.push(typeDef)
        existing.add(typeDef.value)
      }
    }
  }

  return merged.sort((a, b) => a.value.localeCompare(b.value))
}
