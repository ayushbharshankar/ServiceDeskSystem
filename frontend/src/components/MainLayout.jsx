import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useApp } from '../context/AppContext'
import { useMediaQuery } from '../hooks/useMediaQuery'

export default function MainLayout() {
  const { sidebarOpen, setSidebarOpen } = useApp()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true)
    }
  }, [isDesktop, setSidebarOpen])

  return (
    <div className="flex min-h-screen flex-col bg-slate-100/80">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="min-h-[calc(100vh-3.5rem)] min-w-0 flex-1 overflow-y-auto overflow-x-hidden lg:min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
