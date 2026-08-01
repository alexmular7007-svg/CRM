/**
 * DEEP TRACE INVESTIGATION - Layer-by-layer analysis
 * 
 * Captures backend logs at EACH LAYER and identifies where data disappears:
 * 1. Controller layer logs
 * 2. Service layer logs (including Repository calls)
 * 3. SQL queries executed
 * 4. Database inspection (row counts)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  API_BASE: 'http://localhost:8081/api',
  TEST_EMAIL: 'test1@example.com',
  TEST_PASSWORD: 'password123',
  WORKSPACE_ID: 1,
  BACKEND_LOG: 'c:\\Users\\arjun\\OneDrive\\Desktop\\Task Manager and Chat Application\\crm-backend\\logs\\crm-backend.log',
  DB_HOST: 'db.xkzpzcvwzqjavftrnxjl.supabase.co',
  DB_PORT: 5432,
  DB_NAME: 'postgres',
  DB_USER: 'postgres',
};

let token = null;
let report = [];
const startTime = Date.now();
let lastLogLineCount = 0;

// ═══════════════════════════════════════════════════════════════════════════
// HTTP UTILITY
// ═══════════════════════════════════════════════════════════════════════════

function makeRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? require('https') : http;
    
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
// LOGGING & LOG ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

function log(section, message, data = null) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${section}: ${message}`;
  console.log(formatted);
  report.push({ timestamp, section, message, data });
}

function readBackendLogsLines(startLine = 0, endLine = null) {
  try {
    const content = fs.readFileSync(CONFIG.BACKEND_LOG, 'utf-8');
    const lines = content.split('\n');
    
    if (endLine === null) {
      endLine = lines.length;
    }
    
    return lines.slice(startLine, endLine);
  } catch (e) {
    return [];
  }
}

function getBackendLogNewLines() {
  try {
    const content = fs.readFileSync(CONFIG.BACKEND_LOG, 'utf-8');
    const lines = content.split('\n');
    const currentLineCount = lines.length;
    const newLines = lines.slice(lastLogLineCount);
    lastLogLineCount = currentLineCount;
    return newLines;
  } catch (e) {
    return [];
  }
}

function extractTraceLogsFromContent(content) {
  const lines = content.split('\n');
  const traces = [];
  
  for (const line of lines) {
    if (line.includes('[TRACE-') || line.includes('🟢') || line.includes('SELECT ')) {
      traces.push(line);
    }
  }
  
  return traces;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
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
      log('AUTH', `❌ Login failed: ${response.status}`, response.body.substring(0, 500));
      return false;
    }

    token = response.parsedBody?.data?.token;
    if (!token) {
      log('AUTH', '❌ No token in response');
      return false;
    }

    log('AUTH', `✅ Token obtained`);
    return true;

  } catch (error) {
    log('AUTH', `❌ Error: ${error.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEEP TRACE - DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

async function deepTraceDashboard() {
  log('DASHBOARD_DEEP', 'Starting Dashboard deep trace investigation...');
  
  const beforeTime = Date.now();
  const beforeLogs = getBackendLogNewLines();
  
  log('DASHBOARD_DEEP', 'Making API call...');
  const response = await makeRequest(
    'GET',
    `${CONFIG.API_BASE}/dashboard/overview?workspaceId=${CONFIG.WORKSPACE_ID}`,
    null,
    { 'Authorization': `Bearer ${token}` }
  );
  
  log('DASHBOARD_DEEP', `HTTP ${response.status}`, {
    data: response.parsedBody?.data || null,
  });
  
  // Wait for logs to be written
  await sleep(2000);
  
  const newLogs = getBackendLogNewLines();
  const traceLogs = extractTraceLogsFromContent(newLogs.join('\n'));
  
  log('DASHBOARD_DEEP', `Backend trace logs (${traceLogs.length} lines)`, {
    logs: traceLogs.slice(0, 50).join('\n'),
  });
  
  // Check for SQL queries
  const sqlLines = newLogs.filter(l => l.toUpperCase().includes('SELECT'));
  log('DASHBOARD_DEEP', `SQL queries captured (${sqlLines.length})`, {
    queries: sqlLines.slice(0, 10).map(l => l.substring(0, 200)),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DEEP TRACE - LEAD MAGNETS
// ═══════════════════════════════════════════════════════════════════════════

async function deepTraceLeadMagnets() {
  log('LEAD_MAGNETS_DEEP', 'Starting Lead Magnets deep trace investigation...');
  
  const beforeTime = Date.now();
  getBackendLogNewLines(); // Clear log buffer
  
  log('LEAD_MAGNETS_DEEP', 'Making API call...');
  const response = await makeRequest(
    'GET',
    `${CONFIG.API_BASE}/workspaces/${CONFIG.WORKSPACE_ID}/lead-magnets?page=0&size=20`,
    null,
    { 'Authorization': `Bearer ${token}` }
  );
  
  log('LEAD_MAGNETS_DEEP', `HTTP ${response.status}`, {
    totalElements: response.parsedBody?.data?.totalElements || 0,
    items: response.parsedBody?.data?.content?.length || 0,
  });
  
  // Wait for logs to be written
  await sleep(2000);
  
  const newLogs = getBackendLogNewLines();
  const traceLogs = extractTraceLogsFromContent(newLogs.join('\n'));
  
  log('LEAD_MAGNETS_DEEP', `Backend trace logs (${traceLogs.length} lines)`, {
    logs: traceLogs.slice(0, 50).join('\n'),
  });
  
  // Check for SQL queries
  const sqlLines = newLogs.filter(l => l.toUpperCase().includes('SELECT'));
  log('LEAD_MAGNETS_DEEP', `SQL queries captured (${sqlLines.length})`, {
    queries: sqlLines.slice(0, 10).map(l => l.substring(0, 200)),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DEEP TRACE - EMAIL CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════

async function deepTraceEmailCampaigns() {
  log('EMAIL_CAMPAIGNS_DEEP', 'Starting Email Campaigns deep trace investigation...');
  
  const beforeTime = Date.now();
  getBackendLogNewLines(); // Clear log buffer
  
  log('EMAIL_CAMPAIGNS_DEEP', 'Making API call...');
  const response = await makeRequest(
    'GET',
    `${CONFIG.API_BASE}/workspaces/${CONFIG.WORKSPACE_ID}/email-campaigns?page=0&size=20`,
    null,
    { 'Authorization': `Bearer ${token}` }
  );
  
  log('EMAIL_CAMPAIGNS_DEEP', `HTTP ${response.status}`, {
    totalElements: response.parsedBody?.data?.totalElements || 0,
    items: response.parsedBody?.data?.content?.length || 0,
  });
  
  // Wait for logs to be written
  await sleep(2000);
  
  const newLogs = getBackendLogNewLines();
  const traceLogs = extractTraceLogsFromContent(newLogs.join('\n'));
  
  log('EMAIL_CAMPAIGNS_DEEP', `Backend trace logs (${traceLogs.length} lines)`, {
    logs: traceLogs.slice(0, 50).join('\n'),
  });
  
  // Check for SQL queries
  const sqlLines = newLogs.filter(l => l.toUpperCase().includes('SELECT'));
  log('EMAIL_CAMPAIGNS_DEEP', `SQL queries captured (${sqlLines.length})`, {
    queries: sqlLines.slice(0, 10).map(l => l.substring(0, 200)),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function runInvestigation() {
  try {
    log('START', 'Deep trace investigation started');

    const authenticated = await authenticate();
    if (!authenticated) {
      log('START', '❌ Authentication failed');
      return;
    }

    await sleep(2000);

    await deepTraceDashboard();
    await sleep(3000);

    await deepTraceLeadMagnets();
    await sleep(3000);

    await deepTraceEmailCampaigns();

    log('END', '✅ Deep trace investigation complete');

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
    'DEEP_TRACE_REPORT.md'
  );

  let md = `# DEEP TRACE INVESTIGATION REPORT\n\n`;
  md += `**Generated**: ${new Date().toISOString()}\n`;
  md += `**Duration**: ${duration}ms\n\n`;

  md += `## Summary\n\n`;
  md += `- Test User: ${CONFIG.TEST_EMAIL}\n`;
  md += `- Workspace ID: ${CONFIG.WORKSPACE_ID}\n`;
  md += `- Total Log Entries: ${report.length}\n\n`;

  md += `## Investigation Logs\n\n`;

  let lastSection = null;
  for (const entry of report) {
    if (entry.section !== lastSection) {
      lastSection = entry.section;
      md += `\n### ${entry.section}\n\n`;
    }

    md += `**${entry.timestamp}**  \n`;
    md += `${entry.message}\n`;

    if (entry.data) {
      md += '\n```\n';
      const jsonStr = JSON.stringify(entry.data, null, 2);
      md += jsonStr.substring(0, 6000);
      if (jsonStr.length > 6000) md += '\n... (truncated)';
      md += '\n```\n';
    }

    md += '\n';
  }

  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`\n✅ Report written to: ${reportPath}\n`);
}

// Run it
runInvestigation().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
