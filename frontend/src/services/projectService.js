import api from './api'

export const projectService = {
  list(params) {
    return api.get('/projects', { params }).then((r) => r.data)
  },

  getById(id) {
    return api.get(`/projects/${id}`).then((r) => r.data)
  },

  create(payload) {
    const body = { project_name: payload.name ?? payload.project_name, ...payload }
    delete body.name
    return api.post('/projects', body).then((r) => r.data)
  },

  update(id, payload) {
    const body = { ...payload }
    if (body.name !== undefined) {
      body.project_name = body.name
      delete body.name
    }
    return api.put(`/projects/${id}`, body).then((r) => r.data)
  },

  remove(id) {
    return api.delete(`/projects/${id}`).then((r) => r.data)
  },

  // Members
  getMembers(projectId) {
    return api.get(`/projects/${projectId}/members`).then((r) => r.data)
  },

  addMember(projectId, payload) {
    return api.post(`/projects/${projectId}/members`, payload).then((r) => r.data)
  },

  removeMember(projectId, userId) {
    return api.delete(`/projects/${projectId}/members/${userId}`).then((r) => r.data)
  },

  // Invitations
  inviteMember(projectId, payload) {
    return api.post(`/projects/${projectId}/invite`, payload).then((r) => r.data)
  },

  cancelInvitation(projectId, invitationId) {
    return api.delete(`/projects/${projectId}/invitations/${invitationId}`).then((r) => r.data)
  },

  // Activity & Dashboard
  getActivity(projectId, params) {
    return api.get(`/projects/${projectId}/activity`, { params }).then((r) => r.data)
  },

  getDashboard(projectId) {
    return api.get(`/projects/${projectId}/dashboard`).then((r) => r.data)
  },
}
