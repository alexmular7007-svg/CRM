import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  MessageSquare,
  BarChart3,
  Zap,
  Settings,
  Zap as Logo,
} from 'lucide-react'
import { useThemeContext } from '../contexts/ThemeContext'

const NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/workspaces', icon: FolderOpen, label: 'Workspaces' },
  { path: '/crm', icon: Users, label: 'CRM Pipeline' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/ai-insights', icon: Zap, label: 'AI Insights' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

/**
 * AuthenticatedSidebar - Desktop only (lg breakpoint and above)
 * Mobile navigation is handled by MobileNavigationDrawer in AuthenticatedLayout
 */
const AuthenticatedSidebar = () => {
  // State management
  const [sidebarState, setSidebarState] = useState(() => {
    const saved = localStorage.getItem('sidebar-state')
    return saved || 'collapsed' // 'collapsed', 'pinned'
  })
  const [isPeeking, setIsPeeking] = useState(false)
  const sidebarRef = useRef(null)
  const peekTimeoutRef = useRef(null)

  const { currentTheme } = useThemeContext()
  const location = useLocation()
  const navigate = useNavigate()

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-state', sidebarState)
  }, [sidebarState])

  // Handle mouse enter for peek mode
  const handleMouseEnter = () => {
    if (sidebarState === 'pinned') return
    if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current)
    setIsPeeking(true)
  }

  // Handle mouse leave for peek mode
  const handleMouseLeave = () => {
    if (sidebarState === 'pinned') return
    if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current)
    peekTimeoutRef.current = setTimeout(() => {
      setIsPeeking(false)
    }, 50)
  }

  // Toggle pin state
  const togglePin = () => {
    if (sidebarState === 'pinned') {
      setSidebarState('collapsed')
      setIsPeeking(false)
    } else {
      setSidebarState('pinned')
      setIsPeeking(false)
    }
  }

  // Determine sidebar width
  const getWidth = () => {
    if (sidebarState === 'pinned') return '280px'
    if (isPeeking) return '140px'
    return '72px'
  }

  const showLabels = isPeeking || sidebarState === 'pinned'
  const showFullLabels = sidebarState === 'pinned'

  return (
    <motion.aside
      ref={sidebarRef}
      initial={false}
      animate={{ width: getWidth() }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        backgroundColor: currentTheme.colors.sidebar,
        borderColor: currentTheme.colors.border,
        zIndex: isPeeking ? 40 : 30,
        boxSizing: 'border-box',
        margin: 0,
        padding: 0,
      }}
      className="hidden lg:flex flex-col border-r border-l-0 border-t-0 border-b-0 h-screen overflow-hidden"
    >
      {/* Logo/Header */}
      <div
        style={{ borderColor: currentTheme.colors.border }}
        className="flex items-center justify-between border-b px-3 py-2 h-16 flex-shrink-0"
      >
        <button
          onClick={togglePin}
          title={sidebarState === 'pinned' ? 'Click to unpin' : 'Click to pin'}
          className="flex-1 h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            backgroundColor: currentTheme.colors.surface,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.colors.surface
          }}
        >
          {/* Logo Icon */}
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Logo size={16} className="text-white" />
          </div>

          {/* Text - Shows in pinned or peek mode */}
          {showLabels && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.12 }}
              className="text-sm font-bold truncate"
              style={{ color: currentTheme.colors.primary }}
            >
              {showFullLabels ? 'TaskFlow AI' : 'Task'}
            </motion.span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(path)

          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              title={!showLabels ? label : ''}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group"
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

              {/* Label - shortened in peek mode, full in pinned */}
              {showLabels && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.12 }}
                  className="text-sm font-medium flex-1 text-left truncate"
                >
                  {showFullLabels ? label : label.split(' ')[0]}
                </motion.span>
              )}

              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-r-lg"
                  style={{ backgroundColor: currentTheme.colors.primary }}
                />
              )}

              {/* Tooltip - collapsed state only */}
              {!showLabels && (
                <div
                  className="absolute left-full ml-3 px-2.5 py-1.5 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap font-medium shadow-lg"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text,
                    border: `1px solid ${currentTheme.colors.border}`,
                  }}
                >
                  {label}
                </div>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          borderColor: currentTheme.colors.border,
          color: currentTheme.colors.textMuted,
        }}
        className="border-t p-2 text-center text-[11px]"
      >
        v1.0.0
      </div>
    </motion.aside>
  )
}

export default AuthenticatedSidebar
