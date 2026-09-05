import fs from 'fs';
import path from 'path';
import os from 'os';
import { chromium } from 'playwright';
import { logger } from './logger.js';
import { config } from './config.js';

export class BrowserManager {
  constructor(options = {}) {
    this.extensionPath = options.extensionPath || config.extensionPath;
    this.headless = options.headless !== undefined ? options.headless : config.headless;
    this.browserTimeout = options.browserTimeout || config.browserTimeout;
    this.userDataDir = null;
    this.context = null;
  }

  /**
   * Launch Chromium with unpacked extension in a persistent context
   */
  async launch() {
    logger.info('BROWSER_START', `Headless=${this.headless}, Extension=${this.extensionPath}`);

    // Create unique temporary user-data-dir
    this.userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-chrome-ext-'));

    const launchArgs = [
      `--disable-extensions-except=${this.extensionPath}`,
      `--load-extension=${this.extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ];

    try {
      this.context = await chromium.launchPersistentContext(this.userDataDir, {
        headless: this.headless,
        args: launchArgs,
        timeout: this.browserTimeout,
        viewport: { width: 1280, height: 720 },
      });

      logger.info('BROWSER_STARTED', `UserDataDir=${this.userDataDir}`);
      return this.context;
    } catch (err) {
      logger.error('BROWSER_LAUNCH_FAILED', err.message);
      this.cleanupUserDataDir();
      throw err;
    }
  }

  /**
   * Close browser context and remove temporary directory
   */
  async close() {
    if (this.context) {
      try {
        await this.context.close();
        logger.info('BROWSER_CLOSED', 'Browser context cleanly terminated');
      } catch (err) {
        logger.warn('BROWSER_CLOSE_ERROR', err.message);
      } finally {
        this.context = null;
      }
    }

    this.cleanupUserDataDir();
  }

  cleanupUserDataDir() {
    if (this.userDataDir && fs.existsSync(this.userDataDir)) {
      try {
        fs.rmSync(this.userDataDir, { recursive: true, force: true });
      } catch {
        // Ignore file lock release delays on Windows
      }
      this.userDataDir = null;
    }
  }
}
