import { useCallback, useEffect, useState } from 'react'
import { projectService } from '../services/projectService'
import { getErrorMessage } from '../utils/errorMessage'
import { normalizeProjects } from '../utils/normalize'

export function useProjectsList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const data = await projectService.list()
      setProjects(normalizeProjects(data))
    } catch (err) {
      setProjects([])
      setError(getErrorMessage(err, 'Failed to load projects.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { projects, loading, error, refetch, setProjects, setError }
}
