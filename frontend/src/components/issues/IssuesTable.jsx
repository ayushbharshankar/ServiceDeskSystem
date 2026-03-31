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
export default function IssuesTable({ issues, onEdit, onDelete, deletingId }) {
  return (
    <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {issues.map((issue, index) => {
              const id = rawIssueId(issue)
              return (
                <tr key={issueRowId(issue, index)} className="bg-white hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {id != null ? (
                        <Link to={`/issue/${id}`} className="text-indigo-700 hover:text-indigo-900 hover:underline">
                          {issue.title ?? 'Untitled'}
                        </Link>
                      ) : (
                        (issue.title ?? 'Untitled')
                      )}
                    </p>
                    {issue.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{issue.description}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                        priorityBadgeClass(issuePriority(issue)),
                      )}
                    >
                      {issuePriority(issue)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                        statusBadgeClass(issueStatus(issue)),
                      )}
                    >
                      {statusLabelForIssue(issue)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{assigneeLabel(issue)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(issue)}
                      className="mr-2 rounded-lg px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(issue)}
                      disabled={id == null || deletingId === id}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
