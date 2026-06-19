import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react'

const KanbanColumns = [
  {
    title: 'To Do',
    color: 'bg-slate-100 dark:bg-slate-900/30',
    tasks: [
      { title: 'Design system update', priority: 'high', assignee: 'AJ' },
      { title: 'API documentation', priority: 'medium', assignee: 'SK' },
    ],
  },
  {
    title: 'In Progress',
    color: 'bg-blue-100 dark:bg-blue-900/30',
    tasks: [
      { title: 'Frontend components', priority: 'high', assignee: 'MK' },
      { title: 'Database migration', priority: 'high', assignee: 'RL' },
    ],
  },
  {
    title: 'Review',
    color: 'bg-amber-100 dark:bg-amber-900/30',
    tasks: [
      { title: 'Code review PR #145', priority: 'medium', assignee: 'AR' },
    ],
  },
  {
    title: 'Completed',
    color: 'bg-emerald-100 dark:bg-emerald-900/30',
    tasks: [
      { title: 'Q2 roadmap planning', priority: 'high', assignee: 'PR' },
      { title: 'Client presentation', priority: 'medium', assignee: 'AJ' },
    ],
  },
]

const ProjectManagementSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-32 px-4 sm:px-6 bg-gray-50 dark:bg-[#09090B] border-t border-gray-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start" ref={ref}>
          
          {/* LEFT: Kanban Board Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 overflow-x-auto">
              <div className="flex gap-4 min-w-min">
                {KanbanColumns.map((column, colIdx) => (
                  <motion.div
                    key={column.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + colIdx * 0.1 }}
                    className="flex-shrink-0 w-48"
                  >
                    {/* Column Header */}
                    <div className={`rounded-t-xl ${column.color} px-4 py-3 border-b border-gray-200 dark:border-zinc-700`}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{column.title}</h3>
                        <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">{column.tasks.length}</span>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className={`rounded-b-xl ${column.color} px-4 py-3 space-y-2 min-h-64`}>
                      {column.tasks.map((task, taskIdx) => (
                        <motion.div
                          key={task.title}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={isInView ? { opacity: 1, scale: 1 } : {}}
                          transition={{ delay: 0.4 + colIdx * 0.1 + taskIdx * 0.05 }}
                          className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700 hover:shadow-md transition-shadow cursor-grab"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{task.title}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                              task.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                              'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                            }`}>
                              {task.priority}
                            </span>
                            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                              {task.assignee}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Educational Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 border border-blue-500/25 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full text-xs font-semibold tracking-wide mb-8">
              Project Management Essentials
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight mb-8">
              Turn Ideas Into Action
            </h2>

            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-8">
              Break large projects into manageable tasks, assign responsibilities, track deadlines, and monitor progress in one place.
            </p>

            {/* Key Features */}
            <div className="space-y-6 mb-12">
              {[
                {
                  icon: CheckCircle,
                  title: 'Task Organization',
                  description: 'Visualize work across To Do, In Progress, Review, and Completed states',
                  color: 'text-emerald-600 dark:text-emerald-400',
                },
                {
                  icon: Clock,
                  title: 'Deadline Management',
                  description: 'Set priorities and deadlines to keep teams on track and deliver on time',
                  color: 'text-blue-600 dark:text-blue-400',
                },
                {
                  icon: AlertCircle,
                  title: 'Progress Tracking',
                  description: 'Monitor task progress in real-time and identify bottlenecks instantly',
                  color: 'text-amber-600 dark:text-amber-400',
                },
              ].map((feature, i) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0`}>
                      <Icon size={24} className={feature.color} />
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
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:gap-3 transition-all"
            >
              See project management in action
              <ArrowRight size={16} />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default ProjectManagementSection
