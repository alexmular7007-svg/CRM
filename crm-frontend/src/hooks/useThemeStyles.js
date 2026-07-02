import { useThemeContext } from '../contexts/ThemeContext'

/**
 * Hook that provides reusable style objects based on current theme
 * Use this instead of hardcoded colors or Tailwind dark: classes
 */
export const useThemeStyles = () => {
  const { currentTheme } = useThemeContext()
  const c = currentTheme.colors

  return {
    // Text styles
    text: {
      primary: { color: c.textPrimary },
      secondary: { color: c.textSecondary },
      muted: { color: c.textMuted },
      disabled: { color: c.textDisabled },
      heading: { color: c.heading },
    },

    // Background styles
    bg: {
      primary: { backgroundColor: c.background },
      surface: { backgroundColor: c.surface },
      card: { backgroundColor: c.card },
    },

    // Border styles
    border: {
      default: { borderColor: c.border },
      light: { borderColor: c.borderLight },
    },

    // Badge styles
    badge: {
      success: { 
        backgroundColor: c.badgeSuccess, 
        color: c.badgeSuccessText 
      },
      warning: { 
        backgroundColor: c.badgeWarning, 
        color: c.badgeWarningText 
      },
      danger: { 
        backgroundColor: c.badgeDanger, 
        color: c.badgeDangerText 
      },
      info: { 
        backgroundColor: c.badgeInfo, 
        color: c.badgeInfoText 
      },
      default: { 
        backgroundColor: c.badge, 
        color: c.badgeText 
      },
    },

    // Common combinations
    card: {
      backgroundColor: c.card,
      borderColor: c.border,
      color: c.text,
    },

    input: {
      backgroundColor: c.inputBackground,
      borderColor: c.inputBorder,
      color: c.inputText,
    },

    table: {
      headerBg: c.tableHeader,
      text: c.tableText,
      border: c.tableBorder,
      rowHover: c.tableRowHover,
    },

    // Icon styles
    icon: {
      default: { color: c.icon },
      hover: { color: c.iconHover },
    },

    // Status colors
    status: {
      success: c.success,
      warning: c.warning,
      danger: c.danger,
      info: c.info,
    },
  }
}
