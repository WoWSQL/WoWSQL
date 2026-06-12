import { Plus, X, Trash2, Edit2, Lock } from 'lucide-react'
import { Button } from '@/components/Button'
import type { Column, PostgreSQLDataTypes } from '../types'
import { typeNeedsParams, getParamLabel, getTypeExample } from '../utils/postgresTypes'

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2.5rem'
}

function DataTypeSelect({ value, onChange, disabled, postgresDataTypes }: { value: string; onChange: (v: string) => void; disabled?: boolean; postgresDataTypes: PostgreSQLDataTypes }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      className={`w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-zinc-200 dark:border-white/10 appearance-none cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      style={selectStyle}>
      <optgroup label="Numeric Types">{postgresDataTypes.numeric.map(type => <option key={type.value} value={type.value}>{type.value}</option>)}</optgroup>
      <optgroup label="String Types">{postgresDataTypes.string.map(type => <option key={type.value} value={type.value}>{type.value}</option>)}</optgroup>
      <optgroup label="Date/Time Types">{postgresDataTypes.datetime.map(type => <option key={type.value} value={type.value}>{type.value}</option>)}</optgroup>
      <optgroup label="JSON">{postgresDataTypes.json.map(type => <option key={type.value} value={type.value}>{type.value}</option>)}</optgroup>
      {(postgresDataTypes.extension || []).length > 0 && <optgroup label="Extension Types">{postgresDataTypes.extension.map(type => <option key={type.value} value={type.value}>{type.value}</option>)}</optgroup>}
      {postgresDataTypes.spatial.length > 0 && <optgroup label="Spatial Types">{postgresDataTypes.spatial.map(type => <option key={type.value} value={type.value}>{type.value}</option>)}</optgroup>}
      {postgresDataTypes.other.length > 0 && <optgroup label="Other Types">{postgresDataTypes.other.map(type => <option key={type.value} value={type.value}>{type.value}</option>)}</optgroup>}
    </select>
  )
}

// ============ CREATE TABLE MODAL ============
interface CreateTableModalProps {
  newTableName: string; setNewTableName: (v: string) => void
  newTableDescription: string; setNewTableDescription: (v: string) => void
  enableRLS: boolean; setEnableRLS: (v: boolean) => void
  newTableColumns: Column[]; creatingTable: boolean
  postgresDataTypes: PostgreSQLDataTypes
  onClose: () => void; onCreate: () => void
  onAddColumn: () => void; onRemoveColumn: (idx: number) => void
  onUpdateColumn: (idx: number, field: keyof Column, value: string) => void
}

export function CreateTableModal(props: CreateTableModalProps) {
  const { newTableName, setNewTableName, newTableDescription, setNewTableDescription, enableRLS, setEnableRLS, newTableColumns, creatingTable, postgresDataTypes, onClose, onCreate, onAddColumn, onRemoveColumn, onUpdateColumn } = props
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-stretch justify-end">
      <div className="glass-card shadow-2xl w-full sm:w-[950px] overflow-y-auto custom-scrollbar flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Create New Table</h2>
          <button onClick={onClose} className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-white/70 mb-2">Table Name <span className="text-red-400">*</span></label>
            <input type="text" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10" placeholder="users" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-white/70 mb-2">Description <span className="text-zinc-600 dark:text-white/40 text-xs">(Optional)</span></label>
            <input type="text" value={newTableDescription} onChange={(e) => setNewTableDescription(e.target.value)} className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10" placeholder="Table to store user information" />
          </div>
          <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input type="checkbox" id="enableRLS" checked={enableRLS} onChange={(e) => setEnableRLS(e.target.checked)} className="mt-1 w-4 h-4 rounded border-zinc-200 dark:border-white/20 bg-zinc-100 dark:bg-white/5 text-purple-600 focus:ring-purple-500 focus:ring-offset-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <label htmlFor="enableRLS" className="text-sm font-medium text-zinc-900 dark:text-white cursor-pointer">Enable Row Level Security (RLS)</label>
                  <span className="text-xs font-semibold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">RECOMMENDED</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-white/60 mt-1">Restrict access to your table by enabling RLS and writing PostgreSQL policies.</p>
                {enableRLS && (
                  <div className="mt-3 bg-blue-500/10 border border-zinc-200 dark:border-white/10 rounded-md p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-blue-400 text-xs font-bold">!</span></div>
                      <div>
                        <p className="text-xs font-medium text-blue-300">Policies are required to query data</p>
                        <p className="text-xs text-zinc-600 dark:text-white/60 mt-1">You need to create an access policy before you can query data from this table. Without a policy, querying this table will return an <span className="text-orange-400 font-mono">empty array</span> of results.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-white/70 mb-2">Columns</label>
            <div className="space-y-3">
              {newTableColumns.map((col, idx) => {
                const isDefault = idx < 2
                return (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-start lg:items-center bg-zinc-100 dark:bg-white/5 rounded-lg p-3 border border-zinc-200 dark:border-white/10">
                    <div className="sm:col-span-2 lg:col-span-1">
                      <input type="text" value={col.name} onChange={(e) => onUpdateColumn(idx, 'name', e.target.value)} disabled={isDefault}
                        className={`w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border rounded-md text-zinc-900 dark:text-white text-sm placeholder:text-zinc-500 dark:text-white/40 focus:outline-none ${isDefault ? 'opacity-60 cursor-not-allowed' : col.name.trim() === '' ? 'border-red-500/50' : 'border-zinc-200 dark:border-white/20 focus:border-zinc-200 dark:border-white/10'}`} placeholder="Column name (required)" />
                      {isDefault && <p className="text-xs text-zinc-600 dark:text-white/40 mt-1">Default column (required)</p>}
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1"><DataTypeSelect value={col.type} onChange={(v) => onUpdateColumn(idx, 'type', v)} disabled={isDefault} postgresDataTypes={postgresDataTypes} /></div>
                    {typeNeedsParams(col.type, postgresDataTypes) && (
                      <div className="sm:col-span-2 lg:col-span-1">
                        <input type="text" value={col.typeParams || ''} onChange={(e) => onUpdateColumn(idx, 'typeParams', e.target.value)} placeholder={getParamLabel(col.type, postgresDataTypes)}
                          className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10" title={`Example: ${getTypeExample(col.type, postgresDataTypes)}`} />
                      </div>
                    )}
                    <div className="sm:col-span-1 lg:col-span-1">
                      <select value={col.nullable || 'YES'} onChange={(e) => onUpdateColumn(idx, 'nullable', e.target.value)} disabled={isDefault}
                        className={`w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-zinc-200 dark:border-white/10 appearance-none cursor-pointer ${isDefault ? 'opacity-60 cursor-not-allowed' : ''}`} style={selectStyle}>
                        <option value="YES">Nullable</option>
                        <option value="NO">Not Null</option>
                      </select>
                    </div>
                    <div className="sm:col-span-1 lg:col-span-1">
                      <select value={col.key || ''} onChange={(e) => onUpdateColumn(idx, 'key', e.target.value)} disabled={isDefault}
                        className={`w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-zinc-200 dark:border-white/10 appearance-none cursor-pointer ${isDefault ? 'opacity-60 cursor-not-allowed' : ''}`} style={selectStyle}>
                        <option value="">No Key</option>
                        <option value="PRI">Primary</option>
                      </select>
                    </div>
                    <div className="sm:col-span-1 lg:col-span-1 flex justify-start">
                      {isDefault ? <div className="p-2 text-zinc-600 dark:text-white/30 flex items-center justify-center flex-shrink-0"><Lock className="w-4 h-4" /></div>
                        : <button onClick={() => onRemoveColumn(idx)} className="p-2 text-red-400 hover:text-red-300 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={newTableColumns.length === 2}><X className="w-4 h-4" /></button>}
                    </div>
                  </div>
                )
              })}
            </div>
            <Button onClick={onAddColumn} variant="outline" size="sm" className="mt-2 border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10"><Plus className="w-4 h-4 mr-2" /> Add Column</Button>
          </div>
        </div>
        <div className="p-4 sm:p-6 border-t border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10 w-full sm:w-auto" disabled={creatingTable}>Cancel</Button>
          <Button onClick={onCreate} disabled={creatingTable || newTableColumns.length < 3 || !newTableName.trim()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
            {creatingTable ? 'Creating...' : 'Create Table'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============ INSERT RECORD MODAL ============
interface InsertRecordModalProps {
  selectedTable: string; tableData: any; insertData: Record<string, any>
  setInsertData: (v: Record<string, any>) => void; insertingRecord: boolean
  onClose: () => void; onInsert: () => void
}

export function InsertRecordModal({ selectedTable, tableData, insertData, setInsertData, insertingRecord, onClose, onInsert }: InsertRecordModalProps) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-stretch justify-end">
      <div className="glass-card shadow-2xl w-full sm:w-[950px] overflow-y-auto custom-scrollbar flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Insert into {selectedTable}</h2>
          <button onClick={onClose} className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {tableData?.columns.map((col: any) => {
            const defaultVal = (col.default || col.extra || '').toLowerCase()
            const colName = col.name?.toLowerCase() || ''
            const colType = col.type?.toLowerCase() || ''
            const isNullable = col.null === 'YES' || col.null === true

            // Skip auto-increment primary keys
            if (col.key === 'PRI' && col.extra?.includes('auto_increment')) return null
            // Skip UUID primary key columns (auto-generated by gen_random_uuid())
            if (col.key === 'PRI' && colType.includes('uuid')) return null
            // Skip any UUID column with a uuid default
            if (colType.includes('uuid') && (defaultVal.includes('uuid_generate_v4') || defaultVal.includes('gen_random_uuid'))) return null
            // Skip id column if it's UUID type (convention: auto-generated)
            if (colName === 'id' && colType.includes('uuid')) return null
            // Skip created_at / updated_at timestamp columns
            if ((colName === 'created_at' || colName === 'updated_at') && (colType.includes('timestamp') || colType.includes('date'))) return null
            // Skip columns with known auto-generation defaults
            if (defaultVal && defaultVal !== 'null' && (defaultVal.includes('current_timestamp') || defaultVal.includes('now()') || defaultVal.includes('gen_random_uuid') || defaultVal.includes('uuid_generate_v4'))) return null
            // Skip serial/identity columns
            if (defaultVal.includes('nextval(')) return null
            // Skip other columns with non-null defaults (DB will use the default)
            if (defaultVal && defaultVal !== 'null') return null
            return (
              <div key={col.name}>
                <label className="block text-sm font-medium text-zinc-600 dark:text-white/70 mb-2">{col.name}<span className="text-zinc-600 dark:text-white/50 ml-2 text-xs">{col.type}</span>{!isNullable && !defaultVal && <span className="text-red-400 ml-1">*</span>}</label>
                <input type="text" value={insertData[col.name] || ''} onChange={(e) => setInsertData({ ...insertData, [col.name]: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-md text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10" placeholder={isNullable ? 'Optional' : 'Required'} />
              </div>
            )
          })}
        </div>
        <div className="p-6 border-t border-zinc-200 dark:border-white/10 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10" disabled={insertingRecord}>Cancel</Button>
          <Button onClick={onInsert} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled={insertingRecord}>
            {insertingRecord ? 'Inserting...' : 'Insert Record'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============ DELETE TABLE MODAL ============
interface DeleteTableModalProps {
  selectedTable: string; confirmDeleteTableName: string; setConfirmDeleteTableName: (v: string) => void
  deleteTableCascade: boolean; setDeleteTableCascade: (v: boolean) => void
  deletingTable: boolean; onClose: () => void; onDelete: () => void
}

export function DeleteTableModal({ selectedTable, confirmDeleteTableName, setConfirmDeleteTableName, deleteTableCascade, setDeleteTableCascade, deletingTable, onClose, onDelete }: DeleteTableModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
      <div className="glass-card border border-zinc-200 dark:border-white/20 rounded-xl p-6 max-w-md w-full animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400" /> Delete Table</h3>
          <button onClick={onClose} className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-sm text-red-400">This action cannot be undone. This will permanently delete the table <span className="font-bold">{selectedTable}</span> and all its data.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-white/80 mb-2">Type <span className="font-mono bg-zinc-100 dark:bg-white/10 px-2 py-0.5 rounded">{selectedTable}</span> to confirm:</label>
            <input type="text" value={confirmDeleteTableName} onChange={(e) => setConfirmDeleteTableName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/20 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/40 focus:outline-none focus:border-zinc-200 dark:border-white/10" placeholder="Enter table name" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="cascade" checked={deleteTableCascade} onChange={(e) => setDeleteTableCascade(e.target.checked)} className="w-4 h-4 rounded border-zinc-200 dark:border-white/20 bg-zinc-100 dark:bg-white/5 text-purple-600 focus:ring-purple-500/50" />
            <label htmlFor="cascade" className="text-sm text-zinc-600 dark:text-white/80">Delete with CASCADE (remove dependent objects)</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10" disabled={deletingTable}>Cancel</Button>
            <Button onClick={onDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-zinc-900 dark:text-white" disabled={confirmDeleteTableName !== selectedTable || deletingTable}>
              {deletingTable ? 'Deleting...' : 'Delete Table'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ DELETE COLUMN MODAL ============
interface DeleteColumnModalProps {
  columnToDelete: string; onClose: () => void; onConfirm: () => void
}

export function DeleteColumnModal({ columnToDelete, onClose, onConfirm }: DeleteColumnModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
      <div className="glass-card border border-zinc-200 dark:border-white/20 rounded-xl p-6 max-w-md w-full animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400" /> Delete Column</h3>
          <button onClick={onClose} className="text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-sm text-red-400">This action cannot be undone. This will permanently delete the column <span className="font-bold">{columnToDelete}</span> and all its data.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-200 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-100 dark:bg-white/10">Cancel</Button>
            <Button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-zinc-900 dark:text-white">Delete Column</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
