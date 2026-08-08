'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Users, Search, RefreshCw, Plus, MoreVertical, CheckCircle, XCircle, Ban, Trash2, Shield, X, Eye, Mail, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { AppSelect } from '@/components/AppSelect'
import { SkeletonTableRows } from '@/components/Skeleton'

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

  const inp = 'ui-control w-full'

  if (!authEnabled) {
    return (
      <div className="ui-page flex flex-col items-center justify-center h-[60vh] text-center">
        <Shield className="w-10 h-10 text-muted-foreground/40 mb-4" />
        <p className="ui-page-title">Auth is not enabled for this project</p>
        <p className="ui-page-desc mt-1">Enable authentication first to manage users</p>
      </div>
    )
  }

  return (
    <div className="ui-page p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 h-8 px-3 rounded-md text-xs font-medium flex items-center gap-2 shadow-lg animate-in slide-in-from-top
        ${toast.ok ? 'bg-blue-500 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="min-w-0">
          <h1 className="ui-page-title flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400 shrink-0" />
            Users
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-md bg-muted text-muted-foreground font-normal">{total}</span>
          </h1>
          <p className="ui-page-desc mt-1">Manage your project&apos;s authenticated users</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => loadUsers()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Create User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className={inp + ' pl-8'} placeholder="Search by email, phone, or name..." />
        </div>
        <AppSelect
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1) }}
          searchable={false}
          className="w-40"
          options={[
            { value: '', label: 'All users' },
            { value: 'verified', label: 'Verified' },
            { value: 'unverified', label: 'Unverified' },
            { value: 'banned', label: 'Banned' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>

      {/* Table */}
      <div className="ui-panel overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-2.5 ui-label uppercase tracking-wide">User</th>
              <th className="px-4 py-2.5 ui-label uppercase tracking-wide">Provider</th>
              <th className="px-4 py-2.5 ui-label uppercase tracking-wide">Status</th>
              <th className="px-4 py-2.5 ui-label uppercase tracking-wide">Created</th>
              <th className="px-4 py-2.5 ui-label uppercase tracking-wide">Last Sign In</th>
              <th className="px-4 py-2.5 ui-label uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && users.length === 0 ? (
            <SkeletonTableRows rows={6} cols={6} />
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center ui-muted">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                <td className="px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">{u.email}</p>
                    {u.full_name && <p className="ui-muted truncate">{u.full_name}</p>}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{u.auth_provider || 'email'}</span>
                </td>
                <td className="px-4 py-2.5">
                  {u.is_banned ? (
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1"><Ban className="w-3 h-3" /> Banned</span>
                  ) : !u.is_active ? (
                    <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">Inactive</span>
                  ) : u.email_verified ? (
                    <span className="text-xs text-blue-500 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">Unverified</span>
                  )}
                </td>
                <td className="px-4 py-2.5 ui-muted">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-2.5 ui-muted">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {actionMenu === u.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 ui-panel shadow-xl z-10 py-1 bg-card">
                        {!u.email_verified && (
                          <button onClick={() => handleVerify(u.id)} className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" /> Force Verify
                          </button>
                        )}
                        <button onClick={() => handleBan(u.id, !u.is_banned)}
                          className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted flex items-center gap-2">
                          <Ban className="w-3.5 h-3.5" /> {u.is_banned ? 'Unban' : 'Ban User'}
                        </button>
                        <button onClick={() => handleDelete(u.id)}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2">
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
          <p className="ui-muted">Page {page} of {totalPages} ({total} users)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-30">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-30">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="ui-panel w-full max-w-md p-5 bg-card shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="ui-section-title">Create User</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="ui-label mb-1.5 block">Email *</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className={inp} placeholder="user@example.com" />
              </div>
              <div>
                <label className="ui-label mb-1.5 block">Password (optional — user can set via magic link)</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className={inp} placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="ui-label mb-1.5 block">Full Name</label>
                <input type="text" value={createForm.full_name} onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                  className={inp} placeholder="John Doe" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={createForm.email_verified} onChange={e => setCreateForm(f => ({ ...f, email_verified: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-border" />
                <span className="text-xs text-foreground">Auto-verify email</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="inline-flex h-8 items-center px-3 text-xs font-medium border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating || !createForm.email}
                className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50 shadow-sm">
                {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setSelectedUser(null)}>
          <div className="border-l border-border bg-card w-full max-w-md h-full overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="ui-section-title">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="p-3 ui-panel bg-muted/30">
                <p className="text-sm font-medium text-foreground truncate">{selectedUser.email}</p>
                {selectedUser.full_name && <p className="ui-muted mt-0.5">{selectedUser.full_name}</p>}
                <p className="ui-muted mt-1.5 font-mono truncate">{selectedUser.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Provider', value: selectedUser.auth_provider || 'email' },
                  { label: 'Status', value: selectedUser.is_banned ? 'Banned' : !selectedUser.is_active ? 'Inactive' : selectedUser.email_verified ? 'Verified' : 'Unverified', color: selectedUser.is_banned ? 'text-red-400' : selectedUser.email_verified ? 'text-blue-500 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400' },
                  { label: 'Created', value: selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '-' },
                  { label: 'Last Login', value: selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleDateString() : 'Never' },
                ].map(item => (
                  <div key={item.label} className="p-2.5 ui-panel bg-muted/30">
                    <p className="ui-label uppercase tracking-wide mb-0.5">{item.label}</p>
                    <p className={`text-sm text-foreground truncate ${'color' in item ? item.color : ''}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {selectedUser.phone && (
                <div className="p-2.5 ui-panel bg-muted/30">
                  <p className="ui-label uppercase tracking-wide mb-0.5">Phone</p>
                  <p className="text-sm text-foreground">{selectedUser.phone}</p>
                </div>
              )}

              {selectedUser.user_metadata && Object.keys(selectedUser.user_metadata).length > 0 && (
                <div className="p-2.5 ui-panel bg-muted/30">
                  <p className="ui-label uppercase tracking-wide mb-0.5">User Metadata</p>
                  <pre className="ui-muted mt-1 overflow-x-auto">{JSON.stringify(selectedUser.user_metadata, null, 2)}</pre>
                </div>
              )}

              {selectedUser.is_banned && selectedUser.banned_reason && (
                <div className="p-2.5 rounded-md border border-red-500/20 bg-red-500/10">
                  <p className="text-xs font-medium text-red-400 uppercase tracking-wide mb-0.5">Ban Reason</p>
                  <p className="text-sm text-red-300">{selectedUser.banned_reason}</p>
                </div>
              )}

              <div className="pt-3 border-t border-border space-y-2">
                {!selectedUser.email_verified && (
                  <button onClick={() => handleVerify(selectedUser.id)}
                    className="w-full inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium border border-border rounded-md text-foreground hover:bg-muted transition-colors">
                    <Mail className="w-3.5 h-3.5" /> Force Verify Email
                  </button>
                )}
                <button onClick={() => handleBan(selectedUser.id, !selectedUser.is_banned)}
                  className="w-full inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium border border-border rounded-md text-foreground hover:bg-muted transition-colors">
                  <Ban className="w-3.5 h-3.5" /> {selectedUser.is_banned ? 'Unban User' : 'Ban User'}
                </button>
                <button onClick={() => handleDelete(selectedUser.id)}
                  className="w-full inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
