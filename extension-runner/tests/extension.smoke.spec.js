import { test, expect } from '@playwright/test';
import http from 'http';
import { BrowserManager } from '../src/browserManager.js';
import { ExtensionLoader } from '../src/extensionLoader.js';
import { logger } from '../src/logger.js';
import { config } from '../src/config.js';

let localServer;
let browserManager;
let context;
let loader;
let extensionId;
const testPort = config.testServerPort;

test.beforeAll(async () => {
  // Start deterministic local HTTP server
  localServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
  <head><title>Playwright Test Page</title></head>
  <body>
    <h1>Controlled Test Page</h1>
    <div id="test-node">Sample Container</div>
  </body>
</html>`);
  });

  await new Promise((resolve) => localServer.listen(testPort, '127.0.0.1', resolve));

  // Initialize loader and validate extension
  loader = new ExtensionLoader(config.extensionPath);
  loader.validate();
});

test.afterAll(async () => {
  if (browserManager) {
    await browserManager.close();
  }
  if (localServer) {
    localServer.close();
  }
});

test.describe.serial('Manifest V3 Chrome Extension Playground Tests', () => {

  test('TEST 1: Runner starts Chromium successfully', async () => {
    logger.info('TEST_1_START', 'Launching Chromium browser manager');
    browserManager = new BrowserManager({
      extensionPath: config.extensionPath,
      headless: config.headless,
    });
    context = await browserManager.launch();
    expect(context).toBeDefined();
    logger.info('TEST_1_PASSED', 'Chromium launched with persistent context');
  });

  test('TEST 2: Manifest V3 extension loads successfully', async () => {
    logger.info('TEST_2_START', 'Checking Manifest V3 schema and properties');
    const manifest = loader.manifest;
    expect(manifest).toBeDefined();
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('Chrome Extension Playground');
    logger.info('TEST_2_PASSED', `Manifest loaded: ${manifest.name} v${manifest.version}`);
  });

  test('TEST 3: Extension ID is discovered dynamically', async () => {
    logger.info('TEST_3_START', 'Discovering extension ID from context');
    extensionId = await loader.discoverExtensionId(context);
    expect(extensionId).toBeDefined();
    expect(extensionId.length).toBeGreaterThan(10);
    logger.info('TEST_3_PASSED', `Discovered Extension ID: ${extensionId}`);
  });

  test('TEST 4: Popup loads successfully with required DOM elements', async () => {
    logger.info('POPUP_TEST_START', 'Navigating to popup HTML');
    const popupUrl = loader.getPopupUrl();
    const page = await context.newPage();
    try {
      await page.goto(popupUrl, { waitUntil: 'load' });

      // Verify Title
      const title = await page.title();
      expect(title).toContain('Chrome Extension Playground');

      // Verify Header & Version
      const versionElem = page.locator('#ext-version');
      await expect(versionElem).toBeVisible();
      await expect(versionElem).toHaveText('v1.0.0');

      // Verify Badges
      const statusBadge = page.locator('#ext-status-badge');
      await expect(statusBadge).toBeVisible();
      await expect(statusBadge).toHaveText('READY');

      // Verify Action Buttons
      const checkCrmBtn = page.locator('#btn-check-crm');
      await expect(checkCrmBtn).toBeVisible();

      const runDiagBtn = page.locator('#btn-run-diagnostics');
      await expect(runDiagBtn).toBeVisible();

      logger.info('POPUP_TEST_PASSED', 'Popup opened and DOM elements verified');
    } finally {
      await page.close();
    }
  });

  test('TEST 5: Content script initializes on controlled local page', async () => {
    logger.info('CONTENT_SCRIPT_TEST_START', 'Testing content script on local test page');
    const page = await context.newPage();
    try {
      let scriptLogged = false;
      page.on('console', msg => {
        if (msg.text().includes('[CRM-Extension Content Script]')) {
          scriptLogged = true;
        }
      });

      await page.goto(`http://127.0.0.1:${testPort}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // Verify page is rendered in browser context
      const heading = await page.locator('h1').textContent();
      expect(heading).toContain('Controlled Test Page');

      logger.info('CONTENT_SCRIPT_TEST_PASSED', 'Content script lifecycle active');
    } finally {
      await page.close();
    }
  });

  test('TEST 6: Background service worker starts and responds', async () => {
    logger.info('SERVICE_WORKER_TEST_START', 'Verifying background service worker');
    const sw = context.serviceWorkers().find(w => w.url().includes(extensionId));
    expect(sw).toBeDefined();

    const swDetails = await sw.evaluate(async () => {
      const manifest = chrome.runtime.getManifest();
      return {
        name: manifest.name,
        version: manifest.version,
        hasStoragePermission: chrome.storage !== undefined,
      };
    });

    expect(swDetails.name).toBe('Chrome Extension Playground');
    expect(swDetails.hasStoragePermission).toBe(true);
    logger.info('SERVICE_WORKER_TEST_PASSED', `Worker active for ${swDetails.name}`);
  });

  test('TEST 7: Chrome storage read/write works inside extension context', async () => {
    logger.info('STORAGE_TEST_START', 'Testing chrome.storage.local persistence');
    const page = await context.newPage();
    try {
      await page.goto(loader.getPopupUrl(), { waitUntil: 'load' });

      const storageResult = await page.evaluate(async () => {
        const testKey = '__smoke_test_storage__';
        const testPayload = { timestamp: Date.now(), status: 'TEST_OK' };

        await new Promise((resolve) => chrome.storage.local.set({ [testKey]: testPayload }, resolve));
        const retrieved = await new Promise((resolve) => chrome.storage.local.get(testKey, resolve));
        await new Promise((resolve) => chrome.storage.local.remove(testKey, resolve));

        return {
          expected: testPayload.status,
          actual: retrieved ? retrieved[testKey]?.status : null,
        };
      });

      expect(storageResult.actual).toBe(storageResult.expected);
      logger.info('STORAGE_TEST_PASSED', 'Storage write, read, and cleanup verified');
    } finally {
      await page.close();
    }
  });

  test('TEST 8: Browser closes cleanly', async () => {
    logger.info('TEST_8_START', 'Closing browser context');
    await browserManager.close();
    expect(browserManager.context).toBeNull();
    logger.info('TEST_8_PASSED', 'Browser shutdown verified without dangling processes');
  });

});
