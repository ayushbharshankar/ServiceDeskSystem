import { cn } from '../../utils/cn'

const toneMap = {
  error: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    icon: 'text-red-500',
    title: 'text-red-900',
    msg: 'text-red-700',
    btn: 'text-red-700 hover:bg-red-100',
  },
  warning: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    icon: 'text-amber-500',
    title: 'text-amber-900',
    msg: 'text-amber-700',
    btn: 'text-amber-700 hover:bg-amber-100',
  },
  info: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    icon: 'text-blue-500',
    title: 'text-blue-900',
    msg: 'text-blue-700',
    btn: 'text-blue-700 hover:bg-blue-100',
  },
}

export default function ErrorBanner({
  tone = 'error',
  title,
  message,
  onRetry,
  retryLabel = 'Retry',
  className = '',
}) {
  const t = toneMap[tone] || toneMap.error

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border p-4', t.border, t.bg, className)} role="alert">
      <svg className={cn('mt-0.5 h-5 w-5 shrink-0', t.icon)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <div className="min-w-0 flex-1">
        {title ? <p className={cn('text-sm font-semibold', t.title)}>{title}</p> : null}
        {message ? <p className={cn('text-sm', title && 'mt-0.5', t.msg)}>{message}</p> : null}
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={cn('shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition', t.btn)}
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}
