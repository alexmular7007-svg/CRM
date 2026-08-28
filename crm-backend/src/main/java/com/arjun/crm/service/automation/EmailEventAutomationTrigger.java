package com.arjun.crm.service.automation;

import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.event.EmailEventPublished;

/**
 * EmailEventAutomationTrigger - PHASE 7.3: Email Event → Automation Trigger
 *
 * Service interface for triggering automations based on email events.
 * Handles the complete flow from email event to automation execution.
 *
 * Responsibilities:
 * 1. Find all matching automations in the campaign's workspace
 * 2. Filter by trigger type and status
 * 3. Check for duplicate execution protection
 * 4. Create and execute automation executions asynchronously
 *
 * Usage:
 * - Called from AutomationEventListener when email events are published
 * - Receives EmailEventPublished domain event
 * - Queries automations and executes matching ones
 *
 * Workspace Isolation:
 * - Queries automations only from the email campaign's workspace
 * - Campaign carries workspace relationship
 *
 * Duplicate Prevention:
 * - Checks AutomationExecutionRepository for recent executions
 * - Prevents re-triggering same automation for same recipient
 * - Uses time window to allow rate-limited re-execution
 *
 * Error Handling:
 * - Individual automation failures don't affect others
 * - Failures logged but not re-thrown (non-blocking)
 */
public interface EmailEventAutomationTrigger {

    /**
     * Trigger automations based on email event.
     *
     * Flow:
     * 1. Extract trigger type from event
     * 2. Get workspace from campaign
     * 3. Find all ACTIVE automations with matching trigger type
     * 4. For each automation:
     *    a. Check if recipient lead can be determined
     *    b. Check for recent execution (dedup)
     *    c. If not duplicate, execute automation
     * 5. Log summary of triggered automations
     *
     * @param event Email event published from webhook processing
     */
    void triggerAutomations(EmailEventPublished event);
}
