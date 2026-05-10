import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ErrorBanner from '../components/ui/ErrorBanner'
import PageHeader from '../components/ui/PageHeader'
import { projectService } from '../services/projectService'
import { getErrorMessage } from '../utils/errorMessage'
import { cn } from '../utils/cn'

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

function StatMiniCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold', color || 'text-slate-900')}>{value ?? 0}</p>
    </div>
  )
}

function ProgressBar({ value, max, label, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('animate-progress-fill h-full rounded-full transition-all duration-500', color || 'bg-indigo-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function MemberAvatar({ name, role }) {
  const initials = (name || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roleColor = {
    Owner: 'ring-amber-400',
    Admin: 'ring-indigo-400',
    Member: 'ring-slate-200',
  }

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-[10px] font-bold text-white ring-2',
          roleColor[role] || roleColor.Member,
        )}
        title={name}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{name}</p>
        <p className="text-[11px] text-slate-500">{role || 'Member'}</p>
      </div>
    </div>
  )
}

const ACTION_LABELS = {
  project_created: 'created the project',
  issue_created: 'created an issue',
  issue_status_changed: 'changed issue status',
  issue_deleted: 'deleted an issue',
  member_added: 'added a member',
  member_invited: 'invited a member',
  comment_added: 'added a comment',
}

const ACTION_ICONS = {
  project_created: '🎉',
  issue_created: '📝',
  issue_status_changed: '🔄',
  issue_deleted: '🗑️',
  member_added: '👤',
  member_invited: '📨',
  comment_added: '💬',
}

function ActivityItem({ activity }) {
  const label = ACTION_LABELS[activity.action] || activity.action
  const icon = ACTION_ICONS[activity.action] || '📌'
  const details = activity.details || {}
  let extra = ''
  if (details.title) extra = `"${details.title}"`
  if (details.old_status && details.new_status) extra = `${details.old_status} → ${details.new_status}`
  if (details.member_name) extra = details.member_name
  if (details.email && !details.member_name) extra = details.email

  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 text-sm" aria-hidden>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-700">
          <span className="font-medium text-slate-900">{activity.user_name || 'Someone'}</span>
          {' '}{label}
          {extra && <span className="text-slate-500"> — {extra}</span>}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(activity.created_at)}</p>
      </div>
    </div>
  )
}

export default function ProjectDashboard() {
  const { projectId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = useCallback(async () => {
    if (!projectId) return
    setError('')
    setLoading(true)
    try {
      const result = await projectService.getDashboard(projectId)
      setData(result)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load project dashboard.'))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const stats = data?.stats || {}
  const project = data?.project || {}
  const members = data?.members || []
  const activities = data?.activities || []
  const total = parseInt(stats.total || 0, 10)
  const done = parseInt(stats.done || 0, 10)
  const todo = parseInt(stats.todo || 0, 10)
  const inProgress = parseInt(stats.in_progress || 0, 10)

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.project_name || 'Project Dashboard'}
        description={project.description || 'Overview, stats, and recent activity for this project.'}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/kanban/${projectId}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Kanban
            </Link>
            <Link
              to={`/issues/${projectId}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Issues
            </Link>
            <button
              type="button"
              onClick={fetchDashboard}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchDashboard} />}

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatMiniCard label="Total Issues" value={total} color="text-slate-900" />
            <StatMiniCard label="To Do" value={todo} color="text-slate-600" />
            <StatMiniCard label="In Progress" value={inProgress} color="text-blue-600" />
            <StatMiniCard label="Done" value={done} color="text-emerald-600" />
          </div>

          {/* Progress & Priority row */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-800">Completion</h3>
              <ProgressBar value={done} max={total} label="Overall progress" color="bg-emerald-500" />
              <div className="mt-4 space-y-3">
                <ProgressBar value={todo} max={total} label="To Do" color="bg-slate-400" />
                <ProgressBar value={inProgress} max={total} label="In Progress" color="bg-blue-500" />
                <ProgressBar value={done} max={total} label="Done" color="bg-emerald-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-800">Priority Distribution</h3>
              <div className="space-y-3">
                <ProgressBar
                  value={parseInt(stats.high || 0, 10)}
                  max={total}
                  label="High"
                  color="bg-red-500"
                />
                <ProgressBar
                  value={parseInt(stats.medium || 0, 10)}
                  max={total}
                  label="Medium"
                  color="bg-amber-500"
                />
                <ProgressBar
                  value={parseInt(stats.low || 0, 10)}
                  max={total}
                  label="Low"
                  color="bg-slate-400"
                />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-2xl font-bold text-indigo-600">{stats.completion_rate ?? 0}%</span>
                <span className="text-xs text-slate-500">completion rate</span>
              </div>
            </div>
          </div>

          {/* Members & Activity row */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Members */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Members</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {members.length}
                </span>
              </div>
              <div className="space-y-3">
                {members.length === 0 ? (
                  <p className="text-sm text-slate-500">No members yet</p>
                ) : (
                  members.slice(0, 8).map((m) => (
                    <MemberAvatar
                      key={m.user_id}
                      name={m.full_name}
                      role={m.member_role}
                    />
                  ))
                )}
                {members.length > 8 && (
                  <p className="text-xs text-slate-500">+{members.length - 8} more</p>
                )}
              </div>
            </div>

            {/* Activity */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold text-slate-800">Recent Activity</h3>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-500">No activity yet</p>
                </div>
              ) : (
                <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
                  {activities.map((a) => (
                    <ActivityItem key={a.activity_id} activity={a} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
