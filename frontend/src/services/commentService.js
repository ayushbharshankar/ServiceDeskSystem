import api from './api'

export const commentService = {
  /**
   * @param {string|number} issueId
   */
  listByIssue(issueId) {
    return api.get('/comments', { params: { issue_id: issueId } }).then((r) => r.data)
  },

  /**
   * @param {string|number} issueId
   * @param {string} commentText
   */
  create(issueId, commentText) {
    return api.post('/comments', { issue_id: issueId, comment_text: commentText }).then((r) => r.data)
  },

  /**
   * @param {string|number} commentId
   */
  remove(commentId) {
    return api.delete(`/comments/${commentId}`).then((r) => r.data)
  },
}
