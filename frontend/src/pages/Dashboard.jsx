import { useAuth } from '../context/AuthContext'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import StatCard from '../components/dashboard/StatCard'
import ErrorBanner from '../components/ui/ErrorBanner'
import PageHeader from '../components/ui/PageHeader'
import { useDashboardStats } from '../hooks/useDashboardStats'

const iconClass = 'h-5 w-5'

export default function Dashboard() {
  const { stats, loading, error, refetch } = useDashboardStats()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Live metrics from your projects and issues. Counts update when you refresh or return to this page."
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total projects"
            value={stats.total_projects}
            description="Projects you are a member of or manage."
            accentClass="bg-gradient-to-br from-indigo-500 to-indigo-600"
            icon={
              <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            }
          />
          <StatCard
            title="Assigned tasks"
            value={stats.total_tasks}
            description="Total issues assigned to you across projects."
            accentClass="bg-gradient-to-br from-sky-500 to-blue-600"
            icon={
              <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
          />
          <StatCard
            title="Pending tasks"
            value={stats.pending_tasks}
            description="Your open issues with status 'To Do'."
            accentClass="bg-gradient-to-br from-amber-500 to-orange-500"
            icon={
              <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          {stats.total_users != null ? (
            <StatCard
              title="Total Users"
              value={stats.total_users}
              description="Total registered users in the system."
              accentClass="bg-gradient-to-br from-emerald-500 to-teal-600"
              icon={
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
            />
          ) : (
            <StatCard
              title="Completed tasks"
              value={stats.completed_tasks}
              description="Your tasks marked as 'Done'."
              accentClass="bg-gradient-to-br from-emerald-500 to-teal-600"
              icon={
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
