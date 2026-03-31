import { useCallback, useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboardService'
import { getErrorMessage } from '../utils/errorMessage'

export function useDashboardStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const data = await dashboardService.getStats()
      setStats(data)
    } catch (err) {
      setStats(null)
      setError(getErrorMessage(err, 'Could not load dashboard data. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { stats, loading, error, refetch }
}
