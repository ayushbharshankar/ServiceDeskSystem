import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ErrorBanner from './ui/ErrorBanner'
import { useCommentThread } from '../hooks/useCommentThread'
import { cn } from '../utils/cn'
import {
  commentAuthor,
  commentAuthorId,
  commentBody,
  commentKey,
  commentTime,
  initials,
} from '../utils/commentHelpers'

/**
 * Chat-style comments for an issue: list, add, author + time per message.
 * @param {{ issueId: string | number, className?: string, title?: string }} props
 */
export default function Comments({ issueId, className = '', title = 'Discussion' }) {
  const { user } = useAuth()
  const myId = user?.id != null ? String(user.id) : user?._id != null ? String(user._id) : null

  const {
    comments,
    loading,
    fetchError,
    submitError,
    submitting,
    setSubmitError,
    submitComment,
    listEndRef,
    refetch,
  } = useCommentThread(issueId)

  const [text, setText] = useState('')

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length, loading, listEndRef])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    const body = text.trim()
    if (!body) {
      setSubmitError('Write a message before sending.')
      return
    }
    if (issueId == null || issueId === '') return
    try {
      await submitComment(body)
      setText('')
    } catch {
      /* submitError set in hook */
    }
  }

  return (
    <section
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm',
        className,
      )}
    >
      <header className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">Messages sync with your server.</p>
      </header>

      {fetchError ? (
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <ErrorBanner className="text-xs" message={fetchError} onRetry={() => refetch()} />
        </div>
      ) : null}

      <div className="max-h-[min(420px,50vh)] min-h-[200px] overflow-y-auto bg-slate-50/40 px-3 py-4 sm:px-4">
        {loading ? (
          <div className="space-y-4 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
                  <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 && !fetchError ? (
          <p className="mx-auto max-w-sm py-10 text-center text-sm text-slate-500">
            No messages yet. Start the thread below.
          </p>
        ) : comments.length === 0 ? null : (
          <ul className="flex list-none flex-col gap-4 p-1">
            {comments.map((c, index) => {
              const author = commentAuthor(c)
              const aid = commentAuthorId(c)
              const isOwn = myId != null && aid != null && String(aid) === String(myId)
              const time = commentTime(c)

              return (
                <li
                  key={commentKey(c, index)}
                  className={cn('flex gap-3', isOwn && 'flex-row-reverse')}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      isOwn ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800',
                    )}
                    aria-hidden
                  >
                    {initials(author)}
                  </div>
                  <div className={cn('min-w-0 max-w-[85%]', isOwn && 'flex flex-col items-end')}>
                    <div
                      className={cn(
                        'mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0 text-xs',
                        isOwn ? 'flex-row-reverse' : '',
                      )}
                    >
                      <span className="font-semibold text-slate-800">{author}</span>
                      {time ? (
                        <time className="text-slate-400" dateTime={String(c.createdAt ?? c.created_at ?? '')}>
                          {time}
                        </time>
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
                        isOwn
                          ? 'rounded-tr-sm bg-indigo-600 text-white'
                          : 'rounded-tl-sm border border-slate-200/80 bg-white text-slate-800',
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{commentBody(c) || '—'}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <div ref={listEndRef} aria-hidden />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white p-3 sm:p-4">
        <label htmlFor={`comment-input-${issueId}`} className="sr-only">
          New message
        </label>
        <textarea
          id={`comment-input-${issueId}`}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (submitError) setSubmitError('')
          }}
          rows={3}
          placeholder="Type a message…"
          className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
        />
        {submitError ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {submitError}
          </p>
        ) : null}
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-55"
          >
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </section>
  )
}
