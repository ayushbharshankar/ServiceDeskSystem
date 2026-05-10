import { Link } from 'react-router-dom'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import StatCard from '../components/dashboard/StatCard'
import ErrorBanner from '../components/ui/ErrorBanner'
import PageHeader from '../components/ui/PageHeader'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { cn } from '../utils/cn'

const iconClass = 'h-5 w-5'

/* ─── Priority badge ─── */
function priorityBadge(priority) {
  const p = String(priority || 'Medium')
  if (p === 'High') return 'bg-red-50 text-red-700 ring-red-200'
  if (p === 'Low') return 'bg-slate-50 text-slate-600 ring-slate-200'
  return 'bg-amber-50 text-amber-700 ring-amber-200'
}

function statusDot(status) {
  if (status === 'In Progress') return 'bg-blue-500'
  if (status === 'Done') return 'bg-emerald-500'
  return 'bg-slate-400'
}

/* ─── Activity icon ─── */
function activityIcon(action) {
  if (action?.includes('created'))
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </span>
    )
  if (action?.includes('status'))
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </span>
    )
  if (action?.includes('comment'))
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </span>
    )
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
  )
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function describeActivity(a) {
  const details = typeof a.details === 'string' ? JSON.parse(a.details) : a.details
  const user = a.user_name || 'Someone'
  if (a.action === 'issue_created') return `${user} created "${details?.title || 'an issue'}"`
  if (a.action === 'issue_status_changed')
    return `${user} moved "${details?.title || 'an issue'}" to ${details?.new_status || '?'}`
  if (a.action === 'comment_added') return `${user} commented on "${details?.issue_title || 'an issue'}"`
  if (a.action === 'issue_deleted') return `${user} deleted "${details?.title || 'an issue'}"`
  if (a.action === 'project_created') return `${user} created project "${details?.project_name || ''}"`
  if (a.action === 'member_invited') return `${user} invited a member`
  return `${user} performed ${a.action?.replace(/_/g, ' ') || 'an action'}`
}

/* ─── Project progress colors ─── */
const PROJECT_COLORS = [
  'from-indigo-500 to-violet-600', 'from-blue-500 to-cyan-600', 'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-violet-500 to-purple-600',
]

export default function Dashboard() {
  const { stats, loading, error, refetch } = useDashboardStats()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your personalized productivity overview."
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      {error ? <ErrorBanner message={error} onRetry={() => refetch()} /> : null}

      {loading && !stats ? (
        <DashboardSkeleton />
      ) : stats ? (
        <>
          {/* ─── Stat Cards ─── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total projects"
              value={stats.total_projects}
              description="Projects you belong to"
              accentClass="bg-gradient-to-br from-indigo-500 to-indigo-600"
              icon={
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              }
            />
            <StatCard
              title="Assigned tasks"
              value={stats.total_tasks}
              description="Issues assigned to you"
              accentClass="bg-gradient-to-br from-sky-500 to-blue-600"
              icon={
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatCard
              title="In Progress"
              value={stats.in_progress_tasks}
              description="Tasks you're working on"
              accentClass="bg-gradient-to-br from-amber-500 to-orange-500"
              icon={
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="Completed"
              value={stats.completed_tasks}
              description={`${stats.completed_this_week ?? 0} this week`}
              accentClass="bg-gradient-to-br from-emerald-500 to-teal-600"
              icon={
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* ─── Two-column: Priority Issues + Activity ─── */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Priority Issues */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <h3 className="text-sm font-semibold text-slate-800">Priority Tasks</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {stats.priority_issues?.length ?? 0} open
                </span>
              </div>
              {stats.priority_issues && stats.priority_issues.length > 0 ? (
                <div className="divide-y divide-slate-50 p-1">
                  {stats.priority_issues.map((issue) => (
                    <Link
                      key={issue.issue_id}
                      to={`/issue/${issue.issue_id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-50"
                    >
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', statusDot(issue.status))} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{issue.title}</p>
                        <p className="text-xs text-slate-500">{issue.project_name}</p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                          priorityBadge(issue.priority),
                        )}
                      >
                        {issue.priority}
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        {issue.status}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <svg className="mx-auto h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-slate-500">No pending tasks — you're all caught up!</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <h3 className="text-sm font-semibold text-slate-800">Recent Activity</h3>
              </div>
              {stats.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto p-3">
                  <div className="space-y-3">
                    {stats.recent_activity.map((a, i) => (
                      <div key={a.activity_id ?? i} className="flex gap-3">
                        {activityIcon(a.action)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-700 leading-snug">{describeActivity(a)}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {a.project_name ? `${a.project_name} · ` : ''}
                            {formatTimeAgo(a.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-slate-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── Active Projects ─── */}
          {stats.active_projects && stats.active_projects.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <h3 className="text-sm font-semibold text-slate-800">Active Projects</h3>
                <Link to="/projects" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  View all →
                </Link>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {stats.active_projects.map((project, index) => {
                  const total = parseInt(project.total_issues, 10) || 0
                  const done = parseInt(project.done_issues, 10) || 0
                  const open = parseInt(project.open_issues, 10) || 0
                  const progress = total > 0 ? Math.round((done / total) * 100) : 0
                  const colorClass = PROJECT_COLORS[index % PROJECT_COLORS.length]

                  return (
                    <Link
                      key={project.project_id}
                      to={`/project-dashboard/${project.project_id}`}
                      className="group block rounded-xl border border-slate-200/80 p-4 transition hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white',
                            colorClass,
                          )}
                        >
                          {(project.project_name || 'P').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
                            {project.project_name}
                          </p>
                          <p className="text-xs text-slate-500">{open} open · {project.member_count} members</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>{progress}% complete</span>
                          <span>{done}/{total}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', colorClass)}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── Recent Assigned Issues ─── */}
          {stats.recent_issues && stats.recent_issues.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <h3 className="text-sm font-semibold text-slate-800">Recently Assigned</h3>
              </div>
              <div className="divide-y divide-slate-50 p-1">
                {stats.recent_issues.map((issue) => (
                  <Link
                    key={issue.issue_id}
                    to={`/issue/${issue.issue_id}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-50"
                  >
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', statusDot(issue.status))} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{issue.title}</p>
                      <p className="text-xs text-slate-500">{issue.project_name}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                        priorityBadge(issue.priority),
                      )}
                    >
                      {issue.priority}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
