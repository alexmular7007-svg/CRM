package com.arjun.crm.enums;

/**
 * AutomationExecutionStatus - PHASE 3: Execution Engine
 * 
 * Represents the lifecycle state of an automation execution
 * 
 * Transitions:
 * PENDING → RUNNING → COMPLETED
 * PENDING → RUNNING → FAILED
 * PENDING → RUNNING → WAITING → RUNNING → COMPLETED
 * 
 * PENDING: Execution created, waiting to start
 * RUNNING: Currently executing steps
 * WAITING: Paused due to WAIT_DURATION step, will resume later
 * COMPLETED: Successfully completed all steps
 * FAILED: Execution failed on a step, error recorded
 */
public enum AutomationExecutionStatus {
    PENDING,    // Created, not yet started
    RUNNING,    // Currently executing
    WAITING,    // Paused at wait step, will resume
    COMPLETED,  // Successfully completed
    FAILED      // Failed on a step
}
