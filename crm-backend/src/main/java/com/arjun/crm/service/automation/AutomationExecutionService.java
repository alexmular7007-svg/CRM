package com.arjun.crm.service.automation;

import com.arjun.crm.entity.Automation;
import com.arjun.crm.entity.Lead;

/**
 * AutomationExecutionService - PHASE 3: Execution Engine
 * 
 * Orchestrates automation workflow execution
 * 
 * Responsibilities:
 * 1. Create execution record
 * 2. Execute steps sequentially
 * 3. Handle conditions and branching
 * 4. Handle wait steps
 * 5. Record execution status
 * 6. Record errors
 * 7. Continue safely on failures
 * 
 * Execution Flow:
 * 1. executeAutomation(automation, lead) called
 * 2. Check for duplicate recent executions
 * 3. Create AutomationExecution with status=PENDING
 * 4. Transition to RUNNING
 * 5. For each step:
 *    - Execute step via StepExecutor
 *    - Handle result (success, failure, wait, condition)
 * 6. On completion: transition to COMPLETED
 * 7. On failure: transition to FAILED, record error
 * 
 * Error Handling:
 * - One failed execution doesn't crash system
 * - Errors are stored in AutomationExecution.error
 * - Execution stops, can be retried later
 */
public interface AutomationExecutionService {
    
    /**
     * Execute an automation for a lead
     * Called when trigger is detected (lead created, email opened, etc.)
     * 
     * @param automation the automation to execute
     * @param lead the lead triggering the automation
     */
    void executeAutomation(Automation automation, Lead lead);
    
    /**
     * Resume a waiting execution
     * Called by scheduler when WAIT_DURATION expires
     * 
     * @param executionId the execution ID to resume
     */
    void resumeExecution(Long executionId);
}
