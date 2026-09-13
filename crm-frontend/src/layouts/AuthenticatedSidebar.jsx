import { useState, useEffect, useRef, memo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  MessageSquare,
  BarChart3,
  Zap,
  Settings,
  Megaphone,
  ChevronDown,
  Puzzle,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react'
import { useThemeContext } from '../contexts/ThemeContext'

const NAV_GROUPS = [
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

const AuthenticatedSidebar = memo(() => {
  // State management: 'collapsed' (72px) or 'pinned' (260px)
  const [sidebarState, setSidebarState] = useState(() => {
    const saved = localStorage.getItem('sidebar-state')
    return saved || 'collapsed'
  })
  
  const [expandedMenu, setExpandedMenu] = useState(null)
  const sidebarRef = useRef(null)
  const { currentTheme } = useThemeContext()
  const location = useLocation()
  const navigate = useNavigate()

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-state', sidebarState)
  }, [sidebarState])

  // Auto-expand group containing active route
  useEffect(() => {
    for (const group of NAV_GROUPS) {
      const activeGroup = group.items.find(
        (item) => item.children && item.children.some((child) => location.pathname.startsWith(child.path))
      )
      if (activeGroup) {
        setExpandedMenu(activeGroup.label)
        break
      }
    }
  }, [location.pathname])

  // Toggle between collapsed (72px) and expanded/pinned (260px)
  const togglePin = () => {
    setSidebarState((prev) => (prev === 'pinned' ? 'collapsed' : 'pinned'))
  }

  const isExpanded = sidebarState === 'pinned'
  const sidebarWidth = isExpanded ? '260px' : '72px'

  return (
    <motion.aside
      ref={sidebarRef}
      initial={false}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        backgroundColor: currentTheme?.colors?.sidebar || '#071A3A',
        borderColor: currentTheme?.colors?.border || 'rgba(255, 255, 255, 0.1)',
        boxSizing: 'border-box',
        borderWidth: '1px',
        borderRightWidth: '1px',
        margin: 0,
        padding: 0,
      }}
      className="hidden lg:flex flex-col border-r h-screen overflow-hidden select-none shrink-0"
    >
      {/* Header Container */}
      <div
        style={{ borderColor: currentTheme?.colors?.border || 'rgba(255, 255, 255, 0.1)' }}
        className={`flex items-center ${isExpanded ? 'justify-between px-3.5' : 'justify-center px-2'} h-16 shrink-0 border-b`}
      >
        {isExpanded ? (
          <>
            <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[#0052FF] flex items-center justify-center text-white font-black text-xs shadow-md shrink-0">
                TF
              </div>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col min-w-0"
              >
                <span
                  style={{ color: currentTheme?.colors?.text || '#FFFFFF' }}
                  className="text-sm font-black uppercase tracking-wider truncate leading-tight"
                >
                  TaskFlow AI
                </span>
                <span
                  style={{ color: currentTheme?.colors?.textMuted || '#94A3B8' }}
                  className="text-[10px] font-bold uppercase tracking-widest truncate"
                >
                  Workspace
                </span>
              </motion.div>
            </Link>

            {/* Toggle Collapse Control Button */}
            <button
              onClick={togglePin}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="p-2 rounded-lg transition-colors flex items-center justify-center"
              style={{
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme?.colors?.surfaceSecondary || 'rgba(255, 255, 255, 0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <PanelLeftClose size={18} style={{ color: currentTheme?.colors?.textSecondary || '#CBD5E1' }} />
            </button>
          </>
        ) : (
          <button
            onClick={togglePin}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="w-10 h-10 rounded-xl bg-[#0052FF] hover:bg-[#0043D6] flex items-center justify-center text-white shadow-md transition-all group relative"
          >
            <PanelLeft size={18} />
            <div
              className="absolute left-full ml-3 px-3 py-1.5 text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap shadow-xl bg-[#071A3A] dark:bg-[#0F172A] text-white border border-white/10"
              role="tooltip"
            >
              Expand Sidebar
            </div>
          </button>
        )}
      </div>

      {/* Navigation Groups Container */}
      <nav className="flex-1 px-2.5 py-3 space-y-5 overflow-y-auto overflow-x-hidden">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {/* Section Header (Visible in Expanded Mode) */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-[0.12em]"
                style={{ color: currentTheme?.colors?.textMuted || '#94A3B8' }}
              >
                {group.title}
              </motion.div>
            )}

            {group.items.map((item) => {
              // Handle Collapsible Submenus (Marketing & Developer Tools)
              if (item.children) {
                const Icon = item.icon
                const isSubExpanded = expandedMenu === item.label
                const hasActiveChild = item.children.some((child) => location.pathname.startsWith(child.path))

                return (
                  <div key={item.label}>
                    <button
                      onClick={() => {
                        if (!isExpanded) {
                          setSidebarState('pinned')
                          setExpandedMenu(item.label)
                        } else {
                          setExpandedMenu(isSubExpanded ? null : item.label)
                        }
                      }}
                      aria-label={item.label}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative group min-h-[44px]"
                      style={{
                        backgroundColor: (isSubExpanded || hasActiveChild) && isExpanded ? (currentTheme?.colors?.surface || 'rgba(255, 255, 255, 0.08)') : 'transparent',
                        color: (isSubExpanded || hasActiveChild) ? (currentTheme?.colors?.primary || '#0052FF') : (currentTheme?.colors?.textSecondary || '#CBD5E1'),
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = currentTheme?.colors?.surfaceSecondary || 'rgba(255, 255, 255, 0.06)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = (isSubExpanded || hasActiveChild) && isExpanded ? (currentTheme?.colors?.surface || 'rgba(255, 255, 255, 0.08)') : 'transparent'
                      }}
                    >
                      <Icon size={18} className="shrink-0" />

                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.12 }}
                          className="text-sm font-semibold flex-1 text-left truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}

                      {/* Submenu Indicator Chevron */}
                      {isExpanded && (
                        <ChevronDown
                          size={15}
                          className="shrink-0 transition-transform duration-200"
                          style={{
                            transform: isSubExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                      )}

                      {/* Collapsed Tooltip */}
                      {!isExpanded && (
                        <div
                          className="absolute left-full ml-3 px-3 py-1.5 text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap shadow-xl bg-[#071A3A] dark:bg-[#0F172A] text-white border border-white/10"
                          role="tooltip"
                        >
                          {item.label}
                        </div>
                      )}
                    </button>

                    {/* Submenu Children Items (Only shown when Expanded) */}
                    {isExpanded && isSubExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="pl-4 space-y-1 mt-1 border-l border-white/10 ml-4 overflow-hidden"
                      >
                        {item.children.map((child) => {
                          const isActive = location.pathname.startsWith(child.path)
                          return (
                            <button
                              key={child.path}
                              onClick={() => navigate(child.path)}
                              aria-label={child.label}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative group min-h-[40px]"
                              style={{
                                backgroundColor: isActive ? (currentTheme?.colors?.surface || 'rgba(255, 255, 255, 0.1)') : 'transparent',
                                color: isActive ? (currentTheme?.colors?.primary || '#0052FF') : (currentTheme?.colors?.textSecondary || '#CBD5E1'),
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = currentTheme?.colors?.surfaceSecondary || 'rgba(255, 255, 255, 0.06)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isActive ? (currentTheme?.colors?.surface || 'rgba(255, 255, 255, 0.1)') : 'transparent'
                              }}
                            >
                              <span className="text-xs font-semibold flex-1 text-left truncate">{child.label}</span>
                              {isActive && (
                                <div
                                  className="absolute left-0 top-1 bottom-1 w-1 rounded-r-md"
                                  style={{ backgroundColor: currentTheme?.colors?.primary || '#0052FF' }}
                                />
                              )}
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </div>
                )
              }

              // Handle Top-Level Navigation Items
              const { path, icon: Icon, label } = item
              const isActive = location.pathname.startsWith(path)

              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  aria-label={label}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative group min-h-[44px]"
                  style={{
                    backgroundColor: isActive ? (currentTheme?.colors?.surface || 'rgba(255, 255, 255, 0.08)') : 'transparent',
                    color: isActive ? (currentTheme?.colors?.primary || '#0052FF') : (currentTheme?.colors?.textSecondary || '#CBD5E1'),
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = currentTheme?.colors?.surfaceSecondary || 'rgba(255, 255, 255, 0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? (currentTheme?.colors?.surface || 'rgba(255, 255, 255, 0.08)') : 'transparent'
                  }}
                >
                  <Icon size={18} className="shrink-0" />

                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.12 }}
                      className="text-sm font-semibold flex-1 text-left truncate"
                    >
                      {label}
                    </motion.span>
                  )}

                  {/* Active Indicator Pill */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md"
                      style={{ backgroundColor: currentTheme?.colors?.primary || '#0052FF' }}
                    />
                  )}

                  {/* Collapsed Tooltip */}
                  {!isExpanded && (
                    <div
                      className="absolute left-full ml-3 px-3 py-1.5 text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap shadow-xl bg-[#071A3A] dark:bg-[#0F172A] text-white border border-white/10"
                      role="tooltip"
                    >
                      {label}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </motion.aside>
  )
})

AuthenticatedSidebar.displayName = 'AuthenticatedSidebar'

export default AuthenticatedSidebar
