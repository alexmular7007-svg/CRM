import axios from 'axios'
import { store } from '../store'
import { logout } from '../store/slices/authSlice'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token
    if (token) {
      // Proactive expiry check: decode the exp claim without a library
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp && Date.now() / 1000 > payload.exp) {
          // Token already expired — clear state and redirect before the request
          store.dispatch(logout())
          const authPages = ['/login', '/register', '/session-expired', '/forgot-password']
          if (!authPages.includes(window.location.pathname)) {
            window.location.href = '/session-expired'
          }
          return Promise.reject(new Error('Token expired'))
        }
      } catch {
        // Malformed token — let the request go through and 401/403 will catch it
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data, config } = error.response

      // Check BEFORE dispatching logout so the flag is accurate
      const hadToken = !!store.getState().auth.token

      // Only 401 (invalid/expired token) should trigger session expiry redirect.
      // 403 means "authenticated but forbidden" — should NOT force logout.
      if (status === 401 && hadToken) {
        store.dispatch(logout())
        const currentPath = window.location.pathname
        const authPages = ['/login', '/register', '/session-expired', '/forgot-password', '/reset-password']
        if (!authPages.includes(currentPath)) {
          window.location.href = '/session-expired'
        }
        return Promise.reject(data || error)
      }

      // Allow callers to suppress toasts by passing { silent: true } in axios config
      const silent = error.config?.silent === true

      // Also suppress toasts for read-only analytics/reporting/dashboard/leads-analytics
      // endpoints — these fail gracefully and should show empty charts, not popups.
      const url = error.config?.url || ''
      const isSilentEndpoint =
        url.includes('/analytics') ||
        url.includes('/dashboard') ||
        url.includes('/reports') ||
        url.includes('/ai-insights') ||
        url.includes('/ai/insights') ||
        (url.includes('/leads') && url.includes('/analytics')) ||
        (url.includes('/workspaces') && url.includes('/projects'))

      if (!silent && !isSilentEndpoint) {
        // For validation errors (400 status with nested error map), show first field error
        if (status === 400 && data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          const fieldErrors = data.data
          const firstError = Object.values(fieldErrors)[0]
          if (firstError) {
            toast.error(firstError)
          } else {
            toast.error(data?.message || 'Validation failed')
          }
        } else {
          const message = data?.message || 'An error occurred'

          if (status === 403) {
            toast.error(message !== 'An error occurred' ? message : 'Access denied')
          } else if (status === 404) {
            toast.error('Resource not found')
          } else if (status === 409) {
            // Conflict errors (e.g., duplicate email)
            toast.error(message !== 'An error occurred' ? message : 'Resource already exists')
          } else if (status === 500) {
            toast.error('Server error. Please try again later.')
          } else if (status !== 401) {
            toast.error(message)
          }
        }
      }

      return Promise.reject(data || error)
    }

    // Network error — only show if not a silent request
    if (!error.config?.silent) {
      toast.error('Network error. Please check your connection.')
    }
    return Promise.reject(error)
  }
)

export default api
