import { motion } from 'framer-motion'
import { Users2, ArrowRight, CheckCircle, TrendingUp, Building2, DollarSign, Sparkles } from 'lucide-react'

const STAGES = [
  { name: 'New Lead', count: '4', color: 'border-blue-500/40 text-blue-400' },
  { name: 'Contacted', count: '6', color: 'border-cyan-500/40 text-cyan-400' },
  { name: 'Qualified', count: '5', color: 'border-indigo-500/40 text-indigo-400' },
  { name: 'Proposal', count: '3', color: 'border-purple-500/40 text-purple-400' },
  { name: 'Negotiation', count: '2', color: 'border-amber-500/40 text-amber-400' },
  { name: 'Won', count: '8', color: 'border-emerald-500/40 text-emerald-400' },
]

export default function CRMShowcase() {
  return (
    <section className="py-24 lg:py-32 bg-[#071A3A] text-white overflow-hidden border-t border-white/10 dark-section" data-section-theme="dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Visual Pipeline Board Composition (7 cols on lg, order-1) */}
          <div className="lg:col-span-7 lg:order-1">
            <div
              className="rounded-3xl border-2 border-white/15 bg-[#0B1F3A] p-5 sm:p-7 shadow-2xl space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0052FF] flex items-center justify-center text-white font-black">
                    <Users2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wide">
                      Active Sales Funnel
                    </h3>
                    <p className="text-[10px] font-bold text-[#A9DFFF] uppercase">
                      Direct Ingestion from Inbound Forms
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#A9DFFF]">
                  <span>Total: 28 Deals</span>
                </div>
              </div>

              {/* Visual Funnel Stage Pill Bar */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                {STAGES.map((s) => (
                  <div key={s.name} className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[9px] font-bold uppercase text-white/60 truncate">{s.name}</div>
                    <div className="text-sm font-mono font-black text-white mt-0.5">{s.count}</div>
                  </div>
                ))}
              </div>

              {/* Realistic Deal Cards Preview */}
              <div className="space-y-3">
                {/* Deal Card 1 - Won */}
                <div className="p-4 rounded-2xl bg-white/5 border-2 border-emerald-500/40 hover:bg-white/8 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">Apex Cloud Systems</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Won · Converted
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 font-medium mt-0.5">
                        Contact: Sarah Miller · Lead Score: 94
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-black text-white">$24,000</div>
                      <div className="text-[9px] text-emerald-400 font-bold uppercase">Annual Contract</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2.5 border-t border-white/10 text-[10px] text-white/60">
                    <span>Client Record #CL-419 created</span>
                    <span>·</span>
                    <span className="text-[#A9DFFF]">Project Workspace automatically provisioned</span>
                  </div>
                </div>

                {/* Deal Card 2 - Proposal */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/15 hover:bg-white/8 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">Stellar Health Labs</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Proposal Sent
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 font-medium mt-0.5">
                        Contact: David Patel · Lead Score: 81
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-black text-white">$16,500</div>
                      <div className="text-[9px] text-white/50 font-bold uppercase">Multi-Seat Workspace</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2.5 border-t border-white/10 text-[10px] text-white/60">
                    <span>Follow-up scheduled: Tomorrow, 2:00 PM</span>
                    <span>·</span>
                    <span className="text-amber-400">High probability</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Text Block (5 cols on lg, order-2) */}
          <div className="lg:col-span-5 lg:order-2">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#A9DFFF] block mb-3">
              Sales Pipeline & CRM
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] mb-6 text-white">
              Turn Leads
              <span className="block text-[#A9DFFF] mt-1">Into Loyal</span>
              <span className="block mt-1 text-white">Customers.</span>
            </h2>
            <p className="text-base sm:text-lg text-white/80 font-medium leading-relaxed mb-8">
              A visual sales pipeline purpose-built for teams that execute work after closing deals. Move prospects across 7 stages, record meeting notes, track lead scores, and automatically convert won deals into active client workspaces.
            </p>

            <div className="space-y-3.5 border-t border-white/10 pt-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-[#0052FF] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-white">
                    7 Configurable Deal Stages
                  </div>
                  <p className="text-xs text-white/70 font-medium mt-0.5">
                    From New Lead and Contacted through Qualified, Proposal, Negotiation, to Won or Lost.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-[#0052FF] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-white">
                    Automated Client Conversion
                  </div>
                  <p className="text-xs text-white/70 font-medium mt-0.5">
                    When a deal is marked Won, TaskFlow provisions a client record with linked activity logs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-[#0052FF] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-white">
                    Lead Scoring & Timeline Activity
                  </div>
                  <p className="text-xs text-white/70 font-medium mt-0.5">
                    Track calls, emails, and notes with automated scoring to focus reps on high-intent opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
