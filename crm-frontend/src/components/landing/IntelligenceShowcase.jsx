import { motion } from 'framer-motion'
import { Sparkles, AlertTriangle, ShieldCheck, TrendingUp, Activity, CheckCircle2 } from 'lucide-react'

export default function IntelligenceShowcase() {
  return (
    <section id="ai" className="py-24 lg:py-32 bg-[#F7F5F0] dark:bg-[#071A3A] text-[#071A3A] dark:text-white transition-colors duration-300 overflow-hidden border-t border-[#071A3A]/10 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Offset Narrative & Capability Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start mb-12">
          {/* Left Narrative (7 cols) */}
          <div className="lg:col-span-7">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0052FF] dark:text-[#A9DFFF] block mb-3">
              Operational Intelligence
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] mb-6 text-[#071A3A] dark:text-white">
              See The Risks
              <span className="block text-[#0052FF] dark:text-[#A9DFFF] mt-1">Before They</span>
              <span className="block mt-1">Become Blockers.</span>
            </h2>
            <p className="text-base sm:text-lg text-[#52627A] dark:text-white/80 font-medium leading-relaxed max-w-xl">
              TaskFlow continuously assesses your workspace health, monitors active task velocity, flags overdue items, and detects team workload bottlenecks before sprint delivery dates slip.
            </p>
          </div>

          {/* Right 3 Diagnostic Pillars (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1F3A] border border-[#071A3A]/10 dark:border-white/10 shadow-xs">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-6 h-6 rounded-md bg-[#071A3A] dark:bg-white text-white dark:text-[#071A3A] flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </span>
                <div className="text-xs font-black uppercase tracking-wider text-[#071A3A] dark:text-white">
                  Workspace Health Scoring
                </div>
              </div>
              <p className="text-xs text-[#52627A] dark:text-white/60 font-medium pl-8.5">
                Calculated across task completion rates, deal progress, and team participation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1F3A] border border-[#071A3A]/10 dark:border-white/10 shadow-xs">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-6 h-6 rounded-md bg-[#071A3A] dark:bg-white text-white dark:text-[#071A3A] flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </span>
                <div className="text-xs font-black uppercase tracking-wider text-[#071A3A] dark:text-white">
                  Task Delay Probability
                </div>
              </div>
              <p className="text-xs text-[#52627A] dark:text-white/60 font-medium pl-8.5">
                Surfaces tasks with imminent deadlines that lack recent activity to unblock early.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1F3A] border border-[#071A3A]/10 dark:border-white/10 shadow-xs">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-6 h-6 rounded-md bg-[#071A3A] dark:bg-white text-white dark:text-[#071A3A] flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </span>
                <div className="text-xs font-black uppercase tracking-wider text-[#071A3A] dark:text-white">
                  Workload Balancing & Bottlenecks
                </div>
              </div>
              <p className="text-xs text-[#52627A] dark:text-white/60 font-medium pl-8.5">
                Identifies overloaded collaborators and suggests practical reassignments before burnout.
              </p>
            </div>
          </div>
        </div>

        {/* Large Workspace Diagnostic Center Showcase */}
        <div className="rounded-3xl border-2 border-[#071A3A]/15 dark:border-white/15 bg-white dark:bg-[#0B1F3A] p-5 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#071A3A]/10 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0052FF] flex items-center justify-center text-white">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-[#071A3A] dark:text-white tracking-wide">
                  Workspace Diagnostic Center
                </h3>
                <p className="text-[10px] font-bold text-[#52627A] dark:text-[#A9DFFF] uppercase">
                  Continuous Health Assessment & Risk Flagging
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Status: Strong
            </span>
          </div>

          {/* Health Score Gauge & Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#F7F5F0] dark:bg-[#071A3A] border border-[#071A3A]/10 dark:border-white/10 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase text-[#52627A] dark:text-white/60">Health Index</span>
              <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 my-1.5">
                88<span className="text-xs font-medium text-[#52627A] dark:text-white/50">/100</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Velocity within target
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F5F0] dark:bg-[#071A3A] border border-[#071A3A]/10 dark:border-white/10 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase text-[#52627A] dark:text-white/60">Delays Projected</span>
              <div className="text-4xl font-black text-[#071A3A] dark:text-white my-1.5">
                0
              </div>
              <span className="text-[11px] font-semibold text-[#52627A] dark:text-white/60">
                All deadlines tracking
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F5F0] dark:bg-[#071A3A] border border-[#071A3A]/10 dark:border-white/10 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase text-[#52627A] dark:text-white/60">Team Workload</span>
              <div className="text-4xl font-black text-[#0052FF] dark:text-[#A9DFFF] my-1.5">
                Balanced
              </div>
              <span className="text-[11px] font-semibold text-[#0052FF] dark:text-[#A9DFFF]">
                Capacity at 74%
              </span>
            </div>
          </div>

          {/* Actionable Intelligence Alert Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Alert Item 1 */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/25 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#071A3A] dark:text-white mb-1">
                  Task Nearing Deadline Without Active Review
                </div>
                <p className="text-[11px] text-[#52627A] dark:text-white/70 leading-relaxed">
                  "Stripe Webhook Signature Verification" is due in 36 hours with no commits in 2 days. Recommend reassigning review to available engineer.
                </p>
              </div>
            </div>

            {/* Alert Item 2 */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-300 dark:border-emerald-800 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#071A3A] dark:text-white mb-1">
                  CRM Deal Pipeline Velocity Up 18%
                </div>
                <p className="text-[11px] text-[#52627A] dark:text-white/70 leading-relaxed">
                  Lead-to-proposal conversion pace improved after automated email sequence implementation. 5 proposals currently awaiting closing confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
