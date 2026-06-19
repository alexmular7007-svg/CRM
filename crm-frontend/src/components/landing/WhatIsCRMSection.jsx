import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingUp, Users, Target, ArrowRight } from 'lucide-react'

const CRMMetrics = [
  { label: 'Revenue', value: '$1.2M', icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Conversion Rate', value: '28%', icon: Target, color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Active Leads', value: '240', icon: Users, color: 'text-purple-600 dark:text-purple-400' },
  { label: 'Closed Deals', value: '28', icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400' },
]

const CRMPipelineStages = [
  { stage: 'Lead', count: 240, color: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-300' },
  { stage: 'Qualified', count: 156, color: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-700 dark:text-purple-300' },
  { stage: 'Proposal', count: 89, color: 'bg-amber-100 dark:bg-amber-900/30', textColor: 'text-amber-700 dark:text-amber-300' },
  { stage: 'Negotiation', count: 34, color: 'bg-rose-100 dark:bg-rose-900/30', textColor: 'text-rose-700 dark:text-rose-300' },
  { stage: 'Won', count: 28, color: 'bg-emerald-100 dark:bg-emerald-900/30', textColor: 'text-emerald-700 dark:text-emerald-300' },
]

const WhatIsCRMSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-32 px-4 sm:px-6 bg-white dark:bg-[#09090B] border-t border-gray-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center" ref={ref}>
          
          {/* LEFT: Educational Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 border border-rose-500/25 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-full text-xs font-semibold tracking-wide mb-8">
              Learn CRM Fundamentals
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight mb-8">
              What is CRM?
            </h2>

            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-6">
              Customer Relationship Management (CRM) helps businesses track every interaction with customers from the first inquiry to the final sale.
            </p>

            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-8">
              Instead of managing leads in spreadsheets, teams can organize prospects, track conversations, monitor deal progress, and close opportunities faster.
            </p>

            {/* Key Benefits */}
            <div className="space-y-4 mb-12">
              {[
                'Centralize all customer data in one place',
                'Track every interaction and conversation',
                'Monitor deal progress through sales pipeline',
                'Forecast revenue with accuracy',
                'Identify bottlenecks and close deals faster',
              ].map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-rose-600 dark:text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-zinc-300">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <motion.a
              href="#pricing"
              whileHover={{ x: 4 }}
              className="inline-flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold hover:gap-3 transition-all"
            >
              Explore our CRM features
              <ArrowRight size={16} />
            </motion.a>
          </motion.div>

          {/* RIGHT: Interactive CRM Pipeline Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            {/* Pipeline Stages */}
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 p-8 mb-8">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-6 uppercase tracking-wide">Sales Pipeline Flow</h3>
              <div className="space-y-4">
                {CRMPipelineStages.map((stage, idx) => (
                  <motion.div
                    key={stage.stage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{stage.stage}</span>
                      <span className={`text-sm font-bold ${stage.textColor}`}>{stage.count}</span>
                    </div>
                    <div className={`h-8 rounded-lg ${stage.color} flex items-center px-3`}>
                      <div
                        className="h-1 bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-700"
                        style={{ width: `${(stage.count / 240) * 100}%` }}
                      />
                    </div>
                    {idx < CRMPipelineStages.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowRight className="text-gray-300 dark:text-zinc-600 transform rotate-90" size={16} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {CRMMetrics.map((metric, i) => {
                const Icon = metric.icon
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={16} className={metric.color} />
                      <span className="text-xs text-gray-500 dark:text-zinc-400">{metric.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default WhatIsCRMSection
