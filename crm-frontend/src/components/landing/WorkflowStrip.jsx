import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight } from 'lucide-react'

const STAGES = [
  {
    step: '01',
    title: 'Configure Your Workspace',
    description: 'Set up your multi-tenant environment, establish role-based permissions (Owner, Admin, Member), and invite teammates with secure email tokens.',
    accent: 'text-[#0052FF] dark:text-[#A9DFFF]',
  },
  {
    step: '02',
    title: 'Execute Projects & CRM',
    description: 'Structure initiatives into sprint projects, move task cards across Kanban stages, manage deal pipelines from inquiry to won, and chat in live channels.',
    accent: 'text-[#0052FF] dark:text-[#A9DFFF]',
  },
  {
    step: '03',
    title: 'Automate & Monitor Health',
    description: 'Ingest inbound leads from public forms, run tracked email campaigns via Brevo, and rely on health scoring to detect blockers before sprints slip.',
    accent: 'text-[#0052FF] dark:text-[#A9DFFF]',
  },
]

export default function WorkflowStrip() {
  return (
    <section id="workflow" className="py-14 lg:py-20 bg-[#F7F5F0] dark:bg-[#071A3A] text-[#071A3A] dark:text-white transition-colors duration-300 overflow-hidden border-t border-[#071A3A]/10 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0052FF] dark:text-[#A9DFFF] block mb-3">
            Execution Roadmap
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] mb-6 text-[#071A3A] dark:text-white">
            Three Steps To
            <span className="block text-[#0052FF] dark:text-[#A9DFFF] mt-1">Operational Flow.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#52627A] dark:text-white/80 font-medium leading-relaxed">
            From initial team onboarding to automated workflow execution, TaskFlow minimizes operational friction.
          </p>
        </div>

        {/* 3 Step Editorial Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STAGES.map((s) => (
            <div
              key={s.step}
              className="relative p-8 rounded-3xl border-2 border-[#071A3A]/15 dark:border-white/15 bg-white dark:bg-[#0B1F3A] shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#071A3A]/10 dark:border-white/10">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-[#071A3A] dark:text-white">
                    {s.step}
                  </span>
                  <div className="w-3 h-3 rounded-full bg-[#0052FF] dark:bg-[#A9DFFF]" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-[#071A3A] dark:text-white mb-3 leading-snug">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#52627A] dark:text-white/70 leading-relaxed font-medium">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
