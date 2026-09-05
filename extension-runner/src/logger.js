/**
 * Structured, sanitized logger for Chrome Extension Runner
 */
const SENSITIVE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-_.]+/gi,
  /("?password"?\s*[:=]\s*)"[^"]*"/gi,
  /("?secret"?\s*[:=]\s*)"[^"]*"/gi,
  /("?authToken"?\s*[:=]\s*)"[^"]*"/gi,
  /("?apiKey"?\s*[:=]\s*)"[^"]*"/gi,
];

function sanitize(message) {
  if (typeof message !== 'string') {
    try {
      message = JSON.stringify(message);
    } catch {
      message = String(message);
    }
  }
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '$1[REDACTED]');
  }
  return sanitized;
}

export const logger = {
  info(tag, ...args) {
    const formatted = args.map(a => typeof a === 'string' ? sanitize(a) : a);
    console.log(`[RUNNER] ${tag}`, ...formatted);
  },

  warn(tag, ...args) {
    const formatted = args.map(a => typeof a === 'string' ? sanitize(a) : a);
    console.warn(`[RUNNER] [WARN] ${tag}`, ...formatted);
  },

  error(tag, ...args) {
    const formatted = args.map(a => typeof a === 'string' ? sanitize(a) : a);
    console.error(`[RUNNER] [ERROR] ${tag}`, ...formatted);
  },

  debug(tag, ...args) {
    if (process.env.DEBUG) {
      const formatted = args.map(a => typeof a === 'string' ? sanitize(a) : a);
      console.log(`[RUNNER] [DEBUG] ${tag}`, ...formatted);
    }
  }
};
