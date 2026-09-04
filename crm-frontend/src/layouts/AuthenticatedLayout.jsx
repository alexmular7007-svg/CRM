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
import { useThemeContext } from '../contexts/ThemeContext'
import { perfMonitor } from '../utils/performanceMonitor'

// Navigation items for mobile drawer
const MOBILE_NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/workspaces', icon: FolderOpen, label: 'Workspaces' },
  { path: '/crm', icon: Users, label: 'CRM Pipeline' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/ai-insights', icon: Zap, label: 'AI Insights' },
  {
    label: 'Marketing',
    icon: Megaphone,
    children: [
      { path: '/marketing/lead-magnets', label: 'Lead Magnets' },
      { path: '/marketing/email-campaigns', label: 'Email Campaigns' },
      { path: '/marketing/automations', label: 'Automations' },
    ],
  },
  {
    label: 'Developer Tools',
    icon: Puzzle,
    children: [
      { path: '/chrome-extensions', label: 'Extension Lab' },
    ],
  },
]

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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
            className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-xl border shadow-lg"
          >
            {/* Identity header */}
            <div
              style={{ borderColor: currentTheme.colors.border }}
              className="flex items-center gap-3 border-b px-4 py-3"
            >
              <UserAvatar user={user} size="md" />
              <div className="min-w-0">
                <p
                  style={{ color: currentTheme.colors.text }}
                  className="truncate text-[13px] font-semibold"
                >
                  {user?.displayName || user?.fullName || 'User'}
                </p>
                <p
                  style={{ color: currentTheme.colors.textSecondary }}
                  className="truncate text-[11px]"
                >
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              {menuItems.map(({ label, icon: Icon, to, action, badge }) => {
                const content = (
                  <span className="flex items-center gap-2.5">
                    <Icon size={14} className="flex-shrink-0" />
                    <span className="flex-1 text-[13px] font-medium">{label}</span>
                    {badge && (
                      <span className="min-w-[18px] rounded-full bg-red-500 px-1.5 py-px text-center text-[10px] font-bold text-white">
                        {badge}
                      </span>
                    )}
                  </span>
                )
                const baseClasses = 'flex w-full items-center rounded-lg px-2.5 py-2 transition-colors'
                const itemStyle = { color: currentTheme.colors.text }

                if (to) {
                  return (
                    <a
                      key={label}
                      href={to}
                      onClick={() => setOpen(false)}
                      style={{
                        ...itemStyle,
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      className={baseClasses}
                    >
                      {content}
                    </a>
                  )
                }

                return (
                  <button
                    key={label}
                    onClick={action}
                    style={{
                      ...itemStyle,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    className={baseClasses}
                  >
                    {content}
                  </button>
                )
              })}
            </div>

            {/* Logout */}
            <div
              style={{ borderColor: currentTheme.colors.border }}
              className="border-t p-1.5"
            >
              <button
                onClick={() => {
                  setOpen(false)
                  logout()
                }}
                style={{ color: currentTheme.colors.danger }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors"
              >
                <FiLogOut size={14} className="flex-shrink-0" />
                <span className="text-[13px] font-medium">Log out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Mobile Navigation Drawer ─────────────────────────────────────────── */
const MobileNavigationDrawer = memo(({ isOpen, onClose, user, logout, unreadCount, onNotifications, currentTheme }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedMenu, setExpandedMenu] = useState(null)

  useEffect(() => {
    const activeGroup = MOBILE_NAV_ITEMS.find(
      (item) => item.children && item.children.some((child) => location.pathname.startsWith(child.path))
    )
    if (activeGroup) {
      setExpandedMenu(activeGroup.label)
    }
  }, [location.pathname])

  const handleNavigation = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 lg:hidden"
            style={{ opacity: 0.5 }}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              backgroundColor: currentTheme.colors.sidebar,
              borderColor: currentTheme.colors.border,
            }}
            className="fixed left-0 top-0 bottom-0 w-64 border-r h-screen overflow-y-auto flex flex-col z-50 lg:hidden"
          >
            {/* Drawer Header */}
            <div
              className="p-4 border-b flex items-center justify-between flex-shrink-0"
              style={{ borderColor: currentTheme.colors.border }}
            >
              <Link to="/" onClick={onClose} className="flex items-center gap-2 group">
                <img 
                  src="/logo.png" 
                  alt="TaskFlow AI" 
                  className="w-8 h-8 object-contain"
                />
                <span
                  style={{ color: currentTheme.colors.text }}
                  className="font-bold text-base"
                >
                  TaskFlow AI
                </span>
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors touch-target"
                style={{ backgroundColor: currentTheme.colors.surface }}
                aria-label="Close navigation menu"
              >
                <FiX size={20} style={{ color: currentTheme.colors.text }} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {MOBILE_NAV_ITEMS.map((item) => {
                if (item.children) {
                  const Icon = item.icon
                  const isExpanded = expandedMenu === item.label
                  const hasActiveChild = item.children.some((child) => location.pathname.startsWith(child.path))

                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative touch-target"
                        style={{
                          backgroundColor: isExpanded || hasActiveChild ? currentTheme.colors.surface : 'transparent',
                          color: isExpanded || hasActiveChild ? currentTheme.colors.primary : currentTheme.colors.textSecondary,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isExpanded || hasActiveChild ? currentTheme.colors.surface : 'transparent'
                        }}
                      >
                        <Icon size={18} className="flex-shrink-0" />
                        <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          size={14}
                          className="flex-shrink-0 transition-transform duration-200"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                        {(isExpanded || hasActiveChild) && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-r-lg"
                            style={{ backgroundColor: currentTheme.colors.primary }}
                          />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="pl-4 space-y-0.5 mt-1">
                          {item.children.map((child) => {
                            const isActive = location.pathname.startsWith(child.path)
                            return (
                              <button
                                key={child.path}
                                onClick={() => handleNavigation(child.path)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative touch-target"
                                style={{
                                  backgroundColor: isActive ? currentTheme.colors.surface : 'transparent',
                                  color: isActive ? currentTheme.colors.primary : currentTheme.colors.textSecondary,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isActive ? currentTheme.colors.surface : 'transparent'
                                }}
                              >
                                <span className="text-sm font-medium flex-1 text-left">{child.label}</span>
                                {isActive && (
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r-lg"
                                    style={{ backgroundColor: currentTheme.colors.primary }}
                                  />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                const { path, icon: Icon, label } = item
                const isActive = location.pathname.startsWith(path)
                return (
                  <button
                    key={path}
                    onClick={() => handleNavigation(path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative touch-target"
                    style={{
                      backgroundColor: isActive ? currentTheme.colors.surface : 'transparent',
                      color: isActive ? currentTheme.colors.primary : currentTheme.colors.textSecondary,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isActive ? currentTheme.colors.surface : 'transparent'
                    }}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    <span className="text-sm font-medium flex-1 text-left">{label}</span>
                    {isActive && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-r-lg"
                        style={{ backgroundColor: currentTheme.colors.primary }}
                      />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Divider */}
            <div
              style={{ backgroundColor: currentTheme.colors.border }}
              className="h-px mx-3"
            />

            {/* User Section */}
            <div className="p-3 space-y-2 flex-shrink-0">
              {/* Profile */}
              <button
                onClick={() => handleNavigation('/profile')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors touch-target"
                style={{
                  backgroundColor: location.pathname === '/profile' ? currentTheme.colors.surface : 'transparent',
                  color: location.pathname === '/profile' ? currentTheme.colors.primary : currentTheme.colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = location.pathname === '/profile' ? currentTheme.colors.surface : 'transparent'
                }}
              >
                <FiUser size={18} className="flex-shrink-0" />
                <span className="text-sm font-medium">Profile</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => handleNavigation('/settings')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors touch-target"
                style={{
                  backgroundColor: location.pathname === '/settings' ? currentTheme.colors.surface : 'transparent',
                  color: location.pathname === '/settings' ? currentTheme.colors.primary : currentTheme.colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = location.pathname === '/settings' ? currentTheme.colors.surface : 'transparent'
                }}
              >
                <FiSettings size={18} className="flex-shrink-0" />
                <span className="text-sm font-medium">Settings</span>
              </button>

              {/* Notifications */}
              <button
                onClick={() => {
                  onNotifications()
                  onClose()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors touch-target"
                style={{
                  backgroundColor: 'transparent',
                  color: currentTheme.colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div className="relative">
                  <FiBell size={18} className="flex-shrink-0" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">Notifications</span>
              </button>

              {/* Logout */}
              <button
                onClick={() => {
                  onClose()
                  logout()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors touch-target"
                style={{
                  color: currentTheme.colors.danger,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <FiLogOut size={18} className="flex-shrink-0" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>

            {/* Footer */}
            <div
              className="border-t p-3 text-center text-xs flex-shrink-0"
              style={{
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.textMuted,
              }}
            >
              TaskFlow AI v1.0.0
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})

MobileNavigationDrawer.displayName = 'MobileNavigationDrawer'

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
