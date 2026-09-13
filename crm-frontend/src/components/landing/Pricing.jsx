import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check, ArrowRight, ChevronDown, Sparkles } from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    name: 'Free Workspace',
    monthlyPrice: '0',
    yearlyPrice: '0',
    description: 'Complete operational workspace for individuals and small agile teams.',
    features: [
      'Multi-tenant workspace isolation',
      'Projects & drag-and-drop Kanban',
      'Task assignments, priorities & watchers',
      'Real-time team chat & presence',
      'Cloudinary document attachments',
      'Basic CRM pipeline & deal tracking',
    ],
    cta: 'Get Started Free',
    isAvailable: true,
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro Team',
    monthlyPrice: '12',
    yearlyPrice: '9',
    description: 'Advanced capacity, workflow automations, and deep diagnostic insights.',
    features: [
      'Everything in Free',
      'Visual workflow automation builder',
      'Lead Magnets & public form pages',
      'Brevo email campaign tracking',
      'Workspace Health & risk scoring',
      'Extended audit activity logs',
    ],
    cta: 'Coming Soon',
    isAvailable: false,
    highlighted: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    yearlyPrice: null,
    description: 'Dedicated infrastructure, custom SLAs, and high-volume deployment.',
    features: [
      'Everything in Pro Team',
      'Unlimited projects & workspaces',
      'Custom role-based permissions',
      'Dedicated Redis caching instance',
      'Custom webhook destinations',
      'Priority onboarding & SLA support',
    ],
    cta: 'Coming Soon',
    isAvailable: false,
    highlighted: false,
  },
]

const FAQS = [
  {
    q: 'Can I start using TaskFlow for free today?',
    a: 'Yes. The Free plan gives your team access to workspaces, projects, Kanban boards, real-time team chat, and CRM pipelines with immediate setup.',
  },
  {
    q: 'What is the difference between Free and upcoming Pro tiers?',
    a: 'The Free tier contains the complete core platform. The upcoming Pro tier adds automated marketing workflow execution, public lead magnets, and Brevo email campaign analytics.',
  },
  {
    q: 'How does multi-tenant workspace isolation work?',
    a: 'Each workspace is completely isolated with its own projects, members, tasks, and deal pipelines. You can create or join multiple workspaces from a single login.',
  },
  {
    q: 'What happens to our data if our team changes plans?',
    a: 'Your projects, tasks, chat history, and CRM pipeline remain completely intact. Data is never deleted without explicit workspace owner action.',
  },
]

function FaqItem({ faq, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[#071A3A]/10 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#0B1F3A] transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#071A3A]/5 dark:hover:bg-white/5 transition-colors focus:outline-none"
      >
        <span className="text-sm font-black uppercase tracking-tight text-[#071A3A] dark:text-white pr-4">
          {faq.q}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown size={18} className="text-[#52627A] dark:text-white/60" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 text-xs sm:text-sm text-[#52627A] dark:text-white/70 leading-relaxed border-t border-[#071A3A]/5 dark:border-white/5 pt-3 font-medium">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-[#F7F5F0] dark:bg-[#071A3A] text-[#071A3A] dark:text-white transition-colors duration-300 overflow-hidden border-t border-[#071A3A]/10 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 text-center mx-auto">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0052FF] dark:text-[#A9DFFF] block mb-3">
            Transparent Plans
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] mb-6 text-[#071A3A] dark:text-white">
            Simple, Honest
            <span className="block text-[#0052FF] dark:text-[#A9DFFF] mt-1">Pricing.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#52627A] dark:text-white/80 font-medium leading-relaxed mb-8">
            Get started on the full core platform today at zero cost. Pro tiers with advanced marketing automations will become available soon.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-white dark:bg-[#0B1F3A] border border-[#071A3A]/15 dark:border-white/15 shadow-xs">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                !yearly
                  ? 'bg-[#071A3A] text-white dark:bg-white dark:text-[#071A3A] shadow-sm'
                  : 'text-[#52627A] dark:text-white/70 hover:text-[#071A3A]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                yearly
                  ? 'bg-[#071A3A] text-white dark:bg-white dark:text-[#071A3A] shadow-sm'
                  : 'text-[#52627A] dark:text-white/70 hover:text-[#071A3A]'
              }`}
            >
              Yearly
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                -25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {PLANS.map((plan) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice
            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all relative ${
                  plan.highlighted
                    ? 'border-2 border-[#0052FF] bg-white dark:bg-[#0B1F3A] shadow-2xl'
                    : 'border-2 border-[#071A3A]/10 dark:border-white/10 bg-white dark:bg-[#0B1F3A] opacity-95'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#0052FF] text-white shadow-sm">
                      Available Now
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black uppercase tracking-tight text-[#071A3A] dark:text-white">
                      {plan.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#52627A] dark:text-white/70 font-medium leading-relaxed mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-[#071A3A]/10 dark:border-white/10">
                    {price === null ? (
                      <div className="text-3xl font-black text-[#071A3A] dark:text-white">Custom</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-[#071A3A] dark:text-white">${price}</span>
                        <span className="text-xs font-bold text-[#52627A] dark:text-white/60 uppercase">
                          / month {yearly ? '(billed annually)' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-[#071A3A] dark:text-white/80 font-medium">
                        <Check size={14} className="text-[#0052FF] dark:text-[#A9DFFF] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                {plan.isAvailable ? (
                  <Link to="/register" className="w-full">
                    <button className="w-full py-4 rounded-full bg-[#0052FF] hover:bg-[#0043D1] text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95">
                      {plan.cta}
                      <ArrowRight size={15} />
                    </button>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full py-4 rounded-full bg-[#071A3A]/10 dark:bg-white/10 text-[#52627A] dark:text-white/50 text-xs font-black uppercase tracking-wider cursor-not-allowed"
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto pt-6 border-t border-[#071A3A]/10 dark:border-white/10">
          <div className="text-center mb-10">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0052FF] dark:text-[#A9DFFF] block mb-2">
              Common Questions
            </span>
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#071A3A] dark:text-white">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FaqItem key={faq.q} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
