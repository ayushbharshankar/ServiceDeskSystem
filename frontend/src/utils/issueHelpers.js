import { STATUSES } from '../constants/issues'

export function rawIssueId(issue) {
  return issue?.id ?? issue?._id
}

export function issueRowId(issue, index) {
  return issue?.id ?? issue?._id ?? `issue-${index}`
}

export function assigneeLabel(issue) {
  if (!issue) return '—'
  const a = issue.assignee
  if (a && typeof a === 'object') {
    return a.name ?? a.email ?? a.username ?? String(a.id ?? a._id ?? '')
  }
  return (
    issue.assigneeName ??
    issue.assigneeEmail ??
    (issue.assigneeId != null ? `User #${issue.assigneeId}` : null) ??
    (issue.assignedTo != null ? `User #${issue.assignedTo}` : null) ??
    '—'
  )
}

export function issuePriority(issue) {
  return issue?.priority ?? '—'
}

export function issueStatus(issue) {
  return issue?.status ?? '—'
}

export function statusLabelForIssue(issue) {
  return (
    STATUSES.find((s) => s.value === String(issue?.status ?? '').toLowerCase())?.label ??
    issue?.status ??
    '—'
  )
}

export function toFormState(issue) {
  const aid = issue.assigneeId ?? issue.assignee?.id ?? issue.assignee?._id ?? issue.assignedTo
  return {
    title: issue.title ?? '',
    description: issue.description ?? '',
    priority: issue.priority ?? 'medium',
    status: issue.status ?? 'pending',
    assigneeId: aid != null ? String(aid) : '',
  }
}

export function priorityBadgeClass(p) {
  switch (String(p).toLowerCase()) {
    case 'critical':
      return 'bg-rose-100 text-rose-800 ring-rose-600/20'
    case 'high':
      return 'bg-orange-100 text-orange-800 ring-orange-600/20'
    case 'medium':
      return 'bg-amber-100 text-amber-900 ring-amber-600/20'
    case 'low':
      return 'bg-slate-100 text-slate-700 ring-slate-600/15'
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-600/10'
  }
}

export function statusBadgeClass(s) {
  switch (String(s).toLowerCase()) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 ring-emerald-600/20'
    case 'in_progress':
      return 'bg-indigo-100 text-indigo-800 ring-indigo-600/20'
    case 'pending':
      return 'bg-slate-100 text-slate-700 ring-slate-600/15'
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-600/10'
  }
}
