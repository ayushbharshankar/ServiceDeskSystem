import { useState } from 'react'
import { NavLink, useParams, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useProjects } from '../context/ProjectsContext'
import { cn } from '../utils/cn'

const PROJECT_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-sky-500',
  'bg-emerald-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-lime-500', 'bg-orange-500',
]

function getProjectColor(index) {
  return PROJECT_COLORS[index % PROJECT_COLORS.length]
}

function getProjectInitial(name) {
  return (name || 'P').charAt(0).toUpperCase()
}

const nav = [
  {
    to: '/dashboard', label: 'Dashboard', end: true,
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to: '/projects', label: 'Projects', end: false,
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
]

const linkClass = ({ isActive }) =>
  cn(
    'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
    isActive
      ? 'bg-indigo-50 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  )

const iconWrapClass = (isActive) =>
  cn(
    'shrink-0 transition-colors',
    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600',
  )

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp()
  const { projects, loading: loadingProjects } = useProjects()
  const [projectsExpanded, setProjectsExpanded] = useState(true)
  const { projectId: routeProjectId } = useParams()
  const location = useLocation()

  // Derive active project from URL
  const activeProjectId = routeProjectId || null

  function closeMobile() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-14 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed bottom-0 left-0 top-14 z-50 flex w-[min(16rem,85vw)] flex-col border-r border-slate-200/90 bg-white transition-transform duration-300 ease-out lg:static lg:z-0 lg:w-60 lg:min-h-[calc(100vh-3.5rem)] lg:shrink-0 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
          'lg:top-auto lg:h-auto lg:min-h-[calc(100vh-4rem)] lg:shadow-none',
        )}
      >
        <nav className="flex flex-1 flex-col overflow-y-auto p-3" aria-label="Main">
          {/* Main navigation */}
          <div className="space-y-0.5">
            {nav.map(({ to, label, end, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={linkClass}
                onClick={closeMobile}
              >
                {({ isActive }) => (
                  <>
                    <span className={iconWrapClass(isActive)}>{icon}</span>
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-slate-100" />

          {/* Your projects section */}
          <div>
            <button
              type="button"
              onClick={() => setProjectsExpanded((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition hover:text-slate-600"
            >
              <span>Your projects</span>
              <svg
                className={cn('h-3.5 w-3.5 transition-transform duration-200', projectsExpanded && 'rotate-180')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {projectsExpanded && (
              <div className="mt-1 space-y-0.5 animate-fade-in">
                {loadingProjects ? (
                  <div className="space-y-1.5 px-2.5 py-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-6 w-6 animate-pulse rounded-md bg-slate-200" />
                        <div className="h-3 flex-1 animate-pulse rounded bg-slate-200" />
                      </div>
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <p className="px-2.5 py-2 text-xs text-slate-400">No projects yet</p>
                ) : (
                  <div className="max-h-[min(40vh,320px)] overflow-y-auto">
                    {projects.map((project, index) => {
                      const id = String(project.id ?? project._id)
                      const name = project.name ?? project.title ?? 'Untitled'
                      const isOnProjectPage =
                        location.pathname.includes(`/issues/${id}`) ||
                        location.pathname.includes(`/kanban/${id}`) ||
                        location.pathname.includes(`/project-dashboard/${id}`)

                      return (
                        <NavLink
                          key={id}
                          to={`/project-dashboard/${id}`}
                          onClick={closeMobile}
                          className={cn(
                            'group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150',
                            isOnProjectPage
                              ? 'bg-slate-100 text-slate-900'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white',
                              getProjectColor(index),
                            )}
                          >
                            {getProjectInitial(name)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{name}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  )
}
