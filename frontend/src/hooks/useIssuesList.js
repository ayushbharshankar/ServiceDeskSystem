import { useCallback, useEffect, useState } from 'react'
import { issueService } from '../services/issueService'
import { getErrorMessage } from '../utils/errorMessage'
import { normalizeIssues } from '../utils/normalize'

/**
 * @param {string} projectId
 */
export function useIssuesList(projectId) {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    if (!projectId) {
      setIssues([])
      setError('')
      setLoading(false)
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await issueService.list({ projectId })
      setIssues(normalizeIssues(data))
    } catch (err) {
      setIssues([])
      setError(getErrorMessage(err, 'Failed to load issues.'))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { issues, loading, error, refetch, setIssues }
}
