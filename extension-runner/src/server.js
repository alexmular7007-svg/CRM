import http from 'http';
import fs from 'fs';
import crypto from 'crypto';
import { JobManager } from './jobManager.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { validateRunId, validateFilename, getArtifactPath } from './artifactStore.js';

export const jobManager = new JobManager();

function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Runner-Secret, x-runner-secret',
  });
  res.end(payload);
}

function checkAuthentication(req, res) {
  const secret = config.runnerSharedSecret;
  if (!secret) {
    return true; // Unauthenticated local dev mode when no secret is configured
  }

  const providedSecret = req.headers['x-runner-secret'] || req.headers['X-Runner-Secret'] || '';
  if (!providedSecret) {
    sendJson(res, 401, { error: 'Unauthorized: Missing X-Runner-Secret header' });
    return false;
  }

  const expectedBuf = Buffer.from(secret);
  const providedBuf = Buffer.from(String(providedSecret));

  if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    sendJson(res, 401, { error: 'Unauthorized: Invalid X-Runner-Secret header' });
    return false;
  }

  return true;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Runner-Secret, x-runner-secret',
      });
      res.end();
      return;
    }

    try {
      // 1. Health checks (Unauthenticated for health monitors)
      if ((pathname === '/health' || pathname === '/api/health') && (method === 'GET' || method === 'POST')) {
        return sendJson(res, 200, {
          status: 'UP',
          service: 'extension-runner'
        });
      }

      // Enforce X-Runner-Secret authentication for all operational endpoints
      if (!checkAuthentication(req, res)) {
        return;
      }

      // 2. POST /api/test-runs -> Queue browser run
      if (pathname === '/api/test-runs' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.runId) {
          return sendJson(res, 400, { error: 'Missing required field: runId' });
        }

        try {
          validateRunId(String(body.runId));
        } catch (e) {
          return sendJson(res, 400, { error: `Invalid runId: ${e.message}` });
        }

        let testCases = body.testCases;
        if ((!Array.isArray(testCases) || testCases.length === 0) && Array.isArray(body.steps) && body.steps.length > 0) {
          testCases = [{
            type: 'BROWSER',
            name: body.name || 'Declarative browser test',
            steps: body.steps,
          }];
        }

        const job = jobManager.createJob(body.runId, testCases);
        
        // Asynchronously execute Playwright run in background without blocking HTTP response
        setImmediate(() => {
          jobManager.executeJob(body.runId).catch(err => {
            logger.error('JOB_EXECUTION_UNHANDLED', err.message);
          });
        });

        return sendJson(res, 202, {
          runId: job.runId,
          status: 'QUEUED',
          message: 'Browser test run accepted',
        });
      }

      // 3. GET /api/test-runs/:runId -> Query status
      const getMatch = pathname.match(/^\/api\/test-runs\/([^\/]+)$/);
      if (getMatch && method === 'GET') {
        const runId = getMatch[1];
        const job = jobManager.getJob(runId);
        if (!job) {
          return sendJson(res, 404, { error: `Test run '${runId}' not found` });
        }
        return sendJson(res, 200, job);
      }

      // 4. POST /api/test-runs/:runId/cancel -> Cancel run
      const cancelMatch = pathname.match(/^\/api\/test-runs\/([^\/]+)\/cancel$/);
      if (cancelMatch && method === 'POST') {
        const runId = cancelMatch[1];
        const job = jobManager.cancelJob(runId);
        if (!job) {
          return sendJson(res, 404, { error: `Test run '${runId}' not found` });
        }
        return sendJson(res, 200, {
          runId: job.runId,
          status: job.status,
          message: 'Job cancelled successfully',
        });
      }

      // 5. GET /api/artifacts/:runId/:filename -> Retrieve screenshot artifact
      if ((pathname.startsWith('/api/artifacts') || req.url.startsWith('/api/artifacts')) && method === 'GET') {
        const rawUrlLower = req.url.toLowerCase();
        if (rawUrlLower.includes('..') || rawUrlLower.includes('%2e%2e')) {
          return sendJson(res, 400, { error: 'Invalid artifact request: path traversal rejected' });
        }
      }

      const artifactMatch = pathname.match(/^\/api\/artifacts\/([^\/]+)\/([^\/]+)$/);
      if (artifactMatch && method === 'GET') {
        const runId = artifactMatch[1];
        const filename = artifactMatch[2];

        try {
          validateRunId(runId);
        } catch (e) {
          return sendJson(res, 400, { error: `Invalid run ID: ${e.message}` });
        }

        try {
          validateFilename(filename);
        } catch (e) {
          return sendJson(res, 400, { error: `Invalid filename: ${e.message}` });
        }

        let realPath;
        try {
          realPath = await getArtifactPath(runId, filename);
        } catch (e) {
          return sendJson(res, 403, { error: 'Forbidden' });
        }

        if (!realPath) {
          return sendJson(res, 404, { error: 'Artifact not found' });
        }

        const fileBuffer = fs.readFileSync(realPath);
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': fileBuffer.length,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        });
        res.end(fileBuffer);
        return;
      }

      // Default 404
      return sendJson(res, 404, { error: 'Not Found', path: pathname });

    } catch (err) {
      logger.error('SERVER_ERROR', err.message);
      return sendJson(res, 500, { error: 'Internal Server Error: ' + err.message });
    }
  });
}

let activeServer = null;

export function startServer(port = config.runnerPort, host = config.runnerHost) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(port, host, () => {
      logger.info('SERVER_STARTED', `Extension Runner HTTP server listening on http://${host}:${port}`);
      activeServer = server;
      resolve(server);
    });
    server.on('error', reject);
  });
}

export function stopServer() {
  return new Promise((resolve) => {
    if (activeServer) {
      activeServer.close(() => {
        logger.info('SERVER_STOPPED', 'Extension Runner HTTP server stopped');
        activeServer = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Allow direct execution
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer()
    .then(() => {
      logger.info('RUNNER_READY', 'Ready to accept test run requests from Spring Boot CRM');
    })
    .catch(err => {
      logger.error('START_FAILED', err.message);
      process.exit(1);
    });
}
