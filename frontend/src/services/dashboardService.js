import api from './api'

export const dashboardService = {
  /**
   * Loads dashboard metrics from the backend using dedicated /dashboard endpoint.
   */
  async getStats() {
    return api.get('/dashboard').then((r) => r.data)
  },
}
