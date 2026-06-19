import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Database, Server, Shield, Zap, Cloud, Code } from 'lucide-react'

const TECHNOLOGIES = [
  {
    icon: Code,
    name: 'React',
    description: 'Modern UI framework',
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
  },
  {
    icon: Server,
    name: 'Spring Boot',
    description: 'Robust backend',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/40',
  },
  {
    icon: Database,
    name: 'PostgreSQL',
    description: 'Reliable database',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
  },
  {
    icon: Zap,
    name: 'Redis',
    description: 'Real-time caching',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40',
  },
  {
    icon: Cloud,
    name: 'WebSocket',
    description: 'Live collaboration',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
  },
  {
    icon: Shield,
    name: 'JWT Security',
    description: 'Secure authentication',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
  },
]

const ADVANCED_TECH = [
  { name: 'Docker', icon: '🐳', category: 'Containerization' },
  { name: 'Grok AI', icon: '🤖', category: 'AI Intelligence' },
  { name: 'CORS Enabled', icon: '🔓', category: 'Integration' },
  { name: 'REST API', icon: '🔌', category: 'API' },
]

const TechStack = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-32 px-4 sm:px-6 border-t border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#09090B]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <div className="inline-flex items-center gap-2 border border-emerald-500/25 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4">
            Modern Architecture
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight mb-6">
            Built With Modern Technology
          </h2>
          <p className="text-lg text-gray-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Powered by cutting-edge technologies to deliver reliability, scalability, and performance at enterprise scale.
          </p>
        </motion.div>

        {/* Main tech grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {TECHNOLOGIES.map((tech, index) => {
            const Icon = tech.icon
            return (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.15 + index * 0.06 }}
                whileHover={{ y: -4 }}
                className={`rounded-xl border border-gray-200 dark:border-zinc-800 ${tech.bg} p-6 hover:shadow-md dark:hover:shadow-black/30 transition-all`}
              >
                <div className={`inline-flex p-3 rounded-lg ${tech.bg} mb-4`}>
                  <Icon size={20} className={tech.color} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{tech.name}</h3>
                <p className="text-xs text-gray-600 dark:text-zinc-400">{tech.description}</p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Advanced capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 p-8"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Advanced Capabilities</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ADVANCED_TECH.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.65 + i * 0.05 }}
                className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-center"
              >
                <div className="text-2xl mb-2">{tech.icon}</div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">{tech.name}</div>
                <div className="text-[10px] text-gray-500 dark:text-zinc-500">{tech.category}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Architecture highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="mt-12 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Enterprise-Grade Architecture</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Microservices-ready backend with real-time capabilities, full-stack encryption, and multi-tenant support. Scales to handle millions of operations per day.
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all cursor-pointer"
            >
              View Architecture Docs
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TechStack
