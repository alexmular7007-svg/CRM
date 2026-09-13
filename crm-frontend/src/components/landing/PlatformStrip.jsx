import { motion } from 'framer-motion'
import { FolderGit2, CheckSquare, Users2, MessageSquareCode, Sparkles, Workflow } from 'lucide-react'

const PILLARS = [
  {
    tag: '01',
    title: 'Workspaces',
    description: 'Multi-tenant isolation, RBAC & team governance',
    icon: FolderGit2,
  },
  {
    tag: '02',
    title: 'Project Kanban',
    description: 'Sprint planning, tasks, checklists & watchers',
    icon: CheckSquare,
  },
  {
    tag: '03',
    title: 'CRM Pipeline',
    description: '7-stage sales funnel & client conversion',
    icon: Users2,
  },
  {
    tag: '04',
    title: 'Live Chat',
    description: 'Real-time presence, channels & @mentions',
    icon: MessageSquareCode,
  },
  {
    tag: '05',
    title: 'Intelligence',
    description: 'Health scores, delay risk & bottleneck alerts',
    icon: Sparkles,
  },
  {
    tag: '06',
    title: 'Automations',
    description: 'Public forms, email campaigns & triggers',
    icon: Workflow,
  },
]

export default function PlatformStrip() {
  return (
    <section className="border-y border-[#071A3A]/10 dark:border-white/10 bg-[#071A3A] text-white overflow-hidden dark-section" data-section-theme="dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/10">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#A9DFFF] block mb-2">
              Architecture & Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase leading-tight text-white">
              One Unified System. Zero Disconnected Silos.
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-white/70 max-w-md leading-relaxed font-medium">
            Everything your team needs to plan, sell, converse, and automate is engineered into one synchronized environment.
          </p>
        </div>

        {/* 6 Capabilities Grid with editorial vertical dividers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="bg-[#0B1F3A] hover:bg-[#0E274A] p-6 lg:p-8 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-mono font-bold text-[#A9DFFF] px-2.5 py-1 rounded-md bg-white/10 border border-white/20">
                      {pillar.tag}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#A9DFFF] group-hover:scale-110 group-hover:bg-[#0052FF] group-hover:text-white transition-all shadow-sm">
                      <Icon size={19} />
                    </div>
                  </div>
                  <h3 className="text-lg lg:text-xl font-black tracking-tight text-white mb-2 uppercase">
                    {pillar.title}
                  </h3>
                  <p className="text-xs lg:text-sm text-white/70 leading-relaxed font-medium">
                    {pillar.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
