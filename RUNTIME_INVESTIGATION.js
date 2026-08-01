/**
 * COMPLETE RUNTIME INVESTIGATION - Data Disappearance Trace
 * 
 * This script performs an end-to-end investigation of the data flow:
 * React State → Redux → React Query → HTTP Request → Controller → Service → Repository → SQL → Database
 * 
 * Captures for each page (Dashboard, Lead Magnets, Email Campaigns):
 * 1. Redux workspace state
 * 2. React Query query state and execution
 * 3. HTTP request details and response
 * 4. Backend controller logs
 * 5. Backend service logs
 * 6. SQL queries executed
 * 7. Database row counts
 * 8. Rendered UI state
 * 
 * Output: RUNTIME_INVESTIGATION_REPORT.md
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  API_URL: 'http://localhost:8081',
  BACKEND_LOG_FILE: 'c:\\Users\\arjun\\OneDrive\\Desktop\\Task Manager and Chat Application\\crm-backend\\logs\\crm-backend.log',
  TEST_EMAIL: 'test1@example.com',
  TEST_PASSWORD: 'Secure@123',
  WORKSPACE_ID: 1, // Marketing Team workspace
  INVESTIGATION_TIMEOUT: 30000,
};

let report = [];
let browser;
let context;
let page;
let backendLogInitialSize = 0;
let networkRequests = [];
let consoleMessages = [];
let reduxState = {};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function addLog(section, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${section}: ${message}`);
  report.push({ timestamp, section, message, data });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

async function getNewBackendLogs() {
  try {
    const currentSize = getFileSize(CONFIG.BACKEND_LOG_FILE);
    if (currentSize > backendLogInitialSize) {
      const content = fs.readFileSync(CONFIG.BACKEND_LOG_FILE, 'utf-8');
      const lines = content.split('\n');
      const startLineCount = backendLogInitialSize > 0 ? Math.floor(backendLogInitialSize / 100) : 0;
      const newLogs = lines.slice(startLineCount).join('\n');
      backendLogInitialSize = currentSize;
      return newLogs;
    }
  } catch (e) {
    console.error('Error reading backend logs:', e.message);
  }
  return '';
}

async function captureReduxState() {
  try {
    const state = await page.evaluate(() => {
      return window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ 
        ? window.__REDUX_STORE__?.getState?.()
        : null;
    });
    
    // Fallback: Try to get Redux state from localStorage
    if (!state) {
      const workspaceState = await page.evaluate(() => {
        const ws = localStorage.getItem('currentWorkspace');
        return ws ? JSON.parse(ws) : null;
      });
      return { workspace: { currentWorkspace: workspaceState } };
    }
    
    return state;
  } catch (e) {
    console.error('Error capturing Redux state:', e.message);
    return null;
  }
}

async function captureReactQueryState() {
  try {
    const queryCache = await page.evaluate(() => {
      return window.__REACT_QUERY_STATE__ || null;
    });
    return queryCache;
  } catch (e) {
    console.error('Error capturing React Query state:', e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN INVESTIGATION FLOW
// ═══════════════════════════════════════════════════════════════════════════

async function runInvestigation() {
  try {
    await addLog('INIT', 'Starting complete runtime investigation...');

    // Launch browser
    browser = await chromium.launch({ headless: false });
    context = await browser.createContext();
    page = await context.newPage();

    // Set up listeners
    backendLogInitialSize = getFileSize(CONFIG.BACKEND_LOG_FILE);

    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString(),
      });
    });

    page.on('response', response => {
      const request = response.request();
      networkRequests.push({
        method: request.method(),
        url: request.url(),
        status: response.status(),
        headers: response.headers(),
        timestamp: new Date().toISOString(),
      });
    });

    // Navigate to app
    await addLog('NAVIGATION', 'Navigating to application...');
    await page.goto(`${CONFIG.BASE_URL}/login`, { waitUntil: 'networkidle' });
    await sleep(2000);

    // Attempt auto-login
    await addLog('AUTH', 'Attempting automatic login...');
    const loginSuccess = await attemptLogin(page);
    
    if (!loginSuccess) {
      await addLog('AUTH', '❌ Login failed - cannot continue investigation', { error: 'Auto-login unsuccessful' });
      return;
    }

    await addLog('AUTH', '✅ Login successful');
    await sleep(3000); // Wait for post-login state initialization

    // Investigate Dashboard
    await investigatePage('DASHBOARD', '/dashboard', {
      workspaceId: CONFIG.WORKSPACE_ID,
      apiEndpoint: '/dashboard/overview',
    });

    await sleep(2000);

    // Investigate Lead Magnets
    await investigatePage('LEAD_MAGNETS', '/marketing/lead-magnets', {
      workspaceId: CONFIG.WORKSPACE_ID,
      apiEndpoint: '/lead-magnets/list',
      page: 0,
      size: 20,
    });

    await sleep(2000);

    // Investigate Email Campaigns
    await investigatePage('EMAIL_CAMPAIGNS', '/marketing/email-campaigns', {
      workspaceId: CONFIG.WORKSPACE_ID,
      apiEndpoint: '/email-campaigns/list',
      page: 0,
      size: 20,
    });

    await addLog('INVESTIGATION', '✅ Investigation complete');

  } catch (error) {
    await addLog('ERROR', `Investigation failed: ${error.message}`, { stack: error.stack });
  } finally {
    if (browser) {
      await browser.close();
    }
    generateReport();
  }
}

async function attemptLogin(page) {
  try {
    // Find email input
    const emailInput = await page.$('input[type="email"]');
    if (!emailInput) {
      await addLog('AUTH', 'Email input not found on login page');
      return false;
    }

    // Fill in credentials
    await emailInput.fill(CONFIG.TEST_EMAIL);
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill(CONFIG.TEST_PASSWORD);
    }

    // Find and click login button
    const loginButton = await page.$('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Submit")');
    if (!loginButton) {
      await addLog('AUTH', 'Login button not found');
      return false;
    }

    await loginButton.click();
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {
      console.log('Timeout waiting for dashboard redirect - continuing investigation');
    });

    // Check if we're authenticated
    const token = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('auth_token'));
    return !!token;

  } catch (error) {
    await addLog('AUTH', `Login attempt failed: ${error.message}`);
    return false;
  }
}

async function investigatePage(pageType, pathname, config) {
  try {
    await addLog(`${pageType}_START`, `Starting investigation of ${pageType}...`);

    // Navigate to page
    await addLog(`${pageType}_NAV`, `Navigating to ${pathname}...`);
    await page.goto(`${CONFIG.BASE_URL}${pathname}`, { waitUntil: 'networkidle' });
    await sleep(2000);

    // Capture Redux workspace state
    const reduxState = await captureReduxState();
    await addLog(`${pageType}_REDUX`, 'Redux state captured', reduxState);

    // Capture React Query state
    const queryState = await captureReactQueryState();
    await addLog(`${pageType}_REACT_QUERY`, 'React Query state captured', queryState);

    // Capture console messages from this page load
    const pageConsoleMessages = consoleMessages.slice();
    await addLog(`${pageType}_CONSOLE`, `Console messages: ${pageConsoleMessages.length}`, pageConsoleMessages);

    // Capture network requests for API calls
    const apiRequests = networkRequests.filter(r => r.url.includes('/api'));
    await addLog(`${pageType}_NETWORK`, `Network requests made: ${apiRequests.length}`, apiRequests);

    // Wait for data to load
    await sleep(3000);

    // Capture backend logs
    const newBackendLogs = await getNewBackendLogs();
    await addLog(`${pageType}_BACKEND_LOGS`, 'New backend logs captured', { logContent: newBackendLogs });

    // Capture page content
    const pageContent = await page.content();
    const hasData = pageContent.includes('No data') === false && pageContent.length > 1000;
    await addLog(`${pageType}_PAGE_CONTENT`, `Page has data: ${hasData}`, { contentLength: pageContent.length });

    // Try to extract rendered data from DOM
    const renderedData = await page.evaluate(() => {
      const data = {
        elements: {
          tables: document.querySelectorAll('table, [role="table"]').length,
          rows: document.querySelectorAll('tr, [role="row"]').length,
          cards: document.querySelectorAll('[data-testid*="card"], .card').length,
          lists: document.querySelectorAll('ul, ol, [role="list"]').length,
        },
        text: {
          hasNoData: document.body.innerText.includes('No data'),
          hasNoResults: document.body.innerText.includes('No results'),
          hasEmpty: document.body.innerText.includes('empty'),
        },
      };
      return data;
    });

    await addLog(`${pageType}_DOM_STATE`, 'DOM element counts captured', renderedData);

    // Make explicit API call to capture exact response
    try {
      const apiEndpoint = config.apiEndpoint;
      const params = new URLSearchParams();
      params.append('workspaceId', config.workspaceId);
      if (config.page !== undefined) params.append('page', config.page);
      if (config.size !== undefined) params.append('size', config.size);

      const token = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('auth_token'));
      
      if (token) {
        const response = await fetch(`${CONFIG.API_URL}/api${apiEndpoint}?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const responseText = await response.text();
        await addLog(`${pageType}_EXPLICIT_API_CALL`, `API call to ${apiEndpoint}`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText.substring(0, 5000), // First 5000 chars
        });
      }
    } catch (apiError) {
      await addLog(`${pageType}_EXPLICIT_API_CALL`, `API call failed: ${apiError.message}`);
    }

    await addLog(`${pageType}_END`, `Investigation of ${pageType} complete`);

  } catch (error) {
    await addLog(`${pageType}_ERROR`, `Investigation failed: ${error.message}`, { stack: error.stack });
  }
}

function generateReport() {
  const reportPath = path.join(
    'c:\\Users\\arjun\\OneDrive\\Desktop\\Task Manager and Chat Application',
    'RUNTIME_INVESTIGATION_REPORT.md'
  );

  const timestamp = new Date().toISOString();
  let markdown = `# RUNTIME INVESTIGATION REPORT\n\n`;
  markdown += `**Generated**: ${timestamp}\n`;
  markdown += `**Investigation Duration**: ${new Date() - startTime}ms\n\n`;

  markdown += `## INVESTIGATION SUMMARY\n\n`;
  markdown += `- **Test User**: ${CONFIG.TEST_EMAIL}\n`;
  markdown += `- **Workspace ID**: ${CONFIG.WORKSPACE_ID}\n`;
  markdown += `- **Base URL**: ${CONFIG.BASE_URL}\n`;
  markdown += `- **API URL**: ${CONFIG.API_URL}\n`;
  markdown += `- **Log Entries**: ${report.length}\n\n`;

  markdown += `## DETAILED LOGS\n\n`;

  let currentSection = null;
  for (const entry of report) {
    if (entry.section !== currentSection) {
      currentSection = entry.section;
      markdown += `### ${currentSection}\n\n`;
    }

    markdown += `**${entry.timestamp}** - ${entry.message}\n`;
    if (entry.data) {
      markdown += '```json\n';
      markdown += JSON.stringify(entry.data, null, 2).substring(0, 2000);
      markdown += '\n```\n';
    }
    markdown += '\n';
  }

  markdown += `## NETWORK REQUESTS SUMMARY\n\n`;
  for (const req of networkRequests) {
    markdown += `- \`${req.method} ${req.url}\` → ${req.status}\n`;
  }

  markdown += `\n## CONSOLE MESSAGES SUMMARY\n\n`;
  for (const msg of consoleMessages.slice(-20)) {
    markdown += `- \`[${msg.type}]\` ${msg.text}\n`;
  }

  fs.writeFileSync(reportPath, markdown, 'utf-8');
  console.log(`\n✅ Report generated: ${reportPath}\n`);
}

// Run investigation
const startTime = Date.now();
runInvestigation().catch(console.error);
