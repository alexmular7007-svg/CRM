package com.arjun.crm.enums;

/**
 * AutomationStepType - PHASE 2: Workflow Model
 * 
 * Categorizes the different types of steps in an automation workflow.
 * 
 * TRIGGER STEPS (1 per automation, always first):
 * - LEAD_CREATED: Triggers when a new lead is created
 * - LEAD_MAGNET_SUBMITTED: Triggers when lead magnet form submitted
 * - EMAIL_OPENED: Triggers when recipient opens an email
 * - EMAIL_CLICKED: Triggers when recipient clicks email link
 * 
 * ACTION STEPS (executed sequentially):
 * - SEND_EMAIL: Send email to lead (integrates with BrevoEmailService)
 * - UPDATE_LEAD: Update lead fields (status, score, custom fields)
 * - UPDATE_LEAD_SCORE: Increment/decrement lead score
 * 
 * CONDITION STEPS (evaluate and branch):
 * - EMAIL_OPENED: Check if email was opened
 * - EMAIL_CLICKED: Check if email link was clicked
 * - LEAD_STATUS: Check lead status
 * - LEAD_SCORE: Check lead score threshold
 * 
 * WAIT STEPS (pause execution):
 * - WAIT_DURATION: Wait for specified time (seconds/minutes/hours/days)
 * 
 * Example Flow:
 * Step 1 [TRIGGER]:  LEAD_MAGNET_SUBMITTED
 * Step 2 [ACTION]:   SEND_EMAIL (welcome email)
 * Step 3 [WAIT]:     WAIT_DURATION (24 hours)
 * Step 4 [CONDITION]: EMAIL_OPENED
 *   - YES: Step 5a [ACTION]: UPDATE_LEAD_SCORE (+10)
 *   - NO:  Step 5b [ACTION]: SEND_EMAIL (reminder)
 */
public enum AutomationStepType {
    // Trigger Steps
    LEAD_CREATED,
    LEAD_MAGNET_SUBMITTED,
    EMAIL_OPENED,
    EMAIL_CLICKED,
    
    // Action Steps
    SEND_EMAIL,
    UPDATE_LEAD,
    UPDATE_LEAD_SCORE,
    
    // Condition Steps
    EMAIL_OPENED_CONDITION,
    EMAIL_CLICKED_CONDITION,
    LEAD_STATUS_CONDITION,
    LEAD_SCORE_CONDITION,
    
    // Wait Steps
    WAIT_DURATION
}
