-- Phase 11.5 — AI Email HTML Rendering Verification
-- SQL Verification Script for Database Inspection
-- 
-- Purpose: Verify HTML content is stored correctly in email_templates table
-- Usage: Run against the CRM database after saving AI-generated template
--
-- Run Date: [TO BE FILLED]
-- Test Email: "Your Free AI CRM Trial"
--

-- ===================================================================
-- CHECKPOINT 2: Database Storage Verification
-- ===================================================================

-- Step 1: List all templates in workspace (verify our test template is there)
SELECT 
    id, 
    name, 
    category, 
    created_at, 
    LENGTH(htmlContent) as html_length,
    SUBSTRING(htmlContent, 1, 100) as html_first_100_chars
FROM email_templates 
WHERE category = 'CAMPAIGN'
ORDER BY created_at DESC 
LIMIT 10;

-- Step 2: Inspect our specific test template
-- IMPORTANT: Check for HTML escaping (look for &lt; instead of <)
SELECT 
    id,
    name,
    category,
    subjectTemplate,
    htmlContent,
    plainTextContent,
    LENGTH(htmlContent) as html_byte_length,
    CASE 
        WHEN htmlContent LIKE '%&lt;%' THEN 'WARNING: HTML ESCAPED WITH &lt;'
        WHEN htmlContent LIKE '%\\u003c%' THEN 'WARNING: HTML ESCAPED WITH UNICODE'
        WHEN htmlContent LIKE '<%html%' THEN 'OK: HTML NOT ESCAPED'
        ELSE 'UNKNOWN: CHECK MANUALLY'
    END as html_escaping_status
FROM email_templates 
WHERE name = 'Your Free AI CRM Trial' 
  AND category = 'CAMPAIGN'
LIMIT 1;

-- Step 3: Check HTML structure (verify key tags present)
SELECT 
    name,
    CASE WHEN htmlContent LIKE '%<!DOCTYPE%' THEN '✓' ELSE '✗' END as has_doctype,
    CASE WHEN htmlContent LIKE '%<html%' THEN '✓' ELSE '✗' END as has_html_tag,
    CASE WHEN htmlContent LIKE '%<head%' THEN '✓' ELSE '✗' END as has_head_tag,
    CASE WHEN htmlContent LIKE '%<style%' THEN '✓' ELSE '✗' END as has_style_tag,
    CASE WHEN htmlContent LIKE '%<body%' THEN '✓' ELSE '✗' END as has_body_tag,
    CASE WHEN htmlContent LIKE '%Welcome, {{firstName}}%' THEN '✓' ELSE '✗' END as has_variable_placeholder,
    CASE WHEN htmlContent LIKE '%max-width%' THEN '✓' ELSE '✗' END as has_css_styles
FROM email_templates 
WHERE name = 'Your Free AI CRM Trial' 
LIMIT 1;

-- Step 4: Verify plainTextContent separately
SELECT 
    name,
    plainTextContent,
    LENGTH(plainTextContent) as plain_text_length,
    CASE WHEN plainTextContent LIKE '%Welcome, {{firstName}}%' THEN '✓' ELSE '✗' END as has_placeholder,
    CASE WHEN plainTextContent LIKE '%Advanced lead management%' THEN '✓' ELSE '✗' END as has_content
FROM email_templates 
WHERE name = 'Your Free AI CRM Trial' 
LIMIT 1;

-- ===================================================================
-- CHECKPOINT 3-7: Campaign and Recipient Verification
-- ===================================================================

-- Step 5: Find test campaign
SELECT 
    c.id,
    c.name,
    c.status,
    c.subject,
    c.ctaButtonText,
    c.ctaButtonUrl,
    t.name as template_name,
    t.id as template_id
FROM email_campaigns c
LEFT JOIN email_templates t ON c.template_id = t.id
WHERE c.name = 'Test AI Email Campaign'
LIMIT 1;

-- Step 6: Get campaign ID and use it in next query
-- (Replace <campaign_id> with actual ID from step 5)
SELECT 
    id as recipient_id,
    campaign_id,
    recipient_email,
    recipient_name,
    status,
    sent_at,
    error_message
FROM email_campaign_recipients 
WHERE campaign_id = <campaign_id>
ORDER BY created_at DESC
LIMIT 10;

