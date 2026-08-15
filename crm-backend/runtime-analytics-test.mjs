import http from 'http';

const BASE = 'http://localhost:8081/api';
const email = 'analytics.test.' + Date.now() + '@example.com';
const password = 'securePassword123';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request(BASE + path, { method, headers }, (res) => {
      let responseBody = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(responseBody); } catch (e) { parsed = responseBody; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== EMAIL CAMPAIGN ANALYTICS RUNTIME TEST ===');
  console.log('Test user:', email);

  // 1. Register
  let r = await request('POST', '/auth/register', {
    fullName: 'Analytics Test User',
    email,
    password,
    role: 'USER'
  });
  console.log('\n[1] Register:', r.status);
  if (r.status !== 201 && r.status !== 200) {
    console.log('Register failed:', JSON.stringify(r.body));
    return;
  }

  // 2. Login
  r = await request('POST', '/auth/login', { email, password });
  console.log('[2] Login:', r.status);
  const token = r.body?.data?.token || r.body?.token || r.body?.data?.accessToken;
  if (!token) {
    console.log('No token in login response:', JSON.stringify(r.body).slice(0, 500));
    return;
  }
  console.log('Token obtained:', token.slice(0, 20) + '...');

  // 3. Get or create workspace
  r = await request('GET', '/workspaces', null, token);
  console.log('[3] List workspaces:', r.status);
  let workspaceId = r.body?.data?.content?.[0]?.id || r.body?.data?.[0]?.id;
  if (!workspaceId) {
    r = await request('POST', '/workspaces', { name: 'Analytics Test WS ' + Date.now() }, token);
    console.log('   Create workspace:', r.status);
    workspaceId = r.body?.data?.id;
  }
  console.log('Workspace ID:', workspaceId);
  if (!workspaceId) {
    console.log('No workspace available:', JSON.stringify(r.body).slice(0, 300));
    return;
  }

  // 4. Create a campaign
  r = await request('POST', `/workspaces/${workspaceId}/email-campaigns`, {
    name: 'Analytics Runtime Test ' + Date.now(),
    subject: 'Analytics Test Subject',
    contentType: 'CUSTOM_HTML',
    htmlContent: '<html><body><h1>Test</h1><a href="https://example.com">Click</a></body></html>',
    recipientMode: 'MANUAL',
    status: 'DRAFT'
  }, token);
  console.log('[4] Create campaign:', r.status);
  const campaignId = r.body?.data?.id;
  console.log('Campaign ID:', campaignId);
  if (!campaignId) {
    console.log('Create campaign failed:', JSON.stringify(r.body).slice(0, 500));
    return;
  }

  // 5. Add recipients
  r = await request('POST', `/workspaces/${workspaceId}/email-campaigns/${campaignId}/recipients`, {
    recipients: [
      { email: 'recipient1@example.com', name: 'Recipient One' },
      { email: 'recipient2@example.com', name: 'Recipient Two' }
    ]
  }, token);
  console.log('[5] Add recipients:', r.status);

  // 6. Get analytics (before send - should show 0 metrics)
  r = await request('GET', `/workspaces/${workspaceId}/email-campaigns/${campaignId}/analytics`, null, token);
  console.log('[6] Analytics (before send):', r.status);
  console.log('   Response:', JSON.stringify(r.body?.data || r.body).slice(0, 600));

  // 7. List recipients
  r = await request('GET', `/workspaces/${workspaceId}/email-campaigns/${campaignId}/recipients`, null, token);
  console.log('[7] List recipients:', r.status);
  const recipients = r.body?.data?.content || [];
  console.log('   Recipient count:', recipients.length);
  recipients.forEach(rec => {
    console.log(`   - ${rec.recipientEmail}: status=${rec.status}, deliveredAt=${rec.deliveredAt}, openedAt=${rec.openedAt}, clickCount=${rec.clickCount}`);
  });

  console.log('\n=== TEST COMPLETE ===');
  console.log('Campaign ID for manual webhook test:', campaignId);
  console.log('Workspace ID:', workspaceId);
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});