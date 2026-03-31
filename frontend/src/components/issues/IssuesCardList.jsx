import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import {
  assigneeLabel,
  issuePriority,
  issueRowId,
  issueStatus,
  priorityBadgeClass,
  rawIssueId,
  statusBadgeClass,
  statusLabelForIssue,
} from '../../utils/issueHelpers'

/**
 * @param {{
 *   issues: object[],
 *   onEdit: (issue: object) => void,
 *   onDelete: (issue: object) => void,
 *   deletingId: string | number | null,
 * }} props
 */
export default function IssuesCardList({ issues, onEdit, onDelete, deletingId }) {
  return (
    <ul className="grid list-none gap-3 p-0 md:hidden">
      {issues.map((issue, index) => {
        const id = rawIssueId(issue)
        return (
          <li key={issueRowId(issue, index)}>
            <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                {id != null ? (
                  <Link to={`/issue/${id}`} className="text-indigo-700 hover:text-indigo-900 hover:underline">
                    {issue.title ?? 'Untitled'}
                  </Link>
                ) : (
                  (issue.title ?? 'Untitled')
                )}
              </h2>
              {issue.description ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{issue.description}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                    priorityBadgeClass(issuePriority(issue)),
                  )}
                >
                  {issuePriority(issue)}
                </span>
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                    statusBadgeClass(issueStatus(issue)),
                  )}
                >
                  {statusLabelForIssue(issue)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Assigned: <span className="text-slate-700">{assigneeLabel(issue)}</span>
              </p>
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => onEdit(issue)}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(issue)}
                  disabled={id == null || deletingId === id}
                  className="flex-1 rounded-xl border border-red-200 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
