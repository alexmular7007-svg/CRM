# Phase 12.3 — Real End-to-End Business Workflow Test Protocol

**Status**: Testing Blueprint & Analysis Document  
**Purpose**: Verify all 6 customer-facing workflows function correctly after Phase 12.2 CRITICAL fixes  
**Target Environment**: Production-like deployment with database, Brevo API, external email  
**Date**: August 24, 2026  

---

## Executive Summary

Phase 12.3 defines comprehensive end-to-end workflow tests for 6 critical business processes. Each workflow includes:

1. **REQUEST**: HTTP request details (method, endpoint, payload)
2. **RESPONSE**: Expected HTTP status and response structure
3. **DATABASE RESULT**: Expected database state changes
4. **FRONTEND RESULT**: Expected UI updates and state changes
5. **EXTERNAL SERVICE RESULT**: Third-party service interactions (Brevo, Gmail, etc.)

Each workflow is tested for **complete business success**, not just HTTP 200 status.

---

## Pre-Test Setup Requirements

### Environment
- Backend running on `http://localhost:8081`
- Frontend running on `http://localhost:5173` or deployed URL
- Supabase PostgreSQL database accessible
- Brevo API key configured and validated
- Gmail account for webhook testing with working inbox

### Test Accounts
- **Workspace Owner**: test-owner@example.com / password
- **Test Workspace**: "E2E Test Workspace" (workspace_id = 1)
- **Email for Leads**: test-lead@example.com
- **Brevo Webhook Account**: Verified email in Brevo dashboard

### Tools Required
- Browser with Developer Tools (Network tab, Storage)
- Database GUI or CLI (psql/pgAdmin) for direct query verification
- Gmail inbox access
- Brevo dashboard (for webhook verification)
- Postman or curl for API testing

### Initial Database State
```sql
-- Clean state before each workflow
DELETE FROM email_campaign_analytics WHERE workspace_id = 1;
DELETE FROM email_campaign_recipients WHERE campaign_id IN (SELECT id FROM email_campaigns WHERE workspace_id = 1);
DELETE FROM email_campaigns WHERE workspace_id = 1;
DELETE FROM email_templates WHERE workspace_id = 1;
DELETE FROM automation_executions WHERE workspace_id = 1;
DELETE FROM automations WHERE workspace_id = 1;
DELETE FROM leads WHERE workspace_id = 1;
DELETE FROM lead_magnets WHERE workspace_id = 1;
```

---

## WORKFLOW 1: LEAD MAGNET

**Business Flow**: Visitor → Lead Magnet → Submit → Lead created → CRM record appears

### Test Scenario
A visitor submits their email via a public lead magnet form. The lead should be created in the CRM and appear in the workspace owner's dashboard.

### Step 1.1: Submit Lead Magnet Form

**REQUEST**
```http
POST /api/lead-magnets/submit
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "phone": "+1-555-123-4567",
  "company": "Tech Corp",
  "leadMagnetId": 1
}
```

