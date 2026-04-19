import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export const ROLES = {
  PUBLIC: 'PUBLIC',
  CITIZEN: 'CITIZEN',
  OFFICER: 'OFFICER',
  ADMIN: 'ADMIN',
}

const DEMO_USERS = {
  CITIZEN: { id: 'BSC-CIT-001', name: 'Amit Kumar Verma', role: ROLES.CITIZEN, avatar: 'AK' },
  OFFICER: { id: 'OFC-IT-007', name: 'Praveen Kulkarni', role: ROLES.OFFICER, avatar: 'PK', agency: 'Income Tax Dept.' },
  ADMIN:   { id: 'ADMIN-001',  name: 'System Administrator', role: ROLES.ADMIN, avatar: 'SA' },
  PUBLIC:  { id: null,         name: 'Public Observer', role: ROLES.PUBLIC, avatar: 'PO' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (role) => setUser(DEMO_USERS[role])
  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
