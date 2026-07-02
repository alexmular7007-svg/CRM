import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useThemeContext } from '../../contexts/ThemeContext'
import AuthShowcase from '../../components/auth/AuthShowcase'
import AuthCard from '../../components/auth/AuthCard'

const AuthPage = () => {
  const location = useLocation()
  const [isLogin, setIsLogin] = useState(location.pathname === '/register' ? false : true)
  const { theme, switchTheme } = useThemeContext()

  // Sync form state when route changes
  useEffect(() => {
    setIsLogin(location.pathname === '/register' ? false : true)
  }, [location.pathname])

  return (
    <div className={`min-h-screen bg-white dark:bg-[#09090B] flex ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Theme Toggle Button */}
      <button
        onClick={() => {
          const newTheme = theme === 'dark' ? 'light' : 'dark'
          switchTheme(newTheme)
        }}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-gray-600" />}
      </button>

      {/* LEFT SIDE - SHOWCASE (FIXED - NEVER MOVES) */}
      <div className="hidden lg:flex lg:w-1/2 fixed left-0 top-0 h-screen overflow-hidden">
        <AuthShowcase />
      </div>

      {/* RIGHT SIDE - SCROLLABLE AUTH CARD */}
      <div className="w-full lg:w-1/2 lg:ml-auto min-h-screen flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 py-12 bg-gradient-to-br from-gray-50 to-white dark:from-[#0A0A0D] dark:to-[#09090B] overflow-y-auto">
        {/* Auth Card Container - Properly Centered */}
        <div className="w-full max-w-[520px] mx-auto">
          <AuthCard isLogin={isLogin} onToggle={setIsLogin} />
        </div>
      </div>
    </div>
  )
}

export default AuthPage
