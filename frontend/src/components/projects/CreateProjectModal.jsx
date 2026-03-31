import { useEffect, useId, useRef, useState } from 'react'
import { projectService } from '../../services/projectService'
import { getErrorMessage } from '../../utils/errorMessage'
import { cn } from '../../utils/cn'

/**
 * @param {{ open: boolean, onClose: () => void, onCreated: () => void }} props
 */
export default function CreateProjectModal({ open, onClose, onCreated }) {
  const titleId = useId()
  const nameInputRef = useRef(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
    setErrors({})
    setFormError('')
    const t = requestAnimationFrame(() => nameInputRef.current?.focus())
    return () => cancelAnimationFrame(t)
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
    const trimmed = name.trim()
    if (!trimmed) next.name = 'Project name is required'
    else if (trimmed.length > 120) next.name = 'Keep the name under 120 characters'
    const desc = description.trim()
    if (desc.length > 2000) next.description = 'Description is too long (max 2000 characters)'
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
    try {
      await projectService.create({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onCreated()
      onClose()
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not create project. Try again.'))
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
        className="relative z-10 m-0 max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:m-4 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            New project
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

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {formError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {formError}
            </p>
          ) : null}

          <div>
            <label htmlFor="project-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Project name
            </label>
            <input
              ref={nameInputRef}
              id="project-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
              }}
              autoComplete="off"
              className={cn(
                'w-full rounded-xl border bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:ring-2',
                errors.name
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20',
              )}
              placeholder="e.g. Website redesign"
            />
            {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="project-description" className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) setErrors((p) => ({ ...p, description: undefined }))
              }}
              rows={4}
              className={cn(
                'w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:ring-2',
                errors.description
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20',
              )}
              placeholder="Goals, scope, or links for your team…"
            />
            {errors.description ? (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            ) : null}
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
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
