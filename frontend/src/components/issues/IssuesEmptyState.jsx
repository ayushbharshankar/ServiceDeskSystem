/**
 * @param {{ issueCount: number, onCreate: () => void }} props
 */
export default function IssuesEmptyState({ issueCount, onCreate }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-14 text-center">
      <p className="font-medium text-slate-800">No issues match</p>
      <p className="mt-1 text-sm text-slate-600">
        {issueCount === 0
          ? 'Create an issue for this project.'
          : 'Try a different search term or adjust status / priority filters.'}
      </p>
      {issueCount === 0 ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New issue
        </button>
      ) : null}
    </div>
  )
}
