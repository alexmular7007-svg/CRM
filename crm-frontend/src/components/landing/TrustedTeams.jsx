import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const COMPANIES = [
  {
    name: 'HCL Technologies',
    logo: 'HCL',
    color: 'bg-blue-600 dark:bg-blue-500',
  },
  {
    name: 'Tata Consultancy Services',
    logo: 'TCS',
    color: 'bg-indigo-600 dark:bg-indigo-500',
  },
  {
    name: 'Infosys',
    logo: 'INF',
    color: 'bg-purple-600 dark:bg-purple-500',
  },
  {
    name: 'Wipro',
    logo: 'WPR',
    color: 'bg-rose-600 dark:bg-rose-500',
  },
  {
    name: 'Tech Mahindra',
    logo: 'TMH',
    color: 'bg-amber-600 dark:bg-amber-500',
  },
]

const TrustedTeams = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 px-4 sm:px-6 border-t border-gray-100 dark:border-zinc-800/60 bg-gradient-to-b from-gray-50/60 to-white dark:from-zinc-900/60 dark:to-[#09090B]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Trusted by leading enterprises
          </h2>
          <p className="text-gray-600 dark:text-zinc-400">
            Join thousands of teams using TaskFlow AI to streamline operations
          </p>
        </motion.div>

        {/* Companies grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {COMPANIES.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.15 + index * 0.06 }}
              whileHover={{ scale: 1.05 }}
              className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 flex flex-col items-center justify-center gap-3 hover:shadow-md dark:hover:shadow-black/30 transition-all cursor-default group"
            >
              <div className={`w-12 h-12 rounded-lg ${company.color} flex items-center justify-center text-white text-xs font-bold group-hover:shadow-lg transition-all`}>
                {company.logo}
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{company.name}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default TrustedTeams
