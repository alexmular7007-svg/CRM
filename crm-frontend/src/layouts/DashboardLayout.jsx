import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { FiBell, FiMenu, FiMoon, FiSun, FiLogOut, FiUser, FiSettings, FiChevronDown } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../hooks/useAuth'
import { togglePanel } from '../store/slices/notificationSlice'
import { toggleSidebar } from '../store/slices/sidebarSlice'
import { setCopilotContext } from '../store/slices/copilotSlice'
import { websocketService } from '../services/websocketService'
import Sidebar from './Sidebar'
import UserAvatar from '../components/common/UserAvatar'

/* ─── User dropdown ──────────────────────────────────────────────────────── */
const UserMenu = ({ user, logout, unreadCount, onNotifications }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const menuItems = [
    { label: 'Profile',       icon: FiUser,     to: '/profile' },
    { label: 'Settings',      icon: FiSettings, to: '/settings' },
    {
      label: 'Notifications', icon: FiBell,
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
        className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors
          hover:bg-gray-100 dark:hover:bg-gray-700/70
          ${open ? 'bg-gray-100 dark:bg-gray-700/70' : ''}`}
      >
        <UserAvatar user={user} size="sm" />
        <div className="hidden text-left sm:block">
          <p className="max-w-[120px] truncate text-[13px] font-medium text-gray-900 dark:text-white leading-tight">
            {user?.displayName || user?.fullName || 'User'}
          </p>
          <p className="max-w-[120px] truncate text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
            {user?.email}
          </p>
        </div>
        <FiChevronDown
          className={`hidden sm:block text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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
            className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right
              rounded-xl border border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800 shadow-lg shadow-black/10 dark:shadow-black/40"
          >
            {/* Identity header */}
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 px-4 py-3">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">
                  {user?.displayName || user?.fullName || 'User'}
                </p>
                <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              {menuItems.map(({ label, icon: Icon, to, action, badge }) => {
                const content = (
                  <span className="flex items-center gap-2.5">
                    <Icon size={14} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    <span className="flex-1 text-[13px] font-medium text-gray-700 dark:text-gray-200">{label}</span>
                    {badge && (
                      <span className="min-w-[18px] rounded-full bg-red-500 px-1.5 py-px text-center text-[10px] font-bold text-white">
                        {badge}
                      </span>
                    )}
                  </span>
                )
                const cls = `flex w-full items-center rounded-lg px-2.5 py-2
                  hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors`
                return to ? (
                  <Link key={label} to={to} onClick={() => setOpen(false)} className={cls}>{content}</Link>
                ) : (
                  <button key={label} onClick={action} className={cls}>{content}</button>
                )
              })}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 dark:border-gray-700 p-1.5">
              <button
                onClick={() => { setOpen(false); logout() }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2
                  text-red-600 dark:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

/* ─── Layout ─────────────────────────────────────────────────────────────── */
const DashboardLayout = () => {
  const { isDark, toggle } = useTheme()
  const { user, logout, isAuthenticated } = useAuth()
  const dispatch = useDispatch()
  const location = useLocation()
  const { unreadCount } = useSelector((state) => state.notifications)

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect immediately on auth
      websocketService.connect()
      
      // Also subscribe to presence for online status
      websocketService.subscribeToPresence((presenceData) => {
        // Presence updates will be handled by websocket subscriptions in useChat/usePresence
      })
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    dispatch(setCopilotContext({ page: location.pathname, title: document.title }))
  }, [dispatch, location.pathname])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 bg-white px-6 py-3 dark:border-[#30363D] dark:bg-[#161B22]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch(toggleSidebar())}
                aria-label="Toggle sidebar"
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden transition-colors"
              >
                <FiMenu className="text-xl" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="rounded-lg p-2 text-gray-500 dark:text-gray-400
                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>
              <button
                onClick={() => dispatch(togglePanel())}
                aria-label="Notifications"
                className="relative rounded-lg p-2 text-gray-500 dark:text-gray-400
                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center
                    rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />
              <UserMenu
                user={user}
                logout={logout}
                unreadCount={unreadCount}
                onNotifications={() => dispatch(togglePanel())}
              />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
