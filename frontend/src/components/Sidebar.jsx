import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { cn } from '../utils/cn'

const nav = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/projects', label: 'Projects', end: false },
  { to: '/issues', label: 'Issues', end: false },
  { to: '/kanban', label: 'Kanban Board', end: false },
]

const linkClass = ({ isActive }) =>
  cn(
    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
    isActive
      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  )

const iconClass = (isActive) =>
  cn(
    'h-5 w-5 shrink-0 transition-colors',
    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600',
  )

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp()

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-14 z-40 bg-slate-900/50 backdrop-blur-[2px] transition-opacity lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed bottom-0 left-0 top-14 z-50 flex w-[min(17.5rem,85vw)] flex-col border-r border-slate-200/90 bg-white shadow-xl transition-transform duration-300 ease-out lg:static lg:z-0 lg:w-64 lg:min-h-[calc(100vh-3.5rem)] lg:shrink-0 lg:translate-x-0 lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:top-auto lg:h-auto lg:min-h-[calc(100vh-4rem)]',
        )}
      >
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3 lg:p-4" aria-label="Main">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Navigation
          </p>
          {nav.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={linkClass}
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
            >
              {({ isActive }) => (
                <>
                  {to === '/dashboard' && (
                    <svg className={iconClass(isActive)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  )}
                  {to === '/projects' && (
                    <svg className={iconClass(isActive)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  )}
                  {to === '/issues' && (
                    <svg className={iconClass(isActive)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  )}
                  {to === '/kanban' && (
                    <svg className={iconClass(isActive)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  )}
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
