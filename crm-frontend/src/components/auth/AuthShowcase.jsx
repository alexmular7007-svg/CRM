import { motion } from 'framer-motion'
import { LayoutDashboard, Briefcase, Users, MessageSquare, BarChart3, Sparkles, Settings, Calendar, Bell, Moon, Search, ChevronRight } from 'lucide-react'
import { useThemeContext } from '../../contexts/ThemeContext'

const AuthShowcase = () => {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  return (
    <div className={`w-full h-full ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} flex items-center justify-center p-8 relative overflow-hidden`}>
      {/* Background gradient orbs */}
      <div className={`absolute -top-40 -right-40 w-96 h-96 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-300/20'} rounded-full blur-3xl`} />
      <div className={`absolute -bottom-40 -left-40 w-96 h-96 ${isDark ? 'bg-purple-500/10' : 'bg-purple-300/20'} rounded-full blur-3xl`} />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">✓</div>
            <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} tracking-tight`}>TaskFlow AI</span>
          </div>
          <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-4 leading-tight`}>
            Manage Projects, Teams and Clients from one workspace.
          </h2>
          <p className={`text-base ${isDark ? 'text-slate-300' : 'text-gray-600'} font-medium`}>
            Tasks, chat, CRM, and AI insights unified in a single platform.
          </p>
        </motion.div>

        {/* Dashboard Preview - Full Featured */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`${isDark ? 'bg-slate-800/60' : 'bg-white/80'} rounded-xl border ${isDark ? 'border-slate-700/50' : 'border-gray-300'} overflow-hidden shadow-2xl backdrop-blur-sm`}
        >
          {/* Browser Header */}
          <div className={`h-10 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-300'} border-b flex items-center px-3 gap-2`}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer transition" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer transition" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 hover:bg-green-600 cursor-pointer transition" />
            </div>
            <div className={`ml-3 flex-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} text-center font-medium`}>localhost:3000/dashboard</div>
          </div>

          {/* Content Container */}
          <div className="flex">
            {/* Sidebar Navigation */}
            <div className={`w-40 ${isDark ? 'bg-gradient-to-b from-slate-900 to-slate-800 border-slate-700' : 'bg-gradient-to-b from-white to-gray-50 border-gray-300'} border-r p-4 space-y-2 flex flex-col`}>
              <div className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'} uppercase tracking-widest px-2 mb-4`}>Navigation</div>
              {[
                { icon: LayoutDashboard, label: 'Dashboard', active: true },
                { icon: Briefcase, label: 'Projects' },
                { icon: Users, label: 'Workspaces' },
                { icon: MessageSquare, label: 'CRM' },
                { icon: BarChart3, label: 'Chat' },
                { icon: Sparkles, label: 'Analytics' },
                { icon: Sparkles, label: 'AI Insights' },
                { icon: Calendar, label: 'Calendar' },
                { icon: Settings, label: 'Settings' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    item.active
                      ? isDark ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={14} />
                  <span className="truncate">{item.label}</span>
                </motion.div>
              ))}
              
              {/* User Profile */}
              <div className={`mt-auto pt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-gray-300'}`}>
                <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'} text-xs cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-gray-900'} transition`}>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0" />
                  <span className="font-medium truncate">John Doe</span>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 ${isDark ? 'bg-gradient-to-b from-slate-700/20 to-slate-800/20' : 'bg-gradient-to-b from-white to-gray-50'} p-4 space-y-3 max-h-96 overflow-y-auto`}>
              {/* Top Bar */}
              <div className={`flex justify-between items-center pb-3 border-b ${isDark ? 'border-slate-700/50' : 'border-gray-300'}`}>
                <div className={`flex items-center gap-2 flex-1 ${isDark ? 'bg-slate-900/50' : 'bg-gray-100'} rounded-lg px-3 py-2`}>
                  <Search size={14} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                  <input type="text" placeholder="Search..." className={`bg-transparent text-xs ${isDark ? 'text-slate-400 placeholder-slate-600' : 'text-gray-600 placeholder-gray-400'} outline-none flex-1`} />
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Bell size={14} className={`${isDark ? 'text-slate-400' : 'text-gray-500'} cursor-pointer ${isDark ? 'hover:text-slate-300' : 'hover:text-gray-700'}`} />
                  <Moon size={14} className={`${isDark ? 'text-slate-400' : 'text-gray-500'} cursor-pointer ${isDark ? 'hover:text-slate-300' : 'hover:text-gray-700'}`} />
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Projects', value: '24', icon: '📊' },
                  { label: 'Tasks', value: '156', icon: '✓' },
                  { label: 'Team Members', value: '32', icon: '👥' },
                  { label: 'Productivity', value: '92%', icon: '⚡' },
                ].map((kpi, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className={`${isDark ? 'bg-slate-900/60' : 'bg-gray-100'} rounded-lg p-2.5 border ${isDark ? 'border-slate-600/30 hover:border-indigo-500/50' : 'border-gray-300 hover:border-indigo-400'} transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'} font-medium`}>{kpi.label}</div>
                        <div className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-gray-900'} mt-1`}>{kpi.value}</div>
                      </div>
                      <div className="text-xl">{kpi.icon}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Project Progress Section */}
              <div className={`${isDark ? 'bg-slate-900/40' : 'bg-gray-100'} rounded-lg p-3 border ${isDark ? 'border-slate-600/30' : 'border-gray-300'}`}>
                <div className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2.5`}>Project Progress</div>
                <div className="space-y-2">
                  {[
                    { name: 'Website Redesign', progress: 75 },
                    { name: 'Mobile App', progress: 60 },
                    { name: 'CRM Integration', progress: 90 },
                  ].map((proj, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{proj.name}</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{proj.progress}%</span>
                      </div>
                      <div className={`h-1.5 ${isDark ? 'bg-slate-800' : 'bg-gray-300'} rounded-full overflow-hidden`}>
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600" style={{ width: `${proj.progress}%` }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CRM Pipeline */}
              <div className={`${isDark ? 'bg-slate-900/40' : 'bg-gray-100'} rounded-lg p-3 border ${isDark ? 'border-slate-600/30' : 'border-gray-300'}`}>
                <div className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2.5`}>CRM Pipeline</div>
                <div className="space-y-1.5">
                  {[
                    { stage: 'Lead', count: 120, color: 'bg-blue-500' },
                    { stage: 'Qualified', count: 85, color: 'bg-indigo-500' },
                    { stage: 'Proposal', count: 45, color: 'bg-purple-500' },
                    { stage: 'Won', count: 25, color: 'bg-emerald-500' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 + i * 0.05 }}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-slate-400">{item.stage}</span>
                      </div>
                      <span className="font-bold text-slate-200">{item.count}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Team Activity */}
              <div className={`${isDark ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30' : 'bg-gradient-to-r from-indigo-100 to-purple-100'} rounded-lg p-3 border ${isDark ? 'border-indigo-500/30' : 'border-indigo-300'}`}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Team Activity</p>
                    <p className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>+12%</p>
                  </div>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>vs last week</span>
                </motion.div>
              </div>

              {/* AI Copilot Widget */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className={`${isDark ? 'bg-gradient-to-br from-indigo-600/40 to-purple-600/40' : 'bg-gradient-to-br from-indigo-100 to-purple-100'} rounded-lg p-3 border ${isDark ? 'border-indigo-500/30 hover:border-indigo-400/50' : 'border-indigo-300 hover:border-indigo-400'} cursor-pointer transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-800'} mb-1`}>✨ AI Insight</div>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-700'} leading-snug`}>3 tasks at risk. View details →</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Feature Bullets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-8 grid grid-cols-2 gap-3"
        >
          {[
            'Task Management',
            'Real-time Collaboration',
            'CRM Pipeline',
            'AI Insights',
          ].map((feature, i) => (
            <div key={i} className={`flex items-center gap-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              <div className={`w-5 h-5 rounded-full ${isDark ? 'bg-indigo-600/20 border-indigo-500/30' : 'bg-indigo-100 border-indigo-300'} border flex items-center justify-center text-xs ${isDark ? 'text-indigo-400' : 'text-indigo-600'} flex-shrink-0`}>✓</div>
              <span className="text-sm font-medium">{feature}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default AuthShowcase
