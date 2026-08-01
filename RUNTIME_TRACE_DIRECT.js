/**
 * DIRECT RUNTIME TRACE - No Browser Required
 * 
 * Makes authenticated API calls directly and captures:
 * 1. HTTP request/response
 * 2. Backend logs (SQL queries, service traces)
 * 3. Repository results
 * 4. Database inspection
 * 
 * This approach is faster and more reliable than Playwright.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  API_BASE: 'http://localhost:8081/api',
  TEST_EMAIL: 'test1@example.com',
  TEST_PASSWORD: 'password123',
  WORKSPACE_ID: 1,
  BACKEND_LOG: 'c:\\Users\\arjun\\OneDrive\\Desktop\\Task Manager and Chat Application\\crm-backend\\logs\\crm-backend.log',
};

let token = null;
let report = [];
const startTime = Date.now();

// ═══════════════════════════════════════════════════════════════════════════
// HTTP UTILITY
// ═══════════════════════════════════════════════════════════════════════════

function makeRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const urlObj = new URL(url);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
    };

    const req = client.request(urlObj, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            body: data,
            parsedBody: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            body: data,
            parsedBody: null,
            parseError: e.message,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════════════════

function log(section, message, data = null) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${section}: ${message}`;
  console.log(formatted);
  report.push({ timestamp, section, message, data });
}

function readBackendLogsAfter(sinceTime) {
  try {
    const content = fs.readFileSync(CONFIG.BACKEND_LOG, 'utf-8');
    const lines = content.split('\n');
    const filtered = lines.filter(line => {
      // Try to extract timestamp from log line
      const match = line.match(/(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/);
      if (match) {
        const logTime = new Date(match[1]);
        return logTime >= sinceTime;
      }
      return false;
    });
    return filtered;
  } catch (e) {
    return [`Error reading logs: ${e.message}`];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════

async function authenticate() {
  try {
    log('AUTH', 'Attempting to obtain JWT token...');
    
    const response = await makeRequest(
      'POST',
      `${CONFIG.API_BASE}/auth/login`,
      {
        email: CONFIG.TEST_EMAIL,
        password: CONFIG.TEST_PASSWORD,
      }
    );

    if (response.status !== 200) {
      log('AUTH', `❌ Login failed: ${response.status} ${response.statusText}`, response.body);
      return false;
    }

    token = response.parsedBody?.data?.token;
    if (!token) {
      log('AUTH', '❌ No token in response', response.parsedBody);
      return false;
    }

    log('AUTH', `✅ Login successful, token obtained (length: ${token.length})`);
    return true;

  } catch (error) {
    log('AUTH', `❌ Authentication error: ${error.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API CALLS - DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

async function testDashboard() {
  try {
    log('DASHBOARD', 'Starting Dashboard API investigation...');
    const beforeTime = new Date();
    
    log('DASHBOARD', `Making GET /api/dashboard/overview?workspaceId=${CONFIG.WORKSPACE_ID}`);
    
    const response = await makeRequest(
      'GET',
      `${CONFIG.API_BASE}/dashboard/overview?workspaceId=${CONFIG.WORKSPACE_ID}`,
      null,
      { 'Authorization': `Bearer ${token}` }
    );

    log('DASHBOARD', `HTTP ${response.status} ${response.statusText}`, {
      headers: response.headers,
      body: response.body.substring(0, 3000),
    });

    if (response.parsedBody) {
      const stats = response.parsedBody.data;
      log('DASHBOARD', 'Response data', stats);
      
      if (stats) {
        log('DASHBOARD', `Returned stats: tasks=${stats.taskStats}, projects=${stats.projectStats}, notifications=${stats.notificationStats}`);
      }
    }

    // Capture backend logs after the call
    await new Promise(r => setTimeout(r, 1000));
    const backendLogs = readBackendLogsAfter(beforeTime);
    log('DASHBOARD', `Backend logs captured (${backendLogs.length} lines)`, {
      logs: backendLogs.join('\n').substring(0, 5000),
    });

  } catch (error) {
    log('DASHBOARD', `❌ Error: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API CALLS - LEAD MAGNETS
// ═══════════════════════════════════════════════════════════════════════════

async function testLeadMagnets() {
  try {
    log('LEAD_MAGNETS', 'Starting Lead Magnets API investigation...');
    const beforeTime = new Date();
    
    const url = `${CONFIG.API_BASE}/workspaces/${CONFIG.WORKSPACE_ID}/lead-magnets?page=0&size=20`;
    log('LEAD_MAGNETS', `Making GET ${url}`);
    
    const response = await makeRequest(
      'GET',
      url,
      null,
      { 'Authorization': `Bearer ${token}` }
    );

    log('LEAD_MAGNETS', `HTTP ${response.status} ${response.statusText}`, {
      headers: response.headers,
      body: response.body.substring(0, 3000),
    });

    if (response.parsedBody) {
      const data = response.parsedBody.data;
      if (data) {
        log('LEAD_MAGNETS', `Response pagination: totalElements=${data.totalElements}, totalPages=${data.totalPages}, size=${data.size}`);
        log('LEAD_MAGNETS', `Content items: ${data.content ? data.content.length : 0}`);
      }
    }

    // Capture backend logs
    await new Promise(r => setTimeout(r, 1000));
    const backendLogs = readBackendLogsAfter(beforeTime);
    log('LEAD_MAGNETS', `Backend logs captured (${backendLogs.length} lines)`, {
      logs: backendLogs.join('\n').substring(0, 5000),
    });

  } catch (error) {
    log('LEAD_MAGNETS', `❌ Error: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API CALLS - EMAIL CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════

async function testEmailCampaigns() {
  try {
    log('EMAIL_CAMPAIGNS', 'Starting Email Campaigns API investigation...');
    const beforeTime = new Date();
    
    const url = `${CONFIG.API_BASE}/workspaces/${CONFIG.WORKSPACE_ID}/email-campaigns?page=0&size=20`;
    log('EMAIL_CAMPAIGNS', `Making GET ${url}`);
    
    const response = await makeRequest(
      'GET',
      url,
      null,
      { 'Authorization': `Bearer ${token}` }
    );

    log('EMAIL_CAMPAIGNS', `HTTP ${response.status} ${response.statusText}`, {
      headers: response.headers,
      body: response.body.substring(0, 3000),
    });

    if (response.parsedBody) {
      const data = response.parsedBody.data;
      if (data) {
        log('EMAIL_CAMPAIGNS', `Response pagination: totalElements=${data.totalElements}, totalPages=${data.totalPages}, size=${data.size}`);
        log('EMAIL_CAMPAIGNS', `Content items: ${data.content ? data.content.length : 0}`);
      }
    }

    // Capture backend logs
    await new Promise(r => setTimeout(r, 1000));
    const backendLogs = readBackendLogsAfter(beforeTime);
    log('EMAIL_CAMPAIGNS', `Backend logs captured (${backendLogs.length} lines)`, {
      logs: backendLogs.join('\n').substring(0, 5000),
    });

  } catch (error) {
    log('EMAIL_CAMPAIGNS', `❌ Error: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function runInvestigation() {
  try {
    log('START', `Runtime trace investigation started at ${new Date().toISOString()}`);

    const authenticated = await authenticate();
    if (!authenticated) {
      log('START', '❌ Cannot proceed without authentication');
      return;
    }

    // Add delay for log file to catch auth logs
    await new Promise(r => setTimeout(r, 2000));

    await testDashboard();
    await new Promise(r => setTimeout(r, 2000));

    await testLeadMagnets();
    await new Promise(r => setTimeout(r, 2000));

    await testEmailCampaigns();

    log('END', '✅ Investigation complete');

  } catch (error) {
    log('ERROR', `Fatal error: ${error.message}`, { stack: error.stack });
  } finally {
    generateReport();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function generateReport() {
  const duration = Date.now() - startTime;
  const reportPath = path.join(
    'c:\\Users\\arjun\\OneDrive\\Desktop\\Task Manager and Chat Application',
    'RUNTIME_TRACE_REPORT.md'
  );

  let md = `# RUNTIME TRACE INVESTIGATION REPORT\n\n`;
  md += `**Generated**: ${new Date().toISOString()}\n`;
  md += `**Duration**: ${duration}ms\n`;
  md += `**Test User**: ${CONFIG.TEST_EMAIL}\n`;
  md += `**Workspace ID**: ${CONFIG.WORKSPACE_ID}\n\n`;

  md += `## Log Entries (${report.length} total)\n\n`;

  let lastSection = null;
  for (const entry of report) {
    if (entry.section !== lastSection) {
      lastSection = entry.section;
      md += `\n### ${entry.section}\n\n`;
    }

    md += `**${entry.timestamp}**\n`;
    md += `${entry.message}\n`;

    if (entry.data) {
      md += '```json\n';
      const jsonStr = JSON.stringify(entry.data, null, 2);
      md += jsonStr.substring(0, 4000);
      if (jsonStr.length > 4000) md += '\n... (truncated)';
      md += '\n```\n';
    }

    md += '\n';
  }

  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`\n✅ Report written to: ${reportPath}`);
}

// Run it
runInvestigation().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
