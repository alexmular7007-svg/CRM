package com.arjun.crm.automation.executor;

import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.enums.AutomationStepType;

/**
 * AutomationStepExecutor - PHASE 3: Execution Engine
 * 
 * Interface for polymorphic step execution.
 * Each step type has an executor that knows how to execute it.
 * 
 * Example Flow:
 * 1. AutomationStepExecutionService gets step
 * 2. Calls StepExecutorFactory.getExecutor(step.getType())
 * 3. Factory returns appropriate executor (SendEmailActionExecutor, etc.)
 * 4. Calls executor.execute(step, execution, lead)
 * 5. Executor performs action and returns StepExecutionResult
 * 
 * Step Types Handled:
 * - SEND_EMAIL: SendEmailActionExecutor
 * - UPDATE_LEAD: UpdateLeadActionExecutor
 * - UPDATE_LEAD_SCORE: UpdateLeadScoreActionExecutor
 * - EMAIL_OPENED_CONDITION: EmailOpenedConditionEvaluator
 * - EMAIL_CLICKED_CONDITION: EmailClickedConditionEvaluator
 * - LEAD_STATUS_CONDITION: LeadStatusConditionEvaluator
 * - LEAD_SCORE_CONDITION: LeadScoreConditionEvaluator
 * - WAIT_DURATION: WaitDurationExecutor
 */
public interface AutomationStepExecutor {
    
    /**
     * Execute a single automation step
     * 
     * @param step the automation step to execute
     * @param execution the automation execution context
     * @param lead the lead being processed
     * @return result of execution (success/failure/wait)
     * @throws Exception if execution fails (will be caught and recorded)
     */
    StepExecutionResult execute(AutomationStep step, AutomationExecution execution, Lead lead);
    
    /**
     * Get the step type this executor handles
     * 
     * @return the AutomationStepType
     */
    AutomationStepType getStepType();
    
    /**
     * Result of executing a single step
     * 
     * Immutable result object containing outcome of step execution
     */
    class StepExecutionResult {
        private final boolean success;
        private final String errorMessage;
        private final StepOutcome outcome;
        private final Boolean conditionResult;  // For CONDITION steps: true/false/null
        private final Long resumeAfterMs;       // For WAIT steps: milliseconds to wait
        
        public StepExecutionResult(boolean success, StepOutcome outcome) {
            this(success, null, outcome, null, null);
        }
        
        public StepExecutionResult(boolean success, String errorMessage, StepOutcome outcome) {
            this(success, errorMessage, outcome, null, null);
        }
        
        public StepExecutionResult(boolean success, StepOutcome outcome, Boolean conditionResult) {
            this(success, null, outcome, conditionResult, null);
        }
        
        public StepExecutionResult(boolean success, StepOutcome outcome, Long resumeAfterMs) {
            this(success, null, outcome, null, resumeAfterMs);
        }
        
        public StepExecutionResult(boolean success, String errorMessage, StepOutcome outcome, Boolean conditionResult, Long resumeAfterMs) {
            this.success = success;
            this.errorMessage = errorMessage;
            this.outcome = outcome;
            this.conditionResult = conditionResult;
            this.resumeAfterMs = resumeAfterMs;
        }
        
        public static StepExecutionResult success() {
            return new StepExecutionResult(true, StepOutcome.CONTINUE);
        }
        
        public static StepExecutionResult failure(String errorMessage) {
            return new StepExecutionResult(false, errorMessage, StepOutcome.FAILED);
        }
        
        public static StepExecutionResult wait(Long resumeAfterMs) {
            return new StepExecutionResult(true, StepOutcome.WAIT, resumeAfterMs);
        }
        
        public static StepExecutionResult condition(Boolean result) {
            return new StepExecutionResult(true, StepOutcome.CONTINUE, result);
        }
        
        public boolean isSuccess() { return success; }
        public String getErrorMessage() { return errorMessage; }
        public StepOutcome getOutcome() { return outcome; }
        public Boolean getConditionResult() { return conditionResult; }
        public Long getResumeAfterMs() { return resumeAfterMs; }
    }
    
    /**
     * Outcome of step execution
     */
    enum StepOutcome {
        CONTINUE,   // Step succeeded, continue to next step
        FAILED,     // Step failed, execution should abort
        WAIT        // Step paused at wait point, will resume later
    }
}
