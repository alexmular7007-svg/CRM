import { test, expect } from '@playwright/test';
import http from 'http';
import { chromium } from 'playwright';
import { BrowserStepExecutor } from '../src/browserStepExecutor.js';

let localServer;
let serverPort;
let browser;
let context;
let page;

test.beforeAll(async () => {
  // Start local deterministic HTTP fixture server
  localServer = http.createServer((req, res) => {
    if (req.url === '/dashboard') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end('<!DOCTYPE html><html><head><title>Dashboard View</title></head><body><h1>Dashboard</h1></body></html>');
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
  <head>
    <title>Step Executor Test Bed</title>
  </head>
  <body>
    <h1 id="main-heading">Playwright Browser Test Bed</h1>
    <div id="status-badge">READY</div>
    <button id="action-btn" onclick="document.getElementById('btn-result').textContent = 'clicked!';">Click Me</button>
    <span id="btn-result">idle</span>
    <input id="search-box" type="text" />
    <select id="env-select">
      <option value="DEV">Development</option>
      <option value="PROD">Production</option>
    </select>
    <div id="hidden-box" style="display: none;">Invisible</div>
  </body>
</html>`);
  });

  await new Promise((resolve) => {
    localServer.listen(0, '127.0.0.1', () => {
      serverPort = localServer.address().port;
      resolve();
    });
  });

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
  page = await context.newPage();
});

test.afterAll(async () => {
  if (page) await page.close().catch(() => {});
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (localServer) localServer.close();
});

test.describe.serial('BrowserStepExecutor Action & Rule Tests', () => {

  test('1. OPEN_PAGE navigates to target URL', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'OPEN_PAGE', target: `http://127.0.0.1:${serverPort}/` },
    ]);

    expect(result.status).toBe('PASSED');
    expect(result.stepResults[0].status).toBe('PASSED');
    expect(result.stepResults[0].actual).toContain(`127.0.0.1:${serverPort}`);
  });

  test('2. CLICK interacts with DOM button and updates state', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'CLICK', target: '#action-btn' },
    ]);

    expect(result.status).toBe('PASSED');
    const resultText = await page.textContent('#btn-result');
    expect(resultText).toBe('clicked!');
  });

  test('3. TYPE fills input selector with text', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'TYPE', target: '#search-box', value: 'playwright lead' },
    ]);

    expect(result.status).toBe('PASSED');
    const val = await page.inputValue('#search-box');
    expect(val).toBe('playwright lead');
  });

  test('4. WAIT delays execution within allowed bounds', async () => {
    const executor = new BrowserStepExecutor(page);
    const start = Date.now();
    const result = await executor.executeSteps([
      { order: 0, action: 'WAIT', duration: 150 },
    ]);

    const duration = Date.now() - start;
    expect(result.status).toBe('PASSED');
    expect(duration).toBeGreaterThanOrEqual(140);
  });

  test('5. ASSERT_VISIBLE verifies visible element', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'ASSERT_VISIBLE', target: '#status-badge' },
    ]);

    expect(result.status).toBe('PASSED');
    expect(result.stepResults[0].expected).toBe('visible');
    expect(result.stepResults[0].actual).toBe('visible');
  });

  test('6. ASSERT_TEXT verifies expected text content', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'ASSERT_TEXT', target: '#status-badge', value: 'READY' },
    ]);

    expect(result.status).toBe('PASSED');
    expect(result.stepResults[0].expected).toBe('READY');
    expect(result.stepResults[0].actual).toBe('READY');
  });

  test('7. ASSERT_URL verifies URL pattern match', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'ASSERT_URL', value: `127.0.0.1:${serverPort}` },
    ]);

    expect(result.status).toBe('PASSED');
    expect(result.stepResults[0].actual).toContain(String(serverPort));
  });

  test('8. ASSERT_TITLE verifies page title', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'ASSERT_TITLE', value: 'Step Executor Test Bed' },
    ]);

    expect(result.status).toBe('PASSED');
    expect(result.stepResults[0].actual).toBe('Step Executor Test Bed');
  });

  test('9. SCREENSHOT captures screenshot and file exists on disk (verified + cleaned up)', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'SCREENSHOT', filename: 'test_capture' },
    ]);

    expect(result.status).toBe('PASSED');
    const step0 = result.stepResults[0];
    expect(step0.status).toBe('PASSED');
    expect(step0.message).toContain('Screenshot captured');

    // Verify the file was actually written to disk
    const filePath = step0.actual;
    expect(typeof filePath).toBe('string');
    expect(filePath.endsWith('.png')).toBe(true);

    const { existsSync, unlinkSync } = await import('fs');
    expect(existsSync(filePath)).toBe(true);

    // Clean up the temporary screenshot file
    unlinkSync(filePath);
    expect(existsSync(filePath)).toBe(false);
  });

  test('10. SELECT_OPTION selects option in select element', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'SELECT_OPTION', target: '#env-select', value: 'PROD' },
    ]);

    expect(result.status).toBe('PASSED');
    const selectedVal = await page.inputValue('#env-select');
    expect(selectedVal).toBe('PROD');
  });

  test('11. Sequential execution executes steps in given order', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'WAIT', duration: 10 },
      { order: 1, action: 'TYPE', target: '#search-box', value: 'step 2' },
      { order: 2, action: 'ASSERT_VISIBLE', target: '#search-box' },
    ]);

    expect(result.status).toBe('PASSED');
    expect(result.stepResults.length).toBe(3);
    expect(result.stepResults[0].order).toBe(0);
    expect(result.stepResults[1].order).toBe(1);
    expect(result.stepResults[2].order).toBe(2);
  });

  test('12. Execution stops immediately after a failed step', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'ASSERT_TEXT', target: '#status-badge', value: 'READY' },
      { order: 1, action: 'ASSERT_TEXT', target: '#status-badge', value: 'MISMATCH_EXPECTATION' },
      { order: 2, action: 'TYPE', target: '#search-box', value: 'should not execute' },
    ]);

    expect(result.status).toBe('FAILED');
    expect(result.stepResults.length).toBe(2); // Step 2 never executed
    expect(result.stepResults[0].status).toBe('PASSED');
    expect(result.stepResults[1].status).toBe('FAILED');
    expect(result.failedStep.order).toBe(1);
  });

  test('13. Failed assertion produces FAILED status with expected vs actual', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'ASSERT_TEXT', target: '#status-badge', value: 'INACTIVE' },
    ]);

    expect(result.status).toBe('FAILED');
    expect(result.stepResults[0].status).toBe('FAILED');
    expect(result.stepResults[0].expected).toBe('INACTIVE');
    expect(result.stepResults[0].actual).toBe('READY');
  });

  test('14. Unexpected executor error produces ERROR status', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'WAIT', duration: -50 }, // Invalid negative duration
    ]);

    expect(result.status).toBe('ERROR');
    expect(result.stepResults[0].status).toBe('ERROR');
    expect(result.stepResults[0].error).toContain('WAIT');
  });

  test('15. Expected and actual are populated for URL and title assertions', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'ASSERT_TITLE', value: 'Non-Existent Title' },
    ]);

    expect(result.status).toBe('FAILED');
    expect(result.stepResults[0].expected).toBe('Non-Existent Title');
    expect(result.stepResults[0].actual).toBe('Step Executor Test Bed');
  });

  test('16. Extension ID placeholders <extension-id> and {extensionId} are resolved', async () => {
    const dummyExtId = 'abcdef1234567890';
    const executor = new BrowserStepExecutor(page, { extensionId: dummyExtId });

    const resolvedWithAngle = executor.resolveTemplates('chrome-extension://<extension-id>/popup.html');
    const resolvedWithBraces = executor.resolveTemplates('chrome-extension://{extensionId}/popup.html');

    expect(resolvedWithAngle).toBe(`chrome-extension://${dummyExtId}/popup.html`);
    expect(resolvedWithBraces).toBe(`chrome-extension://${dummyExtId}/popup.html`);
  });

  test('17. Unknown action is rejected during validation', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'ARBITRARY_CUSTOM_ACTION', target: '#btn' },
    ]);

    expect(result.status).toBe('ERROR');
    expect(result.stepResults[0].status).toBe('ERROR');
    expect(result.stepResults[0].error).toContain('Unsupported or missing action');
  });

  test('18. No arbitrary JS or eval path exists', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'EVAL', target: 'alert(1)' },
    ]);

    expect(result.status).toBe('ERROR');
    expect(result.stepResults[0].error).toContain('Unsupported');
  });

  // ── SCREENSHOT Security Tests ─────────────────────────────────────────────

  test('19. SCREENSHOT: dot-dot traversal filename is rejected before execution', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'SCREENSHOT', filename: '../secret_file' },
    ]);

    expect(result.status).toBe('ERROR');
    expect(result.stepResults[0].status).toBe('ERROR');
    expect(result.stepResults[0].error).toMatch(/traversal|path/i);
  });

  test('20. SCREENSHOT: absolute POSIX path filename is rejected', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'SCREENSHOT', filename: '/etc/shadow' },
    ]);

    expect(result.status).toBe('ERROR');
    expect(result.stepResults[0].status).toBe('ERROR');
    expect(result.stepResults[0].error).toMatch(/separator|traversal/i);
  });

  test('21. SCREENSHOT: Windows drive-rooted path filename is rejected', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'SCREENSHOT', filename: 'C:/windows/evil' },
    ]);

    expect(result.status).toBe('ERROR');
    expect(result.stepResults[0].status).toBe('ERROR');
    expect(result.stepResults[0].error).toMatch(/separator|drive|traversal/i);
  });

  test('22. SCREENSHOT: percent-encoded traversal filename is rejected', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'SCREENSHOT', filename: '%2e%2e%2fsecret' },
    ]);

    expect(result.status).toBe('ERROR');
    expect(result.stepResults[0].status).toBe('ERROR');
    expect(result.stepResults[0].error).toMatch(/encoded|traversal/i);
  });

  test('23. SCREENSHOT: valid alphanumeric filename succeeds and file is confined to temp dir', async () => {
    const executor = new BrowserStepExecutor(page);
    const result = await executor.executeSteps([
      { order: 0, action: 'SCREENSHOT', filename: 'safe_capture_final' },
    ]);

    expect(result.status).toBe('PASSED');
    const filePath = result.stepResults[0].actual;
    expect(typeof filePath).toBe('string');

    // File must be inside the OS temp dir
    const { tmpdir } = await import('os');
    expect(filePath.startsWith(tmpdir())).toBe(true);

    // File must actually exist
    const { existsSync, unlinkSync } = await import('fs');
    expect(existsSync(filePath)).toBe(true);

    // Clean up
    unlinkSync(filePath);
  });

  test('24. SCREENSHOT: with runId writes screenshot to artifacts/<runId>/ safely', async () => {
    const runId = 'exec-artifact-test-run';
    const executor = new BrowserStepExecutor(page, { runId });
    const result = await executor.executeSteps([
      { order: 0, action: 'SCREENSHOT', filename: 'exec_shot' },
    ]);

    expect(result.status).toBe('PASSED');
    const filePath = result.stepResults[0].actual;
    expect(typeof filePath).toBe('string');
    expect(filePath.endsWith('.png')).toBe(true);
    expect(filePath).toContain(runId);

    const { existsSync, unlinkSync, rmSync } = await import('fs');
    const { dirname } = await import('path');
    expect(existsSync(filePath)).toBe(true);

    // Clean up
    unlinkSync(filePath);
    const runDir = dirname(filePath);
    try {
      rmSync(runDir, { recursive: true, force: true });
    } catch {}
  });

  test('25. SCREENSHOT: with invalid runId (path traversal) fails step execution', async () => {
    const executor = new BrowserStepExecutor(page, { runId: '../traversal-run' });
    const result = await executor.executeSteps([
      { order: 0, action: 'SCREENSHOT', filename: 'bad_run' },
    ]);

    expect(result.status).toBe('ERROR');
    expect(result.stepResults[0].status).toBe('ERROR');
    expect(result.stepResults[0].error).toMatch(/traversal|separator|invalid/i);
  });

});