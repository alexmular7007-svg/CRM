import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowRight, ShieldCheck, Zap } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="py-24 lg:py-32 bg-[#071A3A] text-white overflow-hidden border-t border-white/10 relative dark-section" data-section-theme="dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border-2 border-white/15 bg-gradient-to-br from-[#0B1F3A] to-[#071A3A] p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden shadow-2xl">
          {/* Subtle graphic accent */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.25em] bg-[#0052FF] text-white">
              Instant Workspace Setup
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tight leading-[0.92] max-w-4xl mx-auto mb-6 sm:mb-8 text-white">
            Bring Projects,
            <span className="block text-[#A9DFFF] mt-1">Customers & Teams</span>
            <span className="block mt-1 text-white">Together.</span>
          </h2>

          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
            Ditch disconnected apps and spreadsheets. Experience what unified task management, CRM pipelines, real-time messaging, and intelligence feel like inside one architecture.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link to="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-9 py-4 rounded-full bg-[#0052FF] hover:bg-[#0043D1] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95">
                Get Started Free
                <ArrowUpRight size={17} />
              </button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full border-2 border-white/20 hover:border-white text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:bg-white/5 active:scale-95">
                Sign In
                <ArrowRight size={15} />
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-bold text-white/80 uppercase tracking-wider">
            <span>Free Tier Available</span>
            <span>·</span>
            <span>Multi-Tenant Workspaces</span>
            <span>·</span>
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </div>
    </section>
  )
}
