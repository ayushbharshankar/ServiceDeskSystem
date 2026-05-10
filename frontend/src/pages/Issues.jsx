import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import IssueFormModal from '../components/issues/IssueFormModal'
import IssuesCardList from '../components/issues/IssuesCardList'
import IssuesEmptyState from '../components/issues/IssuesEmptyState'
import IssuesFilterBar from '../components/issues/IssuesFilterBar'
import IssuesListSkeleton from '../components/issues/IssuesListSkeleton'
import IssuesTable from '../components/issues/IssuesTable'
import ErrorBanner from '../components/ui/ErrorBanner'
import PageHeader from '../components/ui/PageHeader'
import { useIssuesList } from '../hooks/useIssuesList'
import { useProjects } from '../context/ProjectsContext'
import { issueService } from '../services/issueService'
import { getErrorMessage } from '../utils/errorMessage'
import { issuePriority, issueStatus, rawIssueId } from '../utils/issueHelpers'

export default function Issues() {
  const { projectId: projectIdParam } = useParams()
  const navigate = useNavigate()
  const projectId = projectIdParam ?? ''

  const { projects, loading: loadingProjects, error: projectsError, refetch: refetchProjects } =
    useProjects()
  const {
    issues,
    loading: loadingIssues,
    error: issuesError,
    refetch: refetchIssues,
    setIssues,
  } = useIssuesList(projectId)

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [searchTitle, setSearchTitle] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteUiError, setDeleteUiError] = useState('')

  useEffect(() => {
    if (loadingProjects) return
    if (!projectId || projects.length === 0) return
    const ok = projects.some((p) => String(p.id ?? p._id) === String(projectId))
    if (!ok) {
      navigate('/projects', { replace: true })
    }
  }, [loadingProjects, projects, projectId, navigate])

  const filteredIssues = useMemo(() => {
    const q = searchTitle.trim().toLowerCase()
    return issues.filter((issue) => {
      if (filterStatus !== 'all' && String(issueStatus(issue)) !== filterStatus) return false
      if (filterPriority !== 'all' && String(issuePriority(issue)) !== filterPriority) {
        return false
      }
      if (q) {
        const title = String(issue.title ?? '').toLowerCase()
        if (!title.includes(q)) return false
      }
      return true
    })
  }, [issues, filterStatus, filterPriority, searchTitle])

  const hasActiveFilters =
    filterStatus !== 'all' || filterPriority !== 'all' || searchTitle.trim() !== ''

  const listBannerMessage = projectsError || issuesError

  async function handleDelete(issue) {
    const id = rawIssueId(issue)
    if (id == null) return
    const t = issue.title ?? 'this issue'
    if (!window.confirm(`Delete issue “${t}”?`)) return
    setDeletingId(id)
    setDeleteUiError('')
    try {
      await issueService.remove(id)
      setIssues((prev) => prev.filter((x) => rawIssueId(x) !== id))
    } catch (err) {
      setDeleteUiError(getErrorMessage(err, 'Could not delete issue.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Issues"
        description="Track work by project. Search by title and narrow down with status and priority filters."
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                refetchProjects()
                refetchIssues()
              }}
              disabled={loadingIssues || !projectId || loadingProjects}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={!projectId}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              New issue
            </button>
          </>
        }
      />

      <IssuesFilterBar
        projects={projects}
        projectId={projectId}
        loadingProjects={loadingProjects}
        onProjectChange={(id) => navigate(`/issues/${id}`)}
        filterStatus={filterStatus}
        onFilterStatus={setFilterStatus}
        filterPriority={filterPriority}
        onFilterPriority={setFilterPriority}
        searchTitle={searchTitle}
        onSearchTitle={setSearchTitle}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          setFilterStatus('all')
          setFilterPriority('all')
          setSearchTitle('')
        }}
      />

      {listBannerMessage ? (
        <ErrorBanner
          tone="warning"
          title="Could not load data"
          message={listBannerMessage}
          onRetry={() => {
            refetchProjects()
            refetchIssues()
          }}
        />
      ) : null}

      {deleteUiError ? (
        <ErrorBanner
          message={deleteUiError}
          onRetry={() => setDeleteUiError('')}
          retryLabel="Dismiss"
        />
      ) : null}

      {loadingIssues && projectId ? <IssuesListSkeleton /> : null}

      {!loadingIssues && projectId && filteredIssues.length === 0 ? (
        <IssuesEmptyState issueCount={issues.length} onCreate={() => setCreateOpen(true)} />
      ) : null}

      {!loadingIssues && filteredIssues.length > 0 ? (
        <>
          <IssuesTable
            issues={filteredIssues}
            onEdit={setEditingIssue}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
          <IssuesCardList
            issues={filteredIssues}
            onEdit={setEditingIssue}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </>
      ) : null}

      <IssueFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="create"
        projectId={projectId}
        initialIssue={null}
        onSaved={() => refetchIssues()}
      />
      <IssueFormModal
        open={editingIssue != null}
        onClose={() => setEditingIssue(null)}
        mode="edit"
        projectId={projectId}
        initialIssue={editingIssue}
        onSaved={() => refetchIssues()}
      />
    </div>
  )
}
