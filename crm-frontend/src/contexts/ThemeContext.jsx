import { createContext, useContext, useState, useEffect } from 'react'

// Define comprehensive theme tokens for Dark and Light themes only
export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark Professional',
    colors: {
      // Backgrounds
      background: '#0F172A',
      surface: '#1E293B',
      surfaceSecondary: '#334155',
      card: '#1E293B',
      sidebar: '#111827',
      navbar: '#0F172A',
      
      // Text
      text: '#F8FAFC',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
      heading: '#F8FAFC',
      
      // Borders & Dividers
      border: '#1E293B',
      borderLight: '#334155',
      
      // Interactive
      primary: '#6366F1',
      primaryHover: '#4F46E5',
      secondary: '#3B82F6',
      secondaryHover: '#2563EB',
      
      // Status colors
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      
      // Input
      inputBackground: '#0F172A',
      inputBorder: '#334155',
      inputBorderFocus: '#6366F1',
      inputText: '#F8FAFC',
      inputPlaceholder: '#94A3B8',
      
      // Button
      buttonPrimary: '#6366F1',
      buttonPrimaryHover: '#4F46E5',
      buttonPrimaryText: '#FFFFFF',
      buttonSecondary: '#334155',
      buttonSecondaryHover: '#475569',
      buttonSecondaryText: '#F8FAFC',
      
      // Icons
      icon: '#CBD5E1',
      iconHover: '#F8FAFC',
      
      // Table
      tableHeader: '#1E293B',
      tableText: '#F8FAFC',
      tableBorder: '#334155',
      tableRowHover: '#334155',
      
      // Badge & Tags
      badge: '#334155',
      badgeText: '#F8FAFC',
      
      // Status badge backgrounds
      badgeSuccess: 'rgba(16, 185, 129, 0.1)',
      badgeWarning: 'rgba(245, 158, 11, 0.1)',
      badgeDanger: 'rgba(239, 68, 68, 0.1)',
      badgeInfo: 'rgba(59, 130, 246, 0.1)',
      
      // Status badge texts
      badgeSuccessText: '#10B981',
      badgeWarningText: '#F59E0B',
      badgeDangerText: '#EF4444',
      badgeInfoText: '#3B82F6',
      
      // Disabled state
      textDisabled: '#64748B',
      buttonDisabled: '#475569',
      
      // Links
      link: '#3B82F6',
      linkHover: '#2563EB',
      
      // Shadows
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowSm: 'rgba(0, 0, 0, 0.1)',
      
      // Focus Ring
      focusRing: '#6366F1',
    },
  },
  light: {
    id: 'light',
    name: 'Light Professional',
    colors: {
      // Backgrounds
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceSecondary: '#F1F5F9',
      card: '#FFFFFF',
      sidebar: '#FFFFFF',
      navbar: '#FFFFFF',
      
      // Text - IMPROVED CONTRAST for light mode
      text: '#0F172A',
      textPrimary: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#475569',
      heading: '#0F172A',
      
      // Borders & Dividers
      border: '#D1D5DB',
      borderLight: '#E5E7EB',
      
      // Interactive
      primary: '#4F46E5',
      primaryHover: '#4338CA',
      secondary: '#2563EB',
      secondaryHover: '#1D4ED8',
      
      // Status colors
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
      info: '#2563EB',
      
      // Input
      inputBackground: '#FFFFFF',
      inputBorder: '#B4B4B8',
      inputBorderFocus: '#4338CA',
      inputText: '#0F172A',
      inputPlaceholder: '#6B7280',
      
      // Button
      buttonPrimary: '#4F46E5',
      buttonPrimaryHover: '#4338CA',
      buttonPrimaryText: '#FFFFFF',
      buttonSecondary: '#E5E7EB',
      buttonSecondaryHover: '#D1D5DB',
      buttonSecondaryText: '#0F172A',
      
      // Icons - IMPROVED contrast
      icon: '#4B5563',
      iconHover: '#0F172A',
      
      // Table
      tableHeader: '#F1F5F9',
      tableText: '#0F172A',
      tableBorder: '#D1D5DB',
      tableRowHover: '#F8FAFC',
      
      // Badge & Tags
      badge: '#E5E7EB',
      badgeText: '#0F172A',
      
      // Status badge backgrounds - DARKER for better contrast
      badgeSuccess: 'rgba(5, 150, 105, 0.15)',
      badgeWarning: 'rgba(217, 119, 6, 0.15)',
      badgeDanger: 'rgba(220, 38, 38, 0.15)',
      badgeInfo: 'rgba(37, 99, 235, 0.15)',
      
      // Status badge texts
      badgeSuccessText: '#047857',
      badgeWarningText: '#B45309',
      badgeDangerText: '#991B1B',
      badgeInfoText: '#1D4ED8',
      
      // Disabled state
      textDisabled: '#6B7280',
      buttonDisabled: '#D1D5DB',
      
      // Links
      link: '#1D4ED8',
      linkHover: '#1E40AF',
      
      // Shadows
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowSm: 'rgba(0, 0, 0, 0.05)',
      
      // Focus Ring
      focusRing: '#4338CA',
    },
  },
}

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme')
    // Migrate old themes to dark
    if (saved === 'grey' || saved === 'skyBlue') {
      localStorage.setItem('app-theme', 'light')
      return 'light'
    }
    return saved || 'light'
  })

  // Inject all CSS variables whenever theme changes
  useEffect(() => {
    const currentTheme = THEMES[theme]
    const root = document.documentElement
    const colors = currentTheme.colors

    // Inject all theme tokens as CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })

    localStorage.setItem('app-theme', theme)
  }, [theme])

  const switchTheme = (themeId) => {
    if (THEMES[themeId]) {
      setTheme(themeId)
    }
  }

  const currentTheme = THEMES[theme]

  return (
    <ThemeContext.Provider value={{ theme, switchTheme, currentTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }
  return context
}
