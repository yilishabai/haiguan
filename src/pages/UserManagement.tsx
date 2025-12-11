import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Shield, UserCheck, RefreshCw, Pencil } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface Role {
  id: string
  name: string
  description?: string
  permissions?: string
}

interface UserRow {
  id: string
  username: string
  email?: string
  name: string
  is_active: boolean
  roles: Role[]
  created_at: string
  updated_at: string
}

export const UserManagement: React.FC = () => {
  const { token, currentRole, logout, hasPermission } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [savingRoles, setSavingRoles] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRoleIds, setNewRoleIds] = useState<string[]>([])
  const [savingUser, setSavingUser] = useState(false)
  const [roleMgrOpen, setRoleMgrOpen] = useState(false)
  const [roleId, setRoleId] = useState('')
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [rolePermissions, setRolePermissions] = useState('')
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [savingRole, setSavingRole] = useState(false)

  const loadUsers = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const resp = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.detail || '加载失败')
      }
      const data = await resp.json()
      setUsers(data)
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadUsers()
    const loadRoles = async () => {
      if (!token) return
      try {
        const resp = await fetch('/api/users/roles', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!resp.ok) {
          let msg = '无法获取角色列表'
          try {
            const body = await resp.json()
            if (body && body.detail) msg = body.detail
          } catch (e) { console.warn(e) }
          if (resp.status === 401) {
            msg = '登录已过期，请重新登录'
            await logout()
          }
          throw new Error(msg)
        }
        const data = await resp.json()
        setRoles(data)
      } catch (err: any) {
        setError(err.message || '加载角色失败')
      }
    }
    loadRoles()
  }, [token, loadUsers, logout])

  const openRoleEditor = (user: UserRow) => {
    setEditUser(user)
    setSelectedRoleIds(user.roles.map((r) => r.id))
  }

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const toggleNewRole = (roleId: string) => {
    setNewRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const saveUserRoles = async () => {
    if (!editUser || !token) return
    setSavingRoles(true)
    try {
      const resp = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role_ids: selectedRoleIds }),
      })
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.detail || '保存失败')
      }
      await loadUsers()
      setEditUser(null)
    } catch (err: any) {
      setError(err.message || '保存失败')
    } finally {
      setSavingRoles(false)
    }
  }

  const openCreateUser = () => {
    if (!hasPermission('users:write')) {
      setError('无权限新增用户')
      return
    }
    setNewUsername('')
    setNewName('')
    setNewEmail('')
    setNewPassword('')
    setNewRoleIds([])
    setCreateOpen(true)
  }

  const createUser = async () => {
    if (!token) return
    if (!newUsername || !newPassword || !newName) {
      setError('请填写用户名、姓名和密码')
      return
    }
    setSavingUser(true)
    try {
      const resp = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          email: newEmail || undefined,
          name: newName,
          role_ids: newRoleIds,
        }),
      })
      if (!resp.ok) {
        let msg = '新增用户失败'
        try {
          const body = await resp.json()
          if (body && body.detail) msg = body.detail
        } catch (e) { console.warn(e) }
        throw new Error(msg)
      }
      await loadUsers()
      setCreateOpen(false)
    } catch (err: any) {
      setError(err.message || '新增用户失败')
    } finally {
      setSavingUser(false)
    }
  }

  const openRoleManager = () => {
    if (!hasPermission('users:write')) {
      setError('无权限管理角色')
      return
    }
    setRoleMgrOpen(true)
  }

  const createRole = async () => {
    if (!token) return
    if (!roleId || !roleName) {
      setError('请填写角色ID和名称')
      return
    }
    setSavingRole(true)
    try {
      const resp = await fetch('/api/users/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: roleId, name: roleName, description: roleDescription || undefined, permissions: rolePermissions || '' }),
      })
      if (!resp.ok) {
        let msg = '新增角色失败'
        try { const body = await resp.json(); if (body && body.detail) msg = body.detail } catch (e) { console.warn(e) }
        throw new Error(msg)
      }
      setRoleId('')
      setRoleName('')
      setRoleDescription('')
      setRolePermissions('')
      await loadUsers()
      const rResp = await fetch('/api/users/roles', { headers: { Authorization: `Bearer ${token}` } })
      if (rResp.ok) setRoles(await rResp.json())
    } catch (err: any) {
      setError(err.message || '新增角色失败')
    } finally {
      setSavingRole(false)
    }
  }

  const startEditRole = (r: Role) => {
    setEditingRoleId(r.id)
    setRoleName(r.name)
    setRoleDescription(r.description || '')
    setRolePermissions(r.permissions || '')
  }

  const updateRole = async () => {
    if (!token || !editingRoleId) return
    if (!roleName) { setError('请填写角色名称'); return }
    setSavingRole(true)
    try {
      const resp = await fetch(`/api/users/roles/${editingRoleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: roleName, description: roleDescription || undefined, permissions: rolePermissions || undefined }),
      })
      if (!resp.ok) {
        let msg = '更新角色失败'
        try { const body = await resp.json(); if (body && body.detail) msg = body.detail } catch (e) { console.warn(e) }
        throw new Error(msg)
      }
      setEditingRoleId(null)
      await loadUsers()
      const rResp = await fetch('/api/users/roles', { headers: { Authorization: `Bearer ${token}` } })
      if (rResp.ok) setRoles(await rResp.json())
    } catch (err: any) {
      setError(err.message || '更新角色失败')
    } finally {
      setSavingRole(false)
    }
  }

  const deleteRole = async (rid: string) => {
    if (!token) return
    setSavingRole(true)
    try {
      const resp = await fetch(`/api/users/roles/${rid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!resp.ok) {
        let msg = '删除角色失败'
        try { const body = await resp.json(); if (body && body.detail) msg = body.detail } catch (e) { console.warn(e) }
        throw new Error(msg)
      }
      await loadUsers()
      const rResp = await fetch('/api/users/roles', { headers: { Authorization: `Bearer ${token}` } })
      if (rResp.ok) setRoles(await rResp.json())
    } catch (err: any) {
      setError(err.message || '删除角色失败')
    } finally {
      setSavingRole(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">用户与角色</h1>
          <p className="text-sm text-gray-400">管理平台用户与角色分配（当前角色：{currentRole?.name || '未登录'})</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadUsers}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 transition"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </button>
          <button
            onClick={openCreateUser}
            disabled={!hasPermission('users:write')}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition disabled:opacity-60"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增用户
          </button>
          <button
            onClick={openRoleManager}
            disabled={!hasPermission('users:write')}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 hover:bg-gray-600 transition disabled:opacity-60"
          >
            角色管理
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded">{error}</div>}

      <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-gray-200">
          <thead className="bg-gray-800/70">
            <tr>
              <th className="px-4 py-3 text-left">用户名</th>
              <th className="px-4 py-3 text-left">姓名</th>
              <th className="px-4 py-3 text-left">邮箱</th>
              <th className="px-4 py-3 text-left">角色</th>
              <th className="px-4 py-3 text-left">状态</th>
              <th className="px-4 py-3 text-left">创建时间</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-800">
                <td className="px-4 py-3 font-semibold">{u.username}</td>
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">{u.email || '-'}</td>
                <td className="px-4 py-3 space-x-1">
                  {u.roles.map((r) => (
                    <span key={r.id} className="inline-flex items-center px-2 py-1 bg-gray-800 rounded text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      {r.name}
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3">
                  {u.is_active ? (
                    <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-200 rounded text-xs">
                      <UserCheck className="w-3 h-3 mr-1" /> 活跃
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-500/20 text-gray-200 rounded text-xs">禁用</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openRoleEditor(u)}
                    disabled={!hasPermission('users:write')}
                    className={`inline-flex items-center px-3 py-1 bg-gray-800 text-gray-100 rounded border border-gray-700 hover:bg-gray-700 text-xs ${!hasPermission('users:write') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    角色
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                  暂无数据
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                  加载中...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-white">分配角色</div>
                <div className="text-sm text-gray-400">用户：{editUser.username}</div>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="px-3 py-1 text-sm text-gray-300 hover:text-white"
              >
                关闭
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {roles.map((r) => (
                <label key={r.id} className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(r.id)}
                    onChange={() => toggleRole(r.id)}
                    className="form-checkbox h-4 w-4 text-cyan-500"
                  />
                  <div>
                    <div className="text-sm text-white">{r.name}</div>
                    {r.description && <div className="text-xs text-gray-500">{r.description}</div>}
                  </div>
                </label>
              ))}
              {roles.length === 0 && <div className="text-sm text-gray-500 px-3">暂无角色，请先创建</div>}
            </div>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-2 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={saveUserRoles}
                disabled={savingRoles}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {savingRoles ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-white">新增用户</div>
              <button onClick={() => setCreateOpen(false)} className="px-3 py-1 text-sm text-gray-300 hover:text-white">关闭</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">用户名</label>
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">姓名</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">邮箱</label>
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">密码</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" />
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="text-sm text-gray-400">分配角色</div>
              {roles.map((r) => (
                <label key={r.id} className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoleIds.includes(r.id)}
                    onChange={() => toggleNewRole(r.id)}
                    className="form-checkbox h-4 w-4 text-cyan-500"
                  />
                  <div>
                    <div className="text-sm text-white">{r.name}</div>
                    {r.description && <div className="text-xs text-gray-500">{r.description}</div>}
                  </div>
                </label>
              ))}
              {roles.length === 0 && <div className="text-sm text-gray-500 px-3">暂无角色，请先创建</div>}
            </div>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded bg-gray-800 text-gray-200 hover:bg-gray-700">取消</button>
              <button onClick={createUser} disabled={savingUser} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60">{savingUser ? '创建中...' : '创建'}</button>
            </div>
          </div>
        </div>
      )}

      {roleMgrOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-white">角色管理</div>
              <button onClick={() => { setRoleMgrOpen(false); setEditingRoleId(null) }} className="px-3 py-1 text-sm text-gray-300 hover:text-white">关闭</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-2">新增角色</div>
                <div className="space-y-3">
                  <input placeholder="角色ID" value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" />
                  <input placeholder="角色名称" value={roleName} onChange={(e) => setRoleName(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" />
                  <input placeholder="角色描述" value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" />
                  <input placeholder="权限（JSON或自定义字符串）" value={rolePermissions} onChange={(e) => setRolePermissions(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" />
                  <div className="text-xs text-slate-500 mt-1">示例: {`{"menus": ["dashboard", "customs"], "actions": ["read", "write"]}`}</div>
                  <div className="flex justify-end">
                    <button onClick={createRole} disabled={savingRole} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60">{savingRole ? '创建中...' : '创建角色'}</button>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">已有角色</div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {roles.map((r) => (
                    <div key={r.id} className="border border-slate-800 rounded p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-white text-sm">{r.id} — {r.name}</div>
                        <div className="space-x-2">
                          <button onClick={() => startEditRole(r)} className="px-2 py-1 text-xs bg-gray-800 text-gray-200 rounded border border-gray-700 hover:bg-gray-700">编辑</button>
                          <button onClick={() => deleteRole(r.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-500">删除</button>
                        </div>
                      </div>
                      {r.description && <div className="text-xs text-gray-500 mt-1">{r.description}</div>}
                    </div>
                  ))}
                  {roles.length === 0 && <div className="text-sm text-gray-500">暂无角色</div>}
                </div>
              </div>
            </div>
            {editingRoleId && (
              <div className="pt-4 border-t border-slate-800">
                <div className="text-sm text-gray-400 mb-2">编辑角色（{editingRoleId}）</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input placeholder="角色名称" value={roleName} onChange={(e) => setRoleName(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" />
                  <input placeholder="角色描述" value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" />
                  <input placeholder="权限（JSON或自定义字符串）" value={rolePermissions} onChange={(e) => setRolePermissions(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div className="text-xs text-slate-500 mt-1">示例: {`{"menus": ["dashboard", "customs"], "actions": ["read", "write"]}`}</div>
                <div className="flex justify-end mt-3">
                  <button onClick={() => { setEditingRoleId(null); setRoleName(''); setRoleDescription(''); setRolePermissions('') }} className="px-4 py-2 rounded bg-gray-800 text-gray-200 hover:bg-gray-700 mr-2">取消</button>
                  <button onClick={updateRole} disabled={savingRole} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60">{savingRole ? '保存中...' : '保存更新'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

