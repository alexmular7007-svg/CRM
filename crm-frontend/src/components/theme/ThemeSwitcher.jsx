import { useState, useRef, useEffect } from 'react'
import { FiCheck, FiDroplet } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeContext, THEMES } from '../../contexts/ThemeContext'

const ThemeSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, switchTheme, currentTheme } = useThemeContext()
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const themesList = Object.values(THEMES)

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors"
        style={{
          color: currentTheme.colors.text,
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <FiDroplet size={14} className="flex-shrink-0" />
        <span className="flex-1 text-left text-[13px] font-medium">Change Theme</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
            className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border shadow-lg space-y-1 p-1.5 z-50"
          >
            {themesList.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  switchTheme(t.id)
                  setIsOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-[12px] font-medium transition-colors"
                style={{
                  backgroundColor: theme === t.id ? currentTheme.colors.primary : 'transparent',
                  color: theme === t.id ? '#FFFFFF' : currentTheme.colors.text,
                }}
                onMouseEnter={(e) => {
                  if (theme !== t.id) {
                    e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceSecondary
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme !== t.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <div
                  style={{
                    backgroundColor: t.colors.primary,
                  }}
                  className="w-4 h-4 rounded-full flex-shrink-0"
                />
                <span>{t.name}</span>
                {theme === t.id && <FiCheck size={14} className="ml-auto flex-shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ThemeSwitcher
