import { motion } from 'framer-motion'
import { CheckSquare, Calendar, Paperclip, Eye, CheckCircle2, Clock } from 'lucide-react'

export default function ProjectShowcase() {
  return (
    <section id="projects" className="py-20 lg:py-28 bg-[#F6A8C7] dark:bg-[#151322] text-[#071A3A] dark:text-white transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Text Block (5 cols) */}
          <div className="lg:col-span-5">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#071A3A] dark:text-[#F6A8C7] block mb-3">
              Project Management & Kanban
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] mb-6 text-[#071A3A] dark:text-white">
              Plan.
              <span className="block mt-1">Track.</span>
              <span className="block mt-1">Deliver.</span>
            </h2>
            <p className="text-base sm:text-lg text-[#071A3A]/80 dark:text-white/80 font-medium leading-relaxed mb-8">
              Break complex roadmaps into clear milestones and actionable tasks. Keep team velocity visible, track watchers, and never lose an attachment or update.
            </p>

            <div className="space-y-3.5 border-t border-[#071A3A]/15 dark:border-white/10 pt-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-[#071A3A] dark:bg-white text-white dark:text-[#071A3A] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#071A3A] dark:text-white">
                    DnD-Kit Drag & Drop Kanban
                  </div>
                  <p className="text-xs text-[#071A3A]/70 dark:text-white/60 font-medium mt-0.5">
                    Move tasks fluidly across Todo, In Progress, Review, and Done with instant status synchronisation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-[#071A3A] dark:bg-white text-white dark:text-[#071A3A] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#071A3A] dark:text-white">
                    Cloudinary Attachments & Comments
                  </div>
                  <p className="text-xs text-[#071A3A]/70 dark:text-white/60 font-medium mt-0.5">
                    Embed design comps, spreadsheets, and PDFs directly in task modals with audit logs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-[#071A3A] dark:bg-white text-white dark:text-[#071A3A] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#071A3A] dark:text-white">
                    Watchers & Priority Flags
                  </div>
                  <p className="text-xs text-[#071A3A]/70 dark:text-white/60 font-medium mt-0.5">
                    Assign stakeholders as watchers to trigger notifications on status transitions and deadlines.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Realistic Kanban UI Showcase (7 cols) */}
          <div className="lg:col-span-7">
            <div
              className="rounded-3xl border-2 border-[#071A3A]/20 dark:border-white/15 bg-[#F7F5F0] dark:bg-[#0B1F3A] p-4 sm:p-6 shadow-2xl overflow-hidden"
            >
              {/* Board Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#071A3A]/10 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#071A3A] dark:bg-white text-white dark:text-[#071A3A] flex items-center justify-center">
                    <CheckSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide text-[#071A3A] dark:text-white">
                      Sprint 14: Core Infrastructure
                    </h3>
                    <p className="text-[10px] font-bold text-[#52627A] dark:text-[#A9DFFF] uppercase">
                      24 Tasks · 8 Completed · 4 In Progress
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#071A3A]/10 dark:bg-white/10 text-[#071A3A] dark:text-white">
                    Priority: High
                  </span>
                </div>
              </div>

              {/* 4 Column Kanban Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {/* Column: To Do */}
                <div className="rounded-2xl bg-white/70 dark:bg-[#071A3A]/70 border border-[#071A3A]/10 dark:border-white/10 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#071A3A]/10 dark:border-white/10">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#52627A] dark:text-white/60">
                        To Do
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#071A3A]/10 dark:bg-white/10">
                        2
                      </span>
                    </div>

                    {/* Card 1 */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0B1F3A] border border-[#071A3A]/10 dark:border-white/10 mb-2 shadow-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          Low
                        </span>
                        <div className="flex items-center gap-1 text-[9px] text-[#52627A] dark:text-white/60">
                          <Paperclip size={10} />
                          <span>1</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-[#071A3A] dark:text-white leading-snug mb-2">
                        API rate limit test script
                      </p>
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#071A3A]/5 dark:border-white/5 text-[9px] text-[#52627A] dark:text-white/50 font-mono">
                        <span>#backend</span>
                        <span>Oct 12</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column: In Progress */}
                <div className="rounded-2xl bg-white/70 dark:bg-[#071A3A]/70 border border-[#071A3A]/10 dark:border-white/10 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#071A3A]/10 dark:border-white/10">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0052FF] dark:text-[#A9DFFF]">
                        In Progress
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#0052FF]/15 text-[#0052FF] dark:text-[#A9DFFF]">
                        3
                      </span>
                    </div>

                    {/* Card 2 */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0B1F3A] border-2 border-[#0052FF]/30 mb-2 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          High
                        </span>
                        <div className="flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                          <Clock size={10} />
                          <span>Today</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-[#071A3A] dark:text-white leading-snug mb-2">
                        PostgreSQL index optimization
                      </p>
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#071A3A]/5 dark:border-white/5 text-[9px] text-[#52627A] dark:text-white/50 font-mono">
                        <span>#database</span>
                        <span className="font-bold text-[#0052FF]">Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column: Review */}
                <div className="rounded-2xl bg-white/70 dark:bg-[#071A3A]/70 border border-[#071A3A]/10 dark:border-white/10 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#071A3A]/10 dark:border-white/10">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-300">
                        Review
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                        1
                      </span>
                    </div>

                    {/* Card 3 */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0B1F3A] border border-[#071A3A]/10 dark:border-white/10 mb-2 shadow-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                          Urgent
                        </span>
                        <div className="flex items-center gap-1 text-[9px] text-[#52627A] dark:text-white/60">
                          <Eye size={10} />
                          <span>2</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-[#071A3A] dark:text-white leading-snug mb-2">
                        OAuth token refresh handler
                      </p>
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#071A3A]/5 dark:border-white/5 text-[9px] text-[#52627A] dark:text-white/50 font-mono">
                        <span>#auth</span>
                        <span className="font-bold text-purple-600 dark:text-purple-300">PR #88</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column: Done */}
                <div className="rounded-2xl bg-white/70 dark:bg-[#071A3A]/70 border border-[#071A3A]/10 dark:border-white/10 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#071A3A]/10 dark:border-white/10">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Done
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                        8
                      </span>
                    </div>

                    {/* Card 4 */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0B1F3A] border border-[#071A3A]/10 dark:border-white/10 mb-2 opacity-80">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Done
                        </span>
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      </div>
                      <p className="text-xs font-bold line-through text-[#52627A] dark:text-white/60 leading-snug mb-2">
                        WebSocket presence channel
                      </p>
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#071A3A]/5 dark:border-white/5 text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                        <span>#realtime</span>
                        <span>Merged</span>
                      </div>
                    </div>
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
