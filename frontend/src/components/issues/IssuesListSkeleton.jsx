export default function IssuesListSkeleton() {
  return (
    <>
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="h-56 animate-pulse bg-slate-100" />
      </div>
      <div className="space-y-3 md:hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
        ))}
      </div>
    </>
  )
}
