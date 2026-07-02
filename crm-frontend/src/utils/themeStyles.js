// Semantic theme token styles for consistent color usage across the app
export const themeStyles = {
  // Text colors - use these instead of text-gray-*, text-white, text-black
  text: {
    primary: 'color: var(--theme-textPrimary)',
    secondary: 'color: var(--theme-textSecondary)',
    muted: 'color: var(--theme-textMuted)',
    heading: 'color: var(--theme-heading)',
  },

  // Background colors
  bg: {
    surface: 'background-color: var(--theme-surface)',
    card: 'background-color: var(--theme-card)',
    sidebar: 'background-color: var(--theme-sidebar)',
  },

  // Border colors
  border: {
    default: 'border-color: var(--theme-border)',
    light: 'border-color: var(--theme-borderLight)',
  },

  // className utilities for Tailwind
  textClass: {
    primary: 'text-[color:var(--theme-textPrimary)]',
    secondary: 'text-[color:var(--theme-textSecondary)]',
    muted: 'text-[color:var(--theme-textMuted)]',
    heading: 'text-[color:var(--theme-heading)]',
  },
}

// Helper to apply theme colors as inline styles
export const useThemeStyle = (colorType) => {
  const styles = {
    textPrimary: { color: 'var(--theme-textPrimary)' },
    textSecondary: { color: 'var(--theme-textSecondary)' },
    textMuted: { color: 'var(--theme-textMuted)' },
    heading: { color: 'var(--theme-heading)' },
    border: { borderColor: 'var(--theme-border)' },
    card: { backgroundColor: 'var(--theme-card)' },
    surface: { backgroundColor: 'var(--theme-surface)' },
    icon: { color: 'var(--theme-icon)' },
  }
  return styles[colorType] || {}
}
