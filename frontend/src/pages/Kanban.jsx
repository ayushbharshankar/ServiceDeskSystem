import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ErrorBanner from '../components/ui/ErrorBanner'
import PageHeader from '../components/ui/PageHeader'
import { useIssuesList } from '../hooks/useIssuesList'
import { useProjectsList } from '../hooks/useProjectsList'
import { issueService } from '../services/issueService'
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
  todo: { title: 'To Do', apiStatus: 'pending' },
  in_progress: { title: 'In Progress', apiStatus: 'in_progress' },
  done: { title: 'Done', apiStatus: 'completed' },
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

function statusToColumn(status) {
  const s = String(status ?? '').toLowerCase().replace(/\s+/g, '_')
  if (s === 'completed' || s === 'done' || s === 'closed') return 'done'
  if (s === 'in_progress' || s === 'inprogress') return 'in_progress'
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

function resolveDropColumn(overId, columns) {
  if (overId == null) return null
  const id = String(overId)
  if (COLUMN_IDS.includes(id)) return id
  const issueFromDrag = parseIssueIdFromDrag(id)
  if (issueFromDrag) {
    for (const col of COLUMN_IDS) {
      if (columns[col].some((i) => String(rawIssueId(i)) === issueFromDrag)) {
        return col
      }
    }
  }
  return null
}

function findIssueColumn(columns, issueIdStr) {
  for (const col of COLUMN_IDS) {
    if (columns[col].some((i) => String(rawIssueId(i)) === issueIdStr)) return col
  }
  return null
}

function IssueDragPreview({ issue }) {
  const who = assigneeLabel(issue)
  const assigneeDisplay = who === '—' ? 'Unassigned' : who
  return (
    <div className="cursor-grabbing rounded-xl border border-slate-200 bg-white p-3 shadow-xl ring-2 ring-indigo-400/50">
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

function DraggableIssueCard({ issue, columnId }) {
  const id = dragId(issue)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type: 'issue', issue, sourceColumn: columnId },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined

  const who = assigneeLabel(issue)
  const assigneeDisplay = who === '—' ? 'Unassigned' : who

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab touch-none rounded-xl border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
      {...listeners}
      {...attributes}
    >
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

function KanbanColumn({ columnId, title, issues }) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: { type: 'column', columnId },
  })

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-medium text-slate-600">
          {issues.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[min(60vh,420px)] flex-1 flex-col gap-2 rounded-2xl border-2 border-dashed p-2 transition-colors sm:min-h-[min(70vh,520px)]',
          isOver ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-200 bg-slate-50/50',
        )}
      >
        {issues.map((issue, index) => (
          <DraggableIssueCard
            key={String(rawIssueId(issue) ?? index)}
            issue={issue}
            columnId={columnId}
          />
        ))}
        {issues.length === 0 ? (
          <p className="m-auto text-center text-xs text-slate-400">Drop issues here</p>
        ) : null}
      </div>
    </div>
  )
}

export default function Kanban() {
  const { projectId: projectIdParam } = useParams()
  const navigate = useNavigate()
  const projectId = projectIdParam ?? ''

  const { projects, loading: loadingProjects, error: projectsError, refetch: refetchProjects } =
    useProjectsList()
  const {
    issues,
    loading: loadingIssues,
    error: issuesError,
    refetch: refetchIssues,
    setIssues,
  } = useIssuesList(projectId)

  const columns = useMemo(() => partitionIssues(issues), [issues])
  const [activeIssue, setActiveIssue] = useState(null)
  const [dragError, setDragError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
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

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveIssue(null)
    if (!over) return

    const draggedIssueId = parseIssueIdFromDrag(active.id)
    if (!draggedIssueId) return

    const sourceColumn = active.data.current?.sourceColumn
    if (!sourceColumn || !COLUMN_IDS.includes(sourceColumn)) return

    const targetColumn = resolveDropColumn(over.id, columns)
    if (!targetColumn || targetColumn === sourceColumn) return

    const newStatus = COLUMN_META[targetColumn].apiStatus

    setDragError('')
    setIssues((prev) =>
      prev.map((i) => (String(rawIssueId(i)) === draggedIssueId ? { ...i, status: newStatus } : i)),
    )

    try {
      await issueService.update(draggedIssueId, { status: newStatus })
    } catch (err) {
      setDragError(getErrorMessage(err, 'Could not update issue status.'))
      refetchIssues()
    }
  }

  function handleDragStart(event) {
    const id = parseIssueIdFromDrag(event.active.id)
    if (!id) return
    const col = findIssueColumn(columns, id)
    if (!col) return
    const issue = columns[col].find((i) => String(rawIssueId(i)) === id)
    setActiveIssue(issue ?? null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <PageHeader
        title="Kanban board"
        description="Drag cards between columns. Status updates are saved to the server when you drop."
        actions={
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
          className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
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

      {dragError ? (
        <ErrorBanner
          tone="warning"
          message={dragError}
          onRetry={() => setDragError('')}
          retryLabel="Dismiss"
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
          collisionDetection={closestCorners}
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
