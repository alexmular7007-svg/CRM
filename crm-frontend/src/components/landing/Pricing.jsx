import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check, ArrowRight, MessageSquare, ChevronDown, Zap } from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: '0',
    yearlyPrice: '0',
    description: 'For individuals and small teams exploring the platform.',
    features: [
      'Up to 5 team members',
      '10 projects',
      'Basic task management',
      'Real-time chat',
      '5 GB storage',
      'Email support',
    ],
    cta: 'Get started free',
    ctaIcon: ArrowRight,
    highlighted: false,
    badge: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: '12',
    yearlyPrice: '9',
    description: 'For growing teams that need advanced features and AI.',
    features: [
      'Up to 50 team members',
      'Unlimited projects',
      'AI task prioritization',
      'AI deadline prediction',
      'CRM pipeline',
      'Analytics dashboard',
      '100 GB storage',
      'Priority support',
    ],
    cta: 'Coming Soon',
    ctaIcon: Zap,
    highlighted: true,
    badge: 'Most popular',
    comingSoon: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    yearlyPrice: null,
    description: 'For large organisations with custom requirements and SLA.',
    features: [
      'Unlimited team members',
      'Unlimited projects',
      'All Pro features',
      'AI productivity insights',
      'Custom AI training',
      'SSO & SAML',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Coming Soon',
    ctaIcon: MessageSquare,
    highlighted: false,
    badge: null,
    comingSoon: true,
  },
]

const FAQS = [
  {
    q: 'Can I change plans later?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.',
  },
  {
    q: 'Is there a free trial?',
    a: 'All paid plans include a 14-day free trial with no credit card required. Cancel anytime.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your data is retained for 30 days after cancellation, giving you time to export everything.',
  },
]

const FaqItem = ({ faq, index }) => {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white dark:bg-[#18181B] hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors"
      >
        <span className="text-[14px] font-medium text-gray-900 dark:text-white">{faq.q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="px-5 pb-4 text-[13.5px] text-gray-500 dark:text-zinc-400 bg-white dark:bg-[#18181B] leading-relaxed border-t border-gray-100 dark:border-zinc-800 pt-3">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const Pricing = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [yearly, setYearly] = useState(false)

  return (
    <section id="plans" className="py-24 px-4 sm:px-6 border-t border-gray-100 dark:border-zinc-800/60">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <div className="inline-flex items-center gap-2 border border-[#4F46E5]/25 bg-[#4F46E5]/5 text-[#4F46E5] dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-4">
            Plans
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-base text-gray-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
            Choose the plan that fits your team. All plans include a 14-day free trial.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${!yearly ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${yearly ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`}
            >
              Yearly
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">-25%</span>
            </button>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {PLANS.map((plan, i) => {
            const CtaIcon = plan.ctaIcon
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className={`relative flex flex-col rounded-xl border p-6 transition-all ${
                  plan.highlighted
                    ? 'border-[#4F46E5] dark:border-indigo-500 bg-white dark:bg-[#18181B] shadow-lg shadow-indigo-500/10'
                    : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:border-gray-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 bg-[#4F46E5] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                      <Zap size={9} />
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Plan name + description */}
                <div className="mb-5">
                  <div className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">{plan.name}</div>
                  <div className="text-[12.5px] text-gray-500 dark:text-zinc-400 leading-relaxed">{plan.description}</div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {price === null ? (
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">Custom</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">${price}</span>
                      <span className="text-[13px] text-gray-400 dark:text-zinc-500">/mo{yearly ? ' · billed yearly' : ''}</span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                {plan.comingSoon ? (
                  <button disabled className="mb-6 w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-75">
                    {plan.cta}
                  </button>
                ) : (
                  <Link to={plan.id === 'enterprise' ? '/login' : '/register'} className="mb-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        plan.highlighted
                          ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-md shadow-indigo-500/20'
                          : 'border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      {plan.cta}
                      <CtaIcon size={14} />
                    </motion.button>
                  </Link>
                )}

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-zinc-800 mb-5" />

                {/* Features */}
                <div className="space-y-2.5 flex-1">
                  {plan.features.map((f, fi) => (
                    <div key={fi} className="flex items-start gap-2.5">
                      <Check size={13} className={`mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-[#4F46E5]' : 'text-emerald-500'}`} />
                      <span className="text-[13px] text-gray-600 dark:text-zinc-400">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Frequently asked questions
          </h3>
          <div className="max-w-2xl mx-auto space-y-2">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} faq={faq} index={i} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Pricing
