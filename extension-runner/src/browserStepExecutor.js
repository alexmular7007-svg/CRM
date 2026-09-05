import fs from 'fs';
import path from 'path';
import os from 'os';
import { validateStep } from './browser/stepValidators.js';
import { validateRunId, validateFilename } from './artifactStore.js';
import { logger } from './logger.js';
import { config } from './config.js';

export function validateUrlForSsrf(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    throw new Error('SSRF validation failed: URL is empty or invalid');
  }

  const trimmed = urlStr.trim();

  // Allow extension internal URLs
  if (trimmed.startsWith('chrome-extension://')) {
    return true;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch (err) {
    throw new Error(`SSRF validation failed: Invalid URL syntax '${trimmed}'`);
  }

  const protocol = parsedUrl.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`SSRF validation failed: Protocol '${protocol}' is not permitted`);
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Cloud Metadata protection
  if (
    hostname === '169.254.169.254' ||
    hostname.includes('metadata.google.internal') ||
    hostname.includes('metadata') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    const err = new Error(`SSRF validation blocked: Access to metadata destination '${hostname}' is prohibited`);
    err.isAssertion = true;
    throw err;
  }

  // Localhost / Loopback allowed for local CRM test environment
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }

  // RFC 1918 Private IP checks
  const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const [, p1, p2] = ipMatch.map(Number);
    if (
      p1 === 10 ||
      (p1 === 172 && p2 >= 16 && p2 <= 31) ||
      (p1 === 192 && p2 === 168) ||
      (p1 === 169 && p2 === 254) ||
      p1 === 0
    ) {
      const err = new Error(`SSRF validation blocked: Access to private IP address '${hostname}' is prohibited`);
      err.isAssertion = true;
      throw err;
    }
  }

  return true;
}

export class BrowserStepExecutor {
  constructor(pageOrContext, options = {}) {
    if (!pageOrContext) {
      throw new Error('BrowserStepExecutor requires a Playwright Page or Context');
    }

    if (typeof pageOrContext.newPage === 'function') {
      this.context = pageOrContext;
      this.page = null;
    } else {
      this.page = pageOrContext;
      this.context = pageOrContext.context ? pageOrContext.context() : null;
      if (this.page && typeof this.page.on === 'function') {
        this.page.on('dialog', async dialog => {
          try { await dialog.accept(); } catch (_) {}
        });
      }
    }

    if (typeof options === 'string') {
      this.extensionId = options;
      this.options = { extensionId: options };
    } else {
      this.options = options || {};
      this.extensionId = options.extensionId || '';
    }
    this.runId = (typeof options === 'object' && options !== null) ? (options.runId || null) : null;
    this.isCancelled = (typeof options === 'object' && typeof options.isCancelled === 'function')
      ? options.isCancelled
      : () => false;
  }

  /**
   * Resolve template placeholders: <extension-id>, {extensionId}, <test-port>, {testPort}
   */
  resolveTemplates(str) {
    if (!str || typeof str !== 'string') return str;
    let res = str
      .replace(/<extension-id>/g, this.extensionId)
      .replace(/\{extensionId\}/g, this.extensionId);
    if (this.options?.popupUrl) {
      res = res
        .replace(/<popup-url>/g, this.options.popupUrl)
        .replace(/<popupUrl>/g, this.options.popupUrl)
        .replace(/\{popupUrl\}/g, this.options.popupUrl);
    }
    if (this.options?.testPort) {
      res = res
        .replace(/<test-port>/g, String(this.options.testPort))
        .replace(/<testPort>/g, String(this.options.testPort))
        .replace(/\{testPort\}/g, String(this.options.testPort));
    }
    return res;
  }

  async getActivePage() {
    if (this.page && !this.page.isClosed()) {
      return this.page;
    }
    if (this.context) {
      this.page = await this.context.newPage();
      if (this.page && typeof this.page.on === 'function') {
        this.page.on('dialog', async dialog => {
          try { await dialog.accept(); } catch (_) {}
        });
      }
      return this.page;
    }
    throw new Error('No active page or context available for execution');
  }

