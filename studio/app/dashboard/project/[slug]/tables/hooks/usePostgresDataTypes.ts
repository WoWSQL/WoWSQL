import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { PostgreSQLDataTypes } from '../types'
import { EXTENSION_TYPE_CATALOG, mergeExtensionTypesForInstalled } from '../utils/extensionTypes'
import { sanitizePostgresDataTypes } from '../utils/postgresTypes'

const FALLBACK_TYPES: PostgreSQLDataTypes = {
  numeric: [
    { value: 'SMALLINT', needs_params: false },
    { value: 'INTEGER', needs_params: false },
    { value: 'BIGINT', needs_params: false },
    { value: 'DECIMAL', needs_params: true, param_label: 'Precision,Scale (e.g., 10,2)', example: 'DECIMAL(10,2)' },
    { value: 'NUMERIC', needs_params: true, param_label: 'Precision,Scale (e.g., 10,2)', example: 'NUMERIC(10,2)' },
    { value: 'REAL', needs_params: false },
    { value: 'DOUBLE PRECISION', needs_params: false },
  ],
  string: [
    { value: 'VARCHAR', needs_params: true, param_label: 'Length (e.g., 255)', example: 'VARCHAR(255)' },
    { value: 'CHAR', needs_params: true, param_label: 'Length (e.g., 50)', example: 'CHAR(50)' },
    { value: 'TEXT', needs_params: false },
  ],
  datetime: [
    { value: 'DATE', needs_params: false },
    { value: 'TIME', needs_params: true, param_label: 'Fractional seconds (0-6)', example: 'TIME(6)' },
    { value: 'TIMESTAMP', needs_params: true, param_label: 'Fractional seconds (0-6)', example: 'TIMESTAMP(6)' },
    { value: 'TIMESTAMPTZ', needs_params: true, param_label: 'Fractional seconds (0-6)', example: 'TIMESTAMPTZ(6)' },
  ],
  json: [
    { value: 'JSON', needs_params: false },
    { value: 'JSONB', needs_params: false },
  ],
  extension: [],
  spatial: [],
  other: [
    { value: 'UUID', needs_params: false },
    { value: 'BOOLEAN', needs_params: false },
  ],
}

function convertType(t: {
  value: string
  needs_params?: boolean
  param_label?: string
  example?: string
}): PostgreSQLDataTypes['numeric'][number] {
  return {
    value: t.value,
    needs_params: !!t.needs_params,
    param_label: t.param_label,
    example: t.example,
  }
}

type InstalledExtension = { name: string; version?: string }

function mergeInstalledLists(
  ...lists: InstalledExtension[][]
): InstalledExtension[] {
  const map = new Map<string, InstalledExtension>()
  for (const list of lists) {
    for (const ext of list) {
      if (!ext?.name) continue
      map.set(ext.name.toLowerCase(), ext)
    }
  }
  return Array.from(map.values())
}

function typeBearingExtensions(extensions: InstalledExtension[]): InstalledExtension[] {
  return extensions.filter((e) =>
    Object.prototype.hasOwnProperty.call(EXTENSION_TYPE_CATALOG, e.name.toLowerCase()),
  )
}

async function fetchInstalledExtensions(slug: string): Promise<InstalledExtension[]> {
  try {
    const res = await api.get(`/api/v1/extensions/${slug}/installed`)
    return res.data.extensions || []
  } catch {
    return []
  }
}

export function usePostgresDataTypes(slug: string) {
  const [postgresDataTypes, setPostgresDataTypes] = useState<PostgreSQLDataTypes>({
    numeric: [], string: [], datetime: [], json: [], extension: [], spatial: [], other: [],
  })
  const [loadingDataTypes, setLoadingDataTypes] = useState(false)
  const [installedExtensions, setInstalledExtensions] = useState<InstalledExtension[]>([])

  const loadDataTypes = useCallback(async () => {
    if (!slug) return
    setLoadingDataTypes(true)

    try {
      const headers = { 'X-Project-Slug': slug }
      const [installedFromApi, dataTypesResult] = await Promise.all([
        fetchInstalledExtensions(slug),
        api
          .get('/api/v1/db/data-types', { headers })
          .then((r) => r.data)
          .catch(() => null),
      ])

      const installedFromDataTypes: InstalledExtension[] =
        dataTypesResult?.extensions_loaded || []
      const allInstalled = mergeInstalledLists(installedFromApi, installedFromDataTypes)
      const typeExtensions = typeBearingExtensions(allInstalled)
      const extensionTypes = mergeExtensionTypesForInstalled(
        (dataTypesResult?.data_types?.extension || []).map(convertType),
        typeExtensions,
      )

      if (dataTypesResult?.success) {
        setPostgresDataTypes(
          sanitizePostgresDataTypes({
            numeric: dataTypesResult.data_types.numeric.map(convertType),
            string: dataTypesResult.data_types.string.map(convertType),
            datetime: dataTypesResult.data_types.datetime.map(convertType),
            json: dataTypesResult.data_types.json.map(convertType),
            extension: extensionTypes,
            spatial: dataTypesResult.data_types.spatial.map(convertType),
            other: dataTypesResult.data_types.other.map(convertType),
          }),
        )
      } else {
        setPostgresDataTypes({ ...FALLBACK_TYPES, extension: extensionTypes })
      }

      setInstalledExtensions(typeExtensions)
    } finally {
      setLoadingDataTypes(false)
    }
  }, [slug])

  useEffect(() => {
    loadDataTypes()
  }, [loadDataTypes])

  useEffect(() => {
    const onExtensionsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ projectSlug?: string }>).detail
      if (!detail?.projectSlug || detail.projectSlug === slug) {
        loadDataTypes()
      }
    }
    window.addEventListener('wowbase:extensions-changed', onExtensionsChanged)
    return () => window.removeEventListener('wowbase:extensions-changed', onExtensionsChanged)
  }, [slug, loadDataTypes])

  return {
    postgresDataTypes,
    loadingDataTypes,
    installedExtensions,
    reloadDataTypes: loadDataTypes,
  }
}
