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

function DetailField({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}

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
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          to={issuesListPath}
          className="inline-flex items-center gap-1.5 font-medium text-slate-500 transition hover:text-indigo-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All issues
        </Link>
      </div>

      {loading ? <LoadingPanel /> : null}

      {error ? (
        <ErrorBanner message={error} onRetry={() => refetch()} />
      ) : null}

      {!loading && issue ? (
        <>
          <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="p-6 sm:p-8">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {issue.title ?? 'Untitled issue'}
              </h1>

              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <DetailField label="Status">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                      statusBadgeClass(issue.status),
                    )}
                  >
                    {statusLabelForIssue(issue)}
                  </span>
                </DetailField>
                <DetailField label="Priority">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                      priorityBadgeClass(issue.priority),
                    )}
                  >
                    {issue.priority ?? '—'}
                  </span>
                </DetailField>
                <DetailField label="Assignee">
                  <div className="flex items-center gap-2">
                    {assignedLabel !== 'Unassigned' && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700">
                        {assignedLabel.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-900">{assignedLabel}</span>
                  </div>
                </DetailField>
              </dl>
            </div>

            <div className="border-t border-slate-100 p-6 sm:p-8">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {issue.description?.trim() ? issue.description : (
                  <span className="italic text-slate-400">No description provided.</span>
                )}
              </div>
            </div>
          </article>

          <Comments issueId={issueId} title="Discussion" />
        </>
      ) : null}
    </div>
  )
}
