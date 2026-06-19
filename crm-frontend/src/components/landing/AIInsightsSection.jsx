import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { AlertCircle, TrendingUp, Zap, Users, ArrowRight } from 'lucide-react'

const AIInsightCard = ({ isInView }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={isInView ? { opacity: 1, scale: 1 } : {}}
    transition={{ duration: 0.6, delay: 0.2 }}
    className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 p-8"
  >
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Health score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col items-center justify-center p-8 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border border-violet-200 dark:border-violet-800/50"
      >
        <div className="text-6xl font-bold text-violet-600 dark:text-violet-400 mb-2">82%</div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Workspace Health</div>
        <div className="text-xs text-gray-600 dark:text-zinc-400">Status: Good</div>
        <div className="mt-4 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 ${
                i < 4 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Detected issues */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="flex flex-col justify-start"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Insights</h3>
        </div>
        <div className="space-y-3">
          {[
            { text: '3 overdue tasks identified', color: 'text-rose-600 dark:text-rose-400' },
            { text: '1 project at risk', color: 'text-amber-600 dark:text-amber-400' },
            { text: '2 members overloaded', color: 'text-orange-600 dark:text-orange-400' },
          ].map((issue, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.3, delay: 0.45 + i * 0.05 }}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/60"
            >
              <div className="w-2 h-2 rounded-full bg-current opacity-60" style={{ color: issue.color }} />
              <span className={`text-sm font-medium ${issue.color}`}>{issue.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-col justify-start p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800/50"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Next Action</h3>
        </div>
        <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed mb-3">
          "Reassign Backend Integration to accelerate completion. Current assignee has 8 open tasks."
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all"
        >
          Apply AI Suggestion
        </motion.button>
      </motion.div>
    </div>
  </motion.div>
)

const AIInsightsSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-32 px-4 sm:px-6 bg-gray-50 dark:bg-[#09090B] border-t border-gray-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center" ref={ref}>
          
          {/* LEFT: Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 border border-violet-500/25 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 px-4 py-2 rounded-full text-xs font-semibold tracking-wide mb-8">
              AI Intelligence
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight mb-8">
              AI Insights That Drive Decisions
            </h2>

            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-12">
              Gain real-time visibility into your team's health. Our AI detects bottlenecks, recommends optimizations, and predicts project risks before they happen.
            </p>

            {/* Key insights features */}
            <div className="space-y-6 mb-12">
              {[
                {
                  icon: TrendingUp,
                  title: 'Productivity Analytics',
                  description: '+12% increase vs last week with predictive trends',
                  color: 'text-emerald-600 dark:text-emerald-400',
                  bg: 'bg-emerald-50 dark:bg-emerald-950/40',
                },
                {
                  icon: Users,
                  title: 'Team Workload Balance',
                  description: 'AI-powered recommendations for optimal task distribution',
                  color: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-50 dark:bg-blue-950/40',
                },
              ].map((feature, i) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={20} className={feature.color} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-zinc-400">{feature.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <motion.a
              href="#pricing"
              whileHover={{ x: 4 }}
              className="inline-flex items-center gap-2 text-[#4F46E5] dark:text-indigo-400 font-semibold hover:gap-3 transition-all"
            >
              Explore AI features
              <ArrowRight size={16} />
            </motion.a>
          </motion.div>

          {/* RIGHT: Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <AIInsightCard isInView={isInView} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default AIInsightsSection
