import { motion } from 'framer-motion'
import { CheckSquare, Clock, Users, BarChart3 } from 'lucide-react'

const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
  viewport: { once: true }
})

const ProjectsEducationSection = () => {
  const kanbanColumns = [
    {
      title: 'To Do',
      color: 'bg-slate-100',
      count: 12,
      tasks: ['Design system audit', 'API documentation']
    },
    {
      title: 'In Progress',
      color: 'bg-blue-100',
      count: 8,
      tasks: ['Frontend refactor', 'Database optimization']
    },
    {
      title: 'Review',
      color: 'bg-purple-100',
      count: 5,
      tasks: ['Code review Q2', 'QA testing']
    },
    {
      title: 'Done',
      color: 'bg-green-100',
      count: 24,
      tasks: ['Mobile app v2', 'Analytics dashboard']
    }
  ]

  return (
    <section className="relative py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white dark:from-[#09090B] dark:to-[#09090B] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Visual Kanban */}
          <motion.div {...fadeInUp(0)} className="order-1">
            <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-lg">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Project: Q2 Roadmap</h3>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  <span>48 tasks</span>
                  <span>8 team members</span>
                </div>
              </div>

              {/* Kanban Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-x-auto">
                {kanbanColumns.map((col, idx) => (
                  <motion.div
                    key={col.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    viewport={{ once: true }}
                    className="flex-shrink-0"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${col.color.replace('bg-', 'bg-')}`} />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{col.title}</span>
                      <span className="ml-auto text-xs font-bold text-gray-400 dark:text-gray-600">{col.count}</span>
                    </div>
                    <div className="space-y-2">
                      {col.tasks.map((task) => (
                        <div
                          key={task}
                          className={`p-2 ${col.color} dark:${col.color.replace('bg-', 'dark:bg-').replace('100', '950/30')} rounded-lg text-xs font-medium text-gray-700 dark:text-gray-400 truncate`}
                        >
                          {task}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right side - Content */}
          <motion.div {...fadeInUp(0.2)} className="order-2">
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-full mb-4">
                Project Management
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Turn ideas into actions, faster
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Break large projects into manageable tasks, assign responsibilities, set deadlines, and monitor progress in one place. Keep your team aligned and moving forward.
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                  <CheckSquare size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Smart Task Organization</h3>
                  <p className="text-gray-600 dark:text-gray-300">Drag-and-drop Kanban boards, list views, and timeline charts</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-950/30">
                  <Clock size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Deadline Tracking</h3>
                  <p className="text-gray-600 dark:text-gray-300">Set milestones, manage dependencies, and get smart reminders</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-green-100 dark:bg-green-950/30">
                  <Users size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Team Assignments</h3>
                  <p className="text-gray-600 dark:text-gray-300">Assign tasks, set workload, and balance team capacity</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-950/30">
                  <BarChart3 size={24} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Progress Visibility</h3>
                  <p className="text-gray-600 dark:text-gray-300">Real-time dashboards show project health and team velocity</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default ProjectsEducationSection
