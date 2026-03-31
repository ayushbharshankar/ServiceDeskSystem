import api from './api'

export const authService = {
  /**
   * @param {{ email: string, password: string }} credentials
   */
  login(credentials) {
    return api.post('/auth/login', credentials).then((r) => r.data)
  },

  /**
   * @param {Record<string, unknown>} payload
   */
  register(payload) {
    return api.post('/auth/register', payload).then((r) => r.data)
  },

  me() {
    return api.get('/auth/me').then((r) => r.data)
  },

  logout() {
    return api.post('/auth/logout').then((r) => r.data)
  },
}
