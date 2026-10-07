import { useState, useCallback } from 'react'
import api from '@/lib/api'
import type { RLSPolicy, EditingPolicy, NewPolicy } from '../types'

type ToastType = 'success' | 'error' | 'info' | 'warning'

const GRANTABLE_ROLES = ['authenticated', 'anon', 'service_role'] as const
const DEFAULT_POLICY_ROLES = ['authenticated']

function quoteIdent(name: string): string {
  return `"${String(name).replace(/"/g, '""')}"`
}

function normalizeRoles(roles: unknown): string[] {
  if (Array.isArray(roles)) return roles.map(String).map((r) => r.trim()).filter(Boolean)
  if (typeof roles === 'string') {
    return roles.replace(/[{}]/g, '').split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function grantableRoles(roles: string[]): string[] {
  return roles
    .map((r) => r.trim().toLowerCase())
    .filter((r) => (GRANTABLE_ROLES as readonly string[]).includes(r))
}

function privilegesForCommand(command: string): string {
  switch (command.toUpperCase()) {
    case 'SELECT': return 'SELECT'
    case 'INSERT': return 'INSERT'
    case 'UPDATE': return 'UPDATE'
    case 'DELETE': return 'DELETE'
    default: return 'SELECT, INSERT, UPDATE, DELETE'
  }
}

/** GRANT only this table, only grantable roles — never PUBLIC, never ALL TABLES. */
function tableGrantSql(schema: string, table: string, command: string, roles: string[]): string | null {
  const targets = grantableRoles(roles)
  if (!targets.length) return null
  const qualified = `${quoteIdent(schema)}.${quoteIdent(table)}`
  return `GRANT ${privilegesForCommand(command)} ON TABLE ${qualified} TO ${targets.map(quoteIdent).join(', ')}`
}

function emptyPolicy(): NewPolicy {
  return {
    policy_name: '',
    command: 'SELECT',
    using_expression: '',
    with_check_expression: '',
    roles: [...DEFAULT_POLICY_ROLES],
  }
}

function executeResults(payload: any): any[] {
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload)) return payload
  return []
}

