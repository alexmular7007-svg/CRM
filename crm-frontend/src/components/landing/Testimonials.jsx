import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const TESTIMONIALS = [
  {
    name: 'Sarah Johnson',
    role: 'Product Manager',
    company: 'TechCorp',
    initials: 'SJ',
    color: 'bg-violet-500',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    quote: 'TaskFlow AI has transformed how our team collaborates. The AI prioritization feature alone saves us hours every week. It actually works — no gimmicks.',
    metric: '+40% productivity in month one',
  },
  {
    name: 'Michael Chen',
    role: 'Engineering Lead',
    company: 'StartupXYZ',
    initials: 'MC',
    color: 'bg-sky-500',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    quote: 'The real-time chat and task management integration is seamless. Our team productivity increased by 40% in the first month. I recommend it to every founder I meet.',
    metric: '40% team productivity increase',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Sales Director',
    company: 'SalesForce Pro',
    initials: 'ER',
    color: 'bg-emerald-500',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    quote: 'The CRM pipeline with AI insights helped us close 30% more deals. The analytics dashboard gives us exactly what we need — nothing more, nothing less.',
    metric: '30% more deals closed',
  },
  {
    name: 'David Kim',
    role: 'Founder & CEO',
    company: 'InnovateLabs',
    initials: 'DK',
    color: 'bg-rose-500',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    quote: 'Best project management tool we\'ve used. The AI features are not gimmicks — they actually work and save real time. We shipped our product two weeks early.',
    metric: 'Shipped 2 weeks ahead of schedule',
  },
  {
    name: 'Lisa Anderson',
    role: 'Operations Manager',
    company: 'GlobalTech',
    initials: 'LA',
    color: 'bg-amber-500',
    image: 'https://images.unsplash.com/photo-1507876466836-bc7706f854ec?w=100&h=100&fit=crop',
    quote: 'Managing multiple teams across time zones is now effortless. The smart notifications keep everyone in sync without the noise.',
    metric: 'Reduced meeting time by 60%',
  },
  {
    name: 'James Wilson',
    role: 'CTO',
    company: 'DevStudio',
    initials: 'JW',
    color: 'bg-indigo-500',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    quote: 'The deadline prediction AI is surprisingly accurate. It\'s helped us set realistic timelines and eliminate project delays entirely.',
    metric: 'Zero missed deadlines this quarter',
  },
]

const TestimonialCard = ({ t, index }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
      className="flex flex-col p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200"
    >
      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <p className="text-[13.5px] text-gray-600 dark:text-zinc-400 leading-relaxed flex-1 mb-5">
        "{t.quote}"
      </p>

      {/* Metric highlight */}
      <div className="text-[11px] font-semibold text-[#4F46E5] dark:text-indigo-400 mb-4 px-2.5 py-1.5 bg-[#4F46E5]/6 dark:bg-indigo-950/50 rounded-md w-fit">
        {t.metric}
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
        <img
          src={t.image}
          alt={t.name}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextElementSibling.style.display = 'flex'
          }}
        />
        <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 hidden`}>
          {t.initials}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-gray-900 dark:text-white">{t.name}</div>
          <div className="text-[11px] text-gray-500 dark:text-zinc-500">{t.role} · {t.company}</div>
        </div>
      </div>
    </motion.div>
  )
}

const Testimonials = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 px-4 sm:px-6 border-t border-gray-100 dark:border-zinc-800/60 bg-gray-50/40 dark:bg-[#0D0D10]">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div className="inline-flex items-center gap-2 border border-amber-400/30 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-4">
            Customer stories
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight mb-3">
                Loved by teams<br className="hidden sm:block" /> around the world
              </h2>
              <p className="text-base text-gray-500 dark:text-zinc-400 max-w-lg leading-relaxed">
                Join thousands of teams who have transformed their workflow with TaskFlow AI.
              </p>
            </div>
            {/* Social proof summary */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">4.9</div>
                <div className="flex gap-0.5 justify-center mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="text-[10px] text-gray-400 dark:text-zinc-600 mt-0.5">2,400 reviews</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} />
          ))}
        </div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 grid grid-cols-3 gap-px bg-gray-200 dark:bg-zinc-800 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800"
        >
          {[
            { v: '4.9/5', l: 'Average rating' },
            { v: '10K+', l: 'Happy users' },
            { v: '500+', l: 'Companies' },
          ].map(({ v, l }) => (
            <div key={l} className="bg-white dark:bg-[#18181B] px-6 py-5 text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">{v}</div>
              <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">{l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Testimonials
