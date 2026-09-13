import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, RefreshCw, Layers, ShieldCheck, Zap } from 'lucide-react'

export default function PlatformStatement() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-[#BFE9FF] dark:bg-[#0B1F3A] text-[#071A3A] dark:text-white transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Text & Value Pillar Block */}
          <div className="lg:col-span-6">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0052FF] dark:text-[#A9DFFF] block mb-3">
              Unified Operational Architecture
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] mb-6 text-[#071A3A] dark:text-white">
              Everything your team needs.
              <span className="block text-[#0052FF] dark:text-[#A9DFFF] mt-1">Zero tool fragmentation.</span>
            </h2>
            <p className="text-base sm:text-lg text-[#071A3A]/80 dark:text-white/80 font-medium leading-relaxed mb-8 max-w-xl">
              Stop toggling between disconnected issue trackers, separate CRM databases, isolated team chats, and stand-alone email tools. TaskFlow connects your entire operational lifecycle inside one multi-tenant workspace.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/80 dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-[#0052FF] dark:text-[#A9DFFF] mb-1">
                  <Layers size={14} />
                  <span>Shared State</span>
                </div>
                <p className="text-xs text-[#52627A] dark:text-white/70 font-medium leading-relaxed">
                  When a task finishes, related CRM deal stages and client records update in real time.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/80 dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-[#0052FF] dark:text-[#A9DFFF] mb-1">
                  <ShieldCheck size={14} />
                  <span>Strict RBAC</span>
                </div>
                <p className="text-xs text-[#52627A] dark:text-white/70 font-medium leading-relaxed">
                  Owner, Admin, and Member permissions protect confidential pipelines and financial values.
                </p>
              </div>
            </div>
          </div>

          {/* Right Visual Composition: Workspace Team Photo + Event Hub */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl border-2 border-[#071A3A]/15 dark:border-white/15 bg-white dark:bg-[#071A3A] overflow-hidden shadow-2xl space-y-0">
              {/* Team Collaboration Photo Header */}
              <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                <img
                  src="/images/workspace-team.jpg"
                  alt="TaskFlow Team Collaborating on Unified Projects and Sales Pipelines"
                  className="w-full h-full object-cover object-center filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071A3A] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block">Cross-Functional Synergy</span>
                    <span className="text-[10px] text-[#A9DFFF] font-bold">Engineering · Sales · Marketing · Management</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500 text-white">
                    Active Session
                  </span>
                </div>
              </div>

              {/* Event Pipeline Overlay Container */}
              <div className="p-5 sm:p-6 space-y-3 bg-white dark:bg-[#071A3A]">
                <div className="flex items-center justify-between pb-3 border-b border-[#071A3A]/10 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#0052FF] text-white flex items-center justify-center font-black text-xs">
                      <Zap size={15} />
                    </div>
                    <span className="text-xs font-black uppercase text-[#071A3A] dark:text-white">
                      Automated Lead → Client → Project Event Pipeline
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#0052FF]" />
                      <div className="text-xs font-bold text-[#071A3A] dark:text-white">
                        1. Public Form Submission
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#0052FF] dark:text-[#A9DFFF]">Trigger</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <div className="text-xs font-bold text-[#071A3A] dark:text-white">
                        2. CRM Lead Ingested & Scored (85/100)
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">Automated</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div className="text-xs font-bold text-[#071A3A] dark:text-white">
                        3. Deal Won → Client & Project Kanban Provisioned
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
