import { useCallback, useEffect, useRef, useState } from 'react'
import { commentService } from '../services/commentService'
import { getErrorMessage } from '../utils/errorMessage'
import { normalizeComments } from '../utils/normalize'

/**
 * @param {string | number | null | undefined} issueId
 */
export function useCommentThread(issueId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const refetch = useCallback(async () => {
    if (issueId == null || issueId === '') {
      setComments([])
      setFetchError('')
      setLoading(false)
      return
    }
    setFetchError('')
    setLoading(true)
    try {
      const data = await commentService.listByIssue(issueId)
      setComments(normalizeComments(data))
    } catch (err) {
      setComments([])
      setFetchError(getErrorMessage(err, 'Could not load comments.'))
    } finally {
      setLoading(false)
    }
  }, [issueId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const listEndRef = useRef(null)

  const submitComment = useCallback(
    async (commentText) => {
      if (issueId == null || issueId === '') return
      setSubmitError('')
      setSubmitting(true)
      try {
        await commentService.create(issueId, commentText)
        await refetch()
      } catch (err) {
        setSubmitError(getErrorMessage(err, 'Could not send.'))
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [issueId, refetch],
  )

  return {
    comments,
    loading,
    fetchError,
    submitError,
    submitting,
    setSubmitError,
    refetch,
    submitComment,
    listEndRef,
  }
}
