import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

export class ExtensionLoader {
  constructor(extensionPath) {
    this.extensionPath = path.resolve(extensionPath);
    this.manifest = null;
    this.extensionId = null;
  }

  /**
   * Validate extension directory and manifest structure
   */
  validate() {
    if (!fs.existsSync(this.extensionPath)) {
      throw new Error(`EXTENSION_LOAD_FAILED: Extension directory does not exist at '${this.extensionPath}'`);
    }

    const stat = fs.statSync(this.extensionPath);
    if (!stat.isDirectory()) {
      throw new Error(`EXTENSION_LOAD_FAILED: Extension path '${this.extensionPath}' is not a directory`);
    }

    const manifestPath = path.join(this.extensionPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`EXTENSION_LOAD_FAILED: manifest.json not found in '${this.extensionPath}'`);
    }

    try {
      const content = fs.readFileSync(manifestPath, 'utf8');
      this.manifest = JSON.parse(content);
    } catch (err) {
      throw new Error(`EXTENSION_LOAD_FAILED: Failed to parse manifest.json: ${err.message}`);
    }

    if (this.manifest.manifest_version !== 3) {
      throw new Error(`EXTENSION_LOAD_FAILED: manifest_version must be 3, found: ${this.manifest.manifest_version}`);
    }

    return this.manifest;
  }

  /**
   * Dynamically discover extension ID from Chromium context
   */
  async discoverExtensionId(context, timeoutMs = 10000) {
    logger.info('EXTENSION_LOAD_START', `Loading from: ${this.extensionPath}`);

    // Check existing service workers
    let serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length > 0) {
      for (const sw of serviceWorkers) {
        const url = sw.url();
        if (url.startsWith('chrome-extension://')) {
          this.extensionId = url.split('/')[2];
          logger.info('EXTENSION_LOADED', `Extension: ${this.manifest?.name || 'Unnamed'}`);
          logger.info('EXTENSION_ID_DISCOVERED', `EXTENSION_ID=${this.extensionId}`);
          return this.extensionId;
        }
      }
    }

    // Wait for serviceworker event
    try {
      const sw = await context.waitForEvent('serviceworker', {
        predicate: (worker) => worker.url().startsWith('chrome-extension://'),
        timeout: timeoutMs,
      });
      this.extensionId = sw.url().split('/')[2];
      logger.info('EXTENSION_LOADED', `Extension: ${this.manifest?.name || 'Unnamed'}`);
      logger.info('EXTENSION_ID_DISCOVERED', `EXTENSION_ID=${this.extensionId}`);
      return this.extensionId;
    } catch (err) {
      // Fallback: Check background pages or open dummy extension page to trigger detection
      const bgPages = context.backgroundPages ? context.backgroundPages() : [];
      for (const bg of bgPages) {
        const url = bg.url();
        if (url.startsWith('chrome-extension://')) {
          this.extensionId = url.split('/')[2];
          logger.info('EXTENSION_LOADED', `Extension: ${this.manifest?.name || 'Unnamed'}`);
          logger.info('EXTENSION_ID_DISCOVERED', `EXTENSION_ID=${this.extensionId}`);
          return this.extensionId;
        }
      }

      // Secondary fallback: check page targets
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        if (url.startsWith('chrome-extension://')) {
          this.extensionId = url.split('/')[2];
          logger.info('EXTENSION_LOADED', `Extension: ${this.manifest?.name || 'Unnamed'}`);
          logger.info('EXTENSION_ID_DISCOVERED', `EXTENSION_ID=${this.extensionId}`);
          return this.extensionId;
        }
      }

      throw new Error(`EXTENSION_LOAD_FAILED: Unable to discover extension ID within ${timeoutMs}ms: ${err.message}`);
    }
  }

  getPopupUrl() {
    if (!this.extensionId) {
      throw new Error('Extension ID has not been discovered yet');
    }
    const defaultPopup = this.manifest?.action?.default_popup || 'src/popup/popup.html';
    return `chrome-extension://${this.extensionId}/${defaultPopup}`;
  }
}
