import { useState, useCallback } from 'react'
import api from '@/lib/api'
import type { RLSPolicy, EditingPolicy, NewPolicy } from '../types'

type ToastType = 'success' | 'error' | 'info' | 'warning'

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
  const [newPolicy, setNewPolicy] = useState<NewPolicy>({
    policy_name: '', command: 'SELECT',
    using_expression: '', with_check_expression: '', roles: []
  })

  const loadRLSData = useCallback(async (tableName: string) => {
    if (!tableName) return
    setLoadingRLS(true)
    try {
      // Batch all queries into a single request
      const escapedTableName = tableName.replace(/'/g, "''")
      const batchQueries = [
        `SELECT current_schema() as schema_name`,
        `SELECT c.relname as tablename, c.relrowsecurity as rowsecurity, n.nspname as schema
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relname = '${escapedTableName}' AND c.relkind = 'r'
         ORDER BY CASE WHEN n.nspname = 'public' THEN 0 ELSE 1 END LIMIT 1`,
        `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
         FROM pg_policies WHERE tablename = '${escapedTableName}'
         ORDER BY CASE WHEN schemaname = 'public' THEN 0 ELSE 1 END, schemaname, policyname`
      ]

      try {
        const batchResponse = await api.post('/api/v1/db/execute',
          { queries: batchQueries, schema: selectedSchema }, { headers: { 'X-Project-Slug': slug } }
        )
        
        const results = batchResponse.data.results || []
        if (results.length >= 3) {
          // Get schema
          const schemaResult = results[0]
          const currentSchema = schemaResult.data?.[0]?.schema_name || 'public'
          
          // Get RLS status
          const rlsResult = results[1]
          let rlsStatus = false
          if (rlsResult.data && rlsResult.data.length > 0) {
            const v = rlsResult.data[0]?.rowsecurity
            rlsStatus = v === true || v === 't' || v === 'true' || v === 1
          }
          setRlsEnabled(rlsStatus)
          
          // Get policies
          const policiesResult = results[2]
          const policies = (policiesResult.data || []).map((row: any) => ({
            schema: row.schemaname || '', table: row.tablename || '',
            policy_name: row.policyname || '', permissive: row.permissive || '',
            roles: row.roles || [], command: row.cmd || '',
            using_expression: row.qual || null, with_check_expression: row.with_check || null
          }))
          setRlsPolicies(policies)
          return
        }
      } catch {}

      // Fallback to API endpoint if batch fails
      try {
        const dbDetailsResponse = await api.get(`/api/v1/projects/${slug}/database-details`,
          { headers: { 'X-Project-Slug': slug } }
        )
        const dbDetails = dbDetailsResponse.data
        setRlsPolicies(dbDetails.row_level_security?.policies?.filter((p: any) => p.table === tableName) || [])
        setRlsEnabled(dbDetails.row_level_security?.enabled_tables?.some((t: any) => t.table === tableName) || false)
      } catch {}
    } finally {
      setLoadingRLS(false)
    }
  }, [slug, selectedSchema])

  const toggleRLS = async (enable: boolean, selectedTable: string) => {
    if (!selectedTable) return
    try {
      const query = enable
        ? `ALTER TABLE "${selectedTable}" ENABLE ROW LEVEL SECURITY`
        : `ALTER TABLE "${selectedTable}" DISABLE ROW LEVEL SECURITY`
      await api.post('/api/v1/db/execute', { query, schema: selectedSchema }, { headers: { 'X-Project-Slug': slug } })
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
    if (usingExpr && (usingExpr.includes('auth.uid()') || usingExpr.includes('auth.role()'))) {
      showToast('Error: auth.uid() and auth.role() are wowsql-specific. Use current_setting() instead.', 'error')
      return
    }
    if (withCheckExpr && (withCheckExpr.includes('auth.uid()') || withCheckExpr.includes('auth.role()'))) {
      showToast('Error: auth.uid() and auth.role() are wowsql-specific. Use current_setting() instead.', 'error')
      return
    }
    try {
      const existingPolicy = rlsPolicies.find(p => p.policy_name === newPolicy.policy_name.trim())
      if (existingPolicy) {
        showToast(`Policy "${newPolicy.policy_name}" already exists.`, 'warning')
        return
      }
      // Batch DROP and CREATE POLICY operations
      let createQuery = `CREATE POLICY "${newPolicy.policy_name}" ON "${selectedTable}" FOR ${newPolicy.command}`
      if (newPolicy.roles.length > 0) createQuery += ` TO ${newPolicy.roles.map((r: string) => `"${r}"`).join(', ')}`
      createQuery += usingExpr ? ` USING (${usingExpr})` : ` USING (true)`
      if ((newPolicy.command === 'INSERT' || newPolicy.command === 'UPDATE' || newPolicy.command === 'ALL') && withCheckExpr) {
        createQuery += ` WITH CHECK (${withCheckExpr})`
      }
      
      await api.post('/api/v1/db/execute', { 
        queries: [
          `DROP POLICY IF EXISTS "${newPolicy.policy_name}" ON "${selectedTable}"`,
          createQuery
        ],
        schema: selectedSchema
      }, { headers: { 'X-Project-Slug': slug } })
      await loadRLSData(selectedTable)
      setNewPolicy({ policy_name: '', command: 'SELECT', using_expression: '', with_check_expression: '', roles: [] })
      setShowRLSPanel(false)
      showToast('RLS policy created successfully', 'success')
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || err.message || 'Unknown error'
      if (errorDetail.includes('already exists') || errorDetail.includes('DuplicateObjectError')) {
        showToast(`Policy "${newPolicy.policy_name}" already exists.`, 'error')
        await loadRLSData(selectedTable)
      } else if (errorDetail.includes('schema "auth" does not exist')) {
        showToast('Error: Cannot use auth.uid() or auth.role(). Use current_setting() instead.', 'error')
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
    if (usingExpr && (usingExpr.includes('auth.uid()') || usingExpr.includes('auth.role()'))) {
      showToast('Error: auth.uid() and auth.role() are wowsql-specific. Use current_setting() instead.', 'error')
      return
    }
    if (withCheckExpr && (withCheckExpr.includes('auth.uid()') || withCheckExpr.includes('auth.role()'))) {
      showToast('Error: auth.uid() and auth.role() are wowsql-specific. Use current_setting() instead.', 'error')
      return
    }
    try {
      if (newPolicyName !== originalPolicyName) {
        const nameExists = rlsPolicies.some(p => p.policy_name === newPolicyName && p.policy_name !== originalPolicyName)
        if (nameExists) { showToast(`Policy "${newPolicyName}" already exists.`, 'warning'); return }
      }
      // Batch DROP and CREATE POLICY operations
      let createQuery = `CREATE POLICY "${newPolicyName}" ON "${selectedTable}" FOR ${editingPolicy.command}`
      if (editingPolicy.roles.length > 0) createQuery += ` TO ${editingPolicy.roles.map((r: string) => `"${r}"`).join(', ')}`
      createQuery += usingExpr ? ` USING (${usingExpr})` : ` USING (true)`
      if ((editingPolicy.command === 'INSERT' || editingPolicy.command === 'UPDATE' || editingPolicy.command === 'ALL') && withCheckExpr) {
        createQuery += ` WITH CHECK (${withCheckExpr})`
      }
      
      await api.post('/api/v1/db/execute', { 
        queries: [
          `DROP POLICY IF EXISTS "${originalPolicyName}" ON "${selectedTable}"`,
          createQuery
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
        { query: `DROP POLICY IF EXISTS "${policyName}" ON "${selectedTable}"`, schema: selectedSchema },
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
      name: 'User-based access', description: 'Allow users to access only their own rows.',
      using: `current_setting('app.current_user_id', true)::uuid = user_id`,
      with_check: `current_setting('app.current_user_id', true)::uuid = user_id`, command: 'ALL'
    })
    if (hasTenantId) suggestions.push({
      name: 'Tenant isolation', description: 'Multi-tenant data isolation using session variables',
      using: `tenant_id = current_setting('app.current_tenant_id', true)::uuid`,
      with_check: `tenant_id = current_setting('app.current_tenant_id', true)::uuid`, command: 'ALL'
    })
    if (hasOrgId) suggestions.push({
      name: 'Organization-based access', description: 'Users can access data from their organization.',
      using: `org_id IN (SELECT org_id FROM user_organizations WHERE user_id = current_setting('app.current_user_id', true)::uuid)`,
      with_check: `org_id IN (SELECT org_id FROM user_organizations WHERE user_id = current_setting('app.current_user_id', true)::uuid)`, command: 'ALL'
    })
    suggestions.push({
      name: 'Public read access', description: 'Allow anyone to read all rows',
      using: 'true', with_check: '', command: 'SELECT'
    })
    suggestions.push({
      name: 'Authenticated users only', description: 'Only allow authenticated users.',
      using: `current_setting('app.current_user_id', true) IS NOT NULL`,
      with_check: `current_setting('app.current_user_id', true) IS NOT NULL`, command: 'ALL'
    })
    if (hasCreatedBy || hasUserId) {
      const ownerColumn = hasCreatedBy ? 'created_by' : 'user_id'
      suggestions.push({
        name: 'Owner-based access', description: `Users can only access rows they own (based on ${ownerColumn})`,
        using: `${ownerColumn} = current_setting('app.current_user_id', true)::uuid`,
        with_check: `${ownerColumn} = current_setting('app.current_user_id', true)::uuid`, command: 'ALL'
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
