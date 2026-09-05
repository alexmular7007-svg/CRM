import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { validateRunId, validateFilename, storeScreenshot, getArtifactPath } from '../src/artifactStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Artifacts base is one level up from tests/ (i.e., extension-runner/artifacts)
const ARTIFACTS_BASE = path.resolve(path.dirname(__dirname), 'artifacts');

const TEST_RUN_ID = 'test-run-step4';

// Minimal valid PNG buffer (1x1 pixel, RGB)
function makeMinimalPng() {
  return Buffer.from(
    '89504e470d0a1a0a' +          // PNG signature
    '0000000d49484452' +          // IHDR chunk: length=13
    '00000001' +                  // width=1
    '00000001' +                  // height=1
    '08' +                        // bit depth=8
    '02' +                        // color type=RGB
    '000000' +                    // compression, filter, interlace
    '9001' + '2e00' +             // CRC (approximate — sufficient for file existence tests)
    '0000000c' +                  // IDAT chunk length
    '49444154' +                  // "IDAT"
    '78016360f8cf' +              // zlib compressed data
    'c00000000200' +              // more data
    '013e0221' +                  // more data
    '90000000' +                  // more data
    '0049454e44' +                // IEND chunk
    'ae426082',                   // IEND CRC
    'hex'
  );
}

