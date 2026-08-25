# Phase 11.5 — AI Email HTML Rendering Verification
## Comprehensive Test Plan

**Objective:** Verify AI-generated email HTML survives the complete pipeline intact from generation through Brevo to Gmail inbox.

**Test Date:** August 19, 2026

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. AI EMAIL GENERATION (Backend)                               │
│    POST /api/workspaces/{id}/ai/email/generate                 │
│    → Returns: subject, bodyHtml, bodyPlainText, ctaText, ctaUrl │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND: SAVE AS TEMPLATE (Phase 11.4)                     │
│    POST /api/workspaces/{id}/email-templates                   │
│    Payload: {                                                   │
│      name, description, category, subjectTemplate,             │
│      htmlContent, plainTextContent, variables, isPublic        │
│    }                                                            │
│    Response: 201 Created {id, ...}                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. DATABASE STORAGE (EmailTemplate entity)                     │
│    Table: email_templates                                       │
│    Column: htmlContent (TEXT, nullable)                        │
│    Column: subjectTemplate (VARCHAR(255))                      │
│    Column: plainTextContent (TEXT, nullable)                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CAMPAIGN CREATION                                            │
│    POST /api/workspaces/{id}/email-campaigns                   │
│    Payload: { name, subject, templateId, ... }                 │
│    Campaign loads template.htmlContent into memory             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CAMPAIGN SENDING (Async)                                    │
│    EmailCampaignSendingService.sendCampaignAsync()             │
│    For each recipient:                                          │
│      a) Load template.htmlContent                              │
│      b) Append CTA button HTML (if configured)                 │
│      c) Render template vars: {{firstName}}, {{email}}, etc.   │
│      d) Append open tracking pixel                             │
│      e) Final HTML ready for Brevo                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. BREVO API CALL                                               │
│    BrevoEmailService.sendEmail()                               │
│    POST https://api.brevo.com/v3/smtp/email                   │
│    Payload JSON: { sender, to, subject, htmlContent, metadata} │
│    htmlContent = final HTML from step 5                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. BREVO PROCESSING                                             │
│    Brevo receives HTML                                          │
│    Brevo formats and delivers to ISP                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. EMAIL INBOX (Gmail, Outlook, etc.)                          │
│    Recipient receives formatted email                           │
│    Email client renders HTML                                   │
│    Result: Formatted email with CTA button, paragraphs, links  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Test Data Specification

### Test Email Template

**Subject:** "Your Free AI CRM Trial"

