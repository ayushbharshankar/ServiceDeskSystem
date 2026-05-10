import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ErrorBanner from '../components/ui/ErrorBanner'
import PageHeader from '../components/ui/PageHeader'
import { useIssuesList } from '../hooks/useIssuesList'
import { useProjects } from '../context/ProjectsContext'
import { useAuth } from '../context/AuthContext'
import { issueService } from '../services/issueService'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'
import {
  assigneeLabel,
  issuePriority,
  priorityBadgeClass,
  rawIssueId,
} from '../utils/issueHelpers'
import { cn } from '../utils/cn'

const COLUMN_IDS = ['todo', 'in_progress', 'done']

const COLUMN_META = {
  todo: { title: 'To Do', dbStatus: 'To Do', color: 'text-slate-600', dot: 'bg-slate-400' },
  in_progress: { title: 'In Progress', dbStatus: 'In Progress', color: 'text-blue-600', dot: 'bg-blue-500' },
  done: { title: 'Done', dbStatus: 'Done', color: 'text-emerald-600', dot: 'bg-emerald-500' },
}

const DRAG_PREFIX = 'issue:'

function dragId(issue) {
  const id = issue?.id ?? issue?._id
  return id != null ? `${DRAG_PREFIX}${id}` : `issue:unknown`
}

function parseIssueIdFromDrag(dragIdValue) {
  const s = String(dragIdValue)
  return s.startsWith(DRAG_PREFIX) ? s.slice(DRAG_PREFIX.length) : null
}

/** Maps ANY status string to a column key */
function statusToColumn(status) {
  if (!status) return 'todo'
  const s = String(status).toLowerCase().replace(/[\s_-]+/g, '')
  if (s === 'done' || s === 'completed' || s === 'closed') return 'done'
  if (s === 'inprogress') return 'in_progress'
  return 'todo'
}

function partitionIssues(issues) {
  const columns = { todo: [], in_progress: [], done: [] }
  for (const issue of issues) {
    const col = statusToColumn(issue.status)
    columns[col].push(issue)
  }
  return columns
}

/** Check if user can update this issue's status */
function canUserUpdateStatus(issue, userId, userRole) {
  if (!userId) return false
  if (userRole === 'Admin') return true
  const assignedTo = issue.assigned_to ?? issue.assignedTo
  if (assignedTo != null && String(assignedTo) === String(userId)) return true
  // Project owners/admins — we allow drag for all, backend will enforce
  // For now, if they are NOT the assignee, show a visual hint
  return false
}

/**
 * Custom collision detection that only considers column droppables.
 */
function columnsOnlyCollision(args) {
  const columnContainers = args.droppableContainers.filter((container) =>
    COLUMN_IDS.includes(String(container.id)),
  )
  return rectIntersection({ ...args, droppableContainers: columnContainers })
}

function IssueDragPreview({ issue }) {
  const who = assigneeLabel(issue)
  const assigneeDisplay = who === '—' ? 'Unassigned' : who
  return (
    <div className="w-64 cursor-grabbing rounded-xl border border-indigo-200 bg-white p-3 shadow-2xl ring-2 ring-indigo-400/40">
      <p className="text-sm font-semibold leading-snug text-slate-900">{issue.title ?? 'Untitled'}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
            priorityBadgeClass(issuePriority(issue)),
          )}
        >
          {issuePriority(issue)}
        </span>
        <span className="truncate text-xs text-slate-500" title={assigneeDisplay}>
          {assigneeDisplay}
        </span>
      </div>
    </div>
  )
}

