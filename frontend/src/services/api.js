import axios from 'axios'
import { clearStoredAuth, getStoredToken } from '../utils/authStorage'

const DEFAULT_BASE_URL = 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? DEFAULT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Attach a normalized message and status for UI / logging.
 */
function normalizeError(error) {
  const status = error.response?.status
  const data = error.response?.data
  const message =
    (typeof data === 'string' ? data : null) ??
    data?.message ??
    data?.error ??
    error.message ??
    'Request failed'

  error.apiMessage = message
  error.apiStatus = status
  return error
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    normalizeError(error)

    if (import.meta.env.DEV) {
      console.error('[API]', error.apiMessage, error.response?.data ?? error)
    }

    const status = error.response?.status
    const url = error.config?.url ?? ''
    const isLoginRequest = url.includes('/auth/login')

    if (status === 401 && !isLoginRequest) {
      clearStoredAuth()
      const redirect = `${window.location.origin}/login`
      window.location.assign(redirect)
    }

    return Promise.reject(error)
  },
)

export default api
