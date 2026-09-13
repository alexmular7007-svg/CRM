import { motion } from 'framer-motion'
import { Server, Database, Zap, Shield, KeyRound, Radio, HardDrive, Mail } from 'lucide-react'

const STACK_ITEMS = [
  {
    category: 'Backend Architecture',
    title: 'Spring Boot 3 API',
    desc: 'Robust Java enterprise framework with HikariCP connection pooling and asynchronous execution.',
    icon: Server,
  },
  {
    category: 'Data Storage',
    title: 'PostgreSQL Relational Store',
    desc: 'Strict ACID compliance, foreign key cascade protections, and multi-tenant workspace partitioning.',
    icon: Database,
  },
  {
    category: 'Performance Caching',
    title: 'Redis Layer',
    desc: 'Low-latency session and workspace caching powered by Lettuce client with custom TTL strategies.',
    icon: Zap,
  },
  {
    category: 'Real-Time Bus',
    title: 'WebSocket & STOMP',
    desc: 'Bi-directional SockJS transport powering live channel messaging, typing indicators, and user presence.',
    icon: Radio,
  },
  {
    category: 'Security & Auth',
    title: 'JWT & OAuth2 Protocols',
    desc: 'Stateless JSON Web Tokens with refresh cycle, Google & GitHub SSO, and granular role enforcement.',
    icon: KeyRound,
  },
  {
    category: 'Cloud Storage',
    title: 'Cloudinary Media CDN',
    desc: 'High-speed cloud asset storage for task documents, design mockups, and chat attachments.',
    icon: HardDrive,
  },
]

export default function TechnicalCredibility() {
  return (
    <section className="py-16 lg:py-24 bg-[#071A3A] text-white overflow-hidden border-t border-white/10 dark-section" data-section-theme="dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#A9DFFF] block mb-3">
            Technical Architecture
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] mb-6 text-white">
            Built For Real Work.
            <span className="block text-[#A9DFFF] mt-1">Engineered For Scale.</span>
          </h2>
          <p className="text-base sm:text-lg text-white/80 font-medium leading-relaxed">
            No toy databases, no single-threaded servers, and no fabricated claims. TaskFlow is backed by standard enterprise infrastructure engineered for reliable daily operations.
          </p>
        </div>

        {/* Stack Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STACK_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="p-6 sm:p-7 rounded-2xl bg-[#0B1F3A] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#A9DFFF] tracking-wider">
                      {item.category}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#A9DFFF] group-hover:bg-[#0052FF] group-hover:text-white transition-all">
                      <Icon size={16} />
                    </div>
                  </div>
                  <h3 className="text-base font-black uppercase tracking-tight text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/70 font-medium leading-relaxed">
                    {item.desc}
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
