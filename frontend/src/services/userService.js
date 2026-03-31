import api from './api'

export const userService = {
  list(params) {
    return api.get('/users', { params }).then((r) => r.data)
  },

  getById(id) {
    return api.get(`/users/${id}`).then((r) => r.data)
  },

  update(id, payload) {
    return api.put(`/users/${id}`, payload).then((r) => r.data)
  },

  remove(id) {
    return api.delete(`/users/${id}`).then((r) => r.data)
  },
}
