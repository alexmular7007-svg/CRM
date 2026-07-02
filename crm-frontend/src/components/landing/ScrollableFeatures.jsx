import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

const ScrollableFeatures = () => {
  const scrollContainerRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const features = [
    {
      title: 'Task Management',
      description: 'Organize, prioritize, and track all your tasks in one powerful dashboard with real-time updates.',
      icon: '✓',
      highlights: ['Kanban boards', 'Custom workflows', 'Time tracking', 'Dependencies'],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Real-Time Chat',
      description: 'Collaborate with your team instantly with built-in messaging, threads, and notifications.',
      icon: '💬',
      highlights: ['Direct messages', 'Channel discussions', 'File sharing', 'Search history'],
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'CRM Pipeline',
      description: 'Manage your sales pipeline, track leads, and close deals faster with visual pipeline management.',
      icon: '📊',
      highlights: ['Sales stages', 'Lead scoring', 'Deal tracking', 'Revenue forecasting'],
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'AI Insights',
      description: 'Get intelligent recommendations powered by AI to optimize your workflow and boost productivity.',
      icon: '✨',
      highlights: ['Smart suggestions', 'Analytics', 'Predictions', 'Automation'],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Team Collaboration',
      description: 'Bring your entire team together with workspace management, roles, and permission controls.',
      icon: '👥',
      highlights: ['Role-based access', 'Workspace isolation', 'Team hierarchy', 'Activity logs'],
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Advanced Analytics',
      description: 'Track performance metrics, generate reports, and make data-driven decisions with ease.',
      icon: '📈',
      highlights: ['Custom reports', 'Performance tracking', 'Team metrics', 'Export data'],
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ]

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
      setTimeout(checkScroll, 300)
    }
  }

  return (
    <section id="features" className="py-20 bg-gradient-to-b from-white to-slate-50 dark:from-[#09090B] dark:to-[#111114] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Everything Your Team Needs to Succeed
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Comprehensive tools designed to streamline your workflow and boost team productivity
          </p>
        </motion.div>

        {/* Scrollable Container */}
        <div className="relative group">
          {/* Left Scroll Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: canScrollLeft ? 1 : 0.3 }}
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white dark:bg-[#1A1A1D] shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#252529] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={24} className="text-gray-600 dark:text-gray-300" />
          </motion.button>

          {/* Right Scroll Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: canScrollRight ? 1 : 0.3 }}
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white dark:bg-[#1A1A1D] shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#252529] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={24} className="text-gray-600 dark:text-gray-300" />
          </motion.button>

          {/* Cards Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-4 px-4"
            style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-96 group/card"
              >
                <div className={`${feature.bgColor} dark:bg-[#1A1A1D] h-full rounded-2xl p-8 border-2 border-transparent dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 shadow-md hover:shadow-xl transition-all duration-300 backdrop-blur-sm`}>
                  {/* Icon & Title */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`text-4xl font-black bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`}>
                      {feature.icon}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-3 mb-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                    {feature.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 size={16} className={`text-${feature.color.split('-')[1]}-600 flex-shrink-0`} />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {highlight}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button className={`w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r ${feature.color} hover:shadow-lg transform hover:scale-105 transition-all duration-200`}>
                    Learn More
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          ← Scroll to explore more features →
        </motion.div>
      </div>
    </section>
  )
}

export default ScrollableFeatures
