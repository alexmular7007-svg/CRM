import { motion } from 'framer-motion'
import { TrendingUp, Users, CheckCircle, Zap } from 'lucide-react'

const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
  viewport: { once: true }
})

const CRMEducationSection = () => {
  return (
    <section className="relative py-24 px-4 sm:px-6 bg-white dark:bg-[#09090B] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <motion.div {...fadeInUp(0)} className="order-2 lg:order-1">
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-full mb-4">
                What is CRM?
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                From Leads to Loyal Customers
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Customer Relationship Management (CRM) helps businesses track every interaction with customers from the first inquiry to the final sale. Instead of managing leads in spreadsheets, teams can organize prospects, track conversations, monitor deal progress, and close opportunities faster.
              </p>
            </div>

            {/* CRM Metrics */}
            <div className="space-y-6 mb-12">
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-950/30">
                  <Users size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Lead Management</h3>
                  <p className="text-gray-600 dark:text-gray-300">Capture, track, and nurture prospects through the entire sales pipeline</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-green-100 dark:bg-green-950/30">
                  <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Deal Pipeline</h3>
                  <p className="text-gray-600 dark:text-gray-300">Visualize opportunities at each stage and forecast revenue with confidence</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-950/30">
                  <CheckCircle size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Activity Tracking</h3>
                  <p className="text-gray-600 dark:text-gray-300">Log calls, emails, and meetings automatically tied to each customer</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-950/30">
                  <Zap size={24} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Predictions</h3>
                  <p className="text-gray-600 dark:text-gray-300">Identify high-probability wins and bottlenecks before they affect revenue</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Visual Pipeline */}
          <motion.div {...fadeInUp(0.2)} className="order-1 lg:order-2">
            <div className="relative">
              {/* Pipeline visualization */}
              <div className="space-y-4">
                {[
                  { stage: 'Lead', count: 48, color: 'from-blue-400 to-blue-600' },
                  { stage: 'Qualified', count: 32, color: 'from-purple-400 to-purple-600' },
                  { stage: 'Proposal', count: 18, color: 'from-orange-400 to-orange-600' },
                  { stage: 'Negotiation', count: 8, color: 'from-rose-400 to-rose-600' },
                  { stage: 'Won', count: 5, color: 'from-green-400 to-green-600' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.stage}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    viewport={{ once: true }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{item.stage}</span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.count} deals</span>
                    </div>
                    <div className="h-8 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(item.count / 48) * 100}%` }}
                        transition={{ delay: 0.4 + idx * 0.1, duration: 0.8 }}
                        viewport={{ once: true }}
                        className={`h-full bg-gradient-to-r ${item.color} flex items-center justify-end pr-3`}
                      >
                        <span className="text-xs font-semibold text-white">${item.count * 50}k</span>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                viewport={{ once: true }}
                className="mt-12 grid grid-cols-3 gap-4"
              >
                <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">$12.1M</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Pipeline Value</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">38%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Win Rate</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">$2.5M</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Monthly Revenue</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default CRMEducationSection