test.describe('Artifact Store — Unit Tests', () => {

  test.afterAll(() => {
    // Clean up test run directories created during tests
    for (const runId of [TEST_RUN_ID, 'run-A-step4', 'run-B-step4']) {
      const dir = path.join(ARTIFACTS_BASE, runId);
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  // ── storeScreenshot & getArtifactPath happy-path ──────────────────────────

  test('1. storeScreenshot saves PNG to artifacts/<runId>/', async () => {
    const tmpPng = path.join(os.tmpdir(), 'test_artifact_src.png');
    fs.writeFileSync(tmpPng, makeMinimalPng());

    const destPath = await storeScreenshot(TEST_RUN_ID, 'capture.png', tmpPng);

    expect(fs.existsSync(destPath)).toBe(true);
    expect(destPath).toContain(TEST_RUN_ID);
    expect(destPath.endsWith('capture.png')).toBe(true);
    expect(destPath.startsWith(ARTIFACTS_BASE)).toBe(true);

    fs.unlinkSync(tmpPng);
  });

  test('2. getArtifactPath returns path for existing artifact', async () => {
    // Relies on artifact stored in test 1
    const result = await getArtifactPath(TEST_RUN_ID, 'capture.png');
    expect(result).not.toBeNull();
    expect(fs.existsSync(result)).toBe(true);
    expect(result.endsWith('capture.png')).toBe(true);
  });

  test('3. getArtifactPath returns null for nonexistent artifact', async () => {
    const result = await getArtifactPath(TEST_RUN_ID, 'nonexistent.png');
    expect(result).toBeNull();
  });

  // ── validateRunId ─────────────────────────────────────────────────────────

  test('4. validateRunId rejects empty string, null, undefined, and non-string', () => {
    expect(() => validateRunId('')).toThrow();
    expect(() => validateRunId(null)).toThrow();
    expect(() => validateRunId(undefined)).toThrow();
    expect(() => validateRunId(123)).toThrow();
    expect(() => validateRunId([])).toThrow();
  });

  test('5. validateRunId rejects dot-dot traversal', () => {
    expect(() => validateRunId('../etc')).toThrow(/traversal|invalid|unsafe|separator/i);
    expect(() => validateRunId('..')).toThrow();
    expect(() => validateRunId('run/../other')).toThrow();
    expect(() => validateRunId('a..b')).toThrow();
  });

  test('6. validateFilename rejects dot-dot traversal', () => {
    expect(() => validateFilename('../secret.png')).toThrow();
    expect(() => validateFilename('../../etc/passwd.png')).toThrow();
    expect(() => validateFilename('a..b.png')).toThrow();
  });

  test('7. validateRunId and validateFilename reject percent-encoded traversal', () => {
    expect(() => validateRunId('%2e%2e%2frun')).toThrow();
    expect(() => validateRunId('run%2fother')).toThrow();
    expect(() => validateFilename('%2e%2e%2ffile.png')).toThrow();
    expect(() => validateFilename('file%2fpng.png')).toThrow();
    expect(() => validateRunId('%5crun')).toThrow();
    expect(() => validateFilename('file%5cname.png')).toThrow();
  });

  test('8. validateRunId and validateFilename reject absolute POSIX paths', () => {
    expect(() => validateRunId('/etc/run')).toThrow();
    expect(() => validateFilename('/etc/passwd.png')).toThrow();
  });

  test('9. validateRunId and validateFilename reject Windows drive paths', () => {
    expect(() => validateRunId('C:/run')).toThrow();
    expect(() => validateFilename('C:/windows/evil.png')).toThrow();
    expect(() => validateRunId('D:\\run')).toThrow();
    expect(() => validateFilename('D:\\evil.png')).toThrow();
  });

  test('10. validateRunId and validateFilename reject Windows UNC paths', () => {
    expect(() => validateRunId('\\\\server\\share')).toThrow();
    expect(() => validateFilename('\\\\server\\share\\evil.png')).toThrow();
  });

  test('11. validateRunId and validateFilename reject null bytes', () => {
    expect(() => validateRunId('run\0id')).toThrow(/null/i);
    expect(() => validateFilename('file\0name.png')).toThrow(/null/i);
    expect(() => validateRunId('%00run')).toThrow();
    expect(() => validateFilename('file%00.png')).toThrow();
  });

  test('12. validateFilename rejects non-PNG extensions', () => {
    expect(() => validateFilename('server.js')).toThrow();
    expect(() => validateFilename('.env')).toThrow();
    expect(() => validateFilename('package.json')).toThrow();
    expect(() => validateFilename('image.jpg')).toThrow();
    expect(() => validateFilename('image.gif')).toThrow();
    expect(() => validateFilename('image.png.js')).toThrow();
    expect(() => validateFilename('image.PNG.js')).toThrow();
  });

  test('13. getArtifactPath rejects attempts to reach project files', async () => {
    // validateRunId will reject '../src' due to '..' or separator
    await expect(getArtifactPath('../src', 'server.png')).rejects.toThrow();
    // validateFilename will reject 'server.js' (not .png)
    await expect(getArtifactPath('run-id', 'server.js')).rejects.toThrow();
    // validateFilename will reject '../src/server.png' due to '..' or separator
    await expect(getArtifactPath('run-id', '../src/server.png')).rejects.toThrow();
  });

  test('14. validateRunId rejects sibling-prefix path attacks via strict allowlist', () => {
    expect(() => validateRunId('run-A/../../run-B')).toThrow();
    expect(() => validateRunId('run-A\\..\\run-B')).toThrow();
    expect(() => validateRunId('run/id')).toThrow();
  });

  test('15. run-A artifact cannot be retrieved through run-B path', async () => {
    const runAId = 'run-A-step4';
    const runBId = 'run-B-step4';

    // Store an artifact in run-A
    const tmpPng = path.join(os.tmpdir(), 'cross_run_test.png');
    fs.writeFileSync(tmpPng, makeMinimalPng());
    await storeScreenshot(runAId, 'artifact.png', tmpPng);
    fs.unlinkSync(tmpPng);

    // run-B should not have the artifact — returns null
    const result = await getArtifactPath(runBId, 'artifact.png');
    expect(result).toBeNull();

    // run-A should still have it
    const validResult = await getArtifactPath(runAId, 'artifact.png');
    expect(validResult).not.toBeNull();
    expect(fs.existsSync(validResult)).toBe(true);
  });

  test('16. symlink pointing outside artifacts dir is rejected by getArtifactPath', async () => {
    const runDir = path.join(ARTIFACTS_BASE, TEST_RUN_ID);
    fs.mkdirSync(runDir, { recursive: true });
    const symlinkPath = path.join(runDir, 'evil.png');
    const outsideTarget = path.join(os.tmpdir(), 'outside_target_step4.png');

    // Create the outside target file
    fs.writeFileSync(outsideTarget, Buffer.from('fake png content'));

    let symlinkCreated = false;
    try {
      if (fs.existsSync(symlinkPath)) fs.unlinkSync(symlinkPath);
      fs.symlinkSync(outsideTarget, symlinkPath);
      symlinkCreated = true;
    } catch (e) {
      // Symlink creation may fail on Windows without elevated permissions
    }

    if (symlinkCreated) {
      // Symlink exists but resolves outside artifacts dir — must be rejected
      await expect(getArtifactPath(TEST_RUN_ID, 'evil.png')).rejects.toThrow(/escaped|forbidden/i);
      fs.unlinkSync(symlinkPath);
    } else {
      // Symlink not created — verify the containment logic works for a real file
      const realFile = path.join(runDir, 'real.png');
      fs.writeFileSync(realFile, Buffer.from('fake png'));
      const result = await getArtifactPath(TEST_RUN_ID, 'real.png');
      expect(result).not.toBeNull();
      expect(result.startsWith(ARTIFACTS_BASE)).toBe(true);
      fs.unlinkSync(realFile);
    }

    if (fs.existsSync(outsideTarget)) fs.unlinkSync(outsideTarget);
  });

  test('16b. symlink pointing to another run directory artifact is rejected', async () => {
    const runAId = 'run-A-step4';
    const runBId = 'run-B-step4';
    const runADir = path.join(ARTIFACTS_BASE, runAId);
    const runBDir = path.join(ARTIFACTS_BASE, runBId);
    fs.mkdirSync(runADir, { recursive: true });
    fs.mkdirSync(runBDir, { recursive: true });

    const targetA = path.join(runADir, 'secret_a.png');
    fs.writeFileSync(targetA, makeMinimalPng());

    const symlinkInB = path.join(runBDir, 'cross_symlink.png');
    let symlinkCreated = false;
    try {
      if (fs.existsSync(symlinkInB)) fs.unlinkSync(symlinkInB);
      fs.symlinkSync(targetA, symlinkInB);
      symlinkCreated = true;
    } catch (e) {
      // Symlink permission limitation on Windows
    }

    if (symlinkCreated) {
      try {
        await expect(getArtifactPath(runBId, 'cross_symlink.png')).rejects.toThrow(/escaped|forbidden/i);
      } finally {
        if (fs.existsSync(symlinkInB)) fs.unlinkSync(symlinkInB);
      }
    }
  });

  // ── Valid inputs accepted ─────────────────────────────────────────────────

  test('17. validateFilename accepts valid PNG filenames with safe characters', () => {
    expect(() => validateFilename('screenshot.png')).not.toThrow();
    expect(() => validateFilename('my_capture-001.png')).not.toThrow();
    expect(() => validateFilename('STEP_0_capture_12345.png')).not.toThrow();
    expect(() => validateFilename('a.png')).not.toThrow();
    expect(() => validateFilename('Screenshot.PNG')).not.toThrow();
  });

  test('18. validateRunId accepts valid run IDs', () => {
    expect(() => validateRunId('run-123')).not.toThrow();
    expect(() => validateRunId('abc')).not.toThrow();
    expect(() => validateRunId('test_run_001')).not.toThrow();
    expect(() => validateRunId('RUN-A-2024')).not.toThrow();
    expect(() => validateRunId('a')).not.toThrow();
  });

});
