import { useEffect, useRef, useState, memo } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { FiBell, FiLogOut, FiUser, FiSettings, FiChevronDown, FiMoon, FiSun, FiMenu, FiX } from 'react-icons/fi'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  MessageSquare,
  BarChart3,
  Zap,
  Megaphone,
  ChevronDown,
  Puzzle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { togglePanel } from '../store/slices/notificationSlice'
import { setCopilotContext } from '../store/slices/copilotSlice'
import { setCurrentWorkspace } from '../store/slices/workspaceSlice'
import { websocketService } from '../services/websocketService'
import { workspaceService } from '../services/workspaceService'
import UserAvatar from '../components/common/UserAvatar'
import AuthenticatedSidebar from './AuthenticatedSidebar'
import MobileNavigationDrawer from './MobileNavigationDrawer'
import { useThemeContext } from '../contexts/ThemeContext'
import { perfMonitor } from '../utils/performanceMonitor'

/* ─── User dropdown menu ───────────────────────────────────────────────── */
const UserMenu = ({ user, logout, unreadCount, onNotifications }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const { currentTheme } = useThemeContext()

  const menuItems = [
    { label: 'Profile', icon: FiUser, to: '/profile' },
    { label: 'Settings', icon: FiSettings, to: '/settings' },
    {
      label: 'Notifications',
      icon: FiBell,
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : null,
      action: () => { onNotifications(); setOpen(false) },
    },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          backgroundColor: open ? currentTheme.colors.surfaceSecondary : 'transparent',
        }}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors"
      >
        <UserAvatar user={user} size="sm" />
        <div className="hidden text-left sm:block">
          <p
            style={{ color: currentTheme.colors.text }}
            className="max-w-[120px] truncate text-[13px] font-medium leading-tight"
          >
            {user?.displayName || user?.fullName || 'User'}
          </p>
          <p
            style={{ color: currentTheme.colors.textSecondary }}
            className="max-w-[120px] truncate text-[11px] leading-tight"
          >
            {user?.email}
          </p>
        </div>
        <FiChevronDown
          style={{ color: currentTheme.colors.textSecondary }}
          className={`hidden sm:block transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          size={14}
        />
      </button>

      {open && (
        <div
          style={{
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          }}
          className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border p-1 shadow-lg shadow-black/10 z-50"
        >
          {menuItems.map((item) => (
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                style={{ color: currentTheme.colors.text }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={15} style={{ color: currentTheme.colors.textSecondary }} />
                  {item.label}
                </div>
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={item.action}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors text-left"
                style={{ color: currentTheme.colors.text }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={15} style={{ color: currentTheme.colors.textSecondary }} />
                  {item.label}
                </div>
                {item.badge && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          ))}

          <div className="my-1 h-px" style={{ backgroundColor: currentTheme.colors.border }} />

          <button
            onClick={() => { setOpen(false); logout(); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors text-left"
            style={{ color: currentTheme.colors.danger || '#ef4444' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <FiLogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Main Authenticated Layout ─────────────────────────────────────────── */
const AuthenticatedLayout = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const dispatch = useDispatch()
  const location = useLocation()
  const { unreadCount } = useSelector((state) => state.notifications)
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const { currentTheme, theme, switchTheme } = useThemeContext()
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  // Track screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fetch workspaces - optimized with staleTime to prevent refetch on every mount
  const { data: workspacesData, isLoading: isLoadingWorkspaces, error: workspacesError } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => {
      perfMonitor.mark('workspaces_fetch_start')
      return workspaceService.getAll().then(data => {
        perfMonitor.mark('workspaces_fetch_complete')
        return data
      })
    },
    enabled: isAuthenticated,
    retry: 1,
    staleTime: 5 * 60 * 1000,  // 5 minutes - workspaces rarely change
    gcTime: 10 * 60 * 1000,    // 10 minutes - keep in cache
  })

  // Initialize workspace on first load
  useEffect(() => {
    console.log('🟠 [AuthenticatedLayout] Workspace init effect - workspacesData:', workspacesData, 'currentWorkspace:', currentWorkspace, 'isLoadingWorkspaces:', isLoadingWorkspaces)
    if (workspacesData && !currentWorkspace) {
      perfMonitor.mark('workspace_initialization_start')
      const list = Array.isArray(workspacesData) ? workspacesData : workspacesData?.content ?? []
      if (list.length > 0) {
        console.log('🟢 [AuthenticatedLayout] Dispatching setCurrentWorkspace with:', list[0])
        dispatch(setCurrentWorkspace(list[0]))
        perfMonitor.mark('workspace_initialization_complete')
      }
    }
  }, [workspacesData, currentWorkspace, dispatch, isLoadingWorkspaces, workspacesError])

  useEffect(() => {
    if (isAuthenticated && user) {
      websocketService.connect()
      websocketService.subscribeToPresence(() => {})
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    dispatch(setCopilotContext({ page: location.pathname, title: document.title }))
  }, [dispatch, location.pathname])

  // Close mobile drawer on route change
  useEffect(() => {
    setShowMobileDrawer(false)
  }, [location.pathname])

  // Close mobile drawer when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setShowMobileDrawer(false)
    }
  }, [isMobile])

  return (
    <div
      style={{
        backgroundColor: currentTheme.colors.background,
        color: currentTheme.colors.text,
      }}
      className="flex h-screen overflow-hidden flex-col lg:flex-row"
    >
      {/* Sidebar - Desktop Only (lg and above) */}
      <div className="hidden lg:flex lg:flex-col" onLoad={() => { perfMonitor.mark('sidebar_rendered') }}>
        <AuthenticatedSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        {/* Top Navigation - Responsive Header */}
        <header
          style={{
            backgroundColor: currentTheme.colors.navbar,
            borderColor: currentTheme.colors.border,
            boxSizing: 'border-box',
            borderWidth: '1px',
            margin: 0,
            padding: '10px 12px',
          }}
          className="border-b shrink-0"
        >
          <div className="flex items-center justify-between w-full min-h-[44px] sm:h-10">
            {/* Left Section - Mobile/Tablet: Hamburger + Title | Desktop: Title */}
            <div className="flex items-center gap-2 flex-1 lg:flex-initial">
              {/* Mobile Menu Toggle - Mobile Only */}
              <button
                onClick={() => setShowMobileDrawer(!showMobileDrawer)}
                className="p-2 -ml-2 rounded-lg transition-colors touch-target lg:hidden"
                style={{
                  color: currentTheme.colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                aria-label="Toggle navigation menu"
                title="Open navigation menu"
              >
                <FiMenu size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Page Title - Mobile Only */}
              <div className="min-w-0 px-2 lg:hidden">
                <h1
                  style={{ color: currentTheme.colors.text }}
                  className="text-sm sm:text-base font-semibold truncate"
                >
                  {document.title.split(' - ')[0] || 'Dashboard'}
                </h1>
              </div>
            </div>

            {/* Spacer - Desktop Only: Push right actions to far right */}
            <div className="hidden lg:flex-1" />

            {/* Right Actions - Always Visible */}
            <div className="flex items-center justify-end gap-0.5 sm:gap-1 flex-shrink-0">
              {/* Theme Toggle */}
              <button
                onClick={() => {
                  const newTheme = theme === 'dark' ? 'light' : 'dark'
                  switchTheme(newTheme)
                }}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 rounded-lg transition-colors touch-target"
                style={{
                  color: currentTheme.colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {theme === 'dark' ? (
                  <FiSun size={18} className="text-yellow-500" />
                ) : (
                  <FiMoon size={18} />
                )}
              </button>

              {/* Divider - Hidden on very small screens */}
              <div
                style={{ backgroundColor: currentTheme.colors.border }}
                className="hidden sm:block h-5 sm:h-6 w-px"
              />

              {/* Notifications */}
              <button
                onClick={() => dispatch(togglePanel())}
                aria-label="Notifications"
                className="relative p-2 rounded-lg transition-colors touch-target"
                style={{
                  color: currentTheme.colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Divider - Hidden on very small screens */}
              <div
                style={{ backgroundColor: currentTheme.colors.border }}
                className="hidden sm:block h-5 sm:h-6 w-px"
              />

              {/* User Menu */}
              <UserMenu
                user={user}
                logout={logout}
                unreadCount={unreadCount}
                onNotifications={() => dispatch(togglePanel())}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main
          style={{
            backgroundColor: currentTheme.colors.background,
            color: currentTheme.colors.text,
          }}
          className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 w-full"
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNavigationDrawer
        isOpen={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        user={user}
        logout={logout}
        unreadCount={unreadCount}
        onNotifications={() => dispatch(togglePanel())}
        currentTheme={currentTheme}
      />

      {/* Global Notification Panel - Removed FloatingCopilot from authenticated layout */}
      {/* FloatingCopilot only appears on Landing page, not in authenticated pages */}
    </div>
  )
}

export default AuthenticatedLayout
