import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDown, CheckCircle2, ShieldCheck, Sparkles, Folder, CheckSquare2, Users, Layers } from 'lucide-react'

export default function HeroSection() {
  const scrollToFeatures = () => {
    const el = document.getElementById('projects')
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
              <span className="px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.2em] bg-[#0052FF]/10 dark:bg-[#A9DFFF]/15 text-[#0052FF] dark:text-[#A9DFFF] border border-[#0052FF]/20 dark:border-[#A9DFFF]/20">
                Multi-Tenant AI Workspace Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-black text-[#071A3A] dark:text-white uppercase tracking-tight leading-[0.92] mb-6 sm:mb-8">
              The Unified AI Workspace
              <span className="block text-[#0052FF] dark:text-[#A9DFFF] mt-1">
                For Projects, CRM,
              </span>
              <span className="block mt-1 text-[#071A3A] dark:text-white">
                Team Chat & Operations
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-[#52627A] dark:text-white/80 max-w-xl font-medium leading-relaxed mb-8 sm:mb-10">
              Stop switching between fragmented tools. TaskFlow combines Kanban project tracking, CRM deal pipelines, real-time team chat, automated marketing, and AI operational intelligence into one fast workspace.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#0052FF] hover:bg-[#0043D1] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95">
                  GET STARTED FREE
                  <ArrowUpRight size={17} className="text-white shrink-0" />
                </button>
              </Link>
              <button
                onClick={scrollToFeatures}
                className="w-full sm:w-auto px-7 py-4 rounded-full border-2 border-[#071A3A]/20 dark:border-white/20 hover:border-[#071A3A] dark:hover:border-white text-[#071A3A] dark:text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:bg-[#071A3A]/5 dark:hover:bg-white/5 active:scale-95"
              >
                EXPLORE PLATFORM
                <ArrowDown size={15} className="text-[#071A3A] dark:text-white shrink-0" />
              </button>
            </div>

            {/* Proof points */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-bold text-[#52627A] dark:text-white/80 uppercase tracking-wider pt-4 border-t border-[#071A3A]/10 dark:border-white/20">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#0052FF] dark:text-[#A9DFFF]" />
                <span>Free Tier Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-[#0052FF] dark:text-[#A9DFFF]" />
                <span>Multi-Tenant Workspaces</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-[#0052FF] dark:text-[#A9DFFF]" />
                <span>Role-Based Permissions</span>
              </div>
            </div>
          </div>

          {/* Right Visual Hero Image + Product UI Overlay Composition (6 cols on lg) */}
          <div className="lg:col-span-6 xl:col-span-6 relative">
            {/* Architectural background accent */}
            <div className="absolute -inset-2 sm:-inset-4 rounded-3xl bg-gradient-to-tr from-[#0052FF]/10 via-[#BFE9FF]/20 to-[#F6A8C7]/15 dark:from-[#0052FF]/20 dark:via-white/5 dark:to-transparent -z-10 blur-xl opacity-70" />

            <div className="relative rounded-3xl border-2 border-[#071A3A]/15 dark:border-white/15 overflow-hidden shadow-2xl bg-[#0B1F3A]">
              {/* Human Image */}
              <img
                src="/images/hero-person.jpg"
                alt="TaskFlow Team Member using unified AI workspace"
                className="w-full h-[460px] sm:h-[520px] object-cover object-center filter brightness-[0.92] dark:brightness-90"
              />

              {/* Gradient Overlay for card contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#071A3A] via-[#071A3A]/40 to-transparent pointer-events-none" />

              {/* Floating Product UI Card 1 - Active Kanban Task (Top Left) */}
              <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-xs p-3.5 rounded-2xl bg-white/95 dark:bg-[#071A3A]/95 backdrop-blur-md border border-[#071A3A]/10 dark:border-white/20 shadow-xl">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#0052FF]/15 text-[#0052FF] dark:bg-[#0052FF]/30 dark:text-[#A9DFFF]">
                    Kanban · Sprint 14
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">In Progress</span>
                </div>
                <div className="text-xs font-bold text-[#071A3A] dark:text-white">
                  OAuth2 Client Token Refresh
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#071A3A]/5 dark:border-white/10 text-[10px] text-[#52627A] dark:text-white/60 font-mono">
                  <span>Assigned: Alex K.</span>
                  <span>Due: Today</span>
                </div>
              </div>

              {/* Floating Product UI Card 2 - Active CRM Deal (Middle Right) */}
              <div className="absolute top-1/2 -translate-y-1/2 right-4 left-4 sm:left-auto sm:max-w-xs p-3.5 rounded-2xl bg-[#0B1F3A]/95 backdrop-blur-md border border-emerald-500/40 shadow-xl text-white">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-black uppercase text-white">Apex Cloud Systems</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Deal Won
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-white/70">Contract Value</span>
                  <span className="text-sm font-mono font-black text-white">$24,000/yr</span>
                </div>
                <div className="mt-2 text-[10px] font-medium text-[#A9DFFF] flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>Client record & project workspace created</span>
                </div>
              </div>

              {/* Floating Product UI Card 3 - AI Operational Risk & Chat Notification (Bottom Overlay Strip) */}
              <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-white/95 dark:bg-[#0B1F3A]/95 backdrop-blur-md border border-[#071A3A]/10 dark:border-white/20 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#071A3A] dark:text-white">
                        AI Operational Health Score: 88/100
                      </div>
                      <div className="text-[10px] text-[#52627A] dark:text-white/60">
                        0 Blockers · 4 In Progress Tasks · STOMP Live Messaging Active
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#0052FF] text-white shrink-0 text-center">
                    Workspace Synchronized
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
