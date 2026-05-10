export default function LoadingPanel({ text = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  )
}
