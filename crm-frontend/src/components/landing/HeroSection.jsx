import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDown, CheckCircle2, ShieldCheck, Sparkles, Folder, CheckSquare2, Users, Layers } from 'lucide-react'

export default function HeroSection() {
  const scrollToFeatures = () => {
    const el = document.getElementById('features')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-40 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#F7F5F0] dark:bg-[#071A3A] transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Editorial Content (6 cols on lg) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.2em] bg-[#0052FF]/10 dark:bg-[#A9DFFF]/15 text-[#0052FF] dark:text-[#A9DFFF] border border-[#0052FF]/20 dark:border-[#A9DFFF]/20">
                Projects · CRM · Team Collaboration
              </span>
            </div>

            {/* Huge Editorial Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-black text-[#071A3A] dark:text-white uppercase tracking-tight leading-[0.92] mb-6 sm:mb-8">
              Manage Projects.
              <span className="block text-[#0052FF] dark:text-[#A9DFFF] mt-1">
                Move Deals.
              </span>
              <span className="block mt-1 text-[#071A3A] dark:text-white">
                Keep Teams In Sync.
              </span>
            </h1>

            {/* Editorial Description */}
            <p className="text-base sm:text-lg text-[#52627A] dark:text-white/80 max-w-xl font-medium leading-relaxed mb-8 sm:mb-10">
              TaskFlow unites sprint planning, CRM pipelines, real-time team messaging, and proactive risk detection in a single, multi-tenant workspace.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#0052FF] hover:bg-[#0043D1] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95">
                  Get Started Free
                  <ArrowUpRight size={17} />
                </button>
              </Link>
              <button
                onClick={scrollToFeatures}
                className="w-full sm:w-auto px-7 py-4 rounded-full border-2 border-[#071A3A]/20 dark:border-white/20 hover:border-[#071A3A] dark:hover:border-white text-[#071A3A] dark:text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:bg-[#071A3A]/5 dark:hover:bg-white/5 active:scale-95"
              >
                Explore Platform
                <ArrowDown size={15} />
              </button>
            </div>

            {/* Truthful Platform Proof points */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-bold text-white/80 uppercase tracking-wider pt-4 border-t border-white/20">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#A9DFFF]" />
                <span className="text-white/80">Free Tier Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-[#A9DFFF]" />
                <span className="text-white/80">Multi-Tenant Workspaces</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-[#A9DFFF]" />
                <span className="text-white/80">Role-Based Access Control</span>
              </div>
            </div>
          </div>

          {/* Right High-Fidelity Product UI Composition (6 cols on lg, elevated presence) */}
          <div className="lg:col-span-6 xl:col-span-6 relative">
            {/* Subtle architectural background framing accent */}
            <div className="absolute -inset-2 sm:-inset-4 rounded-3xl bg-gradient-to-tr from-[#0052FF]/10 via-[#BFE9FF]/20 to-[#F6A8C7]/15 dark:from-[#0052FF]/20 dark:via-white/5 dark:to-transparent -z-10 blur-xl opacity-70" />

            <div
              className="relative rounded-2xl sm:rounded-3xl border-2 border-[#071A3A]/15 dark:border-white/15 bg-white dark:bg-[#0B1F3A] p-4 sm:p-7 shadow-2xl overflow-hidden"
            >
              {/* Product Window Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#071A3A]/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#071A3A] dark:bg-[#0052FF] flex items-center justify-center text-white font-black text-xs">
                    TF
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-[#071A3A] dark:text-white tracking-wide">
                        Core Workspace
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-bold text-[#52627A] dark:text-[#A9DFFF] uppercase">
                      Engineering & Sales
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#0B1F3A] bg-[#0052FF] text-[9px] font-bold text-white items-center justify-center">
                      AK
                    </span>
                    <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#0B1F3A] bg-[#F6A8C7] text-[9px] font-bold text-[#071A3A] items-center justify-center">
                      MR
                    </span>
                    <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#0B1F3A] bg-[#A9DFFF] text-[9px] font-bold text-[#071A3A] items-center justify-center">
                      SL
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Top Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10">
                  <div className="text-[10px] font-bold uppercase text-[#52627A] dark:text-[#A9DFFF]">Active Sprint</div>
                  <div className="text-sm sm:text-base font-black text-[#071A3A] dark:text-white mt-0.5">Sprint 14</div>
                  <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">18/24 Done</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10">
                  <div className="text-[10px] font-bold uppercase text-[#52627A] dark:text-[#A9DFFF]">CRM Funnel</div>
                  <div className="text-sm sm:text-base font-black text-[#071A3A] dark:text-white mt-0.5">14 Deals</div>
                  <div className="text-[10px] font-semibold text-[#0052FF] dark:text-[#A9DFFF]">5 in Proposal</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10">
                  <div className="text-[10px] font-bold uppercase text-[#52627A] dark:text-[#A9DFFF]">Workspace Health</div>
                  <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">88 / 100</div>
                  <div className="text-[10px] font-semibold text-[#52627A] dark:text-white/60">0 Blockers</div>
                </div>
              </div>

              {/* Kanban Interactive Representation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#071A3A] dark:text-white flex items-center gap-1.5">
                    <CheckSquare2 size={13} className="text-[#0052FF]" />
                    Kanban Execution
                  </span>
                  <span className="text-[10px] font-bold text-[#52627A] dark:text-white/60 uppercase">
                    Drag & Drop
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Task Card 1 */}
                  <div className="p-3.5 rounded-xl border border-[#071A3A]/15 dark:border-white/15 bg-white dark:bg-[#071A3A] shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                        Urgent
                      </span>
                      <span className="text-[10px] font-mono text-[#52627A] dark:text-white/50">Today</span>
                    </div>
                    <div className="text-xs font-bold text-[#071A3A] dark:text-white mb-1.5">
                      Verify OAuth2 Client Callback
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#52627A] dark:text-white/60">
                      <span>#dev-core</span>
                      <span className="font-bold text-[#0052FF] dark:text-[#A9DFFF]">Review</span>
                    </div>
                  </div>

                  {/* Task Card 2 */}
                  <div className="p-3.5 rounded-xl border border-[#071A3A]/15 dark:border-white/15 bg-white dark:bg-[#071A3A] shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                        High
                      </span>
                      <span className="text-[10px] font-mono text-[#52627A] dark:text-white/50">Sep 18</span>
                    </div>
                    <div className="text-xs font-bold text-[#071A3A] dark:text-white mb-1.5">
                      Cloudinary Document Upload
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#52627A] dark:text-white/60">
                      <span>#storage</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">In Progress</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Notification Strip */}
              <div className="mt-4 p-3 rounded-xl bg-[#0052FF]/10 dark:bg-[#0052FF]/20 border border-[#0052FF]/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#0052FF] text-white flex items-center justify-center">
                    <Sparkles size={13} />
                  </div>
                  <span className="text-[11px] font-bold text-[#071A3A] dark:text-white">
                    Lead converted to Client record after deal marked Won
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#0052FF] dark:text-[#A9DFFF] uppercase tracking-wider hidden sm:inline">
                  Automated
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
