import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTheme } from './hooks/useTheme'

import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute'
import NotificationPanel from './components/notifications/NotificationPanel'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const SessionExpired = lazy(() => import('./pages/auth/SessionExpired'))
const OAuth2Callback = lazy(() => import('./pages/auth/OAuth2Callback'))
const Workspaces = lazy(() => import('./pages/Workspaces'))
const Projects = lazy(() => import('./pages/Projects'))
const Tasks = lazy(() => import('./pages/Tasks'))
const KanbanBoard = lazy(() => import('./pages/KanbanBoard'))
const CRMPipeline = lazy(() => import('./pages/CRMPipeline'))
const Chat = lazy(() => import('./pages/Chat'))
const Analytics = lazy(() => import('./pages/Analytics'))
const AIInsights = lazy(() => import('./pages/AIInsights'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))

const PageLoader = () => (
  <div className="flex h-full min-h-[50vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
  </div>
)

function App() {
  const { isDark } = useTheme()
  const { isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Suspense fallback={<PageLoader />}><Landing /></Suspense>} />

        {/* Auth Routes - Original Simple Layout */}
        <Route element={<Suspense fallback={<PageLoader />}><AuthLayout /></Suspense>}>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Suspense fallback={<PageLoader />}><Login /></Suspense>} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Suspense fallback={<PageLoader />}><Register /></Suspense>} />
          <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>} />
          <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
        </Route>

        {/* Session Expired (standalone) */}
        <Route path="/session-expired" element={<Suspense fallback={<PageLoader />}><SessionExpired /></Suspense>} />

        {/* OAuth2 callback — standalone, no auth required */}
        <Route path="/oauth2/callback" element={<Suspense fallback={<PageLoader />}><OAuth2Callback /></Suspense>} />

        {/* Protected Routes - Original Dashboard Layout */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="/workspaces" element={<Suspense fallback={<PageLoader />}><Workspaces /></Suspense>} />
          <Route path="/workspaces/:workspaceId/projects" element={<Suspense fallback={<PageLoader />}><Projects /></Suspense>} />
          <Route path="/projects/:projectId/tasks" element={<Suspense fallback={<PageLoader />}><Tasks /></Suspense>} />
          <Route path="/projects/:projectId/kanban" element={<Suspense fallback={<PageLoader />}><KanbanBoard /></Suspense>} />
          <Route path="/crm" element={<Suspense fallback={<PageLoader />}><CRMPipeline /></Suspense>} />
          <Route path="/chat" element={<Suspense fallback={<PageLoader />}><Chat /></Suspense>} />
          <Route path="/chat/:roomId" element={<Suspense fallback={<PageLoader />}><Chat /></Suspense>} />
          <Route path="/analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
          <Route path="/ai-insights" element={<Suspense fallback={<PageLoader />}><AIInsights /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
        </Route>

        {/* Default Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Global Notification Panel */}
      {isAuthenticated && <NotificationPanel />}
    </>
  )
}

export default App
