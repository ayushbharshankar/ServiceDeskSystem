import { useEffect, useId, useRef, useState } from 'react'
import { issueService } from '../../services/issueService'
import { userService } from '../../services/userService'
import { PRIORITIES, STATUSES } from '../../constants/issues'
import { getErrorMessage } from '../../utils/errorMessage'
import { normalizeUsers } from '../../utils/normalize'
import { cn } from '../../utils/cn'
import { rawIssueId, toFormState } from '../../utils/issueHelpers'

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   mode: 'create' | 'edit',
 *   projectId: string,
 *   initialIssue: object | null,
 *   onSaved: () => void,
 * }} props
 */
export default function IssueFormModal({
  open,
  onClose,
  mode,
  projectId,
  initialIssue,
  onSaved,
}) {
  const titleId = useId()
  const firstFieldRef = useRef(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('pending')
  const [assigneeId, setAssigneeId] = useState('')
  const [users, setUsers] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setFormError('')
    setErrors({})
    if (mode === 'edit' && initialIssue) {
      const s = toFormState(initialIssue)
      setTitle(s.title)
      setDescription(s.description)
      setPriority(s.priority)
      setStatus(s.status)
      setAssigneeId(s.assigneeId)
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setStatus('pending')
      setAssigneeId('')
    }
    const t = requestAnimationFrame(() => firstFieldRef.current?.focus())
    return () => cancelAnimationFrame(t)
  }, [open, mode, initialIssue])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await userService.list()
        if (!cancelled) setUsers(normalizeUsers(data))
      } catch {
        if (!cancelled) setUsers([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function validate() {
    const next = {}
    if (!title.trim()) next.title = 'Title is required'
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const v = validate()
    if (Object.keys(v).length) {
      setErrors(v)
      return
    }
    setErrors({})
    setSubmitting(true)
    const body = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      assigneeId: assigneeId.trim() ? assigneeId.trim() : null,
    }
    try {
      if (mode === 'create') {
        if (!projectId) {
          setFormError('Select a project first.')
          return
        }
        await issueService.create({ ...body, projectId })
      } else {
        const id = rawIssueId(initialIssue)
        if (id == null) return
        await issueService.update(id, body)
      }
      onSaved()
      onClose()
    } catch (err) {
      setFormError(getErrorMessage(err, 'Something went wrong.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 m-0 max-h-[min(90vh,800px)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:m-4 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            {mode === 'create' ? 'New issue' : 'Edit issue'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {formError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {formError}
            </p>
          ) : null}

          <div>
            <label htmlFor="issue-title" className="mb-1.5 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              ref={firstFieldRef}
              id="issue-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors((p) => ({ ...p, title: undefined }))
              }}
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-slate-900 outline-none focus:ring-2',
                errors.title
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20',
              )}
              placeholder="Short summary"
            />
            {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title}</p> : null}
          </div>

          <div>
            <label htmlFor="issue-description" className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="issue-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Steps, context, acceptance criteria…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="issue-priority" className="mb-1.5 block text-sm font-medium text-slate-700">
                Priority
              </label>
              <select
                id="issue-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="issue-status" className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="issue-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="issue-assignee" className="mb-1.5 block text-sm font-medium text-slate-700">
              Assigned user
            </label>
            {users.length > 0 ? (
              <select
                id="issue-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Unassigned</option>
                {users.map((u, i) => {
                  const uid = String(u.id ?? u._id ?? i)
                  const label = u.name ?? u.email ?? u.username ?? uid
                  return (
                    <option key={uid} value={uid}>
                      {label}
                    </option>
                  )
                })}
              </select>
            ) : (
              <input
                id="issue-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="User ID (optional, if /users is unavailable)"
              />
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : mode === 'create' ? 'Create issue' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
