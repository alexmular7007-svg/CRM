import { test, expect } from '@playwright/test';
import { startServer, stopServer } from '../src/server.js';
import { config } from '../src/config.js';

const testServerPort = 9091;
const baseUrl = `http://127.0.0.1:${testServerPort}`;

test.beforeAll(async () => {
  await startServer(testServerPort, '127.0.0.1');
});

test.afterAll(async () => {
  await stopServer();
});

test.describe.serial('Extension Runner HTTP Server Integration', () => {

  test('1. GET /health returns UP status and runner metadata', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('UP');
    expect(data.service).toBe('extension-runner');
  });

  test('2. POST /api/test-runs with malformed request returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // missing runId
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Missing required field: runId');
  });

  test('3. POST /api/test-runs accepts job and returns QUEUED state immediately', async () => {
    const runId = 9901;
    const res = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          { type: 'POPUP_SMOKE', name: 'Popup Test' },
        ],
      }),
    });

    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data.runId).toBe(runId);
    expect(['QUEUED', 'RUNNING']).toContain(data.status);

    // Cancel job 9901 cleanly so browser is freed for subsequent tests
    await fetch(`${baseUrl}/api/test-runs/${runId}/cancel`, { method: 'POST' });
    await new Promise(r => setTimeout(r, 500));
  });

  test('4. GET /api/test-runs/:runId polls execution until terminal state PASSED', async () => {
    const runId = 9902;
    // Trigger run with popup smoke test
    await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          { type: 'POPUP_SMOKE', name: 'Popup Test' },
        ],
      }),
    });

    // Poll until complete or timeout
    let finalJob = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await fetch(`${baseUrl}/api/test-runs/${runId}`);
      expect(res.status).toBe(200);
      const job = await res.json();
      if (['PASSED', 'FAILED', 'ERROR', 'CANCELLED'].includes(job.status)) {
        finalJob = job;
        break;
      }
    }

    expect(finalJob).not.toBeNull();
    expect(finalJob.status).toBe('PASSED');
    expect(finalJob.passedTests).toBe(1);
    expect(finalJob.results.length).toBe(1);
    expect(finalJob.results[0].status).toBe('PASSED');
  });

  test('5. POST /api/test-runs/:runId/cancel cancels a test run', async () => {
    const runId = 9903;
    await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          { type: 'STORAGE_SMOKE', name: 'Storage Test' },
        ],
      }),
    });

    // Immediately cancel
    const cancelRes = await fetch(`${baseUrl}/api/test-runs/${runId}/cancel`, {
      method: 'POST',
    });

    expect(cancelRes.status).toBe(200);
    const cancelData = await cancelRes.json();
    expect(cancelData.runId).toBe(runId);
    expect(cancelData.status).toBe('CANCELLED');

    // Verify GET reflects cancelled state
    const getRes = await fetch(`${baseUrl}/api/test-runs/${runId}`);
    const job = await getRes.json();
    expect(job.status).toBe('CANCELLED');
  });

  test('6. GET /api/test-runs/non-existent returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/test-runs/non-existent-9999`);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('not found');
  });

});
