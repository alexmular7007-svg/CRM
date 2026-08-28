package com.arjun.crm.automation.condition;

import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.enums.AutomationStepType;

/**
 * ConditionEvaluator - PHASE 7.2: Automation Condition Engine
 * 
 * Interface for evaluating automation conditions and determining branching.
 * Conditions are database-backed and evaluate actual runtime state.
 * 
 * Supported Condition Types:
 * - LEAD_SCORE_CONDITION: Evaluate lead score with operators (>, <, ==, >=, <=)
 * - LEAD_STATUS_CONDITION: Check lead status (enum equality)
 * - EMAIL_OPENED_CONDITION: Check if email was opened (tracks openedAt)
 * - EMAIL_CLICKED_CONDITION: Check if email was clicked (tracks firstClickedAt)
 * 
 * Execution Flow:
 * 1. Service calls executor.execute(step, execution, lead)
 * 2. Executor evaluates condition against database state
 * 3. Returns StepExecutionResult with conditionResult = true/false
 * 4. Service branches to next step based on result
 * 
 * Error Handling:
 * - Missing required fields → return failure
 * - Invalid operators → return failure
 * - Invalid values → return failure
 * - Null values → handled per condition type
 * - Database errors → propagate as failure
 * 
 * Branching Logic:
 * If condition TRUE:
 *   Execute all subsequent steps until next condition or end
 * If condition FALSE:
 *   Skip to alternative branch (if exists)
 *   Or skip to next sequential step
 * 
 * Design:
 * - Each condition type has its own evaluator
 * - Evaluators are autowired via Spring
 * - Factory pattern routes to correct evaluator
 * - Stateless: no side effects during evaluation
 */
public interface ConditionEvaluator {
    
    /**
     * Evaluate a condition step
     * 
     * @param step the automation step containing condition configuration
     * @param execution the execution context
     * @param lead the lead being processed
     * @return ConditionResult with true/false evaluation result
     * @throws Exception if evaluation fails (will be caught and recorded)
     */
    ConditionResult evaluate(AutomationStep step, AutomationExecution execution, Lead lead);
    
    /**
     * Get the step type this evaluator handles
     * 
     * @return the AutomationStepType (e.g., LEAD_SCORE_CONDITION)
     */
    AutomationStepType getConditionType();
    
    /**
     * Result of condition evaluation
     * 
     * Immutable result object containing outcome of condition evaluation
     */
    class ConditionResult {
        private final boolean success;           // Evaluation succeeded (no errors)
        private final boolean conditionValue;    // TRUE if condition matched, FALSE if not
        private final String errorMessage;       // Error if evaluation failed
        
        public ConditionResult(boolean success, boolean conditionValue, String errorMessage) {
            this.success = success;
            this.conditionValue = conditionValue;
            this.errorMessage = errorMessage;
        }
        
        /**
         * Condition evaluated successfully to TRUE
         */
        public static ConditionResult TRUE() {
            return new ConditionResult(true, true, null);
        }
        
        /**
         * Condition evaluated successfully to FALSE
         */
        public static ConditionResult FALSE() {
            return new ConditionResult(true, false, null);
        }
        
        /**
         * Condition evaluation failed with error
         */
        public static ConditionResult error(String errorMessage) {
            return new ConditionResult(false, false, errorMessage);
        }
        
        public boolean isSuccess() { return success; }
        public boolean getConditionValue() { return conditionValue; }
        public String getErrorMessage() { return errorMessage; }
    }
}
