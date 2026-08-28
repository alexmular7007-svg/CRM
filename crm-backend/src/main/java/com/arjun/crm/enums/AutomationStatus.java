package com.arjun.crm.enums;

/**
 * AutomationStatus - PHASE 1: Core Foundation
 * 
 * Represents the lifecycle state of an automation
 * 
 * Transitions:
 * DRAFT → ACTIVE → PAUSED → ACTIVE (re-activate)
 * Any state → ARCHIVED (soft delete)
 */
public enum AutomationStatus {
    DRAFT,      // Initial state, not yet active
    ACTIVE,     // Running and processing triggers
    PAUSED,     // Temporarily stopped, can be reactivated
    ARCHIVED    // Soft deleted, no longer processes triggers
}
