import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Plus, Users, FolderOpen, CheckSquare, MessageSquare, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'

const WorkflowSteps = [
  {
    number: '1',
    title: 'Create Workspace',
    description: 'Set up a dedicated space for your team to collaborate',
    icon: Plus,
    color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  },
  {
    number: '2',
    title: 'Invite Team',
    description: 'Add team members and assign roles and permissions',
    icon: Users,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  },
  {
    number: '3',
    title: 'Create Projects',
    description: 'Organize work into projects and set objectives',
    icon: FolderOpen,
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  },
  {
    number: '4',
    title: 'Assign Tasks',
    description: 'Break down work and assign to team members',
    icon: CheckSquare,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  },
  {
    number: '5',
    title: 'Collaborate',
    description: 'Communicate in real-time with instant messaging',
    icon: MessageSquare,
    color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  },
  {
    number: '6',
    title: 'Track Progress',
    description: 'Monitor work progress with live dashboards',
    icon: TrendingUp,
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  },
  {
    number: '7',
    title: 'Get AI Insights',
    description: 'Let AI analyze and optimize your workflow',
    icon: Sparkles,
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  },
]

const HowItWorksSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-32 px-4 sm:px-6 bg-white dark:bg-[#09090B] border-t border-gray-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-20 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 border border-violet-500/25 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 px-4 py-2 rounded-full text-xs font-semibold tracking-wide mb-6">
            Product Workflow
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight mb-6">
            How TaskFlow AI Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed">
            A complete step-by-step journey from setup to productivity. See how teams go from chaos to organized collaboration in minutes.
          </p>
        </motion.div>

        {/* Workflow Steps - Visual Flow */}
        <div className="relative mb-20">
          {/* Connection lines (desktop only) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-rose-200 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-rose-900/30 -z-10" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {WorkflowSteps.slice(0, 4).map((step, idx) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="relative"
                >
                  {/* Step Card */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 text-center hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
                    {/* Step Number Badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : {}}
                      transition={{ delay: 0.3 + idx * 0.1, type: 'spring' }}
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${step.color} mb-4 mx-auto font-bold text-lg`}
                    >
                      {step.number}
                    </motion.div>

                    {/* Icon */}
                    <Icon size={32} className={step.color.split(' ')[2]} />

                    {/* Content */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">{step.description}</p>
                  </div>

                  {/* Arrow connector */}
                  {idx < 3 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className="hidden lg:flex absolute -right-3 top-1/3 transform translate-x-full items-center justify-center w-6 h-6"
                    >
                      <ArrowRight size={20} className="text-gray-300 dark:text-zinc-700" />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Bottom row steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-4 mt-8">
            {WorkflowSteps.slice(4).map((step, idx) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + (idx + 4) * 0.1 }}
                  className="relative"
                >
                  {/* Step Card */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 text-center hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
                    {/* Step Number Badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : {}}
                      transition={{ delay: 0.5 + (idx + 4) * 0.1, type: 'spring' }}
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${step.color} mb-4 mx-auto font-bold text-lg`}
                    >
                      {step.number}
                    </motion.div>

                    {/* Icon */}
                    <Icon size={32} className={step.color.split(' ')[2]} />

                    {/* Content */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">{step.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-12"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Ready to transform your workflow?</h3>
          <p className="text-gray-600 dark:text-zinc-400 mb-6 max-w-xl mx-auto">
            Get started in minutes with our intuitive interface and powerful automation. No credit card required.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25"
          >
            Start Free Today
            <ArrowRight size={16} />
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorksSection
