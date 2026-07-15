import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { store } from './store'
import './index.css'

/**
 * On every app boot, validate that the cached currentWorkspace actually
 * belongs to the currently logged-in user.
 * If the workspace owner differs from the current token user, clear it so
 * stale workspace IDs from a previous user session don't cause 403 errors.
 */
;(function clearStaleWorkspaceCache() {
  try {
    const token = localStorage.getItem('token')
    const workspace = localStorage.getItem('currentWorkspace')
    if (!token || !workspace) return

    // Decode userId from JWT (no library needed)
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentUserId = payload?.userId

    if (!currentUserId) {
      localStorage.removeItem('currentWorkspace')
      localStorage.removeItem('currentProject')
      return
    }

    // We can't verify workspace membership without an API call,
    // so just clear cached workspace on every fresh boot.
    // The app will re-fetch and re-set it from the API response.
    localStorage.removeItem('currentWorkspace')
    localStorage.removeItem('currentProject')
  } catch {
    localStorage.removeItem('currentWorkspace')
    localStorage.removeItem('currentProject')
  }
})()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Make queryClient globally accessible for OAuth2Callback and other async contexts
window.__queryClient = queryClient

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
