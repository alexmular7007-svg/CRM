import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JobManager } from '../src/jobManager.js';
import { startServer, stopServer } from '../src/server.js';
import { config } from '../src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_BASE = path.resolve(path.dirname(__dirname), 'artifacts');

const testPort = 9093;
const baseUrl = `http://127.0.0.1:${testPort}`;

test.describe.serial('JobManager BrowserStepExecutor Lifecycle Integration', () => {

  test.beforeEach(() => {
    test.setTimeout(90000);
  });

  test.afterAll(() => {
    // Clean up any test artifact directories
    const testDirs = [
      'step5-run-pass',
      'step5-run-fail',
      'step5-run-error',
      'step5-run-stop',
      'step5-run-screenshot',
      'step5-run-cancel',
      'step5-http-browser-run'
    ];
    for (const d of testDirs) {
      const fullPath = path.join(ARTIFACTS_BASE, d);
      if (fs.existsSync(fullPath)) {
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } catch {}
      }
    }
  });

  test('1. BROWSER job enters QUEUED state upon creation', () => {
    const jm = new JobManager();
    const runId = 'step5-queue-test';
    const job = jm.createJob(runId, [
      {
        type: 'BROWSER',
        name: 'Declarative Test 1',
        steps: [
          { order: 0, action: 'WAIT', duration: 100 }
        ]
      }
    ]);

    expect(job.status).toBe('QUEUED');
    expect(job.runId).toBe(runId);
    expect(job.totalTests).toBe(1);
    expect(job.passedTests).toBe(0);
    expect(job.results).toEqual([]);
  });

  test('2. BROWSER job transitions to RUNNING during execution', async () => {
    const jm = new JobManager();
    const runId = 'step5-running-test';
    const job = jm.createJob(runId, [
      {
        type: 'BROWSER',
        name: 'Slow Step Test',
        steps: [
          { order: 0, action: 'WAIT', duration: 3000 }
        ]
      }
    ]);

    // Start execution asynchronously
    const execPromise = jm.executeJob(runId);

    // Poll until it transitions to RUNNING
    let observedRunning = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 100));
      if (job.status === 'RUNNING') {
        observedRunning = true;
        break;
      }
    }

    expect(observedRunning).toBe(true);
    expect(job.startedAt).not.toBeNull();

    // Cancel to speed up test conclusion
    jm.cancelJob(runId);
    await execPromise;
  });

  test('3. Valid browser steps execute and job becomes PASSED', async () => {
    const jm = new JobManager();
    const runId = 'step5-run-pass';
    jm.createJob(runId, [
      {
        type: 'BROWSER',
        name: 'Popup Validation',
        steps: [
          { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
          { order: 1, action: 'ASSERT_VISIBLE', target: '#ext-status-badge' },
          { order: 2, action: 'ASSERT_TEXT', target: '#ext-status-badge', value: 'READY' },
        ]
      }
    ]);

    await jm.executeJob(runId);
    const job = jm.getJob(runId);

    expect(job.status).toBe('PASSED');
    expect(job.passedTests).toBe(1);
    expect(job.failedTests).toBe(0);
    expect(job.errorTests).toBe(0);
    expect(job.results.length).toBe(1);
    expect(job.results[0].status).toBe('PASSED');
    expect(job.results[0].stepResults.length).toBe(3);
    expect(job.results[0].stepResults[0].status).toBe('PASSED');
    expect(job.results[0].stepResults[1].status).toBe('PASSED');
    expect(job.results[0].stepResults[2].status).toBe('PASSED');
  });

  test('4. Assertion failure becomes FAILED with expected vs actual', async () => {
    const jm = new JobManager();
    const runId = 'step5-run-fail';
    jm.createJob(runId, [
      {
        type: 'BROWSER',
        name: 'Failing Assertion Test',
        steps: [
          { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
          { order: 1, action: 'ASSERT_TEXT', target: '#ext-status-badge', value: 'MISMATCH_EXPECTED' },
        ]
      }
    ]);

    await jm.executeJob(runId);
    const job = jm.getJob(runId);

    expect(job.status).toBe('FAILED');
    expect(job.passedTests).toBe(0);
    expect(job.failedTests).toBe(1);
    expect(job.results[0].status).toBe('FAILED');
    expect(job.results[0].error).toContain('MISMATCH_EXPECTED');
    expect(job.results[0].failedStep.expected).toBe('MISMATCH_EXPECTED');
    expect(job.results[0].failedStep.actual).toBe('READY');
  });

  test('5. Unexpected step configuration / invalid step becomes ERROR', async () => {
    const jm = new JobManager();
    const runId = 'step5-run-error';
    jm.createJob(runId, [
      {
        type: 'BROWSER',
        name: 'Invalid Step Test',
        steps: [
          { order: 0, action: 'UNRECOGNIZED_ACTION_XYZ', target: '#btn' }
        ]
      }
    ]);

    await jm.executeJob(runId);
    const job = jm.getJob(runId);

    expect(job.status).toBe('ERROR');
    expect(job.errorTests).toBe(1);
    expect(job.results[0].status).toBe('ERROR');
    expect(job.results[0].error).toMatch(/unsupported|missing/i);
  });

  test('6. Empty steps array produces controlled ERROR without crashing runner', async () => {
    const jm = new JobManager();
    const runId = 'step5-run-empty-steps';
    jm.createJob(runId, [
      {
        type: 'BROWSER',
        name: 'Empty Steps Test',
        steps: []
      }
    ]);

    await jm.executeJob(runId);
    const job = jm.getJob(runId);

    expect(job.status).toBe('ERROR');
    expect(job.errorTests).toBe(1);
    expect(job.results[0].status).toBe('ERROR');
    expect(job.results[0].error).toContain('non-empty array of steps');
  });

  test('7. Execution stops after failed step (fail-fast within test case)', async () => {
    const jm = new JobManager();
    const runId = 'step5-run-stop';
    jm.createJob(runId, [
      {
        type: 'BROWSER',
        name: 'Stop on Failure Test',
        steps: [
          { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
          { order: 1, action: 'ASSERT_TEXT', target: '#ext-status-badge', value: 'INCORRECT' },
          { order: 2, action: 'CLICK', target: '#btn-check-crm' }, // Must NOT execute
        ]
      }
    ]);

    await jm.executeJob(runId);
    const job = jm.getJob(runId);

    expect(job.status).toBe('FAILED');
    expect(job.results[0].stepResults.length).toBe(2);
    expect(job.results[0].stepResults[0].status).toBe('PASSED');
    expect(job.results[0].stepResults[1].status).toBe('FAILED');
  });

  test('8. SCREENSHOT step writes to artifacts/<runId>/ and returns artifact info', async () => {
    const jm = new JobManager();
    const runId = 'step5-run-screenshot';
    jm.createJob(runId, [
      {
        type: 'BROWSER',
        name: 'Screenshot Capture Test',
        steps: [
          { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
          { order: 1, action: 'SCREENSHOT', filename: 'popup_shot' }
        ]
      }
    ]);

    await jm.executeJob(runId);
    const job = jm.getJob(runId);

    expect(job.status).toBe('PASSED');
    const shotStep = job.results[0].stepResults[1];
    expect(shotStep.status).toBe('PASSED');
    expect(shotStep.action).toBe('SCREENSHOT');
    expect(shotStep.artifactPath).toContain(`artifacts/${runId}/`);
    expect(shotStep.artifactUrl).toContain(`/api/artifacts/${runId}/`);

    // Verify the file exists on disk
    expect(fs.existsSync(shotStep.actual)).toBe(true);

    // Clean up
    try {
      fs.unlinkSync(shotStep.actual);
      fs.rmSync(path.join(ARTIFACTS_BASE, runId), { recursive: true, force: true });
    } catch {}
  });

  test('9. Result contract contains all required step breakdown fields', async () => {
    const jm = new JobManager();
    const runId = 'step5-run-fields';
    jm.createJob(runId, [
      {
        type: 'BROWSER',
        name: 'Contract Fields Test',
        steps: [
          { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
        ]
      }
    ]);

    await jm.executeJob(runId);
    const job = jm.getJob(runId);

    const step0 = job.results[0].stepResults[0];
    expect(step0).toHaveProperty('order');
    expect(step0).toHaveProperty('action');
    expect(step0).toHaveProperty('status');
    expect(step0).toHaveProperty('durationMs');
    expect(step0).toHaveProperty('expected');
    expect(step0).toHaveProperty('actual');
    expect(step0).toHaveProperty('target');
    expect(step0).toHaveProperty('message');
  });

  test('10. Cancellation produces CANCELLED and does not later become PASSED', async () => {
    const jm = new JobManager();
    const runId = 'step5-run-cancel';
    jm.createJob(runId, [
      {
        type: 'BROWSER',
        name: 'Slow Cancellation Test',
        steps: [
          { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
          { order: 1, action: 'WAIT', duration: 4000 },
          { order: 2, action: 'ASSERT_VISIBLE', target: '#ext-status-badge' },
        ]
      }
    ]);

    // Launch execution in background
    const execPromise = jm.executeJob(runId);

    // Wait 500ms then cancel
    await new Promise(r => setTimeout(r, 500));
    jm.cancelJob(runId);

    // Wait for promise to resolve
    await execPromise;

    // Check state immediately
    const job = jm.getJob(runId);
    expect(job.status).toBe('CANCELLED');

    // Wait an additional 500ms to ensure no async callback overrides it
    await new Promise(r => setTimeout(r, 500));
    const jobAfter = jm.getJob(runId);
    expect(jobAfter.status).toBe('CANCELLED');
  });

  test('11. Browser resources are cleaned up cleanly on completion', async () => {
    const jm = new JobManager();
    const runId = 'step5-run-cleanup';
    jm.createJob(runId, [
      {
        type: 'BROWSER',
        name: 'Resource Cleanup Test',
        steps: [
          { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
        ]
      }
    ]);

    await jm.executeJob(runId);
    const internalJob = jm.jobs.get(runId);
    // Context should be null after browserManager.close()
    expect(internalJob.browserManager?.context).toBeNull();
  });

  test('12. Existing smoke-test jobs still work with standard lifecycle', async () => {
    const jm = new JobManager();
    const runId = 'step5-smoke-compat';
    jm.createJob(runId, [
      { type: 'POPUP_SMOKE', name: 'Popup Smoke' }
    ]);

    await jm.executeJob(runId);
    const job = jm.getJob(runId);

    expect(job.status).toBe('PASSED');
    expect(job.passedTests).toBe(1);
    expect(job.results[0].type).toBe('POPUP_SMOKE');
    expect(job.results[0].status).toBe('PASSED');
  });

  test('13. HTTP API: POST /api/test-runs with BROWSER steps queues and executes to PASSED', async () => {
    await startServer(testPort, '127.0.0.1');

    try {
      const runId = 'step5-http-browser-run';
      const postRes = await fetch(`${baseUrl}/api/test-runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          testCases: [
            {
              type: 'BROWSER',
              name: 'HTTP Declarative Run',
              steps: [
                { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
                { order: 1, action: 'ASSERT_VISIBLE', target: '#ext-status-badge' },
                { order: 2, action: 'SCREENSHOT', filename: 'http_run_shot' }
              ]
            }
          ]
        })
      });

      expect(postRes.status).toBe(202);
      const postData = await postRes.json();
      expect(postData.status).toBe('QUEUED');
      expect(postData.runId).toBe(runId);

      // Poll until terminal state
      let finalJob = null;
      for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const getRes = await fetch(`${baseUrl}/api/test-runs/${runId}`);
        expect(getRes.status).toBe(200);
        const jobData = await getRes.json();
        if (['PASSED', 'FAILED', 'ERROR', 'CANCELLED'].includes(jobData.status)) {
          finalJob = jobData;
          break;
        }
      }

      expect(finalJob).not.toBeNull();
      expect(finalJob.status).toBe('PASSED');
      expect(finalJob.passedTests).toBe(1);
      expect(finalJob.results[0].stepResults.length).toBe(3);

      // Retrieve screenshot via artifact endpoint
      const shotStep = finalJob.results[0].stepResults[2];
      const filename = shotStep.expected;
      const artifactRes = await fetch(`${baseUrl}/api/artifacts/${runId}/${filename}`);
      expect(artifactRes.status).toBe(200);
      expect(artifactRes.headers.get('content-type')).toBe('image/png');

      // Cleanup
      const shotFile = shotStep.actual;
      try {
        if (fs.existsSync(shotFile)) fs.unlinkSync(shotFile);
        fs.rmSync(path.join(ARTIFACTS_BASE, runId), { recursive: true, force: true });
      } catch {}

    } finally {
      await stopServer();
    }
  });

  test('14. HTTP API: POST /api/test-runs rejects invalid runId (path traversal)', async () => {
    await startServer(testPort, '127.0.0.1');

    try {
      const postRes = await fetch(`${baseUrl}/api/test-runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: '../traversal-job',
          testCases: [{ type: 'BROWSER', name: 'Bad', steps: [] }]
        })
      });

      expect(postRes.status).toBe(400);
      const data = await postRes.json();
      expect(data.error).toMatch(/invalid runId|traversal/i);
    } finally {
      await stopServer();
    }
  });

});
