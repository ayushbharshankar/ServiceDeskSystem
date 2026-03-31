import { Link, useParams } from 'react-router-dom'
import Comments from '../components/Comments'
import ErrorBanner from '../components/ui/ErrorBanner'
import LoadingPanel from '../components/ui/LoadingPanel'
import { useIssue } from '../hooks/useIssue'
import { cn } from '../utils/cn'
import {
  assigneeLabel,
  priorityBadgeClass,
  statusBadgeClass,
  statusLabelForIssue,
} from '../utils/issueHelpers'

export default function IssueDetail() {
  const { issueId } = useParams()
  const { issue, loading, error, refetch } = useIssue(issueId)

  const issuesListPath =
    issue?.projectId != null || issue?.project_id != null
      ? `/issues/${issue.projectId ?? issue.project_id}`
      : '/issues'

  const assignedLabel = issue
    ? (() => {
        const label = assigneeLabel(issue)
        return label === '—' ? 'Unassigned' : label
      })()
    : '—'

  if (!issueId) {
    return (
      <p className="text-slate-600">
        Invalid issue.{' '}
        <Link to="/issues" className="text-indigo-600 hover:underline">
          Back to issues
        </Link>
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          to={issuesListPath}
          className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700"
        >
          <span aria-hidden>←</span> All issues
        </Link>
      </div>

      {loading ? <LoadingPanel /> : null}

      {error ? (
        <ErrorBanner message={error} onRetry={() => refetch()} />
      ) : null}

      {!loading && issue ? (
        <>
          <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {issue.title ?? 'Untitled issue'}
            </h1>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                      statusBadgeClass(issue.status),
                    )}
                  >
                    {statusLabelForIssue(issue)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</dt>
                <dd className="mt-1">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                      priorityBadgeClass(issue.priority),
                    )}
                  >
                    {issue.priority ?? '—'}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Assigned user
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{assignedLabel}</dd>
              </div>
            </dl>

            <div className="mt-8 border-t border-slate-100 pt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Description</h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {issue.description?.trim() ? issue.description : (
                  <span className="text-slate-400">No description provided.</span>
                )}
              </div>
            </div>
          </article>

          <Comments issueId={issueId} title="Comments" />
        </>
      ) : null}
    </div>
  )
}
