import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { 
  Search, Bell, Moon, Sun, LogOut, User, Settings, ChevronDown,
  LayoutDashboard, Network, MessageSquare, BarChart3, Zap, FolderOpen,
  Plus, Menu, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeContext } from '../contexts/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import { togglePanel } from '../store/slices/notificationSlice'
import { toggleSidebar } from '../store/slices/sidebarSlice'
import { setCopilotContext } from '../store/slices/copilotSlice'
import { setCurrentWorkspace } from '../store/slices/workspaceSlice'
import { websocketService } from '../services/websocketService'
import { workspaceService } from '../services/workspaceService'
import UserAvatar from '../components/common/UserAvatar'

// Sidebar Navigation Items
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', color: 'text-indigo-600' },
  { icon: Network, label: 'Workspaces', path: '/workspaces', color: 'text-blue-600' },
  { icon: FolderOpen, label: 'Projects', path: '/workspaces/:workspaceId/projects', color: 'text-emerald-600' },
  { icon: Zap, label: 'Kanban', path: '/projects/:projectId/kanban', color: 'text-purple-600' },
  { icon: Network, label: 'CRM', path: '/crm', color: 'text-rose-600' },
  { icon: MessageSquare, label: 'Chat', path: '/chat', color: 'text-sky-600' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', color: 'text-amber-600' },
  { icon: Zap, label: 'AI Insights', path: '/ai-insights', color: 'text-violet-600' },
]

// ─── User Menu ───────────────────────────────────────────────────────────────
const UserMenu = ({ user, logout, unreadCount, onNotifications }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all
          hover:bg-gray-100 dark:hover:bg-gray-700/50
          ${open ? 'bg-gray-100 dark:bg-gray-700/50' : ''}"
      >
        <UserAvatar user={user} size="sm" />
        <div className="hidden text-left sm:block">
          <p className="max-w-[140px] truncate text-sm font-medium text-gray-900 dark:text-white">
            {user?.displayName || user?.fullName || 'User'}
          </p>
          <p className="max-w-[140px] truncate text-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`hidden sm:block text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right
              rounded-xl border border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800 shadow-xl dark:shadow-2xl"
          >
            {/* User Info */}
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900 dark:text-white">
                  {user?.displayName || user?.fullName}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1 p-2">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm
                  hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <User size={16} className="text-gray-500" />
                <span>Profile</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm
                  hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <Settings size={16} className="text-gray-500" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => { onNotifications(); setOpen(false) }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm
                  hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <Bell size={16} className="text-gray-500" />
                <span className="flex-1 text-left">Notifications</span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full
                    bg-red-500 text-white text-xs font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              <button
                onClick={() => { setOpen(false); logout() }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm
                  text-red-600 dark:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sidebar Navigation ──────────────────────────────────────────────────────
const PremiumSidebar = ({ isOpen, onClose, currentPath }) => {
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -240, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -240, opacity: 0 }}
        className={`fixed left-0 top-0 z-50 h-screen w-60 border-r border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900 transition-transform duration-300 overflow-y-auto
          lg:relative lg:translate-x-0 ${ isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg 
              flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">TaskFlow</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path || currentPath.startsWith(item.path.split('/:')[0])
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1 h-6 bg-indigo-600 rounded-r-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Create Project Button */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-4">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3
            bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium
            transition-all shadow-lg hover:shadow-xl">
            <Plus size={18} />
            <span>New Project</span>
          </button>
        </div>
      </motion.aside>
    </>
  )
}

// ─── Top Navigation Bar ──────────────────────────────────────────────────────
const TopNavBar = ({ user, logout, unreadCount, onNotifications, isDark, toggle, onMenuClick }) => {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900
      sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 gap-6">
        {/* Left: Mobile Menu & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu size={22} className="text-gray-600 dark:text-gray-400" />
          </button>

          {/* Search Bar */}
          <div className="relative hidden sm:flex flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects, tasks, leads..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700
                bg-white dark:bg-gray-800 text-sm placeholder-gray-600 dark:placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button
            onClick={onNotifications}
            className="relative p-2.5 rounded-lg text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="View notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white
                flex items-center justify-center rounded-full text-xs font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="p-2.5 rounded-lg text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle dark/light mode"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
          </button>

          {/* Divider */}
          <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700" />

          {/* User Menu */}
          <UserMenu
            user={user}
            logout={logout}
            unreadCount={unreadCount}
            onNotifications={onNotifications}
          />
        </div>
      </div>
    </header>
  )
}

// ─── Main Layout ────────────────────────────────────────────────────────────
const PremiumDashboardLayout = () => {
  const { theme, switchTheme } = useThemeContext()
  const isDark = theme === 'dark'
  const toggle = () => {
    switchTheme(isDark ? 'light' : 'dark')
  }
  const { user, logout, isAuthenticated } = useAuth()
  const dispatch = useDispatch()
  const location = useLocation()
  const { unreadCount } = useSelector((state) => state.notifications)
  const { sidebarOpen } = useSelector((state) => state.sidebar)
  const { currentWorkspace } = useSelector((state) => state.workspace)

  // Auto-select first workspace
  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getAll,
    enabled: isAuthenticated && !currentWorkspace,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (currentWorkspace) return
    const list = Array.isArray(workspacesData) ? workspacesData : workspacesData?.content ?? []
    if (list.length > 0) {
      dispatch(setCurrentWorkspace(list[0]))
    }
  }, [workspacesData, currentWorkspace, dispatch])

  useEffect(() => {
    if (isAuthenticated && user) websocketService.connect()
  }, [isAuthenticated, user])

  useEffect(() => {
    dispatch(setCopilotContext({ page: location.pathname, title: document.title }))
  }, [dispatch, location.pathname])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        <PremiumSidebar
          isOpen={sidebarOpen}
          onClose={() => dispatch(toggleSidebar())}
          currentPath={location.pathname}
        />
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Nav */}
        <TopNavBar
          user={user}
          logout={logout}
          unreadCount={unreadCount}
          onNotifications={() => dispatch(togglePanel())}
          isDark={isDark}
          toggle={toggle}
          onMenuClick={() => dispatch(toggleSidebar())}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default PremiumDashboardLayout
