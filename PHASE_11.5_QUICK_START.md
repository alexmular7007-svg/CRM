# Phase 11.5 — Quick Start Testing Guide

**Goal:** Verify AI-generated email HTML renders correctly from generation → database → Brevo → Gmail inbox

**Time Required:** ~15-20 minutes  
**Prerequisites:** Backend running, frontend running, Gmail account for testing

---

## Step 1: Prepare Test Data (2 min)

Keep this data handy for all tests:

```
Test Email Name: Your Free AI CRM Trial
Test Subject: Your Free AI CRM Trial
Test Recipient: <your-gmail@gmail.com>
CTA Text: Start Free Trial
CTA URL: https://your-project-domain.com/signup?trial=14days
Campaign Name: Test AI Email Campaign
```

---

## Step 2: Generate AI Email (3 min)

### Via Frontend UI:
1. Go to Marketing → Email Campaigns → Create Campaign
2. Select "🤖 Generate with AI"
3. Fill in form:
   - Campaign Purpose: "Promote our AI CRM"
   - Target Audience: "Startup founders"
   - Product/Service: "AI-powered CRM"
   - Tone: "Professional"
   - Offer: "14-day free trial"
   - Key Points: "Manage leads, campaigns and analytics"
   - CTA Text: "Start Free Trial"
   - CTA URL: "https://your-project-domain.com/signup?trial=14days"
4. Click "Generate Email"
5. Verify email preview shows:
   - ✓ Subject line
   - ✓ Formatted content (paragraphs, lists)
   - ✓ Blue CTA button with text
   - ✓ Professional styling

**Screenshot:** Capture GeneratedEmailPreview component

---

## Step 3: Save as Template (2 min)

1. In the preview, locate "Save as Template" section
2. Verify template name is pre-filled: "Your Free AI CRM Trial" (or similar)
3. Click "Save as Template" button
4. Wait for success toast: "Template created and verified successfully!"

**Screenshot:** Capture success toast

---

## Step 4: Inspect Database (3 min)

Open a database client (DBeaver, MySQL Workbench, etc.) or use command line:

```bash
# MySQL
mysql -u <user> -p <database> -e "
SELECT htmlContent FROM email_templates 
WHERE name = 'Your Free AI CRM Trial' 
LIMIT 1;
"
```

**Check:**
- ✓ htmlContent starts with `<!DOCTYPE` or `<html`
- ✓ Contains `<` and `>` characters (NOT `&lt;` or `&gt;`)
- ✓ Contains `<style>` block with CSS
- ✓ Contains `<body>` tag

**If you see `&lt;` or escaped HTML:** STOP - Issue found at database layer

**Screenshot:** Show query result with htmlContent

---

## Step 5: Create Campaign (2 min)

1. Go back to Email Campaigns
2. Click "Create New Campaign"
3. Fill in:
   - Campaign Name: "Test AI Email Campaign"
   - Email Subject: "Your Free AI CRM Trial"
   - Email Content: Select "Use Existing Template"
   - Choose template: "Your Free AI CRM Trial"
4. Click "Save Campaign"

**Screenshot:** Capture campaign created notification

---

## Step 6: Add Recipients (1 min)

1. In campaign, click "Add Recipients"
2. Select "Manual emails"
3. Enter: `<your-gmail@gmail.com>`
4. Click "Add"

**Screenshot:** Show recipient added

---

## Step 7: Send Campaign (1 min)

1. Click "Send Campaign" button
2. Confirm dialog appears
3. Click "Send"
4. Campaign status should change to: SENDING

**Note:** May take 5-10 seconds to process

**Screenshot:** Campaign status = SENDING

---

## Step 8: Check Logs (2 min)

While campaign is sending, check backend logs for:

```
[STEP 4] Calling BrevoEmailService.sendEmail()...
[BrevoEmailService] Calling Brevo API: https://api.brevo.com/v3/smtp/email
[BrevoEmailService] ✓ Brevo API Response: 200 OK
```

**Screenshot:** Show successful Brevo log entries

---

## Step 9: Wait for Email (5 min)

Check your Gmail inbox (may take 1-2 minutes):

```
From: noreply@company.com
To: your-gmail@gmail.com
Subject: Your Free AI CRM Trial
```

**Open email and verify:**

### Visual Inspection Checklist:

- [ ] **Subject:** "Your Free AI CRM Trial" (appears in subject line)
- [ ] **Header:** Blue background with text (CSS not stripped)
- [ ] **Content:** Multiple paragraphs with proper spacing
- [ ] **List Items:** 5 bullet points visible
- [ ] **CTA Button:** Blue button with white text "Start Free Trial"
  - Button should be clickable
  - Button should NOT be plain text link
- [ ] **Footer:** Gray background with copyright
- [ ] **Styling:** All colors, fonts, sizes preserved
- [ ] **No Raw HTML:** No `<`, `>`, `&lt;`, `&quot;` visible
- [ ] **No Escaped Content:** No backslashes, no unicode escapes
- [ ] **Variable Rendered:** If personalization used, verify {{firstName}} replaced with "Recipient"

