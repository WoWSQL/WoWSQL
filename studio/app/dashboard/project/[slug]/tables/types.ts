export interface TableInfo {
  name: string
  row_count?: number
}

export interface SchemaInfo {
  name: string
  table_count: number
}

export interface Project {
  name: string
  slug: string
}

export interface Column {
  name: string
  type: string
  typeParams?: string
  nullable?: string
  key?: string
}

export type PostgreSQLDataType = {
  value: string
  needs_params: boolean
  param_label?: string
  example?: string
}

export interface PostgreSQLDataTypes {
  numeric: PostgreSQLDataType[]
  string: PostgreSQLDataType[]
  datetime: PostgreSQLDataType[]
  json: PostgreSQLDataType[]
  extension: PostgreSQLDataType[]
  spatial: PostgreSQLDataType[]
  other: PostgreSQLDataType[]
}

export interface RLSPolicy {
  schema: string
  table: string
  policy_name: string
  permissive: string
  roles: any[]
  command: string
  using_expression: string | null
  with_check_expression: string | null
}

export interface EditingPolicy {
  policy_name: string
  original_policy_name?: string
  command: string
  using_expression: string
  with_check_expression: string
  roles: string[]
}

export interface NewPolicy {
  policy_name: string
  command: string
  using_expression: string
  with_check_expression: string
  roles: string[]
}

export interface ConfirmationModalState {
  isOpen: boolean
  title?: string
  message: string
  onConfirm: () => void
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  showCascade?: boolean
  cascade?: boolean
  onCascadeChange?: (cascade: boolean) => void
}

export interface FilterItem {
  column: string
  operator: string
  value: string
}
