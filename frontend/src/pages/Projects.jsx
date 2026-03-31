import { useState } from 'react'
import { Link } from 'react-router-dom'
import CreateProjectModal from '../components/projects/CreateProjectModal'
import ErrorBanner from '../components/ui/ErrorBanner'
import PageHeader from '../components/ui/PageHeader'
import { useProjectsList } from '../hooks/useProjectsList'
import { projectService } from '../services/projectService'
import { getErrorMessage } from '../utils/errorMessage'

function projectKey(p, index) {
  return p.id ?? p._id ?? p.slug ?? `project-${index}`
}

export default function Projects() {
  const { projects, loading, error, refetch, setProjects } = useProjectsList()
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [actionError, setActionError] = useState('')

  async function handleDelete(project) {
    const id = project.id ?? project._id
    if (id == null) return
    const name = project.name ?? project.title ?? 'this project'
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return
    setDeletingId(id)
    setActionError('')
    try {
      await projectService.remove(id)
      setProjects((prev) => prev.filter((p) => (p.id ?? p._id) !== id))
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not delete project.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="Create and organize workstreams. Projects appear in a responsive grid below."
        actions={
          <>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              New project
            </button>
          </>
        }
      />

      {error ? (
        <ErrorBanner message={error} onRetry={() => refetch()} />
      ) : null}

      {actionError ? (
        <ErrorBanner message={actionError} onRetry={() => setActionError('')} retryLabel="Dismiss" />
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/80"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center">
          <p className="font-medium text-slate-800">No projects yet</p>
          <p className="mt-1 text-sm text-slate-600">Create your first project to get started.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Create project
          </button>
        </div>
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => {
            const id = projectKey(project, index)
            const rawId = project.id ?? project._id
            const title = project.name ?? project.title ?? 'Untitled project'
            const desc = project.description ?? project.summary ?? 'No description yet.'
            return (
              <li key={id}>
                <article className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                  <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{desc}</p>
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {rawId != null ? (
                        <span className="truncate font-mono text-xs text-slate-400">ID {rawId}</span>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(project)}
                        disabled={deletingId === rawId || rawId == null}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === rawId ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                    {rawId != null ? (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/issues/${rawId}`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          Issues
                        </Link>
                        <Link
                          to={`/kanban/${rawId}`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Kanban
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => refetch()}
      />
    </div>
  )
}
