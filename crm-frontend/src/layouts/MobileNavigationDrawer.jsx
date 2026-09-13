import { useState, useEffect, memo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  MessageSquare,
  BarChart3,
  Zap,
  Megaphone,
  Puzzle,
  Settings,
  ChevronDown,
  X,
  User,
  Bell,
  LogOut,
} from 'lucide-react'

const MOBILE_NAV_GROUPS = [
  {
    title: 'MAIN',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/workspaces', icon: FolderOpen, label: 'Workspaces' },
      { path: '/crm', icon: Users, label: 'CRM Pipeline' },
      { path: '/chat', icon: MessageSquare, label: 'Chat' },
      { path: '/analytics', icon: BarChart3, label: 'Analytics' },
      { path: '/ai-insights', icon: Zap, label: 'AI Insights' },
    ],
  },
  {
    title: 'MARKETING',
    items: [
      {
        label: 'Marketing',
        icon: Megaphone,
        children: [
          { path: '/marketing/lead-magnets', label: 'Lead Magnets' },
          { path: '/marketing/email-campaigns', label: 'Email Campaigns' },
          { path: '/marketing/automations', label: 'Automations' },
        ],
      },
    ],
  },
  {
    title: 'DEVELOPER TOOLS',
    items: [
      {
        label: 'Developer Tools',
        icon: Puzzle,
        children: [
          { path: '/chrome-extensions', label: 'Extension Lab' },
        ],
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { path: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

const MobileNavigationDrawer = memo(({ isOpen, onClose, user, logout, unreadCount, onNotifications, currentTheme }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedMenu, setExpandedMenu] = useState(null)

  // Body scroll locking when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Auto-expand group containing active route
  useEffect(() => {
    for (const group of MOBILE_NAV_GROUPS) {
      const activeItem = group.items.find(
        (item) => item.children && item.children.some((child) => location.pathname.startsWith(child.path))
      )
      if (activeItem) {
        setExpandedMenu(activeItem.label)
        break
      }
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
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              backgroundColor: currentTheme?.colors?.sidebar || '#071A3A',
              borderColor: currentTheme?.colors?.border || 'rgba(255, 255, 255, 0.1)',
            }}
            className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] border-r h-screen overflow-y-auto flex flex-col z-50 lg:hidden shadow-2xl"
          >
            {/* Header */}
            <div
              className="p-4 border-b flex items-center justify-between shrink-0 h-16"
              style={{ borderColor: currentTheme?.colors?.border || 'rgba(255, 255, 255, 0.1)' }}
            >
              <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0052FF] flex items-center justify-center text-white font-black text-xs shadow-md">
                  TF
                </div>
                <span
                  style={{ color: currentTheme?.colors?.text || '#FFFFFF' }}
                  className="font-black text-base uppercase tracking-wider"
                >
                  TaskFlow AI
                </span>
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={{ backgroundColor: currentTheme?.colors?.surface || 'rgba(255, 255, 255, 0.05)' }}
                aria-label="Close navigation menu"
              >
                <X size={20} style={{ color: currentTheme?.colors?.text || '#FFFFFF' }} />
              </button>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
              {MOBILE_NAV_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1">
                  <div
                    className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest"
                    style={{ color: currentTheme?.colors?.textMuted || '#94A3B8' }}
                  >
                    {group.title}
                  </div>

                  {group.items.map((item) => {
                    if (item.children) {
                      const Icon = item.icon
                      const isExpanded = expandedMenu === item.label
                      const hasActiveChild = item.children.some((child) => location.pathname.startsWith(child.path))

                      return (
                        <div key={item.label}>
                          <button
                            onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative min-h-[44px]"
                            style={{
                              backgroundColor: isExpanded || hasActiveChild ? (currentTheme?.colors?.surface || 'rgba(255, 255, 255, 0.08)') : 'transparent',
                              color: isExpanded || hasActiveChild ? (currentTheme?.colors?.primary || '#0052FF') : (currentTheme?.colors?.textSecondary || '#CBD5E1'),
                            }}
                          >
                            <Icon size={18} className="shrink-0" />
                            <span className="text-sm font-semibold flex-1 text-left">{item.label}</span>
                            <ChevronDown
                              size={16}
                              className="shrink-0 transition-transform duration-200"
                              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                            {(isExpanded || hasActiveChild) && (
                              <div
                                className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md"
                                style={{ backgroundColor: currentTheme?.colors?.primary || '#0052FF' }}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="pl-4 space-y-1 mt-1 border-l border-white/10 ml-4">
                              {item.children.map((child) => {
                                const isActive = location.pathname.startsWith(child.path)
                                return (
                                  <button
                                    key={child.path}
                                    onClick={() => handleNavigation(child.path)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative min-h-[44px]"
                                    style={{
                                      backgroundColor: isActive ? (currentTheme?.colors?.surface || 'rgba(255, 255, 255, 0.1)') : 'transparent',
                                      color: isActive ? (currentTheme?.colors?.primary || '#0052FF') : (currentTheme?.colors?.textSecondary || '#CBD5E1'),
                                    }}
                                  >
                                    <span className="text-xs font-semibold flex-1 text-left">{child.label}</span>
                                    {isActive && (
                                      <div
                                        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md"
                                        style={{ backgroundColor: currentTheme?.colors?.primary || '#0052FF' }}
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
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative min-h-[44px]"
                        style={{
                          backgroundColor: isActive ? (currentTheme?.colors?.surface || 'rgba(255, 255, 255, 0.08)') : 'transparent',
                          color: isActive ? (currentTheme?.colors?.primary || '#0052FF') : (currentTheme?.colors?.textSecondary || '#CBD5E1'),
                        }}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className="text-sm font-semibold flex-1 text-left">{label}</span>
                        {isActive && (
                          <div
                            className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md"
                            style={{ backgroundColor: currentTheme?.colors?.primary || '#0052FF' }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </nav>

            {/* User Section & Footer */}
            <div
              className="p-3 border-t space-y-1.5 shrink-0"
              style={{ borderColor: currentTheme?.colors?.border || 'rgba(255, 255, 255, 0.1)' }}
            >
              <button
                onClick={() => handleNavigation('/profile')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px]"
                style={{
                  backgroundColor: location.pathname === '/profile' ? (currentTheme?.colors?.surface || 'rgba(255, 255, 255, 0.1)') : 'transparent',
                  color: location.pathname === '/profile' ? (currentTheme?.colors?.primary || '#0052FF') : (currentTheme?.colors?.textSecondary || '#CBD5E1'),
                }}
              >
                <User size={18} className="shrink-0" />
                <span className="text-xs font-semibold">Profile</span>
              </button>

              <button
                onClick={() => {
                  onNotifications()
                  onClose()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px]"
                style={{
                  backgroundColor: 'transparent',
                  color: currentTheme?.colors?.textSecondary || '#CBD5E1',
                }}
              >
                <div className="relative">
                  <Bell size={18} className="shrink-0" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold">Notifications</span>
              </button>

              <button
                onClick={() => {
                  onClose()
                  logout()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px]"
                style={{
                  color: currentTheme?.colors?.danger || '#EF4444',
                }}
              >
                <LogOut size={18} className="shrink-0" />
                <span className="text-xs font-semibold">Logout</span>
              </button>

              <div
                className="pt-2 text-center text-[10px] font-bold uppercase tracking-wider"
                style={{ color: currentTheme?.colors?.textMuted || '#94A3B8' }}
              >
                TaskFlow AI v1.0.0
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})

MobileNavigationDrawer.displayName = 'MobileNavigationDrawer'

export default MobileNavigationDrawer
