import { useToastState } from '../../context/ToastContext'
import { cn } from '../../utils/cn'

const ICON = {
  success: (
    <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const BG = {
  success: 'border-emerald-200 bg-emerald-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'border-blue-200 bg-blue-50',
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastState()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col-reverse gap-2 sm:bottom-6 sm:right-6" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'animate-toast-in flex w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border p-3 shadow-lg backdrop-blur-sm',
            BG[t.type] ?? BG.info,
          )}
        >
          <span className="mt-0.5 shrink-0">{ICON[t.type] ?? ICON.info}</span>
          <div className="min-w-0 flex-1">
            {t.title ? <p className="text-sm font-semibold text-slate-900">{t.title}</p> : null}
            {t.message ? (
              <p className={cn('text-sm text-slate-700', t.title && 'mt-0.5')}>{t.message}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-700"
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
