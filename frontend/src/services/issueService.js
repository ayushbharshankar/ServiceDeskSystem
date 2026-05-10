import api from './api'
import { denormalizePriority, denormalizeStatus } from '../utils/normalize'

function transformIssuePayload(payload) {
  const body = {}
  if (payload.title !== undefined) body.title = payload.title
  if (payload.description !== undefined) body.description = payload.description
  if (payload.projectId !== undefined) body.project_id = payload.projectId
  if (payload.assigneeId !== undefined) body.assigned_to = payload.assigneeId || null
  if (payload.status !== undefined) body.status = denormalizeStatus(payload.status)
  if (payload.priority !== undefined) body.priority = denormalizePriority(payload.priority)
  return body
}

export const issueService = {
  /**
   * @param {Record<string, unknown>} [params] e.g. { projectId }
   */
  list(params) {
    const p = { ...params }
    if (p.projectId) {
      p.project_id = p.projectId
      delete p.projectId
    }
    if (p.assigneeId) {
      p.assigned_to = p.assigneeId
      delete p.assigneeId
    }
    if (p.status) p.status = denormalizeStatus(p.status)
    if (p.priority) p.priority = denormalizePriority(p.priority)

    return api.get('/issues', { params: p }).then((r) => r.data)
  },

  /**
   * @param {string|number} id
   */
  getById(id) {
    return api.get(`/issues/${id}`).then((r) => r.data)
  },

  /**
   * @param {Record<string, unknown>} payload
   */
  create(payload) {
    return api.post('/issues', transformIssuePayload(payload)).then((r) => r.data)
  },

  /**
   * @param {string|number} id
   * @param {Record<string, unknown>} payload
   */
  update(id, payload) {
    return api.put(`/issues/${id}`, transformIssuePayload(payload)).then((r) => r.data)
  },

  /**
   * Update only the status. Accepts either DB enum value directly
   * (e.g. "To Do", "In Progress", "Done") or normalized value.
   * @param {string|number} id
   * @param {string} status
   */
  updateStatus(id, status) {
    // If it's already a DB enum value, send directly; otherwise denormalize
    const dbStatuses = ['To Do', 'In Progress', 'Done']
    const dbStatus = dbStatuses.includes(status) ? status : denormalizeStatus(status)
    return api
      .patch(`/issues/${id}/status`, { status: dbStatus })
      .then((r) => r.data)
  },

  remove(id) {
    return api.delete(`/issues/${id}`).then((r) => r.data)
  },

  getMyTasks() {
    return api.get('/issues/my-tasks').then((r) => r.data)
  },
}
