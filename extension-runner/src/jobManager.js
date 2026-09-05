import http from 'http';
import { BrowserManager } from './browserManager.js';
import { ExtensionLoader } from './extensionLoader.js';
import { BrowserStepExecutor } from './browserStepExecutor.js';
import { validateRunId } from './artifactStore.js';
import { logger } from './logger.js';
import { config } from './config.js';

export class JobManager {
  constructor() {
    this.jobs = new Map();
    this.activeRunId = null;
  }

  /**
   * Validate and queue a new test run job
   */
  createJob(runId, testCases = []) {
    if (!runId) {
      throw new Error('runId is required');
    }
    validateRunId(String(runId));

    if (!Array.isArray(testCases) || testCases.length === 0) {
      // Default to the 3 standard browser smoke tests if not explicitly supplied
      testCases = [
        { type: 'POPUP_SMOKE', name: 'Extension popup smoke test' },
        { type: 'CONTENT_SCRIPT_SMOKE', name: 'Content script smoke test' },
        { type: 'STORAGE_SMOKE', name: 'Storage smoke test' }
      ];
    }

    const job = {
      runId,
      status: 'QUEUED',
      startedAt: null,
      completedAt: null,
      durationMs: 0,
      totalTests: testCases.length,
      passedTests: 0,
      failedTests: 0,
      errorTests: 0,
      testCases,
      results: [],
      logs: [],
      cancellationRequested: false,
      browserManager: null,
    };

    this.jobs.set(String(runId), job);
    this.logJob(job, 'RUNNER_JOB_CREATED', `Job queued for run ID: ${runId} with ${testCases.length} tests`);

    return job;
  }

  getJob(runId) {
    const job = this.jobs.get(String(runId));
    if (!job) return null;

    // Return sanitized DTO excluding internal references
    return {
      runId: job.runId,
      status: job.status,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      durationMs: job.durationMs,
      totalTests: job.totalTests,
      passedTests: job.passedTests,
      failedTests: job.failedTests,
      errorTests: job.errorTests,
      results: job.results,
      logs: job.logs,
    };
  }

  cancelJob(runId) {
    const job = this.jobs.get(String(runId));
    if (!job) {
      return null;
    }

    job.cancellationRequested = true;
    if (job.status === 'QUEUED' || job.status === 'RUNNING') {
      job.status = 'CANCELLED';
      job.completedAt = new Date().toISOString();
      if (job.startedAt) {
        job.durationMs = Date.now() - new Date(job.startedAt).getTime();
      }
      this.logJob(job, 'RUNNER_JOB_CANCELLED', `Job ID: ${runId} was cancelled`);

      if (job.browserManager) {
        job.browserManager.close().catch(() => {});
      }
    }

    return this.getJob(runId);
  }

  logJob(job, event, message) {
    const logLine = `[${new Date().toISOString()}] [${event}] ${message}`;
    job.logs.push(logLine);
    logger.info(event, message);
  }