  /**
   * Execute an array of steps sequentially on the page
   */
  async executeSteps(steps = []) {
    const stepResults = [];
    const page = await this.getActivePage();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepOrder = step.order !== undefined ? step.order : i;
      const action = step.action ? String(step.action).trim().toUpperCase() : '';

      if (this.isCancelled()) {
        const cancelResult = {
          order: stepOrder,
          action: action || 'UNKNOWN',
          status: 'CANCELLED',
          durationMs: 0,
          message: 'Execution aborted due to cancellation',
        };
        stepResults.push(cancelResult);
        return {
          status: 'CANCELLED',
          stepResults,
          failedStep: cancelResult,
        };
      }

      // 1. Validation before execution
      try {
        validateStep(step, stepOrder);
      } catch (validationErr) {
        const errorResult = {
          order: stepOrder,
          action: step.action || 'UNKNOWN',
          status: 'ERROR',
          durationMs: 0,
          expected: undefined,
          actual: undefined,
          error: validationErr.message,
          message: 'Step validation failed',
        };
        stepResults.push(errorResult);
        logger.error('STEP_VALIDATION_ERROR', `[Step ${stepOrder}] ${validationErr.message}`);

        return {
          status: 'ERROR',
          stepResults,
          failedStep: errorResult,
        };
      }

      const stepStart = Date.now();
      const resolvedTarget = this.resolveTemplates(step.target);
      const resolvedValue = this.resolveTemplates(step.value ?? step.expected);

      logger.info('STEP_EXECUTION_START', `[Step ${stepOrder}] ${action} target='${resolvedTarget || ''}'`);

      try {
        let stepMessage = 'Step executed successfully';
        let expectedVal = step.value ?? step.expected;
        let actualVal = undefined;

        switch (action) {
          case 'OPEN_PAGE': {
            const url = resolvedTarget || resolvedValue;
            validateUrlForSsrf(url);
            expectedVal = url;
            await page.goto(url, { waitUntil: 'load', timeout: 15000 });
            actualVal = page.url();
            stepMessage = `Navigated to ${actualVal}`;
            break;
          }

          case 'CLICK': {
            await page.waitForSelector(resolvedTarget, { state: 'visible', timeout: 5000 });
            await page.click(resolvedTarget, { timeout: 5000 });
            stepMessage = `Clicked element '${resolvedTarget}'`;
            actualVal = 'clicked';
            break;
          }

          case 'TYPE': {
            await page.waitForSelector(resolvedTarget, { state: 'visible', timeout: 5000 });
            await page.fill(resolvedTarget, String(resolvedValue), { timeout: 5000 });
            stepMessage = `Filled element '${resolvedTarget}' with text`;
            expectedVal = resolvedValue;
            actualVal = String(resolvedValue);
            break;
          }

          case 'WAIT': {
            const duration = parseInt(step.duration ?? resolvedValue ?? resolvedTarget, 10);
            if (duration < 0 || duration > 10000 || isNaN(duration)) {
              throw new Error(`Invalid WAIT duration: ${duration}`);
            }
            await page.waitForTimeout(duration);
            stepMessage = `Waited ${duration}ms`;
            expectedVal = duration;
            actualVal = duration;
            break;
          }

          case 'ASSERT_VISIBLE': {
            expectedVal = 'visible';
            try {
              await page.waitForSelector(resolvedTarget, { state: 'visible', timeout: 5000 });
              actualVal = 'visible';
              stepMessage = `Element '${resolvedTarget}' is visible`;
            } catch (selErr) {
              const err = new Error(`Assertion failed: Element '${resolvedTarget}' is not visible`);
              err.expected = 'visible';
              err.actual = 'not visible / timed out';
              err.isAssertion = true;
              throw err;
            }
            break;
          }

          case 'ASSERT_TEXT': {
            try {
              await page.waitForSelector(resolvedTarget, { timeout: 5000 });
            } catch (selErr) {
              const err = new Error(`Assertion failed: Target element '${resolvedTarget}' not found`);
              err.expected = String(resolvedValue).trim();
              err.actual = 'element not found';
              err.isAssertion = true;
              throw err;
            }

            const rawText = (await page.textContent(resolvedTarget)) || '';
            const actualText = rawText.trim();
            const expectedText = String(resolvedValue).trim();
            expectedVal = expectedText;
            actualVal = actualText;

            if (!actualText.includes(expectedText)) {
              const err = new Error(`Assertion failed: Expected text '${expectedText}', but received '${actualText}'`);
              err.expected = expectedText;
              err.actual = actualText;
              err.isAssertion = true;
              throw err;
            }
            stepMessage = `Element text contains '${expectedText}'`;
            break;
          }

          case 'ASSERT_URL': {
            const currentUrl = page.url();
            const expectedUrl = String(resolvedValue || resolvedTarget).trim();
            expectedVal = expectedUrl;
            actualVal = currentUrl;

            if (!currentUrl.includes(expectedUrl)) {
              const err = new Error(`Assertion failed: Expected URL to match '${expectedUrl}', but actual URL was '${currentUrl}'`);
              err.expected = expectedUrl;
              err.actual = currentUrl;
              err.isAssertion = true;
              throw err;
            }
            stepMessage = `Current URL matches '${expectedUrl}'`;
            break;
          }

          case 'ASSERT_TITLE': {
            const currentTitle = await page.title();
            const expectedTitle = String(resolvedValue || resolvedTarget).trim();
            expectedVal = expectedTitle;
            actualVal = currentTitle;

            if (!currentTitle.includes(expectedTitle)) {
              const err = new Error(`Assertion failed: Expected title '${expectedTitle}', but actual title was '${currentTitle}'`);
              err.expected = expectedTitle;
              err.actual = currentTitle;
              err.isAssertion = true;
              throw err;
            }
            stepMessage = `Title matches '${expectedTitle}'`;
            break;
          }

          case 'SELECT_OPTION': {
            await page.waitForSelector(resolvedTarget, { state: 'visible', timeout: 5000 });
            await page.selectOption(resolvedTarget, String(resolvedValue), { timeout: 5000 });
            expectedVal = String(resolvedValue);
            actualVal = String(resolvedValue);
            stepMessage = `Selected option '${resolvedValue}' on '${resolvedTarget}'`;
            break;
          }

          case 'SCREENSHOT': {
            // Minimal step execution — prefer step.filename; fall back to step.value / step.target.
            const rawFilename = step.filename ?? resolvedValue ?? resolvedTarget ?? 'screenshot';
            // Allowlist sanitise: only alphanumeric, underscore, hyphen survive
            const safeBaseName = String(rawFilename).replace(/[^a-zA-Z0-9_-]/g, '_') || 'screenshot';
            const pngFilename = `${stepOrder}_${safeBaseName}_${Date.now()}.png`;

            if (this.runId) {
              // Validate runId and generated filename
              validateRunId(this.runId);
              validateFilename(pngFilename);

              // Store in artifacts/<runId>/ when a runId is provided
              const artifactsBase = path.resolve(config.artifactsDir);
              const resolvedArtifactsBase = path.resolve(artifactsBase);
              const runDir = path.join(resolvedArtifactsBase, this.runId);
              const resolvedRunDir = path.resolve(runDir);
              if (!resolvedRunDir.startsWith(resolvedArtifactsBase + path.sep)) {
                throw new Error('SCREENSHOT: Run directory escaped artifacts directory');
              }
              fs.mkdirSync(resolvedRunDir, { recursive: true });

              const candidatePath = path.join(resolvedRunDir, pngFilename);
              const resolvedPath = path.resolve(candidatePath);
              if (!resolvedPath.startsWith(resolvedRunDir + path.sep)) {
                throw new Error('SCREENSHOT: Resolved path escaped artifacts run directory');
              }
              await page.screenshot({ path: resolvedPath, fullPage: false });
              expectedVal = pngFilename;
              actualVal = resolvedPath;
              stepMessage = `Screenshot captured to artifacts: ${resolvedPath}`;
            } else {
              // Fall back to temp dir (preserves existing behavior for tests without runId)
              const tempDir = path.resolve(path.join(os.tmpdir(), 'runner-step-screenshots'));
              fs.mkdirSync(tempDir, { recursive: true });
              const candidatePath = path.join(tempDir, `${stepOrder}_${safeBaseName}_${Date.now()}.png`);
              // Defense-in-depth: confirm resolved path is still inside tempDir
              const resolvedPath = path.resolve(candidatePath);
              if (!resolvedPath.startsWith(tempDir + path.sep) && resolvedPath !== tempDir) {
                throw new Error(`SCREENSHOT: Resolved path escaped temp directory (path traversal detected)`);
              }
              await page.screenshot({ path: resolvedPath, fullPage: false });
              expectedVal = safeBaseName;
              actualVal = resolvedPath;
              stepMessage = `Screenshot captured to temporary location: ${resolvedPath}`;
            }
            break;
          }

          default: {
            throw new Error(`Unsupported action: '${action}'`);
          }
        }

        const durationMs = Date.now() - stepStart;
        let artifactInfo = {};
        if (action === 'SCREENSHOT' && this.runId) {
          artifactInfo = {
            artifactPath: `artifacts/${this.runId}/${expectedVal}`,
            artifactUrl: `/api/artifacts/${this.runId}/${expectedVal}`,
          };
        }

        const passResult = {
          order: stepOrder,
          action,
          status: 'PASSED',
          expected: expectedVal,
          actual: actualVal,
          durationMs,
          target: resolvedTarget,
          message: stepMessage,
          ...artifactInfo,
        };

        stepResults.push(passResult);
        logger.info('STEP_PASSED', `[Step ${stepOrder}] ${action} passed in ${durationMs}ms`);

      } catch (err) {
        const durationMs = Date.now() - stepStart;
        if (this.isCancelled()) {
          const cancelResult = {
            order: stepOrder,
            action,
            status: 'CANCELLED',
            durationMs,
            message: 'Execution aborted due to cancellation',
          };
          stepResults.push(cancelResult);
          return {
            status: 'CANCELLED',
            stepResults,
            failedStep: cancelResult,
          };
        }

        const isAssertionFailure = err.isAssertion || err.message.toLowerCase().includes('assertion failed');
        const status = isAssertionFailure ? 'FAILED' : 'ERROR';

        const failResult = {
          order: stepOrder,
          action,
          status,
          expected: err.expected !== undefined ? err.expected : (step.value ?? step.expected ?? step.target),
          actual: err.actual !== undefined ? err.actual : undefined,
          durationMs,
          target: resolvedTarget,
          error: err.message,
          message: `Step ${action} ${status.toLowerCase()}: ${err.message}`,
        };

        stepResults.push(failResult);
        logger.error(`STEP_${status}`, `[Step ${stepOrder}] ${action} ${status.toLowerCase()}: ${err.message}`);

        // Stop remaining steps immediately on failure
        return {
          status,
          stepResults,
          failedStep: failResult,
        };
      }
    }

    return {
      status: 'PASSED',
      stepResults,
    };
  }

  async close() {
    if (this.page && !this.page.isClosed()) {
      await this.page.close().catch(() => {});
      this.page = null;
    }
  }
}