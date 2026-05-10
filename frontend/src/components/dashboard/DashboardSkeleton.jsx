export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/80" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/80" />
    </div>
  )
}
