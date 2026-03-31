const TOKEN_KEY = 'servicedesk_auth_token'
const USER_KEY = 'servicedesk_auth_user'

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setStoredAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function readPersistedAuth() {
  const token = getStoredToken()
  const user = getStoredUser()
  if (!token || !user) {
    clearStoredAuth()
    return { token: null, user: null }
  }
  return { token, user }
}
