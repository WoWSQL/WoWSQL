import { Plus, X, Edit2, Trash2, RefreshCw, Shield, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/Button'
import type { RLSPolicy, EditingPolicy, NewPolicy } from '../types'

interface RLSModalProps {
  selectedTable: string
  rlsEnabled: boolean
  rlsPolicies: RLSPolicy[]
  loadingRLS: boolean
  showRLSPanel: boolean
  setShowRLSPanel: (v: boolean) => void
  editingPolicy: EditingPolicy | null
  setEditingPolicy: (v: EditingPolicy | null) => void
  newPolicy: NewPolicy
  setNewPolicy: (v: NewPolicy) => void
  tableData: any
  onClose: () => void
  onToggleRLS: (enable: boolean) => void
  onCreatePolicy: () => void
  onUpdatePolicy: () => void
  onDeletePolicy: (name: string) => void
  getRLSSuggestions: () => any[]
}

export function RLSModal(props: RLSModalProps) {
  const {
    selectedTable, rlsEnabled, rlsPolicies, loadingRLS,
    showRLSPanel, setShowRLSPanel, editingPolicy, setEditingPolicy,
    newPolicy, setNewPolicy, onClose, onToggleRLS,
    onCreatePolicy, onUpdatePolicy, onDeletePolicy, getRLSSuggestions,
  } = props

  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-stretch justify-end">
      <div className="glass-card shadow-2xl w-full sm:w-[950px] overflow-y-auto custom-scrollbar flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg"><Shield className="w-5 h-5 text-purple-400" /></div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Row Level Security (RLS)</h2>
              <p className="text-sm text-zinc-600 dark:text-white/60">{selectedTable}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-white/70 mb-2">Row Level Security Status</label>
            <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {rlsEnabled
                      ? <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">Enabled</span>
                      : <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-medium rounded">Disabled</span>}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-white/60">
                    {rlsEnabled ? 'RLS is active. Users can only access rows allowed by policies.' : 'RLS is disabled. All users can access all rows. Enable RLS to restrict access.'}
                  </p>
                </div>
                <Button onClick={() => onToggleRLS(!rlsEnabled)}
                  className={rlsEnabled ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'}>
                  {rlsEnabled ? 'Disable RLS' : 'Enable RLS'}
                </Button>
              </div>
            </div>
          </div>

          {rlsEnabled && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-600 dark:text-white/70">Current Policies ({rlsPolicies.length})</label>
                <Button onClick={() => { setEditingPolicy(null); setNewPolicy({ policy_name: '', command: 'SELECT', using_expression: '', with_check_expression: '', roles: [] }); setShowRLSPanel(true) }}
                  size="sm" className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm gap-2"><Plus className="w-4 h-4" /> New Policy</Button>
              </div>
              <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md p-4">
                {loadingRLS ? (
                  <div className="text-center py-8 text-zinc-600 dark:text-white/60"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /><p className="text-sm">Loading policies...</p></div>
                ) : rlsPolicies.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-white/20 rounded-lg">
                    <ShieldAlert className="w-8 h-8 text-orange-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-zinc-600 dark:text-white/60 mb-1">No policies configured</p>
                    <p className="text-xs text-zinc-600 dark:text-white/40">Without policies, RLS will block all access to this table.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rlsPolicies.map((policy, idx) => (
                      <div key={idx} className="bg-white/80 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-lg p-4 hover:border-zinc-200 dark:border-white/10 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{policy.policy_name}</h4>
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">{policy.command}</span>
                              {policy.permissive && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">{policy.permissive}</span>}
                            </div>
                            {policy.roles && policy.roles.length > 0 && <p className="text-xs text-zinc-600 dark:text-white/60 mb-2">Roles: {Array.isArray(policy.roles) ? policy.roles.join(', ') : policy.roles}</p>}
                            {policy.using_expression && <div className="mb-2"><p className="text-xs text-zinc-600 dark:text-white/50 mb-1">USING:</p><code className="text-xs bg-white/80 dark:bg-black/50 px-2 py-1 rounded text-purple-300 font-mono block">{policy.using_expression}</code></div>}
                            {policy.with_check_expression && <div><p className="text-xs text-zinc-600 dark:text-white/50 mb-1">WITH CHECK:</p><code className="text-xs bg-white/80 dark:bg-black/50 px-2 py-1 rounded text-blue-300 font-mono block">{policy.with_check_expression}</code></div>}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button onClick={() => { setEditingPolicy({ policy_name: policy.policy_name, original_policy_name: policy.policy_name, command: policy.command, using_expression: policy.using_expression || '', with_check_expression: policy.with_check_expression || '', roles: Array.isArray(policy.roles) ? policy.roles : [] }); setShowRLSPanel(true) }}
                              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10 rounded-lg transition-colors" title="Edit policy"><Edit2 className="w-4 h-4 text-blue-400" /></button>
                            <button onClick={() => onDeletePolicy(policy.policy_name)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete policy"><Trash2 className="w-4 h-4 text-red-400" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {rlsEnabled && (
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-white/70 mb-2">Policy Suggestions</label>
              <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md p-4">
                <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" /><h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Suggested Policies</h3></div>
                <p className="text-xs text-zinc-600 dark:text-white/60 mb-4">Based on your table structure, here are some suggested policies:</p>
                <div className="mb-4 bg-blue-500/10 border border-zinc-200 dark:border-white/10 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-blue-400 text-xs font-bold">i</span></div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-300 mb-1">Using Session Variables</p>
                      <p className="text-xs text-zinc-600 dark:text-white/60">These suggestions use PostgreSQL session variables (e.g., <code className="text-blue-300 font-mono">current_setting('app.current_user_id')</code>). Set these before queries using: <code className="text-blue-300 font-mono">SET app.current_user_id = 'user-uuid'</code></p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {getRLSSuggestions().map((suggestion, idx) => (
                    <div key={idx} className="bg-white/80 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-lg p-4 hover:border-amber-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">{suggestion.name}</h4>
                          <p className="text-xs text-zinc-600 dark:text-white/60 mb-3">{suggestion.description}</p>
                          <div className="space-y-2">
                            <div><p className="text-xs text-zinc-600 dark:text-white/50 mb-1">USING:</p><code className="text-xs bg-white/80 dark:bg-black/50 px-2 py-1 rounded text-purple-300 font-mono block">{suggestion.using}</code></div>
                            {suggestion.with_check && <div><p className="text-xs text-zinc-600 dark:text-white/50 mb-1">WITH CHECK:</p><code className="text-xs bg-white/80 dark:bg-black/50 px-2 py-1 rounded text-blue-300 font-mono block">{suggestion.with_check}</code></div>}
                          </div>
                        </div>
                        <button onClick={() => { setNewPolicy({ policy_name: `${suggestion.name.toLowerCase().replace(/\s+/g, '_')}_policy`, command: suggestion.command, using_expression: suggestion.using, with_check_expression: suggestion.with_check, roles: [] }); setShowRLSPanel(true) }}
                          className="ml-4 px-3 py-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 rounded-lg text-xs font-medium transition-colors">Use This</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showRLSPanel && <PolicyEditorPanel editingPolicy={editingPolicy} setEditingPolicy={setEditingPolicy} newPolicy={newPolicy} setNewPolicy={setNewPolicy}
            onClose={() => { setShowRLSPanel(false); setEditingPolicy(null) }} onCreate={onCreatePolicy} onUpdate={onUpdatePolicy} />}
        </div>
      </div>
    </div>
  )
}

function PolicyEditorPanel({ editingPolicy, setEditingPolicy, newPolicy, setNewPolicy, onClose, onCreate, onUpdate }: {
  editingPolicy: EditingPolicy | null; setEditingPolicy: (v: EditingPolicy | null) => void
  newPolicy: NewPolicy; setNewPolicy: (v: NewPolicy) => void
  onClose: () => void; onCreate: () => void; onUpdate: () => void
}) {
  const usingExpr = editingPolicy?.using_expression || newPolicy.using_expression
  const withCheckExpr = editingPolicy?.with_check_expression || newPolicy.with_check_expression
  const command = editingPolicy?.command || newPolicy.command
  const hasAuthWarning = (expr: string) => expr.includes('auth.uid()') || expr.includes('auth.role()')

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-zinc-600 dark:text-white/70">{editingPolicy ? 'Edit Policy' : 'Create New Policy'}</label>
        <button onClick={onClose} className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-md p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-white/70 mb-2">Policy Name <span className="text-red-400">*</span></label>
            <input type="text" value={editingPolicy?.policy_name || newPolicy.policy_name}
              onChange={(e) => editingPolicy ? setEditingPolicy({ ...editingPolicy, policy_name: e.target.value }) : setNewPolicy({ ...newPolicy, policy_name: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10" placeholder="e.g., user_access_policy" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-white/70 mb-2">Command <span className="text-red-400">*</span></label>
            <select value={command} onChange={(e) => editingPolicy ? setEditingPolicy({ ...editingPolicy, command: e.target.value }) : setNewPolicy({ ...newPolicy, command: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-zinc-200 dark:border-white/10">
              <option value="SELECT">SELECT</option><option value="INSERT">INSERT</option><option value="UPDATE">UPDATE</option><option value="DELETE">DELETE</option><option value="ALL">ALL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-white/70 mb-2">USING Expression <span className="text-red-400">*</span></label>
            <textarea value={usingExpr} onChange={(e) => editingPolicy ? setEditingPolicy({ ...editingPolicy, using_expression: e.target.value }) : setNewPolicy({ ...newPolicy, using_expression: e.target.value })}
              className={`w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border rounded-md text-zinc-900 dark:text-white text-sm placeholder:text-zinc-500 dark:text-white/40 focus:outline-none font-mono ${hasAuthWarning(usingExpr) ? 'border-red-500/50' : 'border-zinc-200 dark:border-white/20 focus:border-zinc-200 dark:border-white/10'}`}
              placeholder="e.g., current_setting('app.current_user_id', true)::uuid = user_id" rows={3} />
            {hasAuthWarning(usingExpr) && <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2"><p className="text-xs text-red-400">auth.uid() and auth.role() are wowsql-specific. Use current_setting() instead.</p></div>}
            <p className="text-xs text-zinc-600 dark:text-white/50 mt-1">Expression that determines which rows can be accessed.</p>
          </div>
          {(command === 'INSERT' || command === 'UPDATE' || command === 'ALL') && (
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-white/70 mb-2">WITH CHECK Expression <span className="text-zinc-600 dark:text-white/40 text-xs">(Optional)</span></label>
              <textarea value={withCheckExpr} onChange={(e) => editingPolicy ? setEditingPolicy({ ...editingPolicy, with_check_expression: e.target.value }) : setNewPolicy({ ...newPolicy, with_check_expression: e.target.value })}
                className={`w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border rounded-md text-zinc-900 dark:text-white text-sm placeholder:text-zinc-500 dark:text-white/40 focus:outline-none font-mono ${hasAuthWarning(withCheckExpr) ? 'border-red-500/50' : 'border-zinc-200 dark:border-white/20 focus:border-zinc-200 dark:border-white/10'}`}
                placeholder="e.g., current_setting('app.current_user_id', true)::uuid = user_id" rows={3} />
              {hasAuthWarning(withCheckExpr) && <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2"><p className="text-xs text-red-400">auth.uid() and auth.role() are wowsql-specific. Use current_setting() instead.</p></div>}
              <p className="text-xs text-zinc-600 dark:text-white/50 mt-1">Expression that validates rows being inserted or updated.</p>
            </div>
          )}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={editingPolicy ? onUpdate : onCreate} className="flex-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white shadow-sm">{editingPolicy ? 'Update Policy' : 'Create Policy'}</Button>
            <Button onClick={onClose} variant="outline" className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10">Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
