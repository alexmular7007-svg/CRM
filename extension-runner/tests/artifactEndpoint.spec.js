import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { startServer, stopServer } from '../src/server.js';
import { storeScreenshot } from '../src/artifactStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testPort = 9092; // dedicated port — does not conflict with server.spec.js (9091)
const baseUrl = `http://127.0.0.1:${testPort}`;
const ARTIFACTS_BASE = path.resolve(path.dirname(__dirname), 'artifacts');

const TEST_RUN = 'endpoint-test-run';
const TEST_FILE = 'endpoint_test.png';

test.beforeAll(async () => {
  // Store a real artifact so the happy-path tests have something to fetch
  const tmpSrc = path.join(os.tmpdir(), 'endpoint_test_src.png');
  // Write any bytes — we only need the file to exist for content-type / existence tests
  fs.writeFileSync(tmpSrc, Buffer.alloc(100, 0x89));
  await storeScreenshot(TEST_RUN, TEST_FILE, tmpSrc);
  fs.unlinkSync(tmpSrc);

  await startServer(testPort, '127.0.0.1');
});

test.afterAll(async () => {
  await stopServer();
  const runDir = path.join(ARTIFACTS_BASE, TEST_RUN);
  if (fs.existsSync(runDir)) {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
});

test.describe.serial('Artifact Retrieval Endpoint', () => {

  test('1. GET /api/artifacts/:runId/:filename returns 200 for valid artifact', async () => {
    const res = await fetch(`${baseUrl}/api/artifacts/${TEST_RUN}/${TEST_FILE}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
  });

  test('2. Response Content-Type is image/png', async () => {
    const res = await fetch(`${baseUrl}/api/artifacts/${TEST_RUN}/${TEST_FILE}`);
    expect(res.headers.get('content-type')).toBe('image/png');
  });

  test('3. Missing artifact returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/artifacts/${TEST_RUN}/missing.png`);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('not found');
  });

  test('4. Nonexistent run returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/artifacts/nonexistent-run-xyz/test.png`);
    expect(res.status).toBe(404);
  });

  test('5. Invalid runId (dot-dot) returns 400 or 404', async () => {
    // URL parser may normalize ../ so the route may not match — either 400 or 404 is safe
    const res = await fetch(`${baseUrl}/api/artifacts/../etc/test.png`);
    expect([400, 404]).toContain(res.status);
  });

  test('6. Invalid runId (encoded traversal %2e%2e) returns 400 or 404', async () => {
    // %2e%2e%2f decoded by URL parser becomes ../ — route may not match
    const res = await fetch(`${baseUrl}/api/artifacts/%2e%2e%2fetc/test.png`);
    expect([400, 404]).toContain(res.status);
  });

  test('7. Invalid filename (non-PNG) returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/artifacts/${TEST_RUN}/server.js`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid filename');
  });

  test('8. Invalid filename (.env) returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/artifacts/${TEST_RUN}/.env`);
    expect(res.status).toBe(400);
  });

  test('9. Invalid filename (encoded traversal) returns 400 or 404', async () => {
    const res = await fetch(`${baseUrl}/api/artifacts/${TEST_RUN}/..%2Fserver.js`);
    expect([400, 404]).toContain(res.status);
  });

  test('10. Run ID with encoded slash returns 400 or 404', async () => {
    const res = await fetch(`${baseUrl}/api/artifacts/run%2fid/test.png`);
    expect([400, 404]).toContain(res.status);
  });

  test('11. Null byte in filename (encoded %00) returns 400 or 404', async () => {
    const res = await fetch(`${baseUrl}/api/artifacts/${TEST_RUN}/file%00.png`);
    expect([400, 404]).toContain(res.status);
  });

  test('12. Windows drive path in filename returns 400 or 404', async () => {
    // C%3A%2Fevil.png decodes to C:/evil.png
    const res = await fetch(`${baseUrl}/api/artifacts/${TEST_RUN}/C%3A%2Fevil.png`);
    expect([400, 404]).toContain(res.status);
  });

  test('13. Sibling-prefix run attack returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/artifacts/${TEST_RUN}-evil/${TEST_FILE}`);
    expect(res.status).toBe(404);
  });

  test('14. Run A artifact cannot be retrieved through Run B path', async () => {
    const otherRun = 'endpoint-run-other';
    const res = await fetch(`${baseUrl}/api/artifacts/${otherRun}/${TEST_FILE}`);
    expect(res.status).toBe(404);
  });

  test('15. Symlink escape returns 403 Forbidden', async () => {
    const runDir = path.join(ARTIFACTS_BASE, TEST_RUN);
    const symlinkPath = path.join(runDir, 'symlink_escape.png');
    const outsideTarget = path.join(os.tmpdir(), 'endpoint_outside_target.png');
    fs.writeFileSync(outsideTarget, Buffer.from('outside png'));

    let symlinkCreated = false;
    try {
      if (fs.existsSync(symlinkPath)) fs.unlinkSync(symlinkPath);
      fs.symlinkSync(outsideTarget, symlinkPath);
      symlinkCreated = true;
    } catch (e) {
      // Windows unprivileged symlink limitation
    }

    if (symlinkCreated) {
      try {
        const res = await fetch(`${baseUrl}/api/artifacts/${TEST_RUN}/symlink_escape.png`);
        expect(res.status).toBe(403);
      } finally {
        if (fs.existsSync(symlinkPath)) fs.unlinkSync(symlinkPath);
      }
    }

    if (fs.existsSync(outsideTarget)) fs.unlinkSync(outsideTarget);
  });

});
