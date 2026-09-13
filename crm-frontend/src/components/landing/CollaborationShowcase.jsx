import { motion } from 'framer-motion'
import { MessageSquareCode, Users, Bell, Eye, Paperclip, Send, CheckCheck, Hash } from 'lucide-react'

export default function CollaborationShowcase() {
  return (
    <section id="chat" className="py-16 lg:py-24 bg-[#BFE9FF] dark:bg-[#0A1A2F] text-[#071A3A] dark:text-white transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Editorial Narrative & Feature Pills */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0052FF] dark:text-[#A9DFFF] block mb-3">
              Real-Time Team Communication
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] text-[#071A3A] dark:text-white">
              Keep Everyone
              <span className="block text-[#0052FF] dark:text-[#A9DFFF] mt-1">In Sync.</span>
            </h2>
            <p className="text-base sm:text-lg text-[#071A3A]/80 dark:text-white/80 font-medium leading-relaxed mt-4">
              Eliminate disjointed email threads and external chat apps. TaskFlow embeds real-time STOMP-powered channels, direct messages, online presence dots, and @mentions right where tasks and deals live.
            </p>
          </div>

          {/* 3 Capability Highlight Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-col gap-3 shrink-0">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black uppercase text-[#071A3A] dark:text-white">STOMP Live Bus</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0052FF]" />
              <span className="text-xs font-black uppercase text-[#071A3A] dark:text-white">Project Channels</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#071A3A]/10 dark:border-white/10 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0052FF]" />
              <span className="text-xs font-black uppercase text-[#071A3A] dark:text-white">Task Cross-Linking</span>
            </div>
          </div>
        </div>

        {/* Wide Full-Width Chat Showcase */}
        <div className="rounded-3xl border-2 border-[#071A3A]/15 dark:border-white/15 bg-white dark:bg-[#071A3A] shadow-2xl overflow-hidden">
              {/* Top Chat Bar */}
              <div className="p-4 sm:p-5 border-b border-[#071A3A]/10 dark:border-white/10 bg-[#F7F5F0] dark:bg-[#0B1F3A] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0052FF] text-white flex items-center justify-center">
                    <Hash size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-[#071A3A] dark:text-white">
                        project-launch-v2
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[10px] text-[#52627A] dark:text-white/60 font-medium">
                      8 members · Public workspace channel
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-[#52627A] dark:text-[#A9DFFF]">
                  <span className="px-2.5 py-1 rounded-full bg-white dark:bg-white/10 border border-[#071A3A]/10 dark:border-white/10 text-[10px] font-bold uppercase">
                    STOMP Active
                  </span>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="p-4 sm:p-6 space-y-4 max-h-[320px] overflow-y-auto bg-white dark:bg-[#071A3A]">
                {/* Message 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0052FF] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    AJ
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#071A3A] dark:text-white">Alex Johnson</span>
                      <span className="text-[10px] font-mono text-[#52627A] dark:text-white/50">10:42 AM</span>
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-none bg-[#F7F5F0] dark:bg-white/5 border border-[#071A3A]/5 dark:border-white/5 text-xs text-[#071A3A] dark:text-white/90 leading-relaxed">
                      Hey team, the Sprint 14 OAuth integration and Kanban watcher alerts are deployed to staging. Testing lookups now.
                    </div>
                  </div>
                </div>

                {/* Message 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F6A8C7] text-[#071A3A] text-[10px] font-bold flex items-center justify-center shrink-0">
                    SK
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#071A3A] dark:text-white">Sara Kim</span>
                      <span className="text-[10px] font-mono text-[#52627A] dark:text-white/50">10:44 AM</span>
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-none bg-[#F7F5F0] dark:bg-white/5 border border-[#071A3A]/5 dark:border-white/5 text-xs text-[#071A3A] dark:text-white/90 leading-relaxed">
                      <span className="text-[#0052FF] dark:text-[#A9DFFF] font-bold">@Alex</span> Just checked the deal pipeline for Apex Cloud Systems — contract marked Won! Moving onboarding tasks to In Progress.
                    </div>
                  </div>
                </div>

                {/* Message 3 - Current User Outgoing */}
                <div className="flex items-start justify-end gap-3">
                  <div className="flex-1 max-w-[85%] text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <span className="text-[10px] font-mono text-[#52627A] dark:text-white/50">10:46 AM</span>
                      <span className="text-xs font-bold text-[#071A3A] dark:text-white">You</span>
                    </div>
                    <div className="p-3 rounded-2xl rounded-tr-none bg-[#0052FF] text-white text-xs leading-relaxed text-left inline-block shadow-sm">
                      Awesome. Cloudinary attachments are linked in task #104. Let's run the QA pass.
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                      <CheckCheck size={12} />
                      <span>Read by 4</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#071A3A] dark:bg-white text-white dark:text-[#071A3A] text-[10px] font-bold flex items-center justify-center shrink-0">
                    ME
                  </div>
                </div>
              </div>

              {/* Bottom Message Input Bar */}
              <div className="p-3 sm:p-4 border-t border-[#071A3A]/10 dark:border-white/10 bg-[#F7F5F0] dark:bg-[#0B1F3A] flex items-center gap-2.5">
                <input
                  type="text"
                  placeholder="Message #project-launch-v2..."
                  disabled
                  className="flex-1 bg-white dark:bg-[#071A3A] border border-[#071A3A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#071A3A] dark:text-white placeholder-[#52627A] dark:placeholder-white/40 focus:outline-none"
                />
                <button
                  disabled
                  aria-label="Send message"
                  className="w-9 h-9 rounded-xl bg-[#0052FF] text-white flex items-center justify-center shrink-0 opacity-80"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
  )
}
