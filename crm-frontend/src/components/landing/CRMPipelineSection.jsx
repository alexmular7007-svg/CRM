import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingUp, Users, Target, ArrowRight } from 'lucide-react'

const PIPELINE_STAGES = [
  { 
    stage: 'Lead', 
    count: 240, 
    color: 'bg-blue-50 dark:bg-blue-950/40',
    textColor: 'text-blue-600 dark:text-blue-400',
    dotColor: 'bg-blue-500',
    icon: Target,
  },
  { 
    stage: 'Qualified', 
    count: 156, 
    color: 'bg-purple-50 dark:bg-purple-950/40',
    textColor: 'text-purple-600 dark:text-purple-400',
    dotColor: 'bg-purple-500',
    icon: Users,
  },
  { 
    stage: 'Proposal', 
    count: 89, 
    color: 'bg-amber-50 dark:bg-amber-950/40',
    textColor: 'text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    icon: TrendingUp,
  },
  { 
    stage: 'Negotiation', 
    count: 34, 
    color: 'bg-rose-50 dark:bg-rose-950/40',
    textColor: 'text-rose-600 dark:text-rose-400',
    dotColor: 'bg-rose-500',
    icon: Users,
  },
  { 
    stage: 'Won', 
    count: 28, 
    color: 'bg-emerald-50 dark:bg-emerald-950/40',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    icon: TrendingUp,
  },
]

const PipelineVisualization = ({ isInView }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={isInView ? { opacity: 1, scale: 1 } : {}}
    transition={{ duration: 0.6, delay: 0.2 }}
    className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 p-8 overflow-x-auto"
  >
    <div className="flex gap-4 min-w-min">
      {PIPELINE_STAGES.map((stage, index) => {
        const Icon = stage.icon
        const conversion = index > 0 
          ? Math.round((stage.count / PIPELINE_STAGES[index - 1].count) * 100)
          : 100
        
        return (
          <motion.div
            key={stage.stage}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
            className="flex-shrink-0 w-48"
          >
            <div className={`rounded-xl border-2 border-gray-200 dark:border-zinc-700 ${stage.color} p-5 h-full`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{stage.stage}</h3>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stage.count}
                </div>
                <div className={`text-xs font-semibold ${stage.textColor}`}>
                  {conversion}% conversion
                </div>
              </div>

              <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${(stage.count / PIPELINE_STAGES[0].count) * 100}%` } : {}}
                  transition={{ duration: 0.8, delay: 0.5 + index * 0.08 }}
                  className={`h-full ${stage.dotColor} rounded-full`}
                />
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  </motion.div>
)

const CRMPipelineSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-32 px-4 sm:px-6 bg-gray-50 dark:bg-[#09090B] border-t border-gray-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center" ref={ref}>
          
          {/* LEFT: Pipeline Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <PipelineVisualization isInView={isInView} />
          </motion.div>

          {/* RIGHT: Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 border border-rose-500/25 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-full text-xs font-semibold tracking-wide mb-8">
              Sales Pipeline
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight mb-8">
              CRM Pipeline: From Lead to Revenue
            </h2>

            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-8">
              Visualize your entire sales funnel with intuitive drag-and-drop boards. Track conversion rates, identify bottlenecks, and close deals faster. Monitor real-time updates and make data-driven decisions instantly.
            </p>

            {/* Key metrics */}
            <div className="space-y-6 mb-12">
              {[
                { 
                  label: 'Pipeline Health', 
                  value: '82%',
                  description: 'Strong sales momentum',
                  color: 'text-emerald-600 dark:text-emerald-400',
                },
                { 
                  label: 'Average Deal Value', 
                  value: '$45K',
                  description: 'Up 12% from last quarter',
                  color: 'text-blue-600 dark:text-blue-400',
                },
              ].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className={`w-12 h-12 rounded-lg ${metric.color.replace('text-', 'bg-').replace('-600', '-50').replace('-400', '-900/40')} flex items-center justify-center flex-shrink-0`}>
                    <TrendingUp size={20} className={metric.color} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400 font-medium">{metric.label}</div>
                    <div className={`text-2xl font-bold ${metric.color} mt-1`}>{metric.value}</div>
                    <div className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{metric.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.a
              href="#pricing"
              whileHover={{ x: 4 }}
              className="inline-flex items-center gap-2 text-[#4F46E5] dark:text-indigo-400 font-semibold hover:gap-3 transition-all"
            >
              Learn more about CRM features
              <ArrowRight size={16} />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default CRMPipelineSection