**Expected Response (200 OK)**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "leadId": 42,
  "email": "john.doe@company.com"
}
```

### Step 1.2: Verify DATABASE RESULT

**Query**: Check lead exists in database
```sql
SELECT id, name, email, phone, company, workspace_id, created_at 
FROM leads 
WHERE email = 'john.doe@company.com' AND workspace_id = 1;
```

**Expected Result**:
- Lead record created with id = 42
- name = "John Doe"
- email = "john.doe@company.com"
- phone = "+1-555-123-4567"
- company = "Tech Corp"
- workspace_id = 1
- created_at ≈ current timestamp
- **CRITICAL**: deleted_at = NULL (lead must be active)

**Verify N+1 Query Fix** (Phase 12.2 CRITICAL #6):
- Only 1 query for lead creation (not N+1)
- Use `SET SESSION sql_mode='STRICT_TRANS_TABLES'; SET sql_logging = true;` to verify

### Step 1.3: Verify FRONTEND RESULT

**Browser Action**: Login as workspace owner, navigate to Leads page

**Expected UI State**:
1. Leads page loads (HTTP 200)
2. Lead grid/table displays new lead immediately:
   - Name: "John Doe"
   - Email: "john.doe@company.com"
   - Company: "Tech Corp"
   - Created: Today's date
3. **CRITICAL**: Lead count badge increments by 1

**Verify Rate Limiting** (Phase 12.2 CRITICAL #7):
- Submit 700 lead magnet requests in 1 minute
- Request #601+ should return 429 Too Many Requests
- Rate limit: 600 req/min GET, 120 req/min POST on `/api/lead-magnets/**`

**Verify Workspace Isolation** (Phase 12.2 CRITICAL #8):
- Other workspace users cannot see this lead
- Direct SQL: `SELECT COUNT(*) FROM leads WHERE workspace_id != 1` must not include our lead

### Step 1.4: Verify EXTERNAL SERVICE RESULT

**Expected**: No external service calls for basic lead creation

**Actual Behavior**:
- Lead magnet submission is internal only
- No Brevo API calls at this stage
- No email notifications yet

### Test Success Criteria
✅ HTTP 200 response  
✅ Lead created in database with all fields correct  
✅ Lead appears in frontend within 2 seconds  
✅ Workspace isolation enforced (other users cannot see)  
✅ Rate limiting works (600 req/min POST)  
✅ No database errors in logs  

### Test Failure Indicators
❌ HTTP 500 or validation error  
❌ Lead not in database  
❌ Frontend shows stale data (old lead count)  
❌ Other workspace users can see the lead  
❌ Duplicate lead created  
❌ Rate limiting not enforced  

---

## WORKFLOW 2: EMAIL CAMPAIGN

**Business Flow**: Create Template → Create Campaign → Add Recipient → Send → Brevo → Gmail

### Test Scenario
Workspace owner creates an email template, creates a campaign, adds recipients, and sends. Email should arrive in Gmail inbox.

### Step 2.1: Create Email Template

**REQUEST**
```http
POST /api/email-templates
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Welcome Campaign",
  "subject": "Welcome to TaskFlow!",
  "body": "<h1>Hello {{name}}</h1><p>Welcome aboard!</p>",
  "variables": ["name"]
}
```

**Expected Response (201 Created)**
```json
{
  "id": 101,
  "name": "Welcome Campaign",
  "subject": "Welcome to TaskFlow!",
  "body": "<h1>Hello {{name}}</h1><p>Welcome aboard!</p>",
  "createdAt": "2026-08-24T17:30:00Z"
}
```

### Step 2.2: Verify DATABASE RESULT

**Query**: Template exists
```sql
SELECT id, name, subject, workspace_id, created_by 
FROM email_templates 
WHERE id = 101 AND workspace_id = 1;
```

**Expected Result**:
- Template created with all fields
- workspace_id = 1 (correct workspace)
- created_by = user_id of authenticated user

### Step 2.3: Create Email Campaign

**REQUEST**
```http
POST /api/email-campaigns
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Welcome Campaign - Batch 1",
  "templateId": 101,
  "description": "Initial welcome batch",
  "scheduledFor": null
}
```

**Expected Response (201 Created)**
```json
{
  "id": 201,
  "name": "Welcome Campaign - Batch 1",
  "templateId": 101,
  "status": "DRAFT",
  "recipientCount": 0,
  "createdAt": "2026-08-24T17:31:00Z"
}
```

### Step 2.4: Add Recipient to Campaign

**REQUEST**
```http
POST /api/email-campaigns/201/recipients
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "recipientEmail": "john.doe@company.com",
  "recipientName": "John Doe",
  "variables": {
    "name": "John"
  }
}
```

**Expected Response (201 Created)**
```json
{
  "id": 301,
  "campaignId": 201,
  "recipientEmail": "john.doe@company.com",
  "status": "PENDING",
  "createdAt": "2026-08-24T17:32:00Z"
}
```

### Step 2.5: Verify DATABASE RESULT

**Query**: Recipient exists
```sql
SELECT id, campaign_id, recipient_email, status 
FROM email_campaign_recipients 
WHERE campaign_id = 201 AND recipient_email = 'john.doe@company.com';
```

**Expected Result**:
- Recipient created with status = "PENDING"
- recipient_email = "john.doe@company.com"
- campaign_id = 201

**Verify Async Transaction Fix** (Phase 12.2 CRITICAL #9):
- No transaction loss when saving recipient
- Database shows complete record (not partial)

### Step 2.6: Send Campaign

**REQUEST**
```http
POST /api/email-campaigns/201/send
Authorization: Bearer <jwt_token>
Content-Type: application/json

{}
```

**Expected Response (200 OK)**
```json
{
  "id": 201,
  "status": "SENDING",
  "recipientsSent": 1,
  "message": "Campaign queued for sending"
}
```

### Step 2.7: Verify DATABASE RESULT

**Query**: Campaign and recipient status updated
```sql
SELECT status FROM email_campaigns WHERE id = 201;
SELECT status, sent_at FROM email_campaign_recipients WHERE campaign_id = 201;
```

**Expected Result**:
- Campaign status changed to "SENDING" or "SENT"
- Recipient status changed to "SENT"
- sent_at timestamp populated (recent)

**Verify Webhook Signature** (Phase 12.2 CRITICAL #4):
- Check Brevo will send signed webhooks
- Signature uses HMAC-SHA256
- Header: X-Brevo-Signature = sha256 hash

### Step 2.8: Verify EXTERNAL SERVICE RESULT (Brevo)

**Action**: Check Brevo dashboard (https://dashboard.brevo.com)

**Expected Results**:
- Email appears in "Sent Messages"
- Recipient: john.doe@company.com
- Subject: "Welcome to TaskFlow!"
- Status: "Sent" or "Delivered"
- Metadata in Brevo:
  ```json
  {
    "campaign_id": "201",
    "recipient_id": "301"
  }
  ```

**Verify Metadata Validation** (Phase 12.2 CRITICAL #11):
- Metadata contains positive numeric IDs
- Brevo echoes back in webhooks
- Campaign ID > 0 and Recipient ID > 0

### Step 2.9: Verify EXTERNAL SERVICE RESULT (Gmail)

**Action**: Check Gmail inbox at john.doe@company.com

**Expected Results**:
- Email received from APP_MAIL_FROM address
- Subject: "Welcome to TaskFlow!"
- Body contains: "Hello John"
- Email shows "from: xsde790@gmail.com (TaskFlow)"
- Sent timestamp ≈ 30 seconds after send request

### Step 2.10: Verify FRONTEND RESULT

**Browser Action**: Workspace owner views campaign details page

**Expected UI State**:
1. Campaign page loads (HTTP 200)
2. Campaign status shows: "SENDING" or "SENT"
3. Recipient list displays:
   - Email: john.doe@company.com
   - Status: "SENT"
   - Sent time: Recent timestamp
4. **CRITICAL**: No "send" button visible (campaign already sent)

### Test Success Criteria
✅ Template created with correct data  
✅ Campaign created in DRAFT status  
✅ Recipient added with PENDING status  
✅ Campaign sends successfully  
✅ Recipient status changes to SENT  
✅ Email appears in Brevo dashboard  
✅ Email received in Gmail inbox  
✅ Frontend shows accurate campaign status  
✅ Metadata validation passes  
✅ No HTTP errors in request sequence  

### Test Failure Indicators
❌ Template creation fails (HTTP 500)  
❌ Campaign stuck in DRAFT status  
❌ Recipient not added to campaign  
❌ HTTP 429 (rate limiting) on send  
❌ Email not received in Gmail within 2 minutes  
❌ Brevo dashboard shows no sent message  
❌ Metadata missing or invalid in Brevo  
❌ Frontend shows wrong campaign status  

---

## WORKFLOW 3: EMAIL ANALYTICS

**Business Flow**: Gmail receives email → Open → Click CTA → Brevo webhook → Backend → Database → Analytics UI

### Test Scenario
After email is sent and received in Gmail, user opens the email and clicks a CTA link. Analytics should track these events.

### Prerequisites
- Campaign from Workflow 2 already sent
- Email in Gmail inbox (john.doe@company.com)
- Brevo webhook configured to send events to `/api/webhooks/brevo`

### Step 3.1: User Opens Email in Gmail

**Action**: Open email in Gmail client

**Expected Gmail Behavior**:
- Email opens
- Gmail notifies Brevo of open event
- Brevo detects open tracking pixel

### Step 3.2: Verify Brevo Webhook Received

**Action**: Backend receives webhook from Brevo

**REQUEST (from Brevo)**
```http
POST /api/webhooks/brevo
X-Brevo-Signature: sha256=<hmac_signature>
Content-Type: application/json

{
  "event": "opened",
  "email": "john.doe@company.com",
  "id": 12345,
  "ts": 1724004600,
  "messageId": "msg_xyz",
  "metadata": {
    "campaign_id": "201",
    "recipient_id": "301"
  }
}
```

**Expected Response (200 OK)**
```json
{
  "success": true,
  "message": "Event processed"
}
```

**Verify Webhook Signature** (Phase 12.2 CRITICAL #4):
- X-Brevo-Signature header present
- Signature is valid HMAC-SHA256
- If invalid signature: return 403 Forbidden
- Do NOT process webhook if signature invalid

### Step 3.3: Verify IDEMPOTENCY (Phase 12.2 CRITICAL #5)

**Action**: Simulate duplicate webhook (same event sent twice)

**REQUEST (duplicate)**
```http
POST /api/webhooks/brevo
X-Brevo-Signature: sha256=<same_signature>
Content-Type: application/json

{
  "event": "opened",
  "email": "john.doe@company.com",
  "id": 12345,
  "ts": 1724004600,
  "messageId": "msg_xyz",
  "metadata": {
    "campaign_id": "201",
    "recipient_id": "301"
  }
}
```

**Expected Response (200 OK)** - idempotent
```json
{
  "success": true,
  "message": "Event already processed (duplicate)"
}
```

**Verify DATABASE**:
- Only ONE analytics record created (duplicate rejected)
- Query:
  ```sql
  SELECT COUNT(*) FROM email_campaign_analytics 
  WHERE campaign_id = 201 AND recipient_id = 301 AND event_type = 'OPENED';
  ```
  Expected: 1 (not 2)

### Step 3.4: Verify DATABASE RESULT (Email Opened)

**Query**: Analytics record created
```sql
SELECT id, campaign_id, recipient_id, event_type, event_timestamp 
FROM email_campaign_analytics 
WHERE campaign_id = 201 AND event_type = 'OPENED';
```

**Expected Result**:
- Analytics record created
- campaign_id = 201
- recipient_id = 301
- event_type = "OPENED"
- event_timestamp ≈ current time
- **CRITICAL**: idempotency_key present and unique

**Verify Metadata Extraction** (Phase 12.2 CRITICAL #11):
- campaign_id extracted from metadata: 201 (numeric, positive)
- recipient_id extracted from metadata: 301 (numeric, positive)
- If invalid metadata: webhook rejected gracefully

### Step 3.5: Verify FRONTEND RESULT

**Browser Action**: Workspace owner views Analytics page

**Expected UI State**:
1. Analytics page loads (HTTP 200)
2. Campaign "Welcome Campaign - Batch 1" shows:
   - Total Sent: 1
   - Opened: 1
   - Open Rate: 100%
3. Event timeline displays:
   - "john.doe@company.com opened at [timestamp]"
4. Recipient status updated to "OPENED"

### Step 3.6: User Clicks CTA Link in Email

**Action**: In Gmail, click CTA link in email body

**Expected Email Behavior**:
- Email body contains: `<a href="https://api.example.com/api/campaigns/track/click/301?token=...">Click here</a>`
- Click redirects to tracking endpoint
- Browser navigates to landing page (or redirect target)

### Step 3.7: Verify Click Tracking

**REQUEST (backend receives click)**
```
GET /api/campaigns/track/click/301?token=...
```

**Expected Response (301 Redirect)**
```http
HTTP/301 Moved Permanently
Location: <landing_page_url>
```

### Step 3.8: Verify DATABASE RESULT (Click Recorded)

**Query**: Click event recorded
```sql
SELECT event_type, COUNT(*) FROM email_campaign_analytics 
WHERE campaign_id = 201 
GROUP BY event_type;
```

**Expected Result**:
- OPENED: 1
- CLICKED: 1
- Total: 2 events tracked

### Step 3.9: Verify BREVO WEBHOOK for Click

**REQUEST (from Brevo)**
```http
POST /api/webhooks/brevo
X-Brevo-Signature: sha256=<hmac_signature>
Content-Type: application/json

{
  "event": "clicked",
  "email": "john.doe@company.com",
  "id": 12346,
  "ts": 1724004700,
  "messageId": "msg_xyz",
  "link": "https://example.com/landing",
  "metadata": {
    "campaign_id": "201",
    "recipient_id": "301"
  }
}
```

**Expected Response (200 OK)**
```json
{
  "success": true,
  "message": "Event processed"
}
```

### Step 3.10: Verify FRONTEND RESULT (Analytics Updated)

**Browser Action**: Refresh analytics page

**Expected UI State**:
1. Page reloads (HTTP 200)
2. Campaign analytics updated:
   - Opened: 1
   - Clicked: 1
   - Click Rate: 100%
3. Event timeline shows both events in chronological order

### Test Success Criteria
✅ Webhook signature validated (403 if invalid)  
✅ Duplicate webhooks rejected (idempotency works)  
✅ Metadata extracted correctly (positive IDs only)  
✅ Open event recorded in database  
✅ Click event recorded in database  
✅ Analytics UI updates in real-time  
✅ Event timestamps accurate  
✅ No HTTP errors in webhook processing  

### Test Failure Indicators
❌ Invalid signature accepted (security breach)  
❌ Duplicate webhooks processed (idempotency broken)  
❌ Analytics record not created  
❌ Metadata extraction fails  
❌ Click tracking not working  
❌ Frontend shows stale analytics  
❌ Webhook returns HTTP 500  

---

## WORKFLOW 4: AUTOMATION

**Business Flow**: Lead Magnet submission → Lead created → Automation triggered → Email action → Brevo → Gmail → Webhook → Automation execution updated

### Test Scenario
A lead magnet submission triggers an automation that sends a welcome email. The email is delivered and opened, marking the automation execution as complete.

### Prerequisites
- Automation created with:
  - Trigger: "Lead Magnet Submitted"
  - Action: "Send Email"
  - Template: "Welcome Campaign"

### Step 4.1: Create Automation

**REQUEST**
```http
POST /api/automations
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Welcome New Leads",
  "triggerType": "LEAD_MAGNET_SUBMITTED",
  "actions": [
    {
      "type": "SEND_EMAIL",
      "templateId": 101,
      "delay": 0
    }
  ],
  "enabled": true
}
```

**Expected Response (201 Created)**
```json
{
  "id": 501,
  "name": "Welcome New Leads",
  "triggerType": "LEAD_MAGNET_SUBMITTED",
  "status": "ACTIVE",
  "createdAt": "2026-08-24T17:40:00Z"
}
```

### Step 4.2: Verify DATABASE RESULT

**Query**: Automation created
```sql
SELECT id, name, trigger_type, enabled FROM automations 
WHERE id = 501 AND workspace_id = 1;
```

**Expected Result**:
- Automation created with trigger_type = "LEAD_MAGNET_SUBMITTED"
- enabled = true
- actions stored (JSON)

### Step 4.3: Submit Lead Magnet (Triggers Automation)

**REQUEST**
```http
POST /api/lead-magnets/submit
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane.smith@company.com",
  "leadMagnetId": 1
}
```

**Expected Response (200 OK)**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "leadId": 43
}
```

### Step 4.4: Verify Automation Triggered

**Query**: Automation execution created
```sql
SELECT id, automation_id, trigger_id, status, executed_at 
FROM automation_executions 
WHERE automation_id = 501 AND trigger_id = 43;
```

**Expected Result**:
- Execution record created
- automation_id = 501
- trigger_id = 43 (the lead)
- status = "EXECUTING" or "COMPLETED"
- executed_at ≈ current timestamp

### Step 4.5: Verify Email Sent

**Query**: Email campaign created for automation
```sql
SELECT id, name, template_id, created_by FROM email_campaigns 
WHERE workspace_id = 1 AND name LIKE '%automation%' 
ORDER BY created_at DESC LIMIT 1;
```

**Expected Result**:
- Campaign created automatically
- Template used: 101
- Recipients auto-added from lead: jane.smith@company.com

### Step 4.6: Verify BREVO EMAIL SENT

**Action**: Check Brevo dashboard

**Expected Results**:
- Email sent to jane.smith@company.com
- Subject: "Welcome to TaskFlow!"
- Metadata includes:
  ```json
  {
    "automation_id": "501",
    "campaign_id": "xxx",
    "recipient_id": "xxx"
  }
  ```

### Step 4.7: Verify GMAIL DELIVERY

**Action**: Check Gmail inbox at jane.smith@company.com

**Expected Results**:
- Email received from xsde790@gmail.com (TaskFlow)
- Subject: "Welcome to TaskFlow!"
- Body shows personalized content for Jane

### Step 4.8: User Opens Email

**Action**: Open email in Gmail

**Expected Behavior**:
- Email opens
- Gmail notifies Brevo
- Brevo sends "opened" webhook

### Step 4.9: Verify Webhook Processed

**Query**: Analytics recorded
```sql
SELECT event_type FROM email_campaign_analytics 
WHERE campaign_id IN (
  SELECT campaign_id FROM email_campaign_recipients 
  WHERE recipient_email = 'jane.smith@company.com'
);
```

**Expected Result**:
- Event type: "OPENED"
- Recipient marked as opened

### Step 4.10: Verify Automation Execution Completed

**Query**: Automation execution status updated
```sql
SELECT status, completed_at FROM automation_executions 
WHERE automation_id = 501 AND trigger_id = 43;
```

**Expected Result**:
- status = "COMPLETED"
- completed_at ≈ when email was opened
- duration: ~30 seconds

### Step 4.11: Verify FRONTEND RESULT

**Browser Action**: Workspace owner views automation execution log

**Expected UI State**:
1. Automation page loads
2. Execution history shows:
   - Trigger: "Lead Magnet" by jane.smith@company.com
   - Status: "COMPLETED"
   - Email sent to: jane.smith@company.com
   - Execution time: 00:00:30
3. Link to corresponding email campaign

### Test Success Criteria
✅ Automation created and enabled  
✅ Automation triggered on lead magnet submission  
✅ Email sent automatically  
✅ Email received in Gmail  
✅ Webhook processed for open event  
✅ Automation execution marked complete  
✅ Frontend shows execution history  
✅ No transaction loss in async email send  

### Test Failure Indicators
❌ Automation not triggered  
❌ Email not sent  
❌ Automation execution stuck in EXECUTING state  
❌ Email not received in Gmail  
❌ Frontend shows no execution history  
❌ HTTP 500 errors in automation processing  

---

## WORKFLOW 5: AI EMAIL

**Business Flow**: Generate with AI → Edit → Save Template → Campaign → Send → Gmail

### Test Scenario
Workspace owner uses AI to generate an email, edits it, saves as template, creates a campaign, and sends it.

### Step 5.1: Generate Email with AI

**REQUEST**
```http
POST /api/ai/email-generate
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "subject": "product_launch",
  "tone": "professional",
  "recipientName": "John",
  "recipientCompany": "Tech Corp"
}
```

**Expected Response (200 OK)**
```json
{
  "subject": "Introducing Our Latest Innovation",
  "body": "<h1>Hello John</h1><p>At Tech Corp, we're excited to announce...</p>",
  "generatedAt": "2026-08-24T17:50:00Z"
}
```

**Verify AI Configuration** (checks Phase 12.2):
- XAI API key configured (from .env)
- Model: grok or llama-3.3-70b-versatile
- Response is HTML formatted
- No API errors (HTTP 200)

### Step 5.2: Edit Generated Email

**Action**: Frontend user edits the generated email content

**Frontend Action**:
- Subject: Change to "Exciting News About Our Product Launch"
- Body: Add custom paragraph at end

### Step 5.3: Save as Email Template

**REQUEST**
```http
POST /api/email-templates
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Product Launch - AI Generated",
  "subject": "Exciting News About Our Product Launch",
  "body": "<h1>Hello {{recipientName}}</h1><p>At {{recipientCompany}}, we're excited...</p><p>Custom paragraph added by user.</p>",
  "variables": ["recipientName", "recipientCompany"]
}
```

**Expected Response (201 Created)**
```json
{
  "id": 102,
  "name": "Product Launch - AI Generated",
  "createdAt": "2026-08-24T17:51:00Z"
}
```

### Step 5.4: Verify DATABASE RESULT

**Query**: Template saved
```sql
SELECT id, name, body FROM email_templates 
WHERE id = 102 AND workspace_id = 1;
```

**Expected Result**:
- Template created with AI-generated content + user edits
- Variables: recipientName, recipientCompany
- Body contains both AI content and user customization

### Step 5.5: Create Campaign with AI Template

**REQUEST**
```http
POST /api/email-campaigns
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Product Launch Campaign",
  "templateId": 102,
  "description": "Using AI-generated template"
}
```

**Expected Response (201 Created)**
```json
{
  "id": 202,
  "name": "Product Launch Campaign",
  "templateId": 102,
  "status": "DRAFT"
}
```

### Step 5.6: Add Multiple Recipients

**REQUEST (bulk add)**
```http
POST /api/email-campaigns/202/recipients/bulk
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "recipients": [
    {
      "recipientEmail": "lead1@company.com",
      "recipientName": "Lead One",
      "variables": {
        "recipientName": "Lead One",
        "recipientCompany": "Company A"
      }
    },
    {
      "recipientEmail": "lead2@company.com",
      "recipientName": "Lead Two",
      "variables": {
        "recipientName": "Lead Two",
        "recipientCompany": "Company B"
      }
    }
  ]
}
```

**Expected Response (200 OK)**
```json
{
  "success": true,
  "recipientsAdded": 2
}
```

### Step 5.7: Send Campaign

**REQUEST**
```http
POST /api/email-campaigns/202/send
Authorization: Bearer <jwt_token>
Content-Type: application/json

{}
```

**Expected Response (200 OK)**
```json
{
  "id": 202,
  "status": "SENDING",
  "recipientsSent": 2
}
```

### Step 5.8: Verify BREVO EMAILS SENT

**Action**: Check Brevo dashboard

**Expected Results**:
- 2 emails sent
- To: lead1@company.com and lead2@company.com
- Subject: "Exciting News About Our Product Launch"
- Variables interpolated:
  - Email 1 body: "Hello Lead One... Company A..."
  - Email 2 body: "Hello Lead Two... Company B..."

### Step 5.9: Verify GMAIL DELIVERY

**Action**: Check Gmail inboxes

**Expected Results**:
- Email received at lead1@company.com
- Email received at lead2@company.com
- Variables correctly substituted in personalization
- Subject and body match template

### Step 5.10: Verify FRONTEND RESULT

**Browser Action**: Campaign status page

**Expected UI State**:
1. Campaign shows status: "SENDING" or "SENT"
2. Recipients list shows both emails
3. Status for each: "SENT"
4. **CRITICAL**: Variables were correctly interpolated (verify in email body preview)

### Test Success Criteria
✅ AI email generation returns valid HTML  
✅ User can edit AI content  
✅ Template saved with variables  
✅ Campaign created successfully  
✅ Multiple recipients added  
✅ Campaign sends  
✅ Variables correctly substituted in each email  
✅ Emails received in Gmail  
✅ No HTTP errors  

### Test Failure Indicators
❌ AI generation fails (HTTP 500)  
❌ Template not saved  
❌ Campaign stuck in DRAFT  
❌ Emails not sent to all recipients  
❌ Variables not substituted  
❌ Emails not received in Gmail  
❌ Frontend shows incorrect recipient count  

---

## WORKFLOW 6: DELETE

**Business Flow**: Create campaign → Delete → Refresh → Campaign must remain absent

### Test Scenario
Workspace owner creates a campaign and then deletes it. The campaign should be removed from both database and frontend.

### Step 6.1: Create Campaign

**REQUEST**
```http
POST /api/email-campaigns
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Delete Test Campaign",
  "templateId": 101
}
```

**Expected Response (201 Created)**
```json
{
  "id": 203,
  "name": "Delete Test Campaign",
  "status": "DRAFT"
}
```

### Step 6.2: Verify Campaign Created

**Query**: Campaign in database
```sql
SELECT id, name, deleted_at FROM email_campaigns 
WHERE id = 203 AND workspace_id = 1;
```

**Expected Result**:
- Campaign exists
- deleted_at = NULL (not deleted)

### Step 6.3: Verify Campaign in Frontend

**Browser Action**: Campaigns list page

**Expected UI State**:
1. "Delete Test Campaign" appears in list
2. Campaign count increments
3. Campaign visible in search

### Step 6.4: Delete Campaign

**REQUEST**
```http
DELETE /api/email-campaigns/203
Authorization: Bearer <jwt_token>
```

**Expected Response (200 OK)**
```json
{
  "success": true,
  "message": "Campaign deleted successfully"
}
```

### Step 6.5: Verify Soft Delete in Database

**Query**: Campaign marked as deleted (soft delete)
```sql
SELECT id, name, deleted_at FROM email_campaigns 
WHERE id = 203 AND workspace_id = 1;
```

**Expected Result**:
- Campaign still exists in database
- deleted_at = current timestamp
- **CRITICAL**: Soft delete, not hard delete (data preservation)

### Step 6.6: Verify Campaign Hidden in Active Queries

**Query**: Campaign NOT in active campaigns list
```sql
SELECT COUNT(*) FROM email_campaigns 
WHERE workspace_id = 1 AND deleted_at IS NULL;
```

**Expected Result**: Count does NOT include deleted campaign

### Step 6.7: Verify Campaign Absent from Frontend

**Browser Action**: Refresh campaigns list page

**Expected UI State**:
1. Page reloads (HTTP 200)
2. "Delete Test Campaign" is NO LONGER in list
3. Campaign count decremented by 1
4. Search for deleted campaign returns empty
5. **CRITICAL**: Campaign not visible even after refresh

### Step 6.8: Verify Data Integrity

**Query**: Verify related records not deleted
```sql
SELECT COUNT(*) FROM email_campaign_recipients 
WHERE campaign_id = 203;

SELECT COUNT(*) FROM email_campaign_analytics 
WHERE campaign_id = 203;
```

**Expected Result**:
- Related records still exist (soft delete cascading)
- No orphaned data
- Data accessible for reporting/compliance

### Step 6.9: Verify Workspace Isolation

**Database Action**: Other workspace should not see deleted campaign

**Query**: Check other workspace
```sql
SELECT COUNT(*) FROM email_campaigns 
WHERE deleted_at IS NULL AND workspace_id != 1 AND name = 'Delete Test Campaign';
```

**Expected Result**: 0 (other workspaces unaffected)

### Step 6.10: Verify Attempts to Access Deleted Campaign

**REQUEST (try to get deleted campaign)**
```http
GET /api/email-campaigns/203
Authorization: Bearer <jwt_token>
```

**Expected Response (404 Not Found)**
```json
{
  "error": "Campaign not found",
  "message": "The requested campaign does not exist or has been deleted"
}
```

### Test Success Criteria
✅ Campaign created successfully  
✅ Campaign visible in frontend  
✅ Delete request succeeds (HTTP 200)  
✅ Campaign marked as deleted in database (soft delete)  
✅ Campaign hidden from frontend after delete  
✅ Related records preserved  
✅ Accessing deleted campaign returns 404  
✅ Campaign remains deleted after refresh  
✅ Other workspaces unaffected  

### Test Failure Indicators
❌ Campaign not deleted (still visible)  
❌ Hard delete (data loss)  
❌ Related records deleted (orphaned data)  
❌ Frontend shows deleted campaign after refresh  
❌ HTTP 500 on delete  
❌ Other workspaces affected  
❌ Delete endpoint returns non-200 status  

---

## WORKFLOW SUMMARY TABLE

| Workflow | Key Verification Points | Phase 12.2 Features Tested |
|----------|------------------------|---------------------------|
| **1. Lead Magnet** | Lead creation, database integrity, UI update, rate limiting, workspace isolation | CRITICAL #7, #8 (Rate limit, Workspace isolation) |
| **2. Email Campaign** | Template/Campaign/Recipient creation, Brevo integration, Gmail delivery, metadata validation | CRITICAL #4, #11 (Webhook signature, Metadata validation) |
| **3. Email Analytics** | Webhook processing, idempotency, metadata extraction, analytics tracking, duplicate prevention | CRITICAL #4, #5, #11 (Signatures, Idempotency, Metadata) |
| **4. Automation** | Trigger execution, async email sending, transaction integrity, execution tracking | CRITICAL #9 (Async transactions) |
| **5. AI Email** | AI generation, template saving, variable interpolation, bulk sending | All verified (no new fixes) |
| **6. Delete** | Soft delete, data preservation, workspace isolation, 404 on access | CRITICAL #8 (Workspace isolation) |

---

## Execution Instructions

### For Test Team
1. Set up test environment with database, Brevo API, Gmail account
2. Execute workflows 1-6 in sequence (each depends on previous)
3. Record HTTP requests/responses (screenshots of Network tab)
4. Capture database states after each step (SQL queries)
5. Document any deviations from expected results
6. Save all logs for final report

### For CI/CD Pipeline
```bash
# Load environment
source .env

# Run backend
mvn spring-boot:run

# Run frontend
npm run dev

# Execute test suite (when available)
npm run test:e2e
mvn test:integration
```

### Verification Checklist
- [ ] All 6 workflows execute without errors
- [ ] Database state verified after each step
- [ ] Frontend UI matches expected state
- [ ] External services (Brevo, Gmail) show correct results
- [ ] Phase 12.2 CRITICAL fixes verified in each workflow
- [ ] Rate limiting prevents abuse
- [ ] Workspace isolation enforced
- [ ] Async transactions complete without loss
- [ ] Webhooks processed with signature validation
- [ ] Duplicate webhooks rejected (idempotency)
- [ ] Metadata validation prevents bad data
- [ ] Soft deletes preserve data
- [ ] No HTTP 500 errors
- [ ] All timestamps accurate
- [ ] All database queries efficient

---

## Expected Test Results

### Success Criteria
✅ All 6 workflows complete without errors  
✅ All HTTP responses return expected status codes  
✅ All database operations complete successfully  
✅ Frontend UI updates in real-time  
✅ External services (Brevo, Gmail) receive correct data  
✅ No duplicate processing (webhooks)  
✅ Soft deletes work correctly  
✅ Workspace isolation enforced  
✅ Rate limiting effective  
✅ Async operations don't lose data  

### Failure Escalation
- **HTTP 500**: Critical - stop execution, check logs
- **Database errors**: Critical - stop execution, check migrations
- **External service failures**: Medium - verify API keys, network
- **Frontend lag**: Low - refresh page, check browser console
- **Missing features**: Critical - Phase 12.2 fix validation failed

---

## Documentation & Reporting

After executing all workflows, create final report with:

1. **Summary**: Pass/Fail for each workflow
2. **Details**: Screenshots of each key step
3. **Logs**: Backend logs, database query results, browser console
4. **Evidence**: HTTP requests/responses, email screenshots, Brevo dashboard
5. **Issues**: Any failures or unexpected behavior
6. **Recommendations**: For fixes if any issues found

**Report Location**: `crm-backend/PHASE_12_3_TEST_RESULTS.txt`

