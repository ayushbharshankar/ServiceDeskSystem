import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { cn } from '../utils/cn'

function userInitials(user) {
  const name = user?.name ?? user?.email ?? '?'
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return String(name).slice(0, 2).toUpperCase() || '?'
}

export default function Navbar() {
  const { sidebarOpen, toggleSidebar } = useApp()
  const { user, logout } = useAuth()

  const displayName = user?.name ?? user?.email ?? 'Account'
  const email = user?.email && user?.name ? user.email : null

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/90 bg-white/95 px-3 shadow-sm backdrop-blur-md sm:gap-4 sm:px-4 lg:h-16 lg:px-6">
      <button
        type="button"
        onClick={toggleSidebar}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={sidebarOpen}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          {sidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      <Link
        to="/dashboard"
        className="flex min-w-0 items-center gap-2.5 rounded-lg pr-2 text-slate-900 outline-none ring-indigo-500/0 transition hover:text-indigo-700 focus-visible:ring-2"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-600/20">
          SD
        </span>
        <span className="hidden truncate text-sm font-semibold tracking-tight sm:block sm:text-base">
          Service Desk
        </span>
      </Link>

      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
        <span className="max-w-[32vw] truncate text-xs font-semibold text-slate-900 sm:hidden" title={displayName}>
          {displayName}
        </span>

        <div
          className={cn(
            'hidden min-w-0 flex-col items-end text-right sm:flex',
            !email && 'justify-center',
          )}
        >
          <span className="max-w-[10rem] truncate text-sm font-semibold text-slate-900 lg:max-w-xs">
            {displayName}
          </span>
          {email ? (
            <span className="max-w-[10rem] truncate text-xs text-slate-500 lg:max-w-xs" title={email}>
              {email}
            </span>
          ) : null}
        </div>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md ring-2 ring-white sm:h-10 sm:w-10 sm:ring-slate-100"
          title={displayName}
          aria-hidden
        >
          {userInitials(user)}
        </div>

        <button
          type="button"
          onClick={logout}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:px-4 sm:text-sm"
        >
          Log out
        </button>
      </div>
    </header>
  )
}
