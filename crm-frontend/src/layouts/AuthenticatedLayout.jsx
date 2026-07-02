import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { FiBell, FiLogOut, FiUser, FiSettings, FiChevronDown, FiMoon, FiSun } from 'react-icons/fi'
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
import FloatingCopilot from '../components/landing/FloatingCopilot'
import { useThemeContext } from '../contexts/ThemeContext'

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

/* ─── Main Authenticated Layout ─────────────────────────────────────────── */
const AuthenticatedLayout = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const dispatch = useDispatch()
  const location = useLocation()
  const { unreadCount } = useSelector((state) => state.notifications)
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const { currentTheme, theme, switchTheme } = useThemeContext()

  // Fetch workspaces
  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getAll,
    enabled: isAuthenticated,
  })

  // Initialize workspace on first load
  useEffect(() => {
    if (workspacesData && !currentWorkspace) {
      const list = Array.isArray(workspacesData) ? workspacesData : workspacesData?.content ?? []
      if (list.length > 0) {
        dispatch(setCurrentWorkspace(list[0]))
      }
    }
  }, [workspacesData, currentWorkspace, dispatch])

  useEffect(() => {
    if (isAuthenticated && user) {
      websocketService.connect()
      websocketService.subscribeToPresence(() => {})
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    dispatch(setCopilotContext({ page: location.pathname, title: document.title }))
  }, [dispatch, location.pathname])

  return (
    <div
      style={{
        backgroundColor: currentTheme.colors.background,
        color: currentTheme.colors.text,
      }}
      className="flex h-screen overflow-hidden"
    >
      <AuthenticatedSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <header
          style={{
            backgroundColor: currentTheme.colors.navbar,
            borderColor: currentTheme.colors.border,
          }}
          className="border-b px-6 py-3"
        >
          <div className="flex items-center justify-end gap-1.5">
            <div
              style={{ backgroundColor: currentTheme.colors.border }}
              className="h-6 w-px"
            />

            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                const newTheme = theme === 'dark' ? 'light' : 'dark'
                switchTheme(newTheme)
              }}
              aria-label="Toggle dark/light mode"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="relative rounded-lg p-2 transition-colors"
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

            <div
              style={{ backgroundColor: currentTheme.colors.border }}
              className="h-6 w-px"
            />

            <button
              onClick={() => dispatch(togglePanel())}
              aria-label="Notifications"
              className="relative rounded-lg p-2 transition-colors"
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

            <div
              style={{ backgroundColor: currentTheme.colors.border }}
              className="h-6 w-px"
            />

            <UserMenu
              user={user}
              logout={logout}
              unreadCount={unreadCount}
              onNotifications={() => dispatch(togglePanel())}
            />
          </div>
        </header>

        {/* Main Content */}
        <main
          style={{
            backgroundColor: currentTheme.colors.background,
            color: currentTheme.colors.text,
          }}
          className="flex-1 overflow-y-auto p-6"
        >
          <Outlet />
        </main>
      </div>

      {/* Floating Copilot */}
      <FloatingCopilot />
    </div>
  )
}

export default AuthenticatedLayout