**Screenshots:** Capture email in Gmail inbox (full email, CTA button close-up)

---

## Step 10: Test CTA Button (1 min)

1. Click the blue "Start Free Trial" button in email
2. Browser should redirect to: `https://your-project-domain.com/signup?trial=14days`
3. URL should be clean (no double encoding)

**Screenshot:** Show browser address bar with correct URL

---

## Step 11: Verify Campaign Status (1 min)

Go back to CRM → Email Campaigns:

1. Click on "Test AI Email Campaign"
2. Verify:
   - [ ] Status: SENT (not FAILED)
   - [ ] Sent: 1
   - [ ] Failed: 0
   - [ ] Recipient Status: SENT

**Screenshot:** Show campaign metrics

---

## Step 12: Test Manual Template (Optional, 3 min)

Repeat Steps 2-11 but:
1. In Step 2: Don't generate with AI
2. Instead: Go to Email Templates → Create Template manually
3. Copy same HTML content as AI generated
4. Save as "Manual CRM Trial Email"
5. Create campaign with manual template
6. Send to same recipient

**Compare:**
- [ ] Manual email looks identical to AI email in Gmail
- [ ] Both have same styling, formatting, CTA button
- [ ] Both render identically

---

## Troubleshooting

### Problem: Email doesn't arrive

**Check:**
1. Spam folder in Gmail
2. Campaign status in CRM (should be SENT or PARTIAL, not FAILED)
3. Brevo logs for errors (500 errors, auth issues)

### Problem: HTML appears as raw text

**Check:**
1. Database: Is htmlContent escaped? Look for `&lt;`
2. Gmail: Does email show `<html>` as text?
3. Fix: Remove HTML escaping at the source

### Problem: CTA button is a plain link (not styled button)

**Check:**
1. Email shows link text but no button styling
2. Likely Brevo or email client issue
3. Verify button HTML in database has inline styles

### Problem: Variables not replaced (shows {{firstName}})

**Check:**
1. Was recipient name provided when adding recipients?
2. Verify renderTemplate() is called on htmlContent in EmailCampaignSendingService
3. Check logs for rendering errors

### Problem: Email cuts off or content missing

**Check:**
1. HTML length in database (should be > 2KB)
2. Check if CTA or tracking pixel appended correctly
3. Verify no truncation in Brevo payload

---

## Success Criteria

✅ **Phase 11.5 is COMPLETE when:**

- [ ] AI email generates successfully
- [ ] Template saves without errors
- [ ] Database shows HTML NOT escaped
- [ ] Campaign sends successfully (status: SENT)
- [ ] Email arrives in Gmail inbox
- [ ] Email displays with correct formatting
- [ ] CTA button appears as styled button (not plain link)
- [ ] CTA button click works with correct URL
- [ ] Manual template test passes (optional but recommended)
- [ ] All screenshots documented

---

## Documentation

After testing, create a report with:

**Test Results Summary:**
```
Test Date: _______________
Tester: _______________
Backend: Running / Live
Frontend: Running / Live

AI Email Generation: PASS / FAIL
Template Save: PASS / FAIL
Database Verification: PASS / FAIL
Campaign Send: PASS / FAIL
Gmail Receipt: PASS / FAIL
Email Rendering: PASS / FAIL
CTA Button: PASS / FAIL
Manual Template (Optional): PASS / FAIL

Issues Found:
1. _______________
2. _______________

Fixes Applied:
1. _______________
2. _______________

Final Status: READY FOR PRODUCTION / NEEDS FIXES
```

---

## Quick Reference

| Step | Component | Expected Result | Status |
|------|-----------|-----------------|--------|
| 1 | AI Generation | Email preview with formatted content | __ |
| 2 | Save Template | Success toast "Template created" | __ |
| 3 | Database Check | HTML NOT escaped, contains `<`, `>` | __ |
| 4 | Campaign Create | Campaign saved, status = DRAFT | __ |
| 5 | Add Recipients | Recipient added, status = PENDING | __ |
| 6 | Send Campaign | Campaign status = SENDING then SENT | __ |
| 7 | Brevo Logs | "✓ Brevo API Response: 200 OK" | __ |
| 8 | Gmail Inbox | Email received, properly formatted | __ |
| 9 | Email Rendering | All styling intact, CTA button visible | __ |
| 10 | CTA Click | Redirect to correct URL | __ |
| 11 | Campaign Metrics | sent_count = 1, failed_count = 0 | __ |

---

## Still Having Issues?

1. **Check logs first** - Both backend logs and Gmail spam folder
2. **Follow the pipeline** - Test each checkpoint in order
3. **Verify data** - Use SQL to inspect database directly
4. **Compare layers** - Check if issue is at AI, DB, sending, or rendering stage
5. **Minimal fix** - Fix only the identified layer, don't modify unrelated code

For detailed analysis, see: `PHASE_11.5_TEST_PLAN.md` and `PHASE_11.5_VERIFICATION_SCRIPT.sql`

