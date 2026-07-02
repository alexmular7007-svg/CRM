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
  Menu,
  X,
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

const AuthenticatedSidebar = () => {
  // State management
  const [sidebarState, setSidebarState] = useState(() => {
    const saved = localStorage.getItem('sidebar-state')
    return saved || 'collapsed' // 'collapsed', 'pinned'
  })
  const [isPeeking, setIsPeeking] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)
  const sidebarRef = useRef(null)
  const peekTimeoutRef = useRef(null)

  const { currentTheme } = useThemeContext()
  const location = useLocation()
  const navigate = useNavigate()

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-state', sidebarState)
  }, [sidebarState])

  // Handle mouse enter for peek mode (desktop only)
  const handleMouseEnter = () => {
    if (isMobile || sidebarState === 'pinned') return
    if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current)
    setIsPeeking(true)
  }

  // Handle mouse leave for peek mode (desktop only)
  const handleMouseLeave = () => {
    if (isMobile || sidebarState === 'pinned') return
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

  // Close mobile drawer
  const closeMobileDrawer = () => {
    setShowMobileDrawer(false)
  }

  // Determine sidebar width
  const getWidth = () => {
    if (sidebarState === 'pinned') return '280px'
    if (isPeeking) return '140px'
    return '72px'
  }

  const showLabels = isPeeking || sidebarState === 'pinned'
  const showFullLabels = sidebarState === 'pinned'

  // Desktop Sidebar
  if (!isMobile) {
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
        }}
        className="hidden lg:flex flex-col border-r h-screen overflow-hidden"
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
            {/* Logo Image */}
            <img
              src="/logo.png"
              alt="AI CRM"
              className="h-8 w-8 object-contain"
              style={{ filter: 'brightness(1)' }}
            />

            {/* Text - Shows in pinned or peek mode */}
            {showLabels && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.12 }}
                className="text-sm font-bold"
                style={{ color: currentTheme.colors.primary }}
              >
                {showFullLabels ? 'AI CRM' : 'AI'}
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

        {/* Footer help text - REMOVED */}


      </motion.aside>
    )
  }

  // Mobile Version with Drawer
  return (
    <>
      {/* Mobile Menu Button */}
      {!showMobileDrawer && (
        <button
          onClick={() => setShowMobileDrawer(true)}
          className="lg:hidden fixed bottom-6 right-6 p-4 rounded-full z-40 transition-transform active:scale-95"
          style={{
            backgroundColor: currentTheme.colors.primary,
            color: currentTheme.colors.buttonPrimaryText,
            boxShadow: `0 4px 12px ${currentTheme.colors.shadow}`,
          }}
        >
          <Menu size={24} />
        </button>
      )}

      {/* Mobile Drawer */}
      {showMobileDrawer && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileDrawer}
            className="lg:hidden fixed inset-0 bg-black z-40"
            style={{ opacity: 0.5 }}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              backgroundColor: currentTheme.colors.sidebar,
              borderColor: currentTheme.colors.border,
            }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-64 border-r h-screen overflow-y-auto flex flex-col z-50"
          >
            {/* Mobile Header */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: currentTheme.colors.border }}
            >
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="AI CRM"
                  className="h-8 w-8 object-contain"
                />
                <span
                  style={{ color: currentTheme.colors.text }}
                  className="font-bold text-base"
                >
                  AI CRM
                </span>
              </div>
              <button
                onClick={closeMobileDrawer}
                className="p-2 hover:rounded-lg transition-colors"
                style={{ backgroundColor: currentTheme.colors.surface }}
              >
                <X size={20} style={{ color: currentTheme.colors.text }} />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 p-2 space-y-1">
              {NAV.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname.startsWith(path)

                return (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path)
                      closeMobileDrawer()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative"
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

            {/* Mobile Footer */}
            <div
              className="border-t p-3 text-center text-xs"
              style={{
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.textMuted,
              }}
            >
              v1.0.0
            </div>
          </motion.aside>
        </>
      )}
    </>
  )
}

export default AuthenticatedSidebar
