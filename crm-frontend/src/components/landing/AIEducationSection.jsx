import { motion } from 'framer-motion'
import { Brain, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react'

const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
  viewport: { once: true }
})

const AIEducationSection = () => {
  return (
    <section id="ai" className="relative py-24 px-4 sm:px-6 bg-gradient-to-b from-white via-indigo-50/30 to-white dark:from-[#09090B] dark:via-indigo-950/10 dark:to-[#09090B] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Dashboard visuals */}
          <motion.div {...fadeInUp(0)}>
            <div className="space-y-4">
              {/* Health score card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Workspace Health</h3>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">87%</div>
                </div>
                <div className="h-2 bg-white dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-[87%] bg-gradient-to-r from-green-400 to-emerald-600" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">✓ Team collaboration strong, productivity up 12%</p>
              </motion.div>

              {/* Risk alert */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Project Risk Detected</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Backend sprint is 2 days behind. Recommend task reassignment</p>
                  </div>
                </div>
              </motion.div>

              {/* Recommendations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-start gap-3">
                  <Lightbulb size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Smart Recommendation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Move 3 high-priority tasks to Sprint 13 to reduce overload</p>
                  </div>
                </div>
              </motion.div>

              {/* Lead insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-start gap-3">
                  <TrendingUp size={20} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Sales Forecast</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Expected revenue next quarter: $2.8M (+15% vs Q1)</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right side - Content */}
          <motion.div {...fadeInUp(0.2)}>
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-full mb-4">
                AI Insights
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                AI that helps you make better decisions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                TaskFlow AI continuously analyzes your projects, tasks, team workload, and CRM activity to identify risks, bottlenecks, and opportunities before they become problems.
              </p>
            </div>

            {/* AI capabilities */}
            <div className="space-y-6 mb-10">
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
                  <TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Workspace Health Score</h3>
                  <p className="text-gray-600 dark:text-gray-300">Monitor team productivity, morale, and capacity in real-time</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-950/30">
                  <Brain size={24} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Burnout Detection</h3>
                  <p className="text-gray-600 dark:text-gray-300">Identify overworked team members and recommend workload rebalancing</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-red-100 dark:bg-red-950/30">
                  <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Project Risk Forecast</h3>
                  <p className="text-gray-600 dark:text-gray-300">Predict delays and bottlenecks before they impact delivery</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-950/30">
                  <Lightbulb size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Smart Recommendations</h3>
                  <p className="text-gray-600 dark:text-gray-300">Get actionable insights to optimize workflows and close deals faster</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
              Learn more about AI
              <span>→</span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default AIEducationSection
