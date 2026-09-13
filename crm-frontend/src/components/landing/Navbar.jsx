import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Menu, X, ArrowUpRight } from 'lucide-react'
import { useThemeContext } from '../../contexts/ThemeContext'

const NAV_LINKS = [
  { label: 'Work Management', href: '#projects' },
  { label: 'CRM Pipeline', href: '#crm' },
  { label: 'Real-Time Chat', href: '#chat' },
  { label: 'AI Intelligence', href: '#ai' },
  { label: 'Marketing Engine', href: '#marketing' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const { theme, switchTheme } = useThemeContext()
  const isDark = theme === 'dark'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)

      const sections = ['projects', 'crm', 'chat', 'ai', 'marketing', 'pricing']
      for (const section of sections) {
        const el = document.getElementById(section)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 140 && rect.bottom >= 140) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (href) => {
    const id = href.replace('#', '')
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#F7F5F0]/95 dark:bg-[#071A3A]/95 backdrop-blur-md border-b border-[#071A3A]/10 dark:border-white/10 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group focus:outline-none">
              <div className="w-10 h-10 rounded-lg bg-[#071A3A] dark:bg-white flex items-center justify-center text-white dark:text-[#071A3A] font-black text-xl tracking-tighter shadow-sm transition-transform group-hover:scale-105">
                TF
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-[#071A3A] dark:text-white uppercase leading-none">
                  TaskFlow
                </span>
                <span className="text-[10px] font-bold tracking-widest text-[#52627A] dark:text-[#A9DFFF] uppercase mt-0.5">
                  Workspace
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 border border-[#071A3A]/10 dark:border-white/15 rounded-full px-3 py-1.5 bg-white/70 dark:bg-[#0B1F3A]/70 backdrop-blur-sm shadow-sm">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.href.replace('#', '')
                return (
                  <button
                    key={link.label}
                    onClick={() => scrollToSection(link.href)}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-150 ${
                      isActive
                        ? 'bg-[#071A3A] text-white dark:bg-white dark:text-[#071A3A] shadow-sm'
                        : 'text-[#52627A] dark:text-[#A9DFFF]/80 hover:text-[#071A3A] dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                  </button>
                )
              })}
            </nav>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={() => switchTheme(isDark ? 'light' : 'dark')}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="w-10 h-10 rounded-full border border-[#071A3A]/15 dark:border-white/15 flex items-center justify-center text-[#071A3A] dark:text-white hover:bg-[#071A3A]/5 dark:hover:bg-white/10 transition-colors"
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#071A3A] dark:text-white hover:opacity-75 transition-opacity"
              >
                Sign In
              </Link>

              <Link to="/register">
                <button className="px-5 py-2.5 rounded-full bg-[#0052FF] hover:bg-[#0043D1] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 active:scale-95">
                  Get Started
                  <ArrowUpRight size={15} />
                </button>
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => switchTheme(isDark ? 'light' : 'dark')}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="w-10 h-10 rounded-full border border-[#071A3A]/15 dark:border-white/15 flex items-center justify-center text-[#071A3A] dark:text-white hover:bg-[#071A3A]/5 dark:hover:bg-white/10 transition-colors"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#0B1F3A] border border-[#071A3A]/15 dark:border-white/20 text-[#071A3A] dark:text-white flex items-center justify-center focus:outline-none shadow-sm hover:bg-gray-50 dark:hover:bg-[#0E274A] transition-colors"
              >
                {isMobileMenuOpen ? <X size={20} className="text-[#071A3A] dark:text-white" /> : <Menu size={20} className="text-[#071A3A] dark:text-white" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
              aria-hidden="true"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[#F7F5F0] dark:bg-[#071A3A] border-l border-[#071A3A]/15 dark:border-white/15 z-50 lg:hidden flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-6 border-b border-[#071A3A]/10 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#071A3A] dark:bg-white flex items-center justify-center text-white dark:text-[#071A3A] font-black text-sm">
                    TF
                  </div>
                  <span className="font-black text-sm uppercase tracking-tight text-[#071A3A] dark:text-white">
                    TaskFlow
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-full border border-[#071A3A]/15 dark:border-white/15 flex items-center justify-center text-[#071A3A] dark:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 py-6 space-y-2">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => scrollToSection(link.href)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-black uppercase tracking-wider text-[#071A3A] dark:text-white hover:bg-[#071A3A]/5 dark:hover:bg-white/10 transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              <div className="pt-6 border-t border-[#071A3A]/10 dark:border-white/10 space-y-3">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full py-3 text-center text-xs font-bold uppercase tracking-wider border border-[#071A3A]/20 dark:border-white/20 text-[#071A3A] dark:text-white rounded-xl hover:bg-[#071A3A]/5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full py-3 text-center text-xs font-bold uppercase tracking-wider bg-[#0052FF] text-white rounded-xl shadow-md hover:bg-[#0043D1] transition-colors"
                >
                  Get Started Free
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
