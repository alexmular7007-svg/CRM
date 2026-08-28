package com.arjun.crm.enums;

/**
 * AutomationTriggerType - PHASE 1: Core Foundation + PHASE 7.3: Email Events
 * 
 * Defines the events that can trigger an automation
 * 
 * PHASE 1 Supported Triggers:
 * - LEAD_CREATED: Triggered when a new lead is created (manual or lead magnet)
 * - LEAD_MAGNET_SUBMITTED: Triggered when lead submits a lead magnet form
 * 
 * PHASE 7.3 Email Event Triggers:
 * - EMAIL_DELIVERED: Triggered when email is successfully delivered
 * - EMAIL_OPENED: Triggered when recipient opens an email
 * - EMAIL_CLICKED: Triggered when recipient clicks a link in email
 * - EMAIL_BOUNCED: Triggered when email bounces (permanent or temporary)
 * 
 * Future Phases:
 * - LEAD_STATUS_CHANGED
 * - TASK_CREATED
 * - TIME_BASED (delay/wait)
 */
public enum AutomationTriggerType {
    LEAD_CREATED,
    LEAD_MAGNET_SUBMITTED,
    EMAIL_DELIVERED,
    EMAIL_OPENED,
    EMAIL_CLICKED,
    EMAIL_BOUNCED
}
