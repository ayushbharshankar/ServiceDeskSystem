import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { projectService } from '../services/projectService'
import { normalizeProjects } from '../utils/normalize'
import { getErrorMessage } from '../utils/errorMessage'

const ProjectsContext = createContext(null)

/**
 * Centralized projects state shared between Sidebar, Projects page, and any
 * component that needs the user's project list.  One source of truth — no
 * duplicate fetching, no stale sidebar.
 */
export function ProjectsProvider({ children }) {
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

  const value = useMemo(
    () => ({ projects, loading, error, refetch, setProjects, setError }),
    [projects, loading, error, refetch],
  )

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
}

/**
 * Hook that reads the centralized projects list.
 * Drop-in replacement for the old `useProjectsList()` hook.
 */
export function useProjects() {
  const ctx = useContext(ProjectsContext)
  if (!ctx) {
    throw new Error('useProjects must be used within ProjectsProvider')
  }
  return ctx
}