  /**
   * Execute job asynchronously via Playwright
   */
  async executeJob(runId) {
    const job = this.jobs.get(String(runId));
    if (!job) return;

    // Terminal states are immutable
    if (['PASSED', 'FAILED', 'ERROR', 'CANCELLED'].includes(job.status)) {
      return;
    }

    if (job.cancellationRequested || job.status === 'CANCELLED') {
      job.status = 'CANCELLED';
      return;
    }

    // Ensure strictly one active browser execution runs at a time
    if (this.activeRunId && this.activeRunId !== String(runId)) {
      this.logJob(job, 'RUNNER_JOB_QUEUED', `Job ${runId} queued behind active run ${this.activeRunId}`);
      return;
    }

    this.activeRunId = String(runId);
    job.status = 'RUNNING';
    job.startedAt = new Date().toISOString();
    const startTime = Date.now();
    this.logJob(job, 'RUNNER_JOB_STARTED', `Executing browser run ID: ${runId}`);

    let localServer = null;
    let browserManager = null;
    let context = null;

    try {
      // 1. Start local deterministic HTTP test server on an ephemeral port
      localServer = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html>
<html>
  <head><title>Local Test Target</title></head>
  <body>
    <h1>Browser Test Target</h1>
    <p id="target">Active DOM context</p>
  </body>
</html>`);
      });

      await new Promise((resolve, reject) => {
        localServer.listen(0, '127.0.0.1', resolve);
        localServer.on('error', reject);
      });
      const testPort = localServer.address().port;

      // 2. Validate Extension
      const loader = new ExtensionLoader(config.extensionPath);
      loader.validate();
      this.logJob(job, 'EXTENSION_LOADED', `Validated manifest for ${loader.manifest?.name || 'Extension'}`);

      if (job.cancellationRequested) {
        job.status = 'CANCELLED';
        return;
      }

      // 3. Launch Chromium with persistent context
      browserManager = new BrowserManager({
        extensionPath: config.extensionPath,
        headless: config.headless,
      });
      job.browserManager = browserManager;
      context = await browserManager.launch();
      this.logJob(job, 'BROWSER_STARTED', 'Chromium launched with persistent context');

      // 4. Discover Extension ID
      const extensionId = await loader.discoverExtensionId(context);
      const popupUrl = loader.getPopupUrl();
      this.logJob(job, 'EXTENSION_ID_DISCOVERED', `Extension ID: ${extensionId}, popup: ${popupUrl}`);

      // 5. Execute each requested test case
      for (const tc of job.testCases) {
        if (job.cancellationRequested) {
          job.status = 'CANCELLED';
          this.logJob(job, 'TEST_ABORTED', `Test '${tc.name}' aborted due to cancellation`);
          break;
        }

        const tcStart = Date.now();
        this.logJob(job, 'TEST_STARTED', `Running test: '${tc.name}' (${tc.type})`);

        try {
          if (tc.type === 'POPUP_SMOKE') {
            const popupPage = await context.newPage();
            try {
              await popupPage.goto(loader.getPopupUrl(), { waitUntil: 'load' });
              const title = await popupPage.title();
              const versionElem = await popupPage.$('#ext-version');
              const statusBadge = await popupPage.$('#ext-status-badge');

              const hasVersion = versionElem ? await versionElem.textContent() : null;
              const statusText = statusBadge ? await statusBadge.textContent() : null;

              if (title.includes('Playground') && hasVersion && statusText === 'READY') {
                const duration = Date.now() - tcStart;
                job.passedTests++;
                job.results.push({
                  name: tc.name,
                  type: tc.type,
                  status: 'PASSED',
                  durationMs: duration,
                  details: { title, version: hasVersion, status: statusText },
                });
                this.logJob(job, 'TEST_PASSED', `Popup smoke test passed (${duration}ms)`);
              } else {
                throw new Error(`Popup content mismatch: title='${title}', status='${statusText}'`);
              }
            } finally {
              await popupPage.close().catch(() => {});
            }

          } else if (tc.type === 'CONTENT_SCRIPT_SMOKE') {
            const page = await context.newPage();
            try {
              await page.goto(`http://127.0.0.1:${testPort}/`, { waitUntil: 'networkidle' });
              await page.waitForTimeout(500);

              const heading = await page.locator('h1').textContent();
              if (heading && heading.includes('Browser Test Target')) {
                const duration = Date.now() - tcStart;
                job.passedTests++;
                job.results.push({
                  name: tc.name,
                  type: tc.type,
                  status: 'PASSED',
                  durationMs: duration,
                  details: { heading, url: page.url() },
                });
                this.logJob(job, 'TEST_PASSED', `Content script test passed (${duration}ms)`);
              } else {
                throw new Error('Target page failed to render expected heading');
              }
            } finally {
              await page.close().catch(() => {});
            }

          } else if (tc.type === 'STORAGE_SMOKE') {
            const page = await context.newPage();
            try {
              await page.goto(loader.getPopupUrl(), { waitUntil: 'load' });
              const storageOutcome = await page.evaluate(async () => {
                const key = '__runner_job_test__';
                const payload = 'ok_' + Date.now();
                await new Promise(r => chrome.storage.local.set({ [key]: payload }, r));
                const read = await new Promise(r => chrome.storage.local.get(key, r));
                await new Promise(r => chrome.storage.local.remove(key, r));
                return read && read[key] === payload;
              });

              if (storageOutcome) {
                const duration = Date.now() - tcStart;
                job.passedTests++;
                job.results.push({
                  name: tc.name,
                  type: tc.type,
                  status: 'PASSED',
                  durationMs: duration,
                  details: { storageOperational: true },
                });
                this.logJob(job, 'TEST_PASSED', `Storage smoke test passed (${duration}ms)`);
              } else {
                throw new Error('Storage read/write mismatch');
              }
            } finally {
              await page.close().catch(() => {});
            }

          } else if (tc.type === 'BROWSER' || Array.isArray(tc.steps)) {
            // Declarative browser test
            if (!Array.isArray(tc.steps) || tc.steps.length === 0) {
              const duration = Date.now() - tcStart;
              job.errorTests++;
              job.results.push({
                name: tc.name || 'Declarative browser test',
                type: tc.type || 'BROWSER',
                status: 'ERROR',
                durationMs: duration,
                error: 'BROWSER test case requires a non-empty array of steps',
                stepResults: [],
              });
              this.logJob(job, 'TEST_ERROR', `Test '${tc.name || 'BROWSER'}' error: Missing or empty steps`);
              continue;
            }

            const page = await context.newPage();
            try {
              const executor = new BrowserStepExecutor(page, {
                extensionId,
                runId: String(job.runId),
                testPort,
                popupUrl,
                isCancelled: () => job.cancellationRequested || job.status === 'CANCELLED',
              });

              const stepOutcome = await executor.executeSteps(tc.steps);
              const duration = Date.now() - tcStart;

              if (job.cancellationRequested || job.status === 'CANCELLED') {
                job.status = 'CANCELLED';
                this.logJob(job, 'TEST_ABORTED', `Test '${tc.name || 'BROWSER'}' cancelled`);
                break;
              }

              if (stepOutcome.status === 'PASSED') {
                job.passedTests++;
                job.results.push({
                  name: tc.name || 'Declarative browser test',
                  type: tc.type || 'BROWSER',
                  status: 'PASSED',
                  durationMs: duration,
                  stepResults: stepOutcome.stepResults,
                  details: { totalSteps: tc.steps.length, stepResults: stepOutcome.stepResults },
                });
                this.logJob(job, 'TEST_PASSED', `Browser test '${tc.name || 'BROWSER'}' passed (${duration}ms)`);
              } else if (stepOutcome.status === 'FAILED') {
                job.failedTests++;
                job.results.push({
                  name: tc.name || 'Declarative browser test',
                  type: tc.type || 'BROWSER',
                  status: 'FAILED',
                  durationMs: duration,
                  error: stepOutcome.failedStep?.error || 'Assertion failed',
                  failedStep: stepOutcome.failedStep,
                  stepResults: stepOutcome.stepResults,
                  details: { totalSteps: tc.steps.length, failedStep: stepOutcome.failedStep, stepResults: stepOutcome.stepResults },
                });
                this.logJob(job, 'TEST_FAILED', `Browser test '${tc.name || 'BROWSER'}' failed: ${stepOutcome.failedStep?.error}`);
              } else if (stepOutcome.status === 'CANCELLED') {
                job.status = 'CANCELLED';
                this.logJob(job, 'TEST_ABORTED', `Browser test '${tc.name || 'BROWSER'}' cancelled`);
                break;
              } else {
                // ERROR
                job.errorTests++;
                job.results.push({
                  name: tc.name || 'Declarative browser test',
                  type: tc.type || 'BROWSER',
                  status: 'ERROR',
                  durationMs: duration,
                  error: stepOutcome.failedStep?.error || 'Step execution error',
                  failedStep: stepOutcome.failedStep,
                  stepResults: stepOutcome.stepResults,
                  details: { totalSteps: tc.steps.length, failedStep: stepOutcome.failedStep, stepResults: stepOutcome.stepResults },
                });
                this.logJob(job, 'TEST_ERROR', `Browser test '${tc.name || 'BROWSER'}' error: ${stepOutcome.failedStep?.error}`);
              }
            } finally {
              await page.close().catch(() => {});
            }

          } else {
            // Unsupported or custom test type
            const duration = Date.now() - tcStart;
            job.errorTests++;
            job.results.push({
              name: tc.name,
              type: tc.type,
              status: 'ERROR',
              durationMs: duration,
              error: `Unsupported browser test type: ${tc.type}`,
            });
            this.logJob(job, 'TEST_ERROR', `Unsupported test type: ${tc.type}`);
          }

        } catch (err) {
          const duration = Date.now() - tcStart;
          job.failedTests++;
          job.results.push({
            name: tc.name,
            type: tc.type,
            status: 'FAILED',
            durationMs: duration,
            error: err.message,
          });
          this.logJob(job, 'TEST_FAILED', `Test '${tc.name}' failed: ${err.message}`);
        }
      }

    } catch (err) {
      if (job.cancellationRequested || job.status === 'CANCELLED') {
        job.status = 'CANCELLED';
      } else {
        job.errorTests = Math.max(1, job.totalTests - job.passedTests - job.failedTests);
        this.logJob(job, 'RUNNER_JOB_ERROR', `Fatal execution error: ${err.message}`);
      }
    } finally {
      if (browserManager) {
        await browserManager.close().catch(() => {});
        this.logJob(job, 'BROWSER_CLOSED', 'Chromium context closed');
      }
      if (localServer) {
        localServer.close();
      }

      job.completedAt = new Date().toISOString();
      job.durationMs = Date.now() - startTime;

      if (job.cancellationRequested || job.status === 'CANCELLED') {
        job.status = 'CANCELLED';
      } else {
        if (job.errorTests > 0) {
          job.status = 'ERROR';
        } else if (job.failedTests > 0) {
          job.status = 'FAILED';
        } else {
          job.status = 'PASSED';
        }
      }

      this.logJob(job, 'RUNNER_JOB_COMPLETED', `Run ID: ${runId} finalized with status: ${job.status} in ${job.durationMs}ms`);

      this.activeRunId = null;
      for (const [id, nextJob] of this.jobs.entries()) {
        if (nextJob.status === 'QUEUED' && !nextJob.cancellationRequested) {
          setImmediate(() => this.executeJob(id));
          break;
        }
      }
    }
  }
}
