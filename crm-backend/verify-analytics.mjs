import http from 'http';

const BASE = 'http://localhost:8081/api';
const email = 'analytics.test.1786790436377@example.com';
const password = 'securePassword123';
const workspaceId = 29;
const campaignId = 6;

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
  // Login
  let r = await request('POST', '/auth/login', { email, password });
  console.log('Login:', r.status);
  const token = r.body?.data?.token || r.body?.token;
  if (!token) { console.log('No token'); return; }

  // Analytics
  r = await request('GET', `/workspaces/${workspaceId}/email-campaigns/${campaignId}/analytics`, null, token);
  console.log('\nAnalytics status:', r.status);
  console.log('Analytics data:', JSON.stringify(r.body?.data || r.body));

  // Recipients
  r = await request('GET', `/workspaces/${workspaceId}/email-campaigns/${campaignId}/recipients`, null, token);
  const recs = r.body?.data?.content || [];
  console.log('\nRecipients:');
  recs.forEach(x => console.log(` - ${x.recipientEmail}: status=${x.status}, deliveredAt=${x.deliveredAt}, openedAt=${x.openedAt}, clickCount=${x.clickCount}`));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });