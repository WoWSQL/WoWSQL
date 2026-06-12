'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Users, Search, RefreshCw, Plus, MoreVertical, CheckCircle, XCircle, Ban, Trash2, Shield, X, Eye, Mail, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/api'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface AuthUser {
  id: string
  email: string
  phone: string | null
  full_name: string | null
  auth_provider: string
  email_verified: boolean
  is_banned: boolean
  is_active: boolean
  banned_reason: string | null
  created_at: string
  last_login_at: string | null
  login_count: number
  user_metadata: any
  app_metadata: any
}

export default function UsersPage() {
  const params = useParams()
  const slug = params.slug as string
  const [users, setUsers] = useState<AuthUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [authEnabled, setAuthEnabled] = useState(true)
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', password: '', full_name: '', email_verified: false })
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: 20 }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter) params.status = statusFilter
      const res = await api.get(`/api/v1/projects/${slug}/auth/users`, { params })
      setUsers(res.data.users || [])
      setTotal(res.data.total || 0)
      setTotalPages(res.data.total_pages || 1)
      setAuthEnabled(true)
    } catch (err: any) {
      if (err.response?.status === 400) setAuthEnabled(false)
    } finally { setLoading(false) }
  }, [slug, page, debouncedSearch, statusFilter])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleBan = async (userId: string, ban: boolean) => {
    try {
      await api.patch(`/api/v1/projects/${slug}/auth/users/${userId}`, {
        is_banned: ban,
        ban_reason: ban ? 'Banned by admin' : null,
      })
      showToast(ban ? 'User banned' : 'User unbanned', true)
      setActionMenu(null)
      loadUsers()
    } catch { showToast('Failed to update user', false) }
  }

  const handleVerify = async (userId: string) => {
    try {
      await api.post(`/api/v1/projects/${slug}/auth/users/${userId}/verify`)
      showToast('User verified', true)
      setActionMenu(null)
      loadUsers()
    } catch { showToast('Failed to verify user', false) }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Permanently delete this user and all their sessions?')) return
    try {
      await api.delete(`/api/v1/projects/${slug}/auth/users/${userId}`)
      showToast('User deleted', true)
      setActionMenu(null)
      setSelectedUser(null)
      loadUsers()
    } catch { showToast('Failed to delete user', false) }
  }

  const handleCreate = async () => {
    if (!createForm.email) return
    setCreating(true)
    try {
      await api.post(`/api/v1/projects/${slug}/auth/users`, createForm)
      showToast('User created', true)
      setShowCreate(false)
      setCreateForm({ email: '', password: '', full_name: '', email_verified: false })
      loadUsers()
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create user', false)
    } finally { setCreating(false) }
  }

  const inp = "px-3 py-2.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-zinc-200 dark:border-white/10"

  if (!authEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Shield className="w-12 h-12 text-zinc-600 dark:text-white/20 mb-4" />
        <p className="text-zinc-600 dark:text-white/50 text-lg">Auth is not enabled for this project</p>
        <p className="text-zinc-600 dark:text-white/30 text-sm mt-1">Enable authentication first to manage users</p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg animate-in slide-in-from-top
          ${toast.ok ? 'bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Users
            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-white/60">{total}</span>
          </h1>
          <p className="text-zinc-600 dark:text-white/40 text-sm mt-1">Manage your project&apos;s authenticated users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadUsers()}
            className="px-3 py-2 text-sm text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white rounded-lg flex items-center gap-2 shadow-sm transition-all">
            <Plus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 dark:text-white/30" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className={'w-full ' + inp + ' pl-9'} placeholder="Search by email, phone, or name..." />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className={'w-40 ' + inp}>
          <option value="">All users</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="banned">Banned</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-100 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10">
              <th className="px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">User</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Provider</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Created</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase">Last Sign In</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-600 dark:text-white/50 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-600 dark:text-white/30">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-600 dark:text-white/30">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm text-zinc-900 dark:text-white font-medium">{u.email}</p>
                    {u.full_name && <p className="text-xs text-zinc-600 dark:text-white/40">{u.full_name}</p>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-zinc-600 dark:text-white/60 bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded">{u.auth_provider || 'email'}</span>
                </td>
                <td className="px-4 py-3">
                  {u.is_banned ? (
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded flex items-center gap-1 w-fit"><Ban className="w-3 h-3" /> Banned</span>
                  ) : !u.is_active ? (
                    <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded">Inactive</span>
                  ) : u.email_verified ? (
                    <span className="text-xs text-violet-500 dark:text-violet-400 bg-violet-500/10 px-2 py-1 rounded flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Verified</span>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded">Unverified</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600 dark:text-white/40">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600 dark:text-white/40">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)}
                      className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 text-zinc-600 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {actionMenu === u.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-gray-900 border border-zinc-200 dark:border-white/10 rounded-lg shadow-xl z-10 py-1">
                        {!u.email_verified && (
                          <button onClick={() => handleVerify(u.id)} className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-white/70 hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" /> Force Verify
                          </button>
                        )}
                        <button onClick={() => handleBan(u.id, !u.is_banned)}
                          className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-white/70 hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center gap-2">
                          <Ban className="w-3.5 h-3.5" /> {u.is_banned ? 'Unban' : 'Ban User'}
                        </button>
                        <button onClick={() => handleDelete(u.id)}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-zinc-600 dark:text-white/40">Page {page} of {totalPages} ({total} users)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-white/10 rounded text-zinc-600 dark:text-white/60 hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 disabled:opacity-30">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-white/10 rounded text-zinc-600 dark:text-white/60 hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 disabled:opacity-30">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-white dark:bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-gray-900 border border-zinc-200 dark:border-white/10 rounded-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Create User</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-600 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block">Email *</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className={'w-full ' + inp} placeholder="user@example.com" />
              </div>
              <div>
                <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block">Password (optional — user can set via magic link)</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className={'w-full ' + inp} placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="text-xs text-zinc-600 dark:text-white/50 mb-1.5 block">Full Name</label>
                <input type="text" value={createForm.full_name} onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                  className={'w-full ' + inp} placeholder="John Doe" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={createForm.email_verified} onChange={e => setCreateForm(f => ({ ...f, email_verified: e.target.checked }))}
                  className="w-4 h-4 rounded bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/20" />
                <span className="text-sm text-zinc-600 dark:text-white/70">Auto-verify email</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-zinc-600 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating || !createForm.email}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 hover:opacity-90 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm">
                {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 bg-white dark:bg-black/70 z-50 flex justify-end" onClick={() => setSelectedUser(null)}>
          <div className="bg-gray-900 border-l border-zinc-200 dark:border-white/10 w-full max-w-md h-full overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-600 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/10">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{selectedUser.email}</p>
                {selectedUser.full_name && <p className="text-xs text-zinc-600 dark:text-white/50 mt-1">{selectedUser.full_name}</p>}
                <p className="text-xs text-zinc-600 dark:text-white/30 mt-2 font-mono">{selectedUser.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/10">
                  <p className="text-[10px] text-zinc-600 dark:text-white/40 uppercase mb-1">Provider</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedUser.auth_provider || 'email'}</p>
                </div>
                <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/10">
                  <p className="text-[10px] text-zinc-600 dark:text-white/40 uppercase mb-1">Status</p>
                  <p className={`text-sm ${selectedUser.is_banned ? 'text-red-400' : selectedUser.email_verified ? 'text-violet-500 dark:text-violet-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {selectedUser.is_banned ? 'Banned' : !selectedUser.is_active ? 'Inactive' : selectedUser.email_verified ? 'Verified' : 'Unverified'}
                  </p>
                </div>
                <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/10">
                  <p className="text-[10px] text-zinc-600 dark:text-white/40 uppercase mb-1">Created</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '-'}</p>
                </div>
                <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/10">
                  <p className="text-[10px] text-zinc-600 dark:text-white/40 uppercase mb-1">Last Login</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>

              {selectedUser.phone && (
                <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/10">
                  <p className="text-[10px] text-zinc-600 dark:text-white/40 uppercase mb-1">Phone</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedUser.phone}</p>
                </div>
              )}

              {selectedUser.user_metadata && Object.keys(selectedUser.user_metadata).length > 0 && (
                <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/10">
                  <p className="text-[10px] text-zinc-600 dark:text-white/40 uppercase mb-1">User Metadata</p>
                  <pre className="text-xs text-zinc-600 dark:text-white/60 mt-1 overflow-x-auto">{JSON.stringify(selectedUser.user_metadata, null, 2)}</pre>
                </div>
              )}

              {selectedUser.is_banned && selectedUser.banned_reason && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-[10px] text-red-400 uppercase mb-1">Ban Reason</p>
                  <p className="text-sm text-red-300">{selectedUser.banned_reason}</p>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-200 dark:border-white/10 space-y-2">
                {!selectedUser.email_verified && (
                  <button onClick={() => handleVerify(selectedUser.id)}
                    className="w-full px-4 py-2 text-sm text-zinc-600 dark:text-white/70 border border-zinc-200 dark:border-white/10 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Force Verify Email
                  </button>
                )}
                <button onClick={() => handleBan(selectedUser.id, !selectedUser.is_banned)}
                  className="w-full px-4 py-2 text-sm text-zinc-600 dark:text-white/70 border border-zinc-200 dark:border-white/10 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 dark:bg-white/5 flex items-center gap-2">
                  <Ban className="w-4 h-4" /> {selectedUser.is_banned ? 'Unban User' : 'Ban User'}
                </button>
                <button onClick={() => handleDelete(selectedUser.id)}
                  className="w-full px-4 py-2 text-sm text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
