import { chromium } from 'playwright';
import fs from 'fs';

const REPORT = [];
const API_RESPONSES = {};
const CONSOLE_LOGS = {};
const BACKEND_LOGS = [];

function log(msg) {
  console.log(msg);
  REPORT.push(msg);
}

async function captureBackendLogs() {
  // Capture backend logs from the running process
  try {
    const logsPath = 'c:\\Users\\arjun\\OneDrive\\Desktop\\Task Manager and Chat Application\\crm-backend\\logs\\crm-backend.log';
    if (fs.existsSync(logsPath)) {
      const content = fs.readFileSync(logsPath, 'utf-8');
      const lines = content.split('\n').slice(-200); // Last 200 lines
      return lines.join('\n');
    }
  } catch (e) {
    console.log('Could not read backend logs:', e.message);
  }
  return 'Backend logs not available';
}

async function investigation() {
  log('\n════════════════════════════════════════════════════════════════');
  log('           RUNTIME INVESTIGATION - AUTOMATED PLAYRIGHT TEST');
  log('════════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept all network requests
  const networkLog = [];
  page.on('request', request => {
    networkLog.push({
      method: request.method(),
      url: request.url(),
      time: new Date().toISOString()
    });
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/')) {
      response.text().then(body => {
        API_RESPONSES[url] = {
          status: response.status(),
          body: body.slice(0, 500) // First 500 chars
        };
      }).catch(() => {});
    }
  });

  // Capture console logs
  const currentConsoleLogs = [];
  page.on('console', msg => {
    currentConsoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    log('STEP 1: Navigate to localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    log('✓ Page loaded');

    // Check if already logged in
    let isLoggedIn = false;
    try {
      await page.waitForSelector('[data-testid="dashboard-link"]', { timeout: 5000 }).catch(() => {});
      isLoggedIn = page.url().includes('/dashboard') || page.url().includes('/workspaces');
    } catch (e) {}

    if (!isLoggedIn) {
      log('\nSTEP 2: Attempting login');
      
      // Look for email input
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.fill('test@example.com');
        const passwordInput = await page.$('input[type="password"]');
        if (passwordInput) {
          await passwordInput.fill('TestPassword123!');
          const loginBtn = await page.$('button:has-text("Login")') || await page.$('button:has-text("Sign in")');
          if (loginBtn) {
            await loginBtn.click();
            await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
            await page.waitForTimeout(2000);
            isLoggedIn = page.url().includes('/dashboard') || page.url().includes('/workspaces');
          }
        }
      }
    }

    if (!isLoggedIn) {
      log('⚠ Could not auto-login. Checking current page URL and content...');
      log('Current URL: ' + page.url());
      const pageContent = await page.content();
      log('Page contains auth form: ' + pageContent.includes('Login'));
      log('Proceeding with investigation if workspace page is visible...');
    } else {
      log('✓ Successfully logged in');
    }

    // Wait for app to stabilize
    await page.waitForTimeout(3000);

    // ─────────────────────────────────────────────────────────────
    // DASHBOARD
    // ─────────────────────────────────────────────────────────────
    log('\n' + '='.repeat(70));
    log('PAGE: DASHBOARD');
    log('='.repeat(70));

    CONSOLE_LOGS['dashboard'] = [];
    page.on('console', msg => {
      if (msg.text().includes('[Dashboard]') || msg.text().includes('[analyticsService]')) {
        CONSOLE_LOGS['dashboard'].push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    log('\n[Redux State]');
    const workspaceState = await page.evaluate(() => {
      return window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? null : 
        (window.__store ? window.__store.getState().workspace : 'Store not accessible');
    }).catch(() => 'Cannot access Redux directly via evaluation');
    log('currentWorkspace: ' + JSON.stringify(workspaceState));

    log('\n[React Query Status]');
    const queryState = await page.evaluate(() => {
      return document.body.innerText.includes('0') ? 'Query returned zeros' : 'Check UI rendering';
    });
    log('Query result: ' + queryState);

    log('\n[HTTP Requests in Network Log]');
    const dashboardRequests = networkLog.filter(r => r.url.includes('/dashboard/overview'));
    if (dashboardRequests.length > 0) {
      dashboardRequests.forEach(r => log(`✓ ${r.method} ${r.url}`));
    } else {
      log('✗ NO HTTP REQUEST FOUND for /dashboard/overview');
    }

    log('\n[Console Logs]');
    CONSOLE_LOGS['dashboard'].forEach(l => log(l));

    log('\n[API Response]');
    const dashboardApiUrl = Object.keys(API_RESPONSES).find(u => u.includes('/dashboard/overview'));
    if (dashboardApiUrl) {
      log(`Status: ${API_RESPONSES[dashboardApiUrl].status}`);
      log(`Response: ${API_RESPONSES[dashboardApiUrl].body}`);
    } else {
      log('✗ NO API RESPONSE CAPTURED');
    }

    log('\n[Rendered UI]');
    const dashboardStats = await page.locator('text=Total Tasks').isVisible().catch(() => false);
    const dashboardZeros = await page.locator('text=/^0$/').count();
    log(`UI shows stats: ${dashboardStats}`);
    log(`Number of "0" values visible: ${dashboardZeros}`);

    // ─────────────────────────────────────────────────────────────
    // LEAD MAGNETS
    // ─────────────────────────────────────────────────────────────
    log('\n' + '='.repeat(70));
    log('PAGE: LEAD MAGNETS');
    log('='.repeat(70));

    CONSOLE_LOGS['leadMagnets'] = [];
    page.on('console', msg => {
      if (msg.text().includes('[LeadMagnets]') || msg.text().includes('lead-magnets')) {
        CONSOLE_LOGS['leadMagnets'].push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    await page.goto('http://localhost:3000/marketing/lead-magnets', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    log('\n[Redux State]');
    const workspaceState2 = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Lead Magnets') ? 'Page loaded' : 'Page not loaded';
    });
    log('workspace status: ' + workspaceState2);

    log('\n[HTTP Requests]');
    const leadMagnetRequests = networkLog.filter(r => r.url.includes('/lead-magnets'));
    if (leadMagnetRequests.length > 0) {
      leadMagnetRequests.forEach(r => log(`✓ ${r.method} ${r.url}`));
    } else {
      log('✗ NO HTTP REQUEST FOUND for /lead-magnets');
    }

    log('\n[Console Logs]');
    CONSOLE_LOGS['leadMagnets'].forEach(l => log(l));

    log('\n[API Response]');
    const leadMagnetApiUrl = Object.keys(API_RESPONSES).find(u => u.includes('/lead-magnets'));
    if (leadMagnetApiUrl) {
      log(`Status: ${API_RESPONSES[leadMagnetApiUrl].status}`);
      log(`Response: ${API_RESPONSES[leadMagnetApiUrl].body}`);
    } else {
      log('✗ NO API RESPONSE CAPTURED');
    }

    log('\n[Rendered UI]');
    const noMagnetsMsg = await page.locator('text=/No campaigns|no lead|campaigns yet/i').isVisible().catch(() => false);
    const magnetTable = await page.locator('table').count();
    log(`"No campaigns" message visible: ${noMagnetsMsg}`);
    log(`Table rows visible: ${magnetTable}`);

    // ─────────────────────────────────────────────────────────────
    // EMAIL CAMPAIGNS
    // ─────────────────────────────────────────────────────────────
    log('\n' + '='.repeat(70));
    log('PAGE: EMAIL CAMPAIGNS');
    log('='.repeat(70));

    CONSOLE_LOGS['emailCampaigns'] = [];
    page.on('console', msg => {
      if (msg.text().includes('[EmailCampaigns]') || msg.text().includes('email-campaigns')) {
        CONSOLE_LOGS['emailCampaigns'].push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    await page.goto('http://localhost:3000/marketing/email-campaigns', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    log('\n[HTTP Requests]');
    const emailCampaignRequests = networkLog.filter(r => r.url.includes('/email-campaigns'));
    if (emailCampaignRequests.length > 0) {
      emailCampaignRequests.forEach(r => log(`✓ ${r.method} ${r.url}`));
    } else {
      log('✗ NO HTTP REQUEST FOUND for /email-campaigns');
    }

    log('\n[Console Logs]');
    CONSOLE_LOGS['emailCampaigns'].forEach(l => log(l));

    log('\n[API Response]');
    const emailCampaignApiUrl = Object.keys(API_RESPONSES).find(u => u.includes('/email-campaigns'));
    if (emailCampaignApiUrl) {
      log(`Status: ${API_RESPONSES[emailCampaignApiUrl].status}`);
      log(`Response: ${API_RESPONSES[emailCampaignApiUrl].body}`);
    } else {
      log('✗ NO API RESPONSE CAPTURED');
    }

    log('\n[Rendered UI]');
    const noCampaignsMsg = await page.locator('text=/No email campaigns|no campaigns|campaigns found/i').isVisible().catch(() => false);
    const campaignTable = await page.locator('table').count();
    log(`"No campaigns" message visible: ${noCampaignsMsg}`);
    log(`Table rows visible: ${campaignTable}`);

    // ─────────────────────────────────────────────────────────────
    // BACKEND LOGS
    // ─────────────────────────────────────────────────────────────
    log('\n' + '='.repeat(70));
    log('BACKEND LOGS');
    log('='.repeat(70));
    
    // Try to capture backend process output
    log('\n[Attempting to fetch backend logs]');
    log('Note: See separate terminal where backend is running for detailed logs');
    log('Look for messages starting with:');
    log('  - 🟢 [DashboardController]');
    log('  - 🟢 [LeadMagnetAdminController]');
    log('  - 🟢 [EmailCampaignController]');

    // ─────────────────────────────────────────────────────────────
    // ANALYSIS
    // ─────────────────────────────────────────────────────────────
    log('\n' + '='.repeat(70));
    log('ANALYSIS & ROOT CAUSE');
    log('='.repeat(70));

    log('\n[Summary]');
    const hasDashboardRequest = networkLog.some(r => r.url.includes('/dashboard/overview'));
    const hasLeadMagnetRequest = networkLog.some(r => r.url.includes('/lead-magnets'));
    const hasEmailCampaignRequest = networkLog.some(r => r.url.includes('/email-campaigns'));

    log(`Dashboard API Request: ${hasDashboardRequest ? '✓ FOUND' : '✗ NOT FOUND'}`);
    log(`Lead Magnet API Request: ${hasLeadMagnetRequest ? '✓ FOUND' : '✗ NOT FOUND'}`);
    log(`Email Campaign API Request: ${hasEmailCampaignRequest ? '✓ FOUND' : '✗ NOT FOUND'}`);

    if (!hasDashboardRequest || !hasLeadMagnetRequest || !hasEmailCampaignRequest) {
      log('\n[ROOT CAUSE]');
      log('API Requests are NOT being made from frontend.');
      log('Likely causes:');
      log('  1. React Query "enabled" condition is FALSE (currentWorkspace.id is null/undefined)');
      log('  2. Component rendered before workspace was loaded from Redux');
      log('  3. Query disabled before it had a chance to execute');
    }

  } catch (error) {
    log(`\n✗ Error during investigation: ${error.message}`);
    log(error.stack);
  } finally {
    await browser.close();
  }

  // ─────────────────────────────────────────────────────────────
  // WRITE REPORT
  // ─────────────────────────────────────────────────────────────
  const reportPath = 'runtime-investigation-report.txt';
  fs.writeFileSync(reportPath, REPORT.join('\n'));
  log(`\n\n✓ Report saved to: ${reportPath}`);
}

investigation().catch(console.error);
