/**
 * Step Validators for Browser Test Engine (Phase 6C)
 */
const SUPPORTED_ACTIONS = [
  'OPEN_PAGE',
  'CLICK',
  'TYPE',
  'WAIT',
  'ASSERT_VISIBLE',
  'ASSERT_TEXT',
  'ASSERT_URL',
  'ASSERT_TITLE',
  'SCREENSHOT',
  'SELECT_OPTION',
];

const PROHIBITED_HOSTS = ['169.254.169.254', 'metadata.google.internal'];

export function validateStep(step, stepIndex) {
  if (!step || typeof step !== 'object') {
    throw new Error(`Step [${stepIndex}]: Invalid step definition; must be an object`);
  }

  const action = step.action?.toUpperCase();
  if (!action || !SUPPORTED_ACTIONS.includes(action)) {
    throw new Error(`Step [${stepIndex}]: Unsupported or missing action '${step.action}'`);
  }

  switch (action) {
    case 'OPEN_PAGE': {
      const url = step.target || step.value;
      if (!url || typeof url !== 'string' || !url.trim()) {
        throw new Error(`Step [${stepIndex}] (OPEN_PAGE): Target URL is required`);
      }
      const trimmedUrl = url.trim();
      if (trimmedUrl.startsWith('chrome-extension://')) {
        // Valid extension internal URL
        break;
      }
      try {
        const parsed = new URL(trimmedUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error(`Step [${stepIndex}] (OPEN_PAGE): Invalid protocol '${parsed.protocol}'. Only http, https, or chrome-extension are allowed`);
        }
        if (PROHIBITED_HOSTS.includes(parsed.hostname)) {
          throw new Error(`Step [${stepIndex}] (OPEN_PAGE): Access to metadata endpoints is prohibited`);
        }
      } catch (err) {
        if (!err.message.includes('Step [')) {
          throw new Error(`Step [${stepIndex}] (OPEN_PAGE): Malformed URL '${trimmedUrl}'`);
        }
        throw err;
      }
      break;
    }

    case 'CLICK': {
      if (!step.target || typeof step.target !== 'string' || !step.target.trim()) {
        throw new Error(`Step [${stepIndex}] (CLICK): Selector target is required`);
      }
      break;
    }

    case 'TYPE': {
      if (!step.target || typeof step.target !== 'string' || !step.target.trim()) {
        throw new Error(`Step [${stepIndex}] (TYPE): Selector target is required`);
      }
      if (step.value === undefined || step.value === null) {
        throw new Error(`Step [${stepIndex}] (TYPE): Input value is required`);
      }
      break;
    }

    case 'WAIT': {
      const duration = parseInt(step.duration ?? step.value ?? step.target, 10);
      if (isNaN(duration) || duration < 0) {
        throw new Error(`Step [${stepIndex}] (WAIT): Duration must be a positive integer`);
      }
      if (duration > 10000) {
        throw new Error(`Step [${stepIndex}] (WAIT): Duration ${duration}ms exceeds maximum allowed 10000ms`);
      }
      break;
    }

    case 'ASSERT_VISIBLE': {
      if (!step.target || typeof step.target !== 'string' || !step.target.trim()) {
        throw new Error(`Step [${stepIndex}] (ASSERT_VISIBLE): Selector target is required`);
      }
      break;
    }

    case 'ASSERT_TEXT': {
      if (!step.target || typeof step.target !== 'string' || !step.target.trim()) {
        throw new Error(`Step [${stepIndex}] (ASSERT_TEXT): Selector target is required`);
      }
      if (step.value === undefined && step.expected === undefined) {
        throw new Error(`Step [${stepIndex}] (ASSERT_TEXT): Expected text value is required`);
      }
      break;
    }

    case 'ASSERT_URL': {
      const expected = step.value || step.expected || step.target;
      if (!expected || typeof expected !== 'string' || !expected.trim()) {
        throw new Error(`Step [${stepIndex}] (ASSERT_URL): Expected URL pattern is required`);
      }
      break;
    }

    case 'ASSERT_TITLE': {
      const expected = step.value || step.expected || step.target;
      if (!expected || typeof expected !== 'string' || !expected.trim()) {
        throw new Error(`Step [${stepIndex}] (ASSERT_TITLE): Expected title text is required`);
      }
      break;
    }

    case 'SCREENSHOT': {
      // Resolve filename from all recognised field names
      const filename = step.filename ?? step.value ?? step.target ?? 'screenshot';
      if (typeof filename === 'string') {
        // Reject null bytes
        if (filename.includes('\0')) {
          throw new Error(`Step [${stepIndex}] (SCREENSHOT): Filename contains a null byte`);
        }
        // Reject percent-encoded traversal / separator variants (%2e = '.', %2f = '/', %5c = '\')
        const decoded = filename.toLowerCase();
        if (decoded.includes('%2e') || decoded.includes('%2f') || decoded.includes('%5c')) {
          throw new Error(`Step [${stepIndex}] (SCREENSHOT): Filename contains encoded path-traversal characters`);
        }
        // Reject dot-dot traversal
        if (filename.includes('..')) {
          throw new Error(`Step [${stepIndex}] (SCREENSHOT): Filename cannot contain path traversal sequences (..)`);
        }
        // Reject POSIX path separators
        if (filename.includes('/')) {
          throw new Error(`Step [${stepIndex}] (SCREENSHOT): Filename cannot contain path separators`);
        }
        // Reject Windows path separators and UNC prefix
        if (filename.includes('\\')) {
          throw new Error(`Step [${stepIndex}] (SCREENSHOT): Filename cannot contain path separators`);
        }
        // Reject Windows drive paths (e.g. C:, D:)
        if (/^[a-zA-Z]:/.test(filename)) {
          throw new Error(`Step [${stepIndex}] (SCREENSHOT): Filename cannot be an absolute or drive-rooted path`);
        }
      }
      break;
    }

    case 'SELECT_OPTION': {
      if (!step.target || typeof step.target !== 'string' || !step.target.trim()) {
        throw new Error(`Step [${stepIndex}] (SELECT_OPTION): Selector target is required`);
      }
      if (step.value === undefined || step.value === null) {
        throw new Error(`Step [${stepIndex}] (SELECT_OPTION): Option value is required`);
      }
      break;
    }
  }

  return true;
}
