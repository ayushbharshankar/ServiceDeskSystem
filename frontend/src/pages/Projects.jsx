import { useState } from 'react'
import { Link } from 'react-router-dom'
import CreateProjectModal from '../components/projects/CreateProjectModal'
import ProjectMembersModal from '../components/projects/ProjectMembersModal'
import ErrorBanner from '../components/ui/ErrorBanner'
import PageHeader from '../components/ui/PageHeader'
import { useProjects } from '../context/ProjectsContext'
import { projectService } from '../services/projectService'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'
import { cn } from '../utils/cn'

const PROJECT_COLORS = [
  'from-indigo-500 to-violet-600', 'from-blue-500 to-cyan-600', 'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600', 'from-lime-500 to-green-600',
]

function projectKey(p, index) {
  return p.id ?? p._id ?? p.slug ?? `project-${index}`
}

export default function Projects() {
  const { projects, loading, error, refetch, setProjects } = useProjects()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [membersProject, setMembersProject] = useState(null)

  async function handleDelete(project) {
    const id = project.id ?? project._id
    if (id == null) return
    const name = project.name ?? project.title ?? 'this project'
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await projectService.remove(id)
      setProjects((prev) => prev.filter((p) => (p.id ?? p._id) !== id))
      toast.success('Deleted', `"${name}" has been deleted.`)
    } catch (err) {
      toast.error('Error', getErrorMessage(err, 'Could not delete project.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Create and organize workstreams."
        actions={
          <>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              New project
            </button>
          </>
        }
      />

      {error ? (
        <ErrorBanner message={error} onRetry={() => refetch()} />
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/80"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="mt-3 font-medium text-slate-800">No projects yet</p>
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
            const memberCount = project.member_count ?? 0
            const issueCount = project.issue_count ?? 0
            const colorClass = PROJECT_COLORS[index % PROJECT_COLORS.length]

            return (
              <li key={id}>
                <article className="card-hover flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                  {/* Color bar */}
                  <div className={cn('h-1.5 bg-gradient-to-r', colorClass)} />

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-semibold text-slate-900 leading-tight">{title}</h2>
                      <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
                        <span title={`${issueCount} issues`}>{issueCount} issues</span>
                      </div>
                    </div>

                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">{desc}</p>

                    {/* Meta */}
                    <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => setMembersProject(project)}
                        className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {memberCount} members
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                      {rawId != null && (
                        <>
                          <Link
                            to={`/project-dashboard/${rawId}`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Dashboard
                          </Link>
                          <Link
                            to={`/issues/${rawId}`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-50"
                          >
                            Issues
                          </Link>
                          <Link
                            to={`/kanban/${rawId}`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Kanban
                          </Link>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(project)}
                        disabled={deletingId === rawId || rawId == null}
                        className="ml-auto rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === rawId ? '…' : 'Delete'}
                      </button>
                    </div>
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

      <ProjectMembersModal
        open={membersProject != null}
        onClose={() => setMembersProject(null)}
        projectId={membersProject?.id ?? membersProject?._id}
        projectName={membersProject?.name ?? membersProject?.title}
      />
    </div>
  )
}
