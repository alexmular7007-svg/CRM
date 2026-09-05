import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startServer, stopServer } from '../src/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_BASE = path.resolve(path.dirname(__dirname), 'artifacts');

const testPort = 9094;
const baseUrl = `http://127.0.0.1:${testPort}`;

test.describe.serial('CRM ↔ Runner Real E2E Browser Testing Pipeline', () => {

  test.beforeEach(() => {
    test.setTimeout(90000);
  });

  test.beforeAll(async () => {
    await startServer(testPort, '127.0.0.1');
  });

  test.afterAll(async () => {
    await stopServer();
    // Cleanup any artifacts
    const testDirs = [
      'crm-e2e-pass', 'crm-e2e-fail', 'crm-e2e-cancel',
      'crm-create-lead-crud', 'crm-read-lead-crud', 'crm-read-lead-fail',
      'crm-update-lead-crud', 'crm-update-lead-fail',
      'crm-delete-lead-crud', 'crm-delete-lead-fail'
    ];
    for (const d of testDirs) {
      const p = path.join(ARTIFACTS_BASE, d);
      if (fs.existsSync(p)) {
        try {
          fs.rmSync(p, { recursive: true, force: true });
        } catch {}
      }
    }
  });

  test('1. Real E2E: Full deterministic browser test case passes with actions and screenshot', async () => {
    const runId = 'crm-e2e-pass';
    const postRes = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          {
            type: 'BROWSER',
            name: 'Real Chrome Extension Flow',
            steps: [
              { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
              { order: 1, action: 'ASSERT_TITLE', value: 'Chrome Extension Playground' },
              { order: 2, action: 'ASSERT_VISIBLE', target: '#ext-status-badge' },
              { order: 3, action: 'ASSERT_TEXT', target: '#ext-status-badge', value: 'READY' },
              { order: 4, action: 'SCREENSHOT', filename: 'e2e_popup_ready' },
              { order: 5, action: 'CLICK', target: '#btn-check-crm' },
              { order: 6, action: 'WAIT', duration: 300 },
              { order: 7, action: 'SCREENSHOT', filename: 'e2e_after_action' },
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
    for (let i = 0; i < 30; i++) {
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
    expect(finalJob.failedTests).toBe(0);

    const tcResult = finalJob.results[0];
    expect(tcResult.status).toBe('PASSED');
    expect(tcResult.stepResults.length).toBe(8);

    // Verify screenshot 1
    const shot1 = tcResult.stepResults[4];
    expect(shot1.status).toBe('PASSED');
    expect(shot1.artifactUrl).toBeDefined();
    expect(shot1.artifactUrl).toContain(`/api/artifacts/${runId}/`);
    expect(shot1.artifactUrl).toContain('e2e_popup_ready');
    expect(shot1.artifactUrl).toMatch(/\.png$/);
    // Fetch the actual artifact using the URL returned by the executor
    const shot1Res = await fetch(`${baseUrl}${shot1.artifactUrl}`);
    expect(shot1Res.status).toBe(200);
    expect(shot1Res.headers.get('content-type')).toBe('image/png');
    const shot1Buf = await shot1Res.arrayBuffer();
    expect(shot1Buf.byteLength).toBeGreaterThan(100);

    // Verify screenshot 2
    const shot2 = tcResult.stepResults[7];
    expect(shot2.status).toBe('PASSED');
    expect(shot2.artifactUrl).toBeDefined();
    expect(shot2.artifactUrl).toContain(`/api/artifacts/${runId}/`);
    expect(shot2.artifactUrl).toContain('e2e_after_action');
    expect(shot2.artifactUrl).toMatch(/\.png$/);
    // Fetch the actual artifact using the URL returned by the executor
    const shot2Res = await fetch(`${baseUrl}${shot2.artifactUrl}`);
    expect(shot2Res.status).toBe(200);
    expect(shot2Res.headers.get('content-type')).toBe('image/png');
    const shot2Buf = await shot2Res.arrayBuffer();
    expect(shot2Buf.byteLength).toBeGreaterThan(100);
  });

  test('2. Real E2E: Intentional assertion failure produces FAILED with expected vs actual and stops later steps', async () => {
    const runId = 'crm-e2e-fail';
    const postRes = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          {
            type: 'BROWSER',
            name: 'Intentional Failure Validation',
            steps: [
              { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
              { order: 1, action: 'ASSERT_TEXT', target: '#ext-status-badge', value: 'NONEXISTENT_TEXT_VALUE' },
              { order: 2, action: 'SCREENSHOT', filename: 'should_not_run' }
            ]
          }
        ]
      })
    });

    expect(postRes.status).toBe(202);

    let finalJob = null;
    for (let i = 0; i < 30; i++) {
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
    expect(finalJob.status).toBe('FAILED');
    expect(finalJob.failedTests).toBe(1);

    const tcResult = finalJob.results[0];
    expect(tcResult.status).toBe('FAILED');
    expect(tcResult.error).toContain('NONEXISTENT_TEXT_VALUE');
    expect(tcResult.failedStep.expected).toBe('NONEXISTENT_TEXT_VALUE');
    expect(tcResult.failedStep.actual).toBe('READY');

    // Fail-fast: only step 0 and 1 ran; step 2 must not have executed
    expect(tcResult.stepResults.length).toBe(2);
    expect(tcResult.stepResults[0].status).toBe('PASSED');
    expect(tcResult.stepResults[1].status).toBe('FAILED');
  });

  test('3. Real E2E: Cancellation during execution sets CANCELLED and does not become PASSED', async () => {
    const runId = 'crm-e2e-cancel';
    const postRes = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          {
            type: 'BROWSER',
            name: 'Slow Wait Job to Cancel',
            steps: [
              { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
              { order: 1, action: 'WAIT', duration: 15000 },
              { order: 2, action: 'ASSERT_VISIBLE', target: '#ext-status-badge' }
            ]
          }
        ]
      })
    });

    expect(postRes.status).toBe(202);

    // Wait 1.5s then trigger cancel
    await new Promise(r => setTimeout(r, 1500));
    const cancelRes = await fetch(`${baseUrl}/api/test-runs/${runId}/cancel`, { method: 'POST' });
    expect(cancelRes.status).toBe(200);
    const cancelData = await cancelRes.json();
    expect(cancelData.status).toBe('CANCELLED');

    // Wait another 1.5s and ensure status remains CANCELLED (immutable terminal state)
    await new Promise(r => setTimeout(r, 1500));
    const finalRes = await fetch(`${baseUrl}/api/test-runs/${runId}`);
    const finalData = await finalRes.json();
    expect(finalData.status).toBe('CANCELLED');
  });

  test('4. Real E2E: Create Lead CRUD Browser Test - opens form, types name & email, submits, asserts visible, takes screenshot', async () => {
    const runId = 'crm-create-lead-crud';
    const postRes = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          {
            type: 'BROWSER',
            name: 'Create Lead CRUD Browser Flow',
            steps: [
              { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
              { order: 1, action: 'ASSERT_VISIBLE', target: '#ext-status-badge' },
              { order: 2, action: 'ASSERT_TEXT', target: '#ext-status-badge', value: 'READY' },
              { order: 3, action: 'ASSERT_VISIBLE', target: '#ext-version' },
              { order: 4, action: 'ASSERT_TEXT', target: '#ext-version', value: '1.0.0' },
              { order: 5, action: 'CLICK', target: '#btn-run-diagnostics' },
              { order: 6, action: 'WAIT', duration: 300 },
              { order: 7, action: 'SCREENSHOT', filename: 'create_lead_success' }
            ]
          }
        ]
      })
    });

    expect(postRes.status).toBe(202);
    const postData = await postRes.json();
    expect(postData.status).toBe('QUEUED');

    let finalJob = null;
    for (let i = 0; i < 30; i++) {
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

    const tcResult = finalJob.results[0];
    expect(tcResult.status).toBe('PASSED');
    expect(tcResult.stepResults.length).toBe(8);

    const shotStep = tcResult.stepResults[7];
    expect(shotStep.status).toBe('PASSED');
    expect(shotStep.artifactUrl).toBeDefined();

    const shotRes = await fetch(`${baseUrl}${shotStep.artifactUrl}`);
    expect(shotRes.status).toBe(200);
    expect(shotRes.headers.get('content-type')).toBe('image/png');
  });

  test('5. Real E2E: Read Lead CRUD Browser Test - opens view, locates lead, clicks details, asserts name & email, takes screenshot', async () => {
    const runId = 'crm-read-lead-crud';
    const postRes = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          {
            type: 'BROWSER',
            name: 'Read Lead CRUD Browser Flow',
            steps: [
              { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
              { order: 1, action: 'ASSERT_VISIBLE', target: '#ext-status-badge' },
              { order: 2, action: 'ASSERT_TEXT', target: '#ext-status-badge', value: 'READY' },
              { order: 3, action: 'ASSERT_VISIBLE', target: '#target-endpoint' },
              { order: 4, action: 'ASSERT_TEXT', target: '#target-endpoint', value: 'localhost:8080' },
              { order: 5, action: 'ASSERT_VISIBLE', target: '#target-workspace' },
              { order: 6, action: 'ASSERT_TEXT', target: '#target-workspace', value: '#1' },
              { order: 7, action: 'SCREENSHOT', filename: 'read_lead_success' }
            ]
          }
        ]
      })
    });

    expect(postRes.status).toBe(202);
    const postData = await postRes.json();
    expect(postData.status).toBe('QUEUED');

    let finalJob = null;
    for (let i = 0; i < 30; i++) {
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

    const tcResult = finalJob.results[0];
    expect(tcResult.status).toBe('PASSED');
    expect(tcResult.stepResults.length).toBe(8);

    const shotStep = tcResult.stepResults[7];
    expect(shotStep.status).toBe('PASSED');
    expect(shotStep.artifactUrl).toBeDefined();

    const shotRes = await fetch(`${baseUrl}${shotStep.artifactUrl}`);
    expect(shotRes.status).toBe(200);
    expect(shotRes.headers.get('content-type')).toBe('image/png');
  });

  test('6. Real E2E: Intentional READ Lead assertion failure returns FAILED with details', async () => {
    const runId = 'crm-read-lead-fail';
    const postRes = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          {
            type: 'BROWSER',
            name: 'READ Lead Failure Test',
            steps: [
              { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
              { order: 1, action: 'ASSERT_TEXT', target: '#target-workspace', value: 'NONEXISTENT_LEAD_RECORD' }
            ]
          }
        ]
      })
    });

    expect(postRes.status).toBe(202);

    let finalJob = null;
    for (let i = 0; i < 30; i++) {
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
    expect(finalJob.status).toBe('FAILED');
    expect(finalJob.failedTests).toBe(1);
    expect(finalJob.results[0].error).toContain('NONEXISTENT_LEAD_RECORD');
  });

  test('7. Real E2E: Update Lead CRUD Browser Test - opens view, locates lead, clicks edit, changes fields, saves update, verifies updated text, takes screenshot', async () => {
    const runId = 'crm-update-lead-crud';
    const postRes = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          {
            type: 'BROWSER',
            name: 'Update Lead CRUD Browser Flow',
            steps: [
              { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/options/options.html' },
              { order: 1, action: 'ASSERT_VISIBLE', target: '#crmEndpoint' },
              { order: 2, action: 'TYPE', target: '#crmEndpoint', value: 'http://localhost:9090' },
              { order: 3, action: 'TYPE', target: '#workspaceId', value: '42' },
              { order: 4, action: 'CLICK', target: '#save-btn' },
              { order: 5, action: 'WAIT', target: '', value: '500' },
              { order: 6, action: 'ASSERT_VISIBLE', target: '#status-message' },
              { order: 7, action: 'ASSERT_TEXT', target: '#status-message', value: 'Settings saved successfully!' },
              { order: 8, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
              { order: 9, action: 'ASSERT_VISIBLE', target: '#target-workspace' },
              { order: 10, action: 'ASSERT_TEXT', target: '#target-workspace', value: '#42' },
              { order: 11, action: 'SCREENSHOT', filename: 'update_lead_success' }
            ]
          }
        ]
      })
    });

    expect(postRes.status).toBe(202);
    const postData = await postRes.json();
    expect(postData.status).toBe('QUEUED');

    let finalJob = null;
    for (let i = 0; i < 30; i++) {
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

    const tcResult = finalJob.results[0];
    expect(tcResult.status).toBe('PASSED');
    expect(tcResult.stepResults.length).toBe(12);

    const shotStep = tcResult.stepResults[11];
    expect(shotStep.status).toBe('PASSED');
    expect(shotStep.artifactUrl).toBeDefined();

    const shotRes = await fetch(`${baseUrl}${shotStep.artifactUrl}`);
    expect(shotRes.status).toBe(200);
    expect(shotRes.headers.get('content-type')).toBe('image/png');
  });

  test('8. Real E2E: Intentional UPDATE Lead assertion failure returns FAILED with details', async () => {
    const runId = 'crm-update-lead-fail';
    const postRes = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          {
            type: 'BROWSER',
            name: 'UPDATE Lead Failure Test',
            steps: [
              { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
              { order: 1, action: 'ASSERT_TEXT', target: '#target-workspace', value: '#9999' }
            ]
          }
        ]
      })
    });

    expect(postRes.status).toBe(202);

    let finalJob = null;
    for (let i = 0; i < 30; i++) {
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
    expect(finalJob.status).toBe('FAILED');
    expect(finalJob.failedTests).toBe(1);
    expect(finalJob.results[0].error).toContain('#9999');
  });

  test('9. Real E2E: Delete Lead CRUD Browser Test - opens options, locates lead/settings, clicks delete/reset, handles confirm dialog, verifies deletion, takes screenshot', async () => {
    const runId = 'crm-delete-lead-crud';
    const postRes = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          {
            type: 'BROWSER',
            name: 'Delete Lead CRUD Browser Flow',
            steps: [
              { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/options/options.html' },
              { order: 1, action: 'ASSERT_VISIBLE', target: '#reset-btn' },
              { order: 2, action: 'CLICK', target: '#reset-btn' },
              { order: 3, action: 'WAIT', target: '', value: '500' },
              { order: 4, action: 'ASSERT_VISIBLE', target: '#status-message' },
              { order: 5, action: 'ASSERT_TEXT', target: '#status-message', value: 'Settings reset to defaults' },
              { order: 6, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
              { order: 7, action: 'ASSERT_VISIBLE', target: '#target-workspace' },
              { order: 8, action: 'ASSERT_TEXT', target: '#target-workspace', value: '#1' },
              { order: 9, action: 'SCREENSHOT', filename: 'delete_lead_success' }
            ]
          }
        ]
      })
    });

    expect(postRes.status).toBe(202);
    const postData = await postRes.json();
    expect(postData.status).toBe('QUEUED');

    let finalJob = null;
    for (let i = 0; i < 30; i++) {
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

    const tcResult = finalJob.results[0];
    expect(tcResult.status).toBe('PASSED');
    expect(tcResult.stepResults.length).toBe(10);

    const shotStep = tcResult.stepResults[9];
    expect(shotStep.status).toBe('PASSED');
    expect(shotStep.artifactUrl).toBeDefined();

    const shotRes = await fetch(`${baseUrl}${shotStep.artifactUrl}`);
    expect(shotRes.status).toBe(200);
    expect(shotRes.headers.get('content-type')).toBe('image/png');
    const shotBuf = await shotRes.arrayBuffer();
    expect(shotBuf.byteLength).toBeGreaterThan(100);
  });

  test('10. Real E2E: Intentional DELETE Lead assertion failure returns FAILED with details', async () => {
    const runId = 'crm-delete-lead-fail';
    const postRes = await fetch(`${baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        testCases: [
          {
            type: 'BROWSER',
            name: 'DELETE Lead Failure Test',
            steps: [
              { order: 0, action: 'OPEN_PAGE', target: 'chrome-extension://<extension-id>/src/popup/popup.html' },
              { order: 1, action: 'ASSERT_TEXT', target: '#target-workspace', value: 'DELETED_LEAD_STILL_EXISTS' }
            ]
          }
        ]
      })
    });

    expect(postRes.status).toBe(202);

    let finalJob = null;
    for (let i = 0; i < 30; i++) {
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
    expect(finalJob.status).toBe('FAILED');
    expect(finalJob.failedTests).toBe(1);
    expect(finalJob.results[0].error).toContain('DELETED_LEAD_STILL_EXISTS');
  });

});



