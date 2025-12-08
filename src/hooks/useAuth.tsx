import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface Role {
  id: string
  name: string
  description?: string
  permissions?: string
}

interface User {
  id: string
  username: string
  email?: string
  name: string
  is_active: boolean
  roles: Role[]
}

interface AuthContextType {
  token: string | null
  user: User | null
  currentRole: Role | null
  availableRoles: Role[]
  isAuthenticated: boolean
  login: (token: string, user: User, currentRole: Role, roles: Role[]) => Promise<void>
  logout: () => Promise<void>
  switchRole: (roleId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [currentRole, setCurrentRole] = useState<Role | null>(null)
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])

  useEffect(() => {
    const t = localStorage.getItem('auth_token')
    const u = localStorage.getItem('auth_user')
    const r = localStorage.getItem('auth_role')
    const rs = localStorage.getItem('auth_roles')
    if (t && u && r) {
      setToken(t)
      setUser(JSON.parse(u))
      setCurrentRole(JSON.parse(r))
      if (rs) setAvailableRoles(JSON.parse(rs))
    }
  }, [])

  const login = async (newToken: string, newUser: User, newRole: Role, roles: Role[]) => {
    setToken(newToken)
    setUser(newUser)
    setCurrentRole(newRole)
    setAvailableRoles(roles)
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    localStorage.setItem('auth_role', JSON.stringify(newRole))
    localStorage.setItem('auth_roles', JSON.stringify(roles))
  }

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (err) {
        console.error('logout failed', err)
      }
    }
    setToken(null)
    setUser(null)
    setCurrentRole(null)
    setAvailableRoles([])
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_role')
    localStorage.removeItem('auth_roles')
  }

  const switchRole = async (roleId: string) => {
    if (!token) return
    const resp = await fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role_id: roleId }),
    })
    if (!resp.ok) throw new Error('切换角色失败')
    const data = await resp.json()
    setToken(data.token)
    setCurrentRole(data.role)
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('auth_role', JSON.stringify(data.role))
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        currentRole,
        availableRoles,
        isAuthenticated: !!token,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