export function useRLS(
  slug: string,
  showToast: (msg: string, type?: ToastType) => void,
  selectedSchema: string = 'public'
) {
  const [rlsEnabled, setRlsEnabled] = useState(false)
  const [rlsPolicies, setRlsPolicies] = useState<RLSPolicy[]>([])
  const [loadingRLS, setLoadingRLS] = useState(false)
  const [showRLSModal, setShowRLSModal] = useState(false)
  const [showRLSPanel, setShowRLSPanel] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<EditingPolicy | null>(null)
  const [newPolicy, setNewPolicy] = useState<NewPolicy>(emptyPolicy)

  const loadRLSData = useCallback(async (tableName: string) => {
    if (!tableName) return
    setLoadingRLS(true)
    try {
      const escapedTableName = tableName.replace(/'/g, "''")
      const escapedSchema = selectedSchema.replace(/'/g, "''")
      const batchQueries = [
        `SELECT current_schema() as schema_name`,
        `SELECT c.relname as tablename, c.relrowsecurity as rowsecurity,
                c.relforcerowsecurity as forcerowsecurity, n.nspname as schema
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relname = '${escapedTableName}' AND c.relkind = 'r'
           AND n.nspname = '${escapedSchema}'
         LIMIT 1`,
        `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
         FROM pg_policies
         WHERE tablename = '${escapedTableName}' AND schemaname = '${escapedSchema}'
         ORDER BY policyname`
      ]

      try {
        const batchResponse = await api.post('/api/v1/db/execute',
          { queries: batchQueries, schema: selectedSchema }, { headers: { 'X-Project-Slug': slug } }
        )

        const results = executeResults(batchResponse.data)
        if (results.length >= 3) {
          const rlsResult = results[1]
          let rlsStatus = false
          if (rlsResult.data && rlsResult.data.length > 0) {
            const v = rlsResult.data[0]?.rowsecurity
            rlsStatus = v === true || v === 't' || v === 'true' || v === 1
          }
          setRlsEnabled(rlsStatus)

          const policiesResult = results[2]
          const policies = (policiesResult.data || []).map((row: any) => ({
            schema: row.schemaname || '', table: row.tablename || '',
            policy_name: row.policyname || '', permissive: row.permissive || '',
            roles: normalizeRoles(row.roles), command: row.cmd || '',
            using_expression: row.qual || null, with_check_expression: row.with_check || null
          }))
          setRlsPolicies(policies)
          return
        }
      } catch {}
    } finally {
      setLoadingRLS(false)
    }
  }, [slug, selectedSchema])

  const toggleRLS = async (enable: boolean, selectedTable: string) => {
    if (!selectedTable) return
    const qualified = `${quoteIdent(selectedSchema)}.${quoteIdent(selectedTable)}`
    try {
      const queries = enable
        ? [`ALTER TABLE ${qualified} ENABLE ROW LEVEL SECURITY`]
        : [
            `ALTER TABLE ${qualified} NO FORCE ROW LEVEL SECURITY`,
            `ALTER TABLE ${qualified} DISABLE ROW LEVEL SECURITY`,
          ]
      await api.post('/api/v1/db/execute', { queries, schema: selectedSchema }, { headers: { 'X-Project-Slug': slug } })
      setRlsEnabled(enable)
      showToast(`RLS ${enable ? 'enabled' : 'disabled'} successfully`, 'success')
      await new Promise(resolve => setTimeout(resolve, 500))
      loadRLSData(selectedTable).catch(() => {})
    } catch (err: any) {
      showToast(`Error ${enable ? 'enabling' : 'disabling'} RLS: ${err.response?.data?.detail || err.message}`, 'error')
      await loadRLSData(selectedTable)
    }
  }

  const createRLSPolicy = async (selectedTable: string) => {
    if (!selectedTable || !newPolicy.policy_name.trim()) {
      showToast('Please provide a policy name', 'warning')
      return
    }
    const usingExpr = newPolicy.using_expression.trim()
    const withCheckExpr = newPolicy.with_check_expression.trim()
    try {
      const existingPolicy = rlsPolicies.find(p => p.policy_name === newPolicy.policy_name.trim())
      if (existingPolicy) {
        showToast(`Policy "${newPolicy.policy_name}" already exists.`, 'warning')
        return
      }
      const roles = grantableRoles(newPolicy.roles).length
        ? grantableRoles(newPolicy.roles)
        : [...DEFAULT_POLICY_ROLES]
      let createQuery = `CREATE POLICY ${quoteIdent(newPolicy.policy_name)} ON ${quoteIdent(selectedSchema)}.${quoteIdent(selectedTable)} FOR ${newPolicy.command}`
      createQuery += ` TO ${roles.map(quoteIdent).join(', ')}`
      createQuery += usingExpr ? ` USING (${usingExpr})` : ` USING (true)`
      if ((newPolicy.command === 'INSERT' || newPolicy.command === 'UPDATE' || newPolicy.command === 'ALL') && withCheckExpr) {
        createQuery += ` WITH CHECK (${withCheckExpr})`
      }
      const grantSql = tableGrantSql(selectedSchema, selectedTable, newPolicy.command, roles)

      await api.post('/api/v1/db/execute', {
        queries: [
          `DROP POLICY IF EXISTS ${quoteIdent(newPolicy.policy_name)} ON ${quoteIdent(selectedSchema)}.${quoteIdent(selectedTable)}`,
          createQuery,
          ...(grantSql ? [grantSql] : []),
        ],
        schema: selectedSchema
      }, { headers: { 'X-Project-Slug': slug } })
      await loadRLSData(selectedTable)
      setNewPolicy(emptyPolicy())
      setShowRLSPanel(false)
      showToast('RLS policy created successfully', 'success')
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || err.message || 'Unknown error'
      if (errorDetail.includes('already exists') || errorDetail.includes('DuplicateObjectError')) {
        showToast(`Policy "${newPolicy.policy_name}" already exists.`, 'error')
        await loadRLSData(selectedTable)
      } else {
        showToast(`Error creating policy: ${errorDetail}`, 'error')
      }
    }
  }

  const updateRLSPolicy = async (selectedTable: string) => {
    if (!selectedTable || !editingPolicy) return
    const originalPolicyName = editingPolicy.original_policy_name || editingPolicy.policy_name
    const newPolicyName = editingPolicy.policy_name.trim()
    const usingExpr = editingPolicy.using_expression.trim()
    const withCheckExpr = editingPolicy.with_check_expression.trim()
    try {
      if (newPolicyName !== originalPolicyName) {
        const nameExists = rlsPolicies.some(p => p.policy_name === newPolicyName && p.policy_name !== originalPolicyName)
        if (nameExists) { showToast(`Policy "${newPolicyName}" already exists.`, 'warning'); return }
      }
      const roles = grantableRoles(editingPolicy.roles).length
        ? grantableRoles(editingPolicy.roles)
        : [...DEFAULT_POLICY_ROLES]
      let createQuery = `CREATE POLICY ${quoteIdent(newPolicyName)} ON ${quoteIdent(selectedSchema)}.${quoteIdent(selectedTable)} FOR ${editingPolicy.command}`
      createQuery += ` TO ${roles.map(quoteIdent).join(', ')}`
      createQuery += usingExpr ? ` USING (${usingExpr})` : ` USING (true)`
      if ((editingPolicy.command === 'INSERT' || editingPolicy.command === 'UPDATE' || editingPolicy.command === 'ALL') && withCheckExpr) {
        createQuery += ` WITH CHECK (${withCheckExpr})`
      }
      const grantSql = tableGrantSql(selectedSchema, selectedTable, editingPolicy.command, roles)

      await api.post('/api/v1/db/execute', {
        queries: [
          `DROP POLICY IF EXISTS ${quoteIdent(originalPolicyName)} ON ${quoteIdent(selectedSchema)}.${quoteIdent(selectedTable)}`,
          createQuery,
          ...(grantSql ? [grantSql] : []),
        ],
        schema: selectedSchema
      }, { headers: { 'X-Project-Slug': slug } })
      await loadRLSData(selectedTable)
      setEditingPolicy(null)
      setShowRLSPanel(false)
      showToast('RLS policy updated successfully', 'success')
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || err.message || 'Unknown error'
      if (errorDetail.includes('already exists')) {
        showToast(`Policy "${editingPolicy.policy_name}" already exists.`, 'error')
      } else {
        showToast(`Error updating policy: ${errorDetail}`, 'error')
      }
    }
  }

  const deleteRLSPolicy = async (policyName: string, selectedTable: string) => {
    if (!selectedTable) return
    try {
      await api.post('/api/v1/db/execute',
        { query: `DROP POLICY IF EXISTS ${quoteIdent(policyName)} ON ${quoteIdent(selectedSchema)}.${quoteIdent(selectedTable)}`, schema: selectedSchema },
        { headers: { 'X-Project-Slug': slug } }
      )
      await loadRLSData(selectedTable)
      showToast('RLS policy deleted successfully', 'success')
    } catch (err: any) {
      showToast(`Error deleting policy: ${err.response?.data?.detail || err.message}`, 'error')
    }
  }

  const getRLSSuggestions = (tableData: any) => {
    if (!tableData?.columns) return []
    const columns = tableData.columns
    const suggestions: any[] = []
    const hasUserId = columns.some((c: any) => c.name.toLowerCase().includes('user_id'))
    const hasTenantId = columns.some((c: any) => c.name.toLowerCase().includes('tenant_id'))
    const hasCreatedBy = columns.some((c: any) => c.name.toLowerCase().includes('created_by'))
    const hasOrgId = columns.some((c: any) => c.name.toLowerCase().includes('org_id') || c.name.toLowerCase().includes('organization_id'))

    if (hasUserId) suggestions.push({
      name: 'User-based access', description: 'Allow users to access only their own rows via auth.uid().',
      using: `user_id = auth.uid()`,
      with_check: `user_id = auth.uid()`, command: 'ALL'
    })
    if (hasTenantId) suggestions.push({
      name: 'Tenant isolation', description: 'Multi-tenant isolation using a session variable.',
      using: `tenant_id = current_setting('app.current_tenant_id', true)::uuid`,
      with_check: `tenant_id = current_setting('app.current_tenant_id', true)::uuid`, command: 'ALL'
    })
    if (hasOrgId) suggestions.push({
      name: 'Organization-based access', description: 'Users can access data from their organization.',
      using: `org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())`,
      with_check: `org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())`, command: 'ALL'
    })
    suggestions.push({
      name: 'Public read access', description: 'Allow anyone to read all rows',
      using: 'true', with_check: '', command: 'SELECT'
    })
    suggestions.push({
      name: 'Authenticated users only', description: 'Only allow the authenticated role.',
      using: `auth.role() = 'authenticated'`,
      with_check: `auth.role() = 'authenticated'`, command: 'ALL'
    })
    if (hasCreatedBy || hasUserId) {
      const ownerColumn = hasCreatedBy ? 'created_by' : 'user_id'
      suggestions.push({
        name: 'Owner-based access', description: `Users can only access rows they own (based on ${ownerColumn})`,
        using: `${ownerColumn} = auth.uid()`,
        with_check: `${ownerColumn} = auth.uid()`, command: 'ALL'
      })
    }
    return suggestions
  }

  return {
    rlsEnabled, setRlsEnabled, rlsPolicies, loadingRLS,
    showRLSModal, setShowRLSModal, showRLSPanel, setShowRLSPanel,
    editingPolicy, setEditingPolicy, newPolicy, setNewPolicy,
    loadRLSData, toggleRLS, createRLSPolicy, updateRLSPolicy, deleteRLSPolicy, getRLSSuggestions,
  }
}
