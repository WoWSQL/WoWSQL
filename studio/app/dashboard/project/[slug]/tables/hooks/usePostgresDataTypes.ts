import { useState, useEffect } from 'react'
import api from '@/lib/api'
import type { PostgreSQLDataTypes } from '../types'

export function usePostgresDataTypes(slug: string) {
  const [postgresDataTypes, setPostgresDataTypes] = useState<PostgreSQLDataTypes>({
    numeric: [], string: [], datetime: [], json: [], extension: [], spatial: [], other: []
  })
  const [loadingDataTypes, setLoadingDataTypes] = useState(false)

  useEffect(() => {
    const loadDataTypes = async () => {
      setLoadingDataTypes(true)
      try {
        const response = await api.get('/api/v1/db/data-types', {
          headers: { 'X-Project-Slug': slug }
        })
        if (response.data.success) {
          const convertType = (t: any) => ({
            value: t.value, needsParams: t.needs_params,
            paramLabel: t.param_label, example: t.example
          })
          setPostgresDataTypes({
            numeric: response.data.data_types.numeric.map(convertType),
            string: response.data.data_types.string.map(convertType),
            datetime: response.data.data_types.datetime.map(convertType),
            json: response.data.data_types.json.map(convertType),
            extension: (response.data.data_types.extension || []).map(convertType),
            spatial: response.data.data_types.spatial.map(convertType),
            other: response.data.data_types.other.map(convertType)
          })
        }
      } catch {
        setPostgresDataTypes({
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
          ]
        })
      } finally {
        setLoadingDataTypes(false)
      }
    }
    if (slug) loadDataTypes()
  }, [slug])

  return { postgresDataTypes, loadingDataTypes }
}
