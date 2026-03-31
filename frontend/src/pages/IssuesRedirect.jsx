import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../services/projectService'
import { normalizeProjects } from '../utils/normalize'

/** Sends users from /issues to /issues/:projectId using the first available project. */
export default function IssuesRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await projectService.list()
        const list = normalizeProjects(data)
        const first = list[0]
        const id = first?.id ?? first?._id
        if (cancelled) return
        if (id != null) {
          navigate(`/issues/${id}`, { replace: true })
        } else {
          navigate('/projects', { replace: true })
        }
      } catch {
        if (!cancelled) navigate('/projects', { replace: true })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="flex items-center justify-center py-16 text-sm text-slate-500">Loading…</div>
  )
}
