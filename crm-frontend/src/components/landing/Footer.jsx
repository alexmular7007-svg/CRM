import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  const scrollToAnchor = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <footer className="border-t border-[#071A3A]/10 dark:border-white/10 bg-[#F7F5F0] dark:bg-[#071A3A] text-[#071A3A] dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 mb-14">
          {/* Brand Info (5 cols) */}
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center gap-3 mb-5 group">
              <div className="w-9 h-9 rounded-lg bg-[#071A3A] dark:bg-white flex items-center justify-center text-white dark:text-[#071A3A] font-black text-lg">
                TF
              </div>
              <span className="text-xl font-black uppercase tracking-tight text-[#071A3A] dark:text-white">
                TaskFlow
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-[#52627A] dark:text-white/70 max-w-sm font-medium leading-relaxed mb-6">
              The unified operational workspace for projects, CRM pipelines, real-time messaging, and intelligent health monitoring.
            </p>
            <div className="text-xs font-mono text-[#52627A] dark:text-white/50">
              Architecture: Spring Boot 3 · React 18 · PostgreSQL · Redis
            </div>
          </div>

          {/* Navigation Links (3 cols) */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#0052FF] dark:text-[#A9DFFF] mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs font-bold uppercase tracking-wider text-[#52627A] dark:text-white/70">
              <li>
                <button onClick={() => scrollToAnchor('features')} className="hover:text-[#071A3A] dark:hover:text-white transition-colors">
                  Features & Capabilities
                </button>
              </li>
              <li>
                <button onClick={() => scrollToAnchor('workflow')} className="hover:text-[#071A3A] dark:hover:text-white transition-colors">
                  Three-Step Workflow
                </button>
              </li>
              <li>
                <button onClick={() => scrollToAnchor('ai')} className="hover:text-[#071A3A] dark:hover:text-white transition-colors">
                  Operational Intelligence
                </button>
              </li>
              <li>
                <button onClick={() => scrollToAnchor('pricing')} className="hover:text-[#071A3A] dark:hover:text-white transition-colors">
                  Pricing & Plans
                </button>
              </li>
            </ul>
          </div>

          {/* Access & Legal (4 cols) */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#0052FF] dark:text-[#A9DFFF] mb-4">
              Access & Governance
            </h4>
            <ul className="space-y-2.5 text-xs font-bold uppercase tracking-wider text-[#52627A] dark:text-white/70">
              <li>
                <Link to="/login" className="hover:text-[#071A3A] dark:hover:text-white transition-colors">
                  Sign In to Workspace
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#071A3A] dark:hover:text-white transition-colors">
                  Create New Account
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#071A3A] dark:hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#071A3A] dark:hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#071A3A]/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#52627A] dark:text-white/60">
          <div>
            © {year} TaskFlow. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/login" className="hover:underline">Account</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
