import { motion } from 'framer-motion'
import { Megaphone, ArrowRight, FileText, UserPlus, MailCheck, Zap, Workflow, MousePointerClick } from 'lucide-react'

const ENGINE_STEPS = [
  {
    tag: 'STEP 01',
    title: 'Public Lead Magnets',
    description: 'Create branded opt-in forms hosted at /m/:token/:slug with zero code.',
    icon: FileText,
  },
  {
    tag: 'STEP 02',
    title: 'Instant CRM Ingestion',
    description: 'Submissions automatically create structured leads with scoring and contact notes.',
    icon: UserPlus,
  },
  {
    tag: 'STEP 03',
    title: 'Tracked Email Sequences',
    description: 'Dispatch follow-up campaigns with real-time Brevo delivery, open, and click tracking.',
    icon: MailCheck,
  },
  {
    tag: 'STEP 04',
    title: 'Visual Workflow Automations',
    description: 'Trigger delayed reminders, status transitions, and stakeholder alerts autonomously.',
    icon: Zap,
  },
]

export default function MarketingEngineSection() {
  return (
    <section id="marketing" className="py-24 lg:py-32 bg-[#071A3A] text-white overflow-hidden border-t border-white/10 dark-section" data-section-theme="dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#A9DFFF] block mb-3">
            Inbound Growth & Marketing Engine
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] mb-6 text-white">
            From First Visitor
            <span className="block text-[#A9DFFF] mt-1">To Closed Deal.</span>
          </h2>
          <p className="text-base sm:text-lg text-white/80 font-medium leading-relaxed">
            TaskFlow is more than a task manager. Generate inbound interest with public lead forms, route inquiries straight into your pipeline, run tracked email campaigns, and automate follow-ups with our built-in workflow engine.
          </p>
        </div>

        {/* Visual Engine Flow Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {ENGINE_STEPS.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="p-6 rounded-2xl bg-[#0B1F3A] border border-white/15 hover:border-[#0052FF] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-black text-[#A9DFFF] px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      {step.tag}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#A9DFFF] group-hover:bg-[#0052FF] group-hover:text-white transition-all">
                      <Icon size={16} />
                    </div>
                  </div>
                  <h3 className="text-base font-black uppercase tracking-tight text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-white/70 font-medium leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* High-Fidelity Marketing Engine Preview Box */}
        <div className="rounded-3xl border-2 border-white/15 bg-[#0B1F3A] p-6 lg:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-white/10 gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#A9DFFF] uppercase">
                Workflow Automation Builder
              </span>
              <h4 className="text-lg font-black uppercase text-white mt-1">
                New Enterprise Inbound Lead Sequence
              </h4>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Status: Running
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-[#A9DFFF] uppercase font-bold mb-1">Trigger Event</div>
              <div className="text-xs font-bold text-white mb-2">Public Form Submission</div>
              <p className="text-[11px] text-white/60">
                Visitor submits details on landing page form. Creates lead record in workspace.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-[#A9DFFF] uppercase font-bold mb-1">Immediate Action</div>
              <div className="text-xs font-bold text-white mb-2">Send Confirmation & Pitch Deck</div>
              <p className="text-[11px] text-white/60">
                Brevo webhook fires welcome email. Tracks delivery, opens, and link clicks.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-[#A9DFFF] uppercase font-bold mb-1">Conditional Delay (48h)</div>
              <div className="text-xs font-bold text-white mb-2">Advance Stage & Notify Rep</div>
              <p className="text-[11px] text-white/60">
                If email clicked, moves deal to Proposal stage and assigns task to account executive.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
