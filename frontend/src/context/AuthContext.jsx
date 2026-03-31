import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  clearStoredAuth,
  getStoredToken,
  readPersistedAuth,
  setStoredAuth,
} from '../utils/authStorage'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(() => readPersistedAuth())

  const login = useCallback((newToken, userData) => {
    setStoredAuth(newToken, userData)
    setAuth({ token: newToken, user: userData })
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setAuth({ token: null, user: null })
  }, [])

  const isAuthenticated = useCallback(
    () => Boolean(token || getStoredToken()),
    [token],
  )

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      isAuthenticated,
    }),
    [token, user, login, logout, isAuthenticated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
