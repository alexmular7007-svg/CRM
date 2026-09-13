import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, RefreshCw, Layers, ShieldCheck, Zap } from 'lucide-react'

export default function PlatformStatement() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-[#BFE9FF] dark:bg-[#0B1F3A] text-[#071A3A] dark:text-white transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Text Block */}
          <div className="lg:col-span-6">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0052FF] dark:text-[#A9DFFF] block mb-3">
              The Architecture of Alignment
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] mb-6 text-[#071A3A] dark:text-white">
              One Workspace.
              <span className="block mt-1">Everything Moving.</span>
            </h2>
            <p className="text-base sm:text-lg text-[#071A3A]/80 dark:text-white/80 font-medium leading-relaxed mb-8 max-w-xl">
              Stop toggling between disconnected issue trackers, separate CRM databases, isolated team chats, and stand-alone email tools. TaskFlow connects your entire operational lifecycle inside one unified platform.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Right Visual Composition: Multi-System Synergy Hub */}
          <div className="lg:col-span-6">
            <div
              className="rounded-3xl border-2 border-[#071A3A]/15 dark:border-white/15 bg-white dark:bg-[#071A3A] p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#071A3A]/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0052FF] text-white flex items-center justify-center font-black">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide text-[#071A3A] dark:text-white">
                      Cross-Functional Hub
                    </h3>
                    <p className="text-[11px] font-bold text-[#52627A] dark:text-[#A9DFFF] uppercase">
                      Synchronized Events
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Live Engine
                </span>
              </div>

              {/* Event Pipeline Visualization */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0052FF]" />
                    <div>
                      <div className="text-xs font-bold text-[#071A3A] dark:text-white">
                        Public Form Ingestion
                      </div>
                      <div className="text-[10px] text-[#52627A] dark:text-white/60">
                        Lead Magnet form submitted via /m/token/enterprise-guide
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#0052FF] dark:text-[#A9DFFF]">Trigger</span>
                </div>

                <div className="flex justify-center -my-1">
                  <div className="h-4 w-0.5 bg-[#071A3A]/20 dark:border-white/20" />
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div>
                      <div className="text-xs font-bold text-[#071A3A] dark:text-white">
                        CRM Lead Created & Scored
                      </div>
                      <div className="text-[10px] text-[#52627A] dark:text-white/60">
                        Assigned to Sales Team · Stage: Qualified · Score: 85
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">Automated</span>
                </div>

                <div className="flex justify-center -my-1">
                  <div className="h-4 w-0.5 bg-[#071A3A]/20 dark:border-white/20" />
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-[#071A3A] dark:text-white">
                        Delivery & Team Notification
                      </div>
                      <div className="text-[10px] text-[#52627A] dark:text-white/60">
                        Brevo email sent · WebSocket push sent to #sales channel
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Delivered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
