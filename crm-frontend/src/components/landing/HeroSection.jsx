import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Play, Search, Bell, Moon, Settings, LayoutDashboard, BarChart3, Users, MessageSquare, Briefcase, Sparkles } from 'lucide-react'
import RotatingAvatar from './RotatingAvatar'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
})

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white dark:bg-[#09090B] min-h-screen flex items-center">
      <div className="relative max-w-7xl mx-auto w-full grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">
        
        {/* LEFT COLUMN */}
        <div className="max-w-2xl">
          {/* Badge */}
          <motion.div {...fadeUp(0)} className="flex mb-8">
            <div className="inline-flex items-center gap-2 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" />
              AI-Powered Workspace
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            {...fadeUp(0.1)}
            className="text-5xl sm:text-6xl lg:text-[3.5rem] font-black tracking-tight text-gray-950 dark:text-white leading-[1.15] mb-8 space-y-2"
          >
            <span className="block">Manage Projects, CRM,</span>
            <span className="block">Team Collaboration</span>
            <span className="block">and AI Insights from</span>
            <span className="block">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text">One Workspace.</span>
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            {...fadeUp(0.15)}
            className="text-lg text-gray-600 dark:text-gray-300 mb-12 leading-relaxed max-w-xl font-medium"
          >
            TaskFlow AI helps teams plan projects, track leads, collaborate in real time, and gain AI-powered insights to deliver exceptional results.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div {...fadeUp(0.2)} className="flex flex-col sm:flex-row items-center gap-4 mb-16">
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
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:border-gray-300 dark:hover:border-gray-600 text-base font-semibold rounded-xl transition-all"
            >
              <Play size={18} className="text-indigo-600" />
              View Demo
            </motion.button>
          </motion.div>

          {/* Statistics Row */}
          <motion.div {...fadeUp(0.3)} className="grid grid-cols-3 gap-6 pt-12 border-t border-gray-200 dark:border-gray-800">
            <div>
              <div className="text-3xl font-black text-gray-950 dark:text-white mb-2">50+</div>
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Active Teams</div>
            </div>
            <div>
              <div className="text-3xl font-black text-gray-950 dark:text-white mb-2">10,000+</div>
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Tasks Managed</div>
            </div>
            <div>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-2">95%</div>
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Faster Collaboration</div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN - INTERACTIVE DASHBOARD */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative lg:h-[700px] w-full rounded-2xl border-2 border-gray-300 dark:border-gray-700 bg-gradient-to-br from-white dark:from-[#1A1A1D] via-gray-50 dark:via-[#13131A] to-gray-100 dark:to-[#09090B] shadow-2xl dark:shadow-xl overflow-hidden flex flex-col"
          style={{
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.5), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Browser Header */}
          <div className="h-12 bg-white dark:bg-[#1A1A1D] border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 shrink-0">
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
            <div className="w-48 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 p-4 flex flex-col gap-6 shrink-0">
              <div className="flex items-center gap-2 text-white">
                <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold">✓</div>
                <span className="font-bold text-sm">TaskFlow</span>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Menu</div>
                {[
                  { icon: LayoutDashboard, label: 'Dashboard', active: true },
                  { icon: Briefcase, label: 'Projects' },
                  { icon: Users, label: 'CRM' },
                  { icon: MessageSquare, label: 'Chat' },
                  { icon: BarChart3, label: 'Analytics' },
                  { icon: Sparkles, label: 'AI' },
                  { icon: Settings, label: 'Settings' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${item.active ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}>
                    <item.icon size={14} />
                    {item.label}
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-300 text-xs cursor-pointer hover:text-white transition">
                  <RotatingAvatar size="sm" location="sidebar" />
                  <span className="font-medium">You</span>
                </div>
              </div>
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 bg-gradient-to-b from-gray-50 dark:from-[#13131A] to-gray-100 dark:to-[#09090B] p-6 flex flex-col gap-6 overflow-y-auto">
              {/* Top Bar */}
              <div className="flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Welcome back to your workspace</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <Search size={14} className="text-gray-400" />
                    <input type="text" placeholder="Search..." className="bg-transparent text-xs text-gray-600 dark:text-gray-300 placeholder-gray-400 focus:outline-none w-24" />
                  </div>
                  <RotatingAvatar size="md" location="topbar" />
                  <Bell size={16} className="text-gray-500 dark:text-gray-400" />
                  <Moon size={16} className="text-gray-500 dark:text-gray-400" />
                </div>
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                {[
                  { label: 'Projects', value: '24', unit: '+5 this week', color: 'from-blue-500' },
                  { label: 'Active Tasks', value: '156', unit: '+21% month', color: 'from-indigo-500' },
                  { label: 'Team Members', value: '32', unit: '+3 this week', color: 'from-emerald-500' },
                  { label: 'Productivity', value: '92%', unit: '+2pt week', color: 'from-amber-500' },
                ].map((metric, i) => (
                  <div key={i} className="bg-white dark:bg-[#1A1A1D] rounded-lg border-2 border-gray-300 dark:border-gray-700 p-3 shadow-md dark:shadow-sm hover:shadow-lg dark:hover:shadow-md transition-all">
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{metric.label}</div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">{metric.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{metric.unit}</div>
                  </div>
                ))}
              </div>

              {/* Project Progress */}
              <div className="bg-white dark:bg-[#1A1A1D] rounded-lg border-2 border-gray-300 dark:border-gray-700 p-4 shadow-md dark:shadow-sm shrink-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Project Progress</h4>
                <div className="space-y-3">
                  {[
                    { name: 'Website Redesign', progress: 75 },
                    { name: 'Mobile App', progress: 60 },
                    { name: 'CRM Integration', progress: 90 },
                  ].map((proj, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{proj.name}</span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{proj.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600" style={{ width: `${proj.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CRM Pipeline */}
              <div className="bg-white dark:bg-[#1A1A1D] rounded-lg border-2 border-gray-300 dark:border-gray-700 p-4 shadow-md dark:shadow-sm shrink-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">CRM Pipeline</h4>
                <div className="space-y-2 text-xs">
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

              {/* Team Activity */}
              <div className="bg-white dark:bg-[#1A1A1D] rounded-lg border-2 border-gray-300 dark:border-gray-700 p-4 shadow-md dark:shadow-sm shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Team Activity</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">+12%</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">vs last week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating AI Insight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-56 sm:right-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-2xl border border-indigo-500/30 max-w-xs"
          >
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold mb-1">AI Insight</p>
                <p className="text-xs leading-relaxed text-indigo-100">3 tasks are at risk of delay. View details →</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}

export default HeroSection