**HTML Content (from AI generation):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; }
        .footer { background: #f0f0f0; padding: 15px; font-size: 12px; text-align: center; border-radius: 0 0 8px 8px; }
        h1 { margin: 0; font-size: 24px; }
        p { margin: 15px 0; }
        .highlight { color: #2563eb; font-weight: bold; }
        ul { margin: 15px 0; padding-left: 30px; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome, {{firstName}}!</h1>
        </div>
        <div class="content">
            <p>We're excited to offer you a <span class="highlight">14-day free trial</span> of our AI-powered CRM platform.</p>
            
            <h2>What You'll Get:</h2>
            <ul>
                <li>Advanced lead management and automation</li>
                <li>AI-powered email campaigns with analytics</li>
                <li>Real-time customer insights and reporting</li>
                <li>Unlimited storage for your contacts and communications</li>
                <li>24/7 priority support</li>
            </ul>
            
            <p>Start managing your leads more efficiently and grow your business with our cutting-edge CRM solution.</p>
            
            <p>No credit card required. Cancel anytime.</p>
        </div>
        <div class="footer">
            <p>Questions? Reply to this email or contact support@example.com</p>
            <p>&copy; 2024 AI CRM Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

**Plain Text Content (from AI generation):**
```
Welcome, {{firstName}}!

We're excited to offer you a 14-day free trial of our AI-powered CRM platform.

What You'll Get:
- Advanced lead management and automation
- AI-powered email campaigns with analytics
- Real-time customer insights and reporting
- Unlimited storage for your contacts and communications
- 24/7 priority support

Start managing your leads more efficiently and grow your business with our cutting-edge CRM solution.

No credit card required. Cancel anytime.

Questions? Reply to this email or contact support@example.com
© 2024 AI CRM Platform. All rights reserved.
```

**CTA Configuration:**
- CTA Text: "Start Free Trial"
- CTA URL: "https://your-project-domain.com/signup?trial=14days"

---

## Verification Checkpoints

### Checkpoint 1: AI Generation Response
**Verify:** Frontend receives HTML with proper structure
- [ ] Subject present
- [ ] bodyHtml contains HTML markup (not escaped)
- [ ] bodyHtml contains proper tags: `<html>`, `<head>`, `<style>`, `<body>`
- [ ] bodyPlainText contains plain text version
- [ ] ctaText: "Start Free Trial"
- [ ] ctaUrl: "https://your-project-domain.com/signup?trial=14days"

### Checkpoint 2: Database Storage
**Verify:** SQL query against email_templates table
```sql
SELECT id, name, htmlContent, subjectTemplate, plainTextContent, category 
FROM email_templates 
WHERE name = 'Your Free AI CRM Trial' 
AND category = 'CAMPAIGN'
LIMIT 1;
```
- [ ] htmlContent field contains HTML (NOT escaped, NOT quoted)
- [ ] htmlContent contains opening `<` characters (not `&lt;`)
- [ ] subjectTemplate: "Your Free AI CRM Trial"
- [ ] plainTextContent present and valid
- [ ] category: "CAMPAIGN"
- [ ] Template ID captured: ___________

### Checkpoint 3: Campaign Creation
**API Request:** POST /api/workspaces/{id}/email-campaigns
```json
{
  "name": "Test AI Email Campaign",
  "subject": "Your Free AI CRM Trial",
  "description": "Testing AI-generated email HTML pipeline",
  "templateId": <template_id_from_checkpoint_2>,
  "contentType": "TEMPLATE",
  "recipientMode": "MANUAL",
  "recipientData": "{\"type\":\"MANUAL\",\"emails\":[\"recipient@gmail.com\"]}",
  "status": "DRAFT",
  "isActive": true,
  "ctaButtonText": "Start Free Trial",
  "ctaButtonUrl": "https://your-project-domain.com/signup?trial=14days"
}
```
- [ ] Campaign created successfully (201)
- [ ] Campaign ID captured: ___________
- [ ] Status: DRAFT
- [ ] Template relationship established

### Checkpoint 4: Recipient Addition
**API Request:** POST /api/workspaces/{id}/email-campaigns/{id}/recipients
```json
{
  "recipients": [
    {
      "email": "recipient@gmail.com",
      "name": "John"
    }
  ],
  "replaceExisting": true
}
```
- [ ] Recipients added successfully
- [ ] Recipient status: PENDING
- [ ] Recipient ID captured: ___________

### Checkpoint 5: Campaign Send Initiation
**API Request:** POST /api/workspaces/{id}/email-campaigns/{id}/send
- [ ] Campaign status changed to: SENDING
- [ ] Async process started (no error thrown)
- [ ] Response: 200 OK with campaign data

### Checkpoint 6: Brevo Payload Inspection

**Method:** Enable logging in BrevoEmailService and EmailCampaignSendingService

**Expected Log Output:**
```
[STEP 4] Calling BrevoEmailService.sendEmail()...
[DEBUG] Metadata for Brevo: campaign_id=<id>, recipient_id=<id>
[BrevoEmailService] Brevo Email Service - Sending email
[BrevoEmailService] To: recipient@gmail.com
[BrevoEmailService] Calling Brevo API: https://api.brevo.com/v3/smtp/email
[BrevoEmailService] ✓ Brevo API Response: 200 OK
```

**Verify in Payload:**
- [ ] Subject: "Your Free AI CRM Trial" (properly rendered)
- [ ] htmlContent contains: `<html>`, `<head>`, `<body>` (NOT escaped)
- [ ] htmlContent contains: `<h1>Welcome, John!</h1>` (variable rendered)
- [ ] htmlContent contains: CTA button with tracking URL
- [ ] htmlContent contains: open tracking pixel `<img src="...track/open..."`
- [ ] htmlContent does NOT contain: `\u003c` or `&lt;` or other HTML escaping
- [ ] to: "recipient@gmail.com"
- [ ] metadata: { campaign_id: <id>, recipient_id: <id> }

### Checkpoint 7: Campaign Send Completion
**Verify via API:** GET /api/workspaces/{id}/email-campaigns/{id}
- [ ] Campaign status: SENT or PARTIAL (not FAILED)
- [ ] sentCount: >= 1
- [ ] failedCount: 0
- [ ] Recipient status: SENT (not FAILED)
- [ ] No error messages in logs

### Checkpoint 8: Gmail Receipt Verification

**Expected Email in Inbox:**

Visual Elements to Verify:
- [ ] **Subject Line:** "Your Free AI CRM Trial" (appears in inbox list)
- [ ] **Header Section:** Blue background with "Welcome, John!" (CSS preserved)
- [ ] **Content Section:** White background with proper spacing
- [ ] **Paragraphs:** All text appears with correct line breaks
- [ ] **List Items:** All 5 bullet points display properly with `-` or bullets
- [ ] **CTA Button:** Blue button with white text "Start Free Trial" (NOT a plain link)
- [ ] **Button Styling:** Padding, border-radius, background color all visible
- [ ] **Footer Section:** Gray background with copyright and support info
- [ ] **Open Tracking Pixel:** Invisible (1x1 pixel, not visible to user)
- [ ] **No Raw HTML:** No `<`, `>`, `&lt;`, `&gt;` characters visible to user
- [ ] **No Escaped Characters:** No backslashes, no unicode escapes visible
- [ ] **Responsive Layout:** On mobile, content reflows properly
- [ ] **Links:** All URLs are clickable and unescaped

**Click CTA Button:**
- [ ] Click tracking fires (check backend logs)
- [ ] Browser redirects to: "https://your-project-domain.com/signup?trial=14days"
- [ ] URL is clean (no double-encoding, no escaped characters)

---

## Comparison: AI-Generated vs Manual Template

### Test 2: Manual Template

Create a manual template via UI with same content:
1. Go to Marketing → Email Templates
2. Create New Template: "Manual CRM Trial Email"
3. Copy same HTML content from checkpoint 1
4. Fill in: subject, category (CAMPAIGN), etc.
5. Save

**Create Campaign with Manual Template:**
- [ ] Use manual template instead of AI template
- [ ] Send same test campaign
- [ ] Verify same email content in Gmail

**Expected Result:**
- [ ] Manual template email looks identical to AI-generated email
- [ ] Both emails render identically in Gmail
- [ ] HTML preserved equally in both cases

---

## Failure Scenarios to Check

### Scenario 1: HTML Escaping Issue
**Symptom:** Email arrives with `&lt;`, `&gt;`, `\"` visible to user

**Root Cause Options:**
- HTML escaped in AI response
- HTML escaped during database insert
- HTML escaped during Brevo payload construction
- HTML escaped during template rendering

**Fix Location:** Identify exact layer where escaping occurs

### Scenario 2: Variable Not Rendered
**Symptom:** Email shows `{{firstName}}` instead of `John`

**Root Cause Options:**
- Variable placeholder not recognized
- Recipient data not loaded correctly
- renderTemplate() not called on htmlContent

**Fix Location:** EmailCampaignSendingService.renderTemplate()

### Scenario 3: CTA Button Missing or Broken
**Symptom:** Email arrives without blue button, just plain text link

**Root Cause Options:**
- CTA HTML not appended correctly
- CTA button styling stripped by email client
- Tracking URL malformed
- CTA button div not inserted in right location

**Fix Location:** EmailCampaignSendingService (CTA append logic)

### Scenario 4: Styling Not Applied
**Symptom:** Email arrives in plain text without colors, fonts, or formatting

**Root Cause Options:**
- `<style>` tag stripped
- Inline styles not preserved
- Email client doesn't support styling
- CSS classes not converted to inline styles

**Expected:** Brevo should preserve inline styles or convert `<style>` appropriately

### Scenario 5: Tracking Pixel Visible
**Symptom:** User sees a 1x1 colored pixel at bottom of email

**Root Cause Options:**
- Tracking pixel not hidden with `display:none`
- Tracking pixel `width="1" height="1"` not preserved
- Email client overrides display style

**Fix Location:** EmailCampaignSendingService (tracking pixel HTML)

---

## Test Execution Log

### Run Date: _______________
### Tester: _______________

#### Pre-Test Checklist
- [ ] Backend running: `npm run dev` (or live environment)
- [ ] Frontend running: `npm run dev` (or live environment)
- [ ] Brevo API key configured and valid
- [ ] Test email recipient ready (Gmail or similar)
- [ ] Database accessible for queries
- [ ] Logs configured to capture BrevoEmailService and EmailCampaignSendingService
- [ ] Logging level: DEBUG (to capture full payloads)

#### Test Execution
1. **Checkpoint 1 - AI Generation:** _____ (Pass/Fail/Notes)
2. **Checkpoint 2 - Database:** _____ (Pass/Fail/Notes)
3. **Checkpoint 3 - Campaign Creation:** _____ (Pass/Fail/Notes)
4. **Checkpoint 4 - Recipients:** _____ (Pass/Fail/Notes)
5. **Checkpoint 5 - Send Initiation:** _____ (Pass/Fail/Notes)
6. **Checkpoint 6 - Brevo Payload:** _____ (Pass/Fail/Notes)
7. **Checkpoint 7 - Send Completion:** _____ (Pass/Fail/Notes)
8. **Checkpoint 8 - Gmail Receipt:** _____ (Pass/Fail/Notes)

#### Manual Template Test
- [ ] Manual template test: _____ (Pass/Fail/Notes)
- [ ] Comparison with AI: Match / Mismatch / Notes: _____________

#### Issues Found
1. Issue: _____________ (Location: ________)
2. Issue: _____________ (Location: ________)

#### Fixes Applied
1. Fix: _____________ (File: ________)
2. Fix: _____________ (File: ________)

#### Final Status
- [ ] All checkpoints: PASS
- [ ] Both templates: IDENTICAL
- [ ] Gmail rendering: CORRECT
- [ ] Ready for production: YES / NO

---

## Reference Data for Logs

### Expected HTML Structure Check
```
✓ <!DOCTYPE html>
✓ <html>
✓ <head>
✓ <style> ... </style>
✓ <body>
✓ <div class="container">
✓ <div class="header">
✓ <h1>Welcome, {{firstName}}!</h1>
✓ <div class="content">
✓ <h2>What You'll Get:</h2>
✓ <ul>
✓ <li> ... </li>
✓ CTA button HTML
✓ Tracking pixel
✓ </body>
✓ </html>
```

### Expected Database Query Result
```sql
htmlContent field should start with: <!DOCTYPE html>
htmlContent should contain < and > characters (NOT &lt; or &gt;)
htmlContent should have readable style definitions
```

### Expected Brevo API Payload (Partial)
```json
{
  "sender": {
    "name": "Your Company",
    "email": "noreply@company.com"
  },
  "to": [
    {
      "email": "recipient@gmail.com"
    }
  ],
  "subject": "Your Free AI CRM Trial",
  "htmlContent": "<!DOCTYPE html><html>...[FULL HTML HERE]...</html>",
  "metadata": {
    "campaign_id": <number>,
    "recipient_id": <number>
  }
}
```

---

## Success Criteria

✅ **Phase 11.5 Complete When:**

1. ✓ HTML not escaped or encoded anywhere in pipeline
2. ✓ AI-generated email renders identically to manually created email
3. ✓ CTA button appears as styled button (not plain link)
4. ✓ Paragraphs and list items display with correct formatting
5. ✓ Subject line renders correctly with variables
6. ✓ No raw HTML visible to end user
7. ✓ Click tracking works (clicks recorded in logs)
8. ✓ Open tracking pixel works (opens recorded in logs)
9. ✓ All checkpoints: PASS
10. ✓ Both AI and manual templates work identically

---

## If Issues Found

### Issue Resolution Process
1. Identify exact checkpoint where HTML corruption occurs
2. Check logs at that layer
3. Identify root cause (escaping, encoding, transformation)
4. Apply minimal fix to that layer only
5. Re-test from that checkpoint forward
6. Verify no regressions in other areas

### Logging Configuration

To capture full payloads, add to application-dev.yml:
```yaml
logging:
  level:
    com.arjun.crm.service.brevo.BrevoEmailService: DEBUG
    com.arjun.crm.service.impl.EmailCampaignSendingService: DEBUG
    com.arjun.crm.ai: DEBUG
```

### Quick Debug Commands

List template in database:
```sql
SELECT htmlContent FROM email_templates WHERE name = 'Your Free AI CRM Trial' LIMIT 1;
```

Check campaign status:
```sql
SELECT id, status, sentCount, failedCount FROM email_campaigns WHERE name = 'Test AI Email Campaign' LIMIT 1;
```

Check recipient status:
```sql
SELECT id, status, errorMessage FROM email_campaign_recipients WHERE id = <recipient_id>;
```

---

## Test Complete

**All Checkpoints Passed:** YES / NO  
**Date:** _______________  
**Tester Sign-off:** _______________