-- Step 7: Verify campaign metrics
SELECT 
    id,
    name,
    status,
    total_recipients,
    sent_count,
    failed_count,
    send_started_at,
    send_completed_at,
    CASE 
        WHEN status = 'SENT' AND failed_count = 0 THEN '✓ ALL SENT'
        WHEN status = 'PARTIAL' AND sent_count > 0 THEN '⚠ PARTIAL'
        WHEN status = 'FAILED' THEN '✗ FAILED'
        ELSE status
    END as send_status
FROM email_campaigns
WHERE name = 'Test AI Email Campaign'
LIMIT 1;

-- ===================================================================
-- DIAGNOSTIC: Check for common issues
-- ===================================================================

-- Check if HTML was accidentally escaped/encoded
SELECT 
    id,
    name,
    htmlContent as suspicious_content
FROM email_templates
WHERE name = 'Your Free AI CRM Trial'
  AND (
    htmlContent LIKE '%&lt;%'
    OR htmlContent LIKE '%&gt;%'
    OR htmlContent LIKE '%&quot;%'
    OR htmlContent LIKE '%\\%'
    OR htmlContent LIKE '%\u005c%'
  )
LIMIT 1;

-- Check recipient error messages
SELECT 
    id,
    recipient_email,
    status,
    error_message
FROM email_campaign_recipients
WHERE campaign_id IN (
    SELECT id FROM email_campaigns WHERE name = 'Test AI Email Campaign'
)
AND status = 'FAILED'
LIMIT 10;

-- ===================================================================
-- ANALYSIS: Template Comparison (AI vs Manual)
-- ===================================================================

-- List both templates for comparison
SELECT 
    id,
    name,
    category,
    LENGTH(htmlContent) as html_length,
    LENGTH(plainTextContent) as plain_text_length,
    CASE WHEN htmlContent LIKE '%<!DOCTYPE%' THEN 'Full HTML' ELSE 'Partial HTML' END as html_type,
    created_at
FROM email_templates
WHERE name IN ('Your Free AI CRM Trial', 'Manual CRM Trial Email')
  AND category = 'CAMPAIGN'
ORDER BY created_at DESC;

-- ===================================================================
-- VALIDATION: Ready-to-use checks
-- ===================================================================

-- Quick validation: All prerequisites for Phase 11.5 complete
SELECT 
    (SELECT COUNT(*) FROM email_templates WHERE name = 'Your Free AI CRM Trial') as template_count,
    (SELECT COUNT(*) FROM email_campaigns WHERE name = 'Test AI Email Campaign') as campaign_count,
    (SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id IN (SELECT id FROM email_campaigns WHERE name = 'Test AI Email Campaign')) as recipient_count,
    (SELECT status FROM email_campaigns WHERE name = 'Test AI Email Campaign' LIMIT 1) as campaign_status;

-- ===================================================================
-- CLEANUP: (Optional) Remove test data after verification
-- ===================================================================

-- WARNING: Only run if tests are complete and you want to clean up test data
-- DO NOT RUN unless specifically instructed

-- Step 1: Get test IDs
-- SELECT 
--     (SELECT id FROM email_templates WHERE name = 'Your Free AI CRM Trial' LIMIT 1) as template_id,
--     (SELECT id FROM email_campaigns WHERE name = 'Test AI Email Campaign' LIMIT 1) as campaign_id;

-- Step 2: Delete recipients (if campaign_id = <id>)
-- DELETE FROM email_campaign_recipients WHERE campaign_id = <campaign_id>;

-- Step 3: Delete campaign
-- DELETE FROM email_campaigns WHERE id = <campaign_id>;

-- Step 4: Delete template
-- DELETE FROM email_templates WHERE id = <template_id>;

-- ===================================================================
-- EXPORT: HTML Content for Manual Inspection
-- ===================================================================

-- To export full HTML for inspection in text editor:
-- SELECT htmlContent FROM email_templates WHERE name = 'Your Free AI CRM Trial' INTO OUTFILE '/tmp/test_email.html';
-- Then inspect the file: cat /tmp/test_email.html

-- ===================================================================
-- END OF VERIFICATION SCRIPT
-- ===================================================================
