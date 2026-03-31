import { useCallback, useEffect, useState } from 'react'
import { issueService } from '../services/issueService'
import { getErrorMessage } from '../utils/errorMessage'
import { normalizeIssue } from '../utils/normalize'

/**
 * @param {string | undefined} issueId
 */
export function useIssue(issueId) {
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    if (!issueId) {
      setIssue(null)
      setError('')
      setLoading(false)
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await issueService.getById(issueId)
      // Backend returns { issue: {...}, comments: [...] }
      const rawIssue = data?.issue ?? data
      setIssue(normalizeIssue(rawIssue))
    } catch (err) {
      setIssue(null)
      setError(getErrorMessage(err, 'Could not load this issue.'))
    } finally {
      setLoading(false)
    }
  }, [issueId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { issue, loading, error, refetch }
}
