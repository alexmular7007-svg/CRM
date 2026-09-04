/**
 * Logger Utility
 * Provides standardized logging across extension contexts.
 */
const PREFIX = '[CRM-Extension]'

export const logger = {
  info(...args) {
    console.log(PREFIX, new Date().toISOString().substring(11, 19), 'ℹ️', ...args)
  },
  success(...args) {
    console.log(PREFIX, new Date().toISOString().substring(11, 19), '✅', ...args)
  },
  warn(...args) {
    console.warn(PREFIX, new Date().toISOString().substring(11, 19), '⚠️', ...args)
  },
  error(...args) {
    console.error(PREFIX, new Date().toISOString().substring(11, 19), '❌', ...args)
  },
}
