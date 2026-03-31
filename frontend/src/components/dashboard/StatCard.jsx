import { cn } from '../../utils/cn'

/**
 * @param {{
 *   title: string,
 *   value: number,
 *   description?: string,
 *   icon: import('react').ReactNode,
 *   accentClass: string,
 * }} props
 */
export default function StatCard({ title, value, description, icon, accentClass }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition',
        'hover:border-slate-300 hover:shadow-md',
      )}
    >
      <div
        className={cn(
          'mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm',
          accentClass,
        )}
      >
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
        {value}
      </p>
      {description ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p>
      ) : null}
    </div>
  )
}
