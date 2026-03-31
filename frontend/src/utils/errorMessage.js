/** @param {unknown} err */
export function getErrorMessage(err, fallback = 'Something went wrong.') {
  if (err && typeof err === 'object' && 'apiMessage' in err && err.apiMessage) {
    return String(err.apiMessage)
  }
  if (err instanceof Error && err.message) return err.message
  if (err && typeof err === 'object' && 'message' in err && err.message) {
    return String(err.message)
  }
  return fallback
}
