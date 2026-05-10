import { cn } from '../../utils/cn'

export default function StatCard({ title, value, description, accentClass, icon }) {
  return (
    <div className="card-hover relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value ?? <span className="text-slate-300">—</span>}
          </p>
          {description ? (
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{description}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm',
              accentClass || 'bg-slate-600',
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  )
}
