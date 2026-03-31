import { cn } from '../../utils/cn'

/**
 * @param {{
 *   title?: string,
 *   message: string,
 *   onRetry?: () => void,
 *   retryLabel?: string,
 *   tone?: 'danger' | 'warning',
 *   className?: string,
 * }} props
 */
export default function ErrorBanner({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  tone = 'danger',
  className = '',
}) {
  const styles =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-red-200 bg-red-50/90 text-red-800'

  return (
    <div
      className={cn('rounded-2xl border px-4 py-3 text-sm', styles, className)}
      role="alert"
    >
      <p className="font-medium">{title}</p>
      <p className={cn('mt-1', tone === 'danger' ? 'text-red-700/90' : 'text-amber-800/90')}>
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'mt-3 text-sm font-semibold underline underline-offset-2',
            tone === 'danger'
              ? 'text-red-800 hover:text-red-900'
              : 'text-amber-900 hover:text-amber-950',
          )}
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}
