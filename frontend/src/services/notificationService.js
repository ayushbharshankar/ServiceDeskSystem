import api from './api'

export const notificationService = {
  list(params) {
    return api.get('/notifications', { params }).then((r) => r.data)
  },

  getUnreadCount() {
    return api.get('/notifications/unread-count').then((r) => r.data)
  },

  markAsRead(id) {
    return api.patch(`/notifications/${id}/read`).then((r) => r.data)
  },

  markAllAsRead() {
    return api.patch('/notifications/read-all').then((r) => r.data)
  },
}