function DraggableIssueCard({ issue, columnId, canDrag }) {
  const id = dragId(issue)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type: 'issue', issue, sourceColumn: columnId },
    disabled: !canDrag,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px,${transform.y}px,0)`,
        zIndex: isDragging ? 999 : undefined,
      }
    : undefined

  const who = assigneeLabel(issue)
  const assigneeDisplay = who === '—' ? 'Unassigned' : who
  const navigate = useNavigate()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-150',
        canDrag && 'cursor-grab touch-none active:cursor-grabbing',
        !canDrag && 'cursor-default',
        isDragging && 'scale-[1.02] opacity-30 shadow-lg ring-2 ring-indigo-300',
        !isDragging && canDrag && 'hover:border-slate-300 hover:shadow-md',
      )}
      {...(canDrag ? listeners : {})}
      {...(canDrag ? attributes : {})}
      title={!canDrag ? 'Only the assigned user can update this issue' : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className="flex-1 text-sm font-semibold leading-snug text-slate-900 group-hover:text-indigo-700 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            const issueId = rawIssueId(issue)
            if (issueId != null) navigate(`/issue/${issueId}`)
          }}
        >
          {issue.title ?? 'Untitled'}
        </p>
        {!canDrag && (
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" title="Locked">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
            priorityBadgeClass(issuePriority(issue)),
          )}
        >
          {issuePriority(issue)}
        </span>
        <span className="truncate text-xs text-slate-500" title={assigneeDisplay}>
          {assigneeDisplay}
        </span>
      </div>
    </div>
  )
}

function KanbanColumn({ columnId, title, issues, dotColor, userId, userRole }) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: { type: 'column', columnId },
  })

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cn('h-2.5 w-2.5 rounded-full', dotColor)} />
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <span className="ml-auto rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-medium text-slate-600">
          {issues.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[min(60vh,420px)] flex-1 flex-col gap-2.5 rounded-2xl border-2 p-2.5 transition-all duration-200 sm:min-h-[min(70vh,520px)]',
          isOver
            ? 'border-indigo-400 bg-indigo-50/60 shadow-inner shadow-indigo-100'
            : 'border-dashed border-slate-200 bg-slate-50/40',
        )}
      >
        {issues.map((issue, index) => (
          <DraggableIssueCard
            key={String(rawIssueId(issue) ?? index)}
            issue={issue}
            columnId={columnId}
            canDrag={canUserUpdateStatus(issue, userId, userRole)}
          />
        ))}
        {issues.length === 0 ? (
          <div className="m-auto flex flex-col items-center gap-1 py-8">
            <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-center text-xs text-slate-400">Drop issues here</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function Kanban() {
  const { projectId: projectIdParam } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const projectId = projectIdParam ?? ''

  const userId = user?.user_id ?? user?.id ?? user?._id
  const userRole = user?.role

  const { projects, loading: loadingProjects, error: projectsError, refetch: refetchProjects } =
    useProjects()
  const {
    issues,
    loading: loadingIssues,
    error: issuesError,
    refetch: refetchIssues,
    setIssues,
  } = useIssuesList(projectId)

  const columns = useMemo(() => partitionIssues(issues), [issues])
  const [activeIssue, setActiveIssue] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  )

  useEffect(() => {
    if (loadingProjects) return
    if (!projectId || projects.length === 0) return
    const ok = projects.some((p) => String(p.id ?? p._id) === String(projectId))
    if (!ok) {
      navigate('/projects', { replace: true })
    }
  }, [loadingProjects, projects, projectId, navigate])

  const listError = projectsError || issuesError

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event
    setActiveIssue(null)

    if (!over) return

    const draggedIssueId = parseIssueIdFromDrag(active.id)
    if (!draggedIssueId) return

    const sourceColumn = active.data.current?.sourceColumn
    if (!sourceColumn || !COLUMN_IDS.includes(sourceColumn)) return

    const targetColumn = COLUMN_IDS.includes(String(over.id)) ? String(over.id) : null
    if (!targetColumn || targetColumn === sourceColumn) return

    const newDbStatus = COLUMN_META[targetColumn].dbStatus

    // Optimistic update
    const prevIssues = [...issues]
    setIssues((prev) =>
      prev.map((i) =>
        String(rawIssueId(i)) === draggedIssueId
          ? { ...i, status: newDbStatus }
          : i,
      ),
    )

    try {
      await issueService.updateStatus(draggedIssueId, newDbStatus)
      toast.success('Status updated', `Moved to ${COLUMN_META[targetColumn].title}`)
    } catch (err) {
      // Rollback on failure
      setIssues(prevIssues)
      const msg = err.response?.data?.message || getErrorMessage(err, 'Could not update issue status.')
      const isForbidden = err.response?.status === 403
      toast.error(
        isForbidden ? 'Permission denied' : 'Update failed',
        msg,
      )
    }
  }, [issues, setIssues, toast])

  function handleDragStart(event) {
    const id = parseIssueIdFromDrag(event.active.id)
    if (!id) return
    for (const col of COLUMN_IDS) {
      const issue = columns[col].find((i) => String(rawIssueId(i)) === id)
      if (issue) {
        setActiveIssue(issue)
        return
      }
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <PageHeader
        title="Kanban board"
        description="Drag cards between columns to update status."
        actions={
          <button
            type="button"
            onClick={() => {
              refetchProjects()
              refetchIssues()
            }}
            disabled={loadingIssues || !projectId || loadingProjects}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh
          </button>
        }
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <label htmlFor="kanban-project" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Project
        </label>
        <select
          id="kanban-project"
          value={projectId}
          onChange={(e) => navigate(`/kanban/${e.target.value}`)}
          disabled={loadingProjects || projects.length === 0}
          className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
        >
          {projects.length === 0 ? (
            <option value="">No projects</option>
          ) : (
            projects.map((p, i) => {
              const id = String(p.id ?? p._id ?? i)
              return (
                <option key={id} value={id}>
                  {p.name ?? p.title ?? `Project ${id}`}
                </option>
              )
            })
          )}
        </select>
      </div>

      {listError ? (
        <ErrorBanner
          tone="warning"
          title="Could not load data"
          message={listError}
          onRetry={() => {
            refetchProjects()
            refetchIssues()
          }}
        />
      ) : null}

      {loadingIssues && projectId ? (
        <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : null}

      {!loadingIssues && projectId ? (
        <DndContext
          sensors={sensors}
          collisionDetection={columnsOnlyCollision}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveIssue(null)}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {COLUMN_IDS.map((columnId) => (
              <KanbanColumn
                key={columnId}
                columnId={columnId}
                title={COLUMN_META[columnId].title}
                issues={columns[columnId]}
                dotColor={COLUMN_META[columnId].dot}
                userId={userId}
                userRole={userRole}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeIssue ? <IssueDragPreview issue={activeIssue} /> : null}
          </DragOverlay>
        </DndContext>
      ) : null}
    </div>
  )
}
