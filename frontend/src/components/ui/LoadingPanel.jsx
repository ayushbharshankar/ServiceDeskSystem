/** @param {{ lines?: number }} props */
export default function LoadingPanel({ lines = 3 }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-lg bg-slate-100 ${i === 0 ? 'h-8 w-2/3' : i === 1 ? 'h-24 w-full' : 'h-10 max-w-md'}`}
        />
      ))}
    </div>
  )
}
