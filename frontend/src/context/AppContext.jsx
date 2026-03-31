import { createContext, useContext, useMemo, useState } from 'react'

const AppContext = createContext(null)

function getInitialSidebarOpen() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(min-width: 1024px)').matches
}

export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarOpen)

  const value = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar: () => setSidebarOpen((o) => !o),
    }),
    [sidebarOpen],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider')
  }
  return ctx
}
