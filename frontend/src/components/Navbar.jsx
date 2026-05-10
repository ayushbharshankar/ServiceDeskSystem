import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { notificationService } from '../services/notificationService'
import { cn } from '../utils/cn'

function userInitials(user) {
  const name = user?.name ?? user?.full_name ?? user?.email ?? '?'
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return String(name).slice(0, 2).toUpperCase() || '?'
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const secs = Math.floor((now - d) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

const NOTIF_ICON = {
  issue_assigned: '📋',
  issue_status_changed: '🔄',
  comment_added: '💬',
  project_invitation: '📨',
  member_added: '👤',
}

function NotificationDropdown({ notifications, unreadCount, onMarkRead, onMarkAllRead, onClose }) {
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={dropdownRef}
      className="animate-dropdown-in absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-medium text-indigo-600 transition hover:text-indigo-800"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-[min(400px,60vh)] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm text-slate-500">No notifications</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li key={n.notification_id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!n.is_read) onMarkRead(n.notification_id)
                    if (n.link) {
                      window.location.href = n.link
                      onClose()
                    }
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50',
                    !n.is_read && 'bg-indigo-50/40',
                  )}
                >
                  <span className="mt-0.5 text-base leading-none" aria-hidden>
                    {NOTIF_ICON[n.type] || '🔔'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', !n.is_read ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function Navbar() {
  const { sidebarOpen, toggleSidebar } = useApp()
  const { user, logout } = useAuth()

  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const displayName = user?.name ?? user?.full_name ?? user?.email ?? 'Account'
  const email = user?.email && (user?.name || user?.full_name) ? user.email : null

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.list({ limit: 20 })
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch {
      // silently fail
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationService.getUnreadCount()
      setUnreadCount(data.unread_count || 0)
    } catch {
      // silently fail
    }
  }, [])

  // Poll for unread count
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (showNotifs) fetchNotifications()
  }, [showNotifs, fetchNotifications])

  async function handleMarkRead(id) {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n)),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {}
  }

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {}
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/90 bg-white/95 px-3 shadow-sm backdrop-blur-md sm:gap-4 sm:px-4 lg:h-16 lg:px-6">
      <button
        type="button"
        onClick={toggleSidebar}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={sidebarOpen}
      >
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <Link
        to="/dashboard"
        className="flex min-w-0 items-center gap-2 rounded-lg pr-2 text-slate-900 outline-none transition hover:text-indigo-700"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm">
          SD
        </span>
        <span className="hidden truncate text-sm font-semibold tracking-tight sm:block">
          Service Desk
        </span>
      </Link>

      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifs((v) => !v)}
            className={cn(
              'relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition',
              showNotifs
                ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
            )}
            aria-label="Notifications"
          >
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onClose={() => setShowNotifs(false)}
            />
          )}
        </div>

        {/* User info */}
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

        {/* Avatar */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white shadow-sm ring-2 ring-white sm:h-9 sm:w-9"
          title={displayName}
          aria-hidden
        >
          {userInitials(user)}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:px-3.5 sm:text-sm"
        >
          Log out
        </button>
      </div>
    </header>
  )
}
