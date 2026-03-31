import { PRIORITIES, STATUSES } from '../../constants/issues'

/**
 * @param {{
 *   projects: object[],
 *   projectId: string,
 *   loadingProjects: boolean,
 *   onProjectChange: (projectId: string) => void,
 *   filterStatus: string,
 *   onFilterStatus: (v: string) => void,
 *   filterPriority: string,
 *   onFilterPriority: (v: string) => void,
 *   searchTitle: string,
 *   onSearchTitle: (v: string) => void,
 *   hasActiveFilters: boolean,
 *   onClearFilters: () => void,
 * }} props
 */
export default function IssuesFilterBar({
  projects,
  projectId,
  loadingProjects,
  onProjectChange,
  filterStatus,
  onFilterStatus,
  filterPriority,
  onFilterPriority,
  searchTitle,
  onSearchTitle,
  hasActiveFilters,
  onClearFilters,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filter and search</p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="self-start text-xs font-semibold text-indigo-600 hover:text-indigo-800 sm:self-auto"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="mb-4">
        <label
          htmlFor="issue-search-title"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          Search by title
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            id="issue-search-title"
            type="search"
            value={searchTitle}
            onChange={(e) => onSearchTitle(e.target.value)}
            placeholder="Type to filter issues by title…"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          <label htmlFor="issue-project" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Project
          </label>
          <select
            id="issue-project"
            value={projectId}
            onChange={(e) => onProjectChange(e.target.value)}
            disabled={loadingProjects || projects.length === 0}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
          >
            {projects.length === 0 ? (
              <option value="">No projects</option>
            ) : (
              projects.map((p, i) => {
                const id = String(p.id ?? p._id ?? i)
                const name = p.name ?? p.title ?? `Project ${id}`
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                )
              })
            )}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor="filter-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Status
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => onFilterStatus(e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <label htmlFor="filter-priority" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Priority
          </label>
          <select
            id="filter-priority"
            value={filterPriority}
            onChange={(e) => onFilterPriority(e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
