import { motion } from 'framer-motion'
import { Check, Users, Zap, MessageSquare, BarChart3, Sparkles } from 'lucide-react'

const WORKFLOW_STEPS = [
  {
    number: 1,
    title: 'Create Workspace',
    description: 'Set up your workspace in seconds. Invite team members and start collaborating.',
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
  },
  {
    number: 2,
    title: 'Invite Team',
    description: 'Add team members with custom roles and permissions. Full control over access.',
    icon: Users,
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    number: 3,
    title: 'Manage Tasks',
    description: 'Create projects, tasks, and kanban boards. Organize work efficiently.',
    icon: Check,
    color: 'from-purple-500 to-purple-600',
  },
  {
    number: 4,
    title: 'Collaborate',
    description: 'Real-time chat, @mentions, and task assignments. Keep everyone in sync.',
    icon: MessageSquare,
    color: 'from-pink-500 to-pink-600',
  },
  {
    number: 5,
    title: 'Track & Improve',
    description: 'Analytics dashboards show progress, productivity metrics, and insights.',
    icon: BarChart3,
    color: 'from-amber-500 to-amber-600',
  },
  {
    number: 6,
    title: 'AI Optimizes',
    description: 'AI analyzes patterns, predicts delays, and recommends optimizations.',
    icon: Sparkles,
    color: 'from-emerald-500 to-emerald-600',
  },
]

const WorkflowTimeline = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <section
      id="workflow"
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 dark:from-gray-900 to-white dark:to-[#09090B]"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-gray-950 dark:text-white mb-6 leading-tight">
            How TaskFlow AI Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Six simple steps to transform your team's productivity with AI-powered workspace management.
          </p>
        </motion.div>

        {/* Timeline Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="group relative"
              >
                {/* Step Card */}
                <div className="bg-white dark:bg-[#1A1A1D] rounded-2xl border-2 border-gray-300 dark:border-gray-700 p-8 shadow-md dark:shadow-sm hover:shadow-lg dark:hover:shadow-md transition-all duration-300 h-full">
                  {/* Step Number Badge */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} text-white font-black text-lg mb-6 shadow-lg`}>
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Icon */}
                  <div className="absolute top-8 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon size={64} className="text-gray-900 dark:text-white" />
                  </div>
                </div>

                {/* Connection line (visible on desktop) */}
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -bottom-8 -right-8 w-16 h-16">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full text-gray-300 dark:text-gray-700"
                      preserveAspectRatio="none"
                    >
                      <polyline
                        points="0,0 100,100"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                      <polygon points="90,80 100,100 110,90" fill="currentColor" transform="translate(100, 100) rotate(45)" />
                    </svg>
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
            Ready to streamline your workflow?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="/register"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-colors"
            >
              Start Your Free Trial
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              Watch Demo
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default WorkflowTimeline
