import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Play, BarChart3, Users, LayoutDashboard, MessageSquare, Briefcase, TrendingUp, Sparkles, Activity, TrendingUpIcon } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
})

// Animated line chart component
const MiniChart = () => (
  <svg className="w-full h-12" viewBox="0 0 100 40" preserveAspectRatio="none">
    <defs>
      <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
      </linearGradient>
    </defs>
    <polyline
      points="0,25 15,22 30,18 45,20 60,15 75,12 90,14 100,10"
      fill="none"
      stroke="#6366f1"
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
    />
    <polygon
      points="0,25 15,22 30,18 45,20 60,15 75,12 90,14 100,10 100,40 0,40"
      fill="url(#chartGrad)"
    />
  </svg>
)

const PremiumHero = () => {
  return (
    <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white dark:bg-[#09090B] min-h-[90vh] flex items-center">
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, #4f46e5 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        
        {/* Left Side Content */}
        <div className="max-w-2xl">
          {/* Badge */}
          <motion.div {...fadeUp(0)} className="flex mb-6">
            <div className="inline-flex items-center gap-2 border border-indigo-100 bg-indigo-50/80 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              Enterprise-grade AI Platform
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            {...fadeUp(0.1)}
            className="text-5xl sm:text-6xl lg:text-[4rem] font-black tracking-tight text-gray-950 dark:text-white leading-[1.15] mb-6 space-y-2"
          >
            <span className="block">Manage Projects, CRM,</span>
            <span className="block">Team Collaboration and</span>
            <span className="block">
              AI Insights from <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text">One Workspace.</span>
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            {...fadeUp(0.15)}
            className="text-lg text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-2xl font-medium"
          >
            TaskFlow AI helps you manage projects, track leads, collaborate in real time, and gain AI-powered insights to deliver exceptional results.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div {...fadeUp(0.2)} className="flex flex-col sm:flex-row items-center gap-4 mb-12">
            <Link to="/register" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
              >
                Get Started Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 border-2 border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300 text-base font-semibold rounded-xl transition-all"
            >
              <Play size={18} className="text-indigo-600 fill-indigo-600/20" />
              View Demo
            </motion.button>
          </motion.div>

          {/* Statistics row */}
          <motion.div {...fadeUp(0.3)} className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">50+</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Teams</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">10,000+</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks Managed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600 mb-1">95%</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Faster Collaboration</div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Dashboard Showcase */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative lg:h-[580px] w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white dark:from-[#1A1A1D] via-gray-50 dark:via-[#13131A] to-gray-100 dark:to-[#09090B] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Mac OS Header */}
          <div className="h-11 bg-white dark:bg-[#1A1A1D] border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 shrink-0">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer transition" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer transition" />
              <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 cursor-pointer transition" />
            </div>
            <div className="ml-3 flex-1 flex justify-center text-xs text-gray-500 dark:text-gray-400 font-medium">
              localhost:3000/dashboard
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-52 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 p-5 flex flex-col gap-6 shrink-0 hidden sm:flex">
              <div className="flex items-center gap-2 text-white">
                <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-lg">✓</div>
                <span className="font-bold text-sm tracking-wide">TaskFlow AI</span>
              </div>
              
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Navigation</div>
                {[
                  { icon: LayoutDashboard, label: 'Dashboard', active: true },
                  { icon: Briefcase, label: 'Projects' },
                  { icon: Users, label: 'CRM' },
                  { icon: MessageSquare, label: 'Chat' },
                  { icon: BarChart3, label: 'Analytics' },
                  { icon: Sparkles, label: 'AI Insights' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${item.active ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}>
                    <item.icon size={16} />
                    {item.label}
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-300 text-xs cursor-pointer hover:text-white transition">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
                  <span className="font-medium">John Doe</span>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-gradient-to-b from-gray-50 dark:from-[#13131A] to-gray-100 dark:to-[#09090B] p-6 flex flex-col gap-6 overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome to your workspace</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-gray-600">Online</span>
                </div>
              </div>

              {/* Top Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                {[
                  { label: 'New Projects', value: '24', unit: '+5 this week' },
                  { label: 'Active Tasks', value: '156', unit: '+21% this month' },
                  { label: 'Team Members', value: '32', unit: '+3 this week' },
                  { label: 'Productivity', value: '92%', unit: '+2pt this week' },
                ].map((metric, i) => (
                  <div key={i} className="bg-white dark:bg-[#1A1A1D] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-500">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{metric.label}</div>
                    <div className="text-2xl font-bold text-gray-950 dark:text-white mb-1">{metric.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{metric.unit}</div>
                  </div>
                ))}
              </div>

              {/* Project Progress & Pipeline */}
              <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Project Progress */}
                <div className="bg-white dark:bg-[#1A1A1D] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex flex-col">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Project Progress</h4>
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                    {[
                      { name: 'Website Redesign', progress: 75 },
                      { name: 'Mobile App', progress: 60 },
                      { name: 'CRM Integration', progress: 85 },
                    ].map((proj, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{proj.name}</span>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{proj.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" style={{ width: `${proj.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CRM Pipeline */}
                <div className="bg-white dark:bg-[#1A1A1D] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex flex-col">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">CRM Pipeline</h4>
                  <div className="space-y-2 flex-1 flex flex-col justify-between text-xs">
                    {[
                      { stage: 'Lead', count: 120, color: 'bg-blue-500' },
                      { stage: 'Qualified', count: 85, color: 'bg-indigo-500' },
                      { stage: 'Proposal', count: 45, color: 'bg-purple-500' },
                      { stage: 'Won', count: 25, color: 'bg-emerald-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="font-medium text-gray-700 dark:text-gray-300">{item.stage}</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating AI Insights Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-64 sm:right-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-2xl border border-indigo-500/30 max-w-xs"
          >
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold mb-1">AI Insights</p>
                <p className="text-xs leading-relaxed text-indigo-100">3 deals are at risk and 2 resources are overallocated. View details →</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}

export default PremiumHero
