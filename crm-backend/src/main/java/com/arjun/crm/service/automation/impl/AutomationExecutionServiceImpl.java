package com.arjun.crm.service.automation.impl;

import com.arjun.crm.automation.condition.ConditionEvaluator;
import com.arjun.crm.automation.condition.ConditionExecutorFactory;
import com.arjun.crm.automation.executor.AutomationStepExecutor;
import com.arjun.crm.automation.executor.StepExecutorFactory;
import com.arjun.crm.entity.*;
import com.arjun.crm.enums.AutomationExecutionStatus;
import com.arjun.crm.enums.AutomationStepType;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.AutomationExecutionRepository;
import com.arjun.crm.repository.AutomationRepository;
import com.arjun.crm.repository.AutomationStepRepository;
import com.arjun.crm.service.automation.AutomationExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * AutomationExecutionServiceImpl - PHASE 3: Execution Engine
 * 
 * Implementation of automation execution orchestration
 * 
 * Key Features:
 * - Async execution (non-blocking)
 * - Sequential step execution
 * - Duplicate prevention
 * - Error handling and recording
 * - Wait step handling
 * - Execution history tracking
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AutomationExecutionServiceImpl implements AutomationExecutionService {
    
    private static final int DUPLICATE_CHECK_MINUTES = 5;
    
    private final AutomationRepository automationRepository;
    private final AutomationStepRepository stepRepository;
    private final AutomationExecutionRepository executionRepository;
    private final StepExecutorFactory stepExecutorFactory;
    private final ConditionExecutorFactory conditionExecutorFactory;
    
    @Override
    @Async
    public void executeAutomation(Automation automation, Lead lead) {
        log.info("╔════════════════════════════════════════════════════════════════════════════════");
        log.info("║ AUTOMATION EXECUTION START");
        log.info("║ Automation: {} (ID: {})", automation.getName(), automation.getId());
        log.info("║ Lead: {} (ID: {})", lead.getName(), lead.getId());
        log.info("╚════════════════════════════════════════════════════════════════════════════════");
        
        AutomationExecution execution = null;
        
        try {
            // Check for duplicate recent executions (prevent spam)
            LocalDateTime cutoff = LocalDateTime.now().minus(DUPLICATE_CHECK_MINUTES, ChronoUnit.MINUTES);
            long recentCount = executionRepository.countRecentExecutions(
                    automation.getId(), lead.getId(), cutoff
            );
            
            if (recentCount > 0) {
                log.warn("Duplicate execution detected: {} executions in last {} minutes", recentCount, DUPLICATE_CHECK_MINUTES);
                return;
            }
            
            // Create execution record
            execution = AutomationExecution.builder()
                    .automation(automation)
                    .lead(lead)
                    .status(AutomationExecutionStatus.PENDING)
                    .currentStep(null)
                    .build();
            
            execution = executionRepository.save(execution);
            log.info("Created execution: {} with status={}", execution.getId(), execution.getStatus());
            
            // Fetch all steps in order
                List<AutomationStep> steps = stepRepository.findEnabledByAutomationIdAndWorkspaceId(
                    automation.getId(), automation.getWorkspace().getId());
            
            if (steps.isEmpty()) {
                log.warn("Automation has no steps, marking as completed");
                execution.setStatus(AutomationExecutionStatus.COMPLETED);
                execution.setCompletedAt(LocalDateTime.now());
                executionRepository.save(execution);
                return;
            }
            
            // Transition to RUNNING
            execution.setStatus(AutomationExecutionStatus.RUNNING);
            execution.setStartedAt(LocalDateTime.now());
            execution = executionRepository.save(execution);
            
            // Execute steps sequentially
            for (AutomationStep step : steps) {
                log.info("│ Executing step: {} type={} order={}", step.getId(), step.getType(), step.getStepOrder());
                
                // Update current step
                execution.setCurrentStep(step.getStepOrder());
                execution = executionRepository.save(execution);
                
                try {
                    // Check if this is a condition step
                    if (isConditionStep(step.getType())) {
                        if (!handleConditionStep(step, execution, lead, steps)) {
                            return;
                        }
                    } else {
                        // Execute action/wait step
                        AutomationStepExecutor executor = stepExecutorFactory.getExecutor(step.getType());
                        AutomationStepExecutor.StepExecutionResult result = executor.execute(step, execution, lead);
                        
                        if (!result.isSuccess()) {
                            log.error("Step execution failed: {}", result.getErrorMessage());
                            execution.setStatus(AutomationExecutionStatus.FAILED);
                            execution.setError(result.getErrorMessage());
                            execution.setFailedStepId(step.getId());
                            execution.setCompletedAt(LocalDateTime.now());
                            executionRepository.save(execution);
                            
                            log.warn("Execution failed at step {}: {}", step.getStepOrder(), result.getErrorMessage());
                            return;
                        }
                        
                        // Handle outcome
                        switch (result.getOutcome()) {
                            case CONTINUE:
                                log.info("│ Step completed, continuing...");
                                break;
                                
                            case WAIT:
                                log.info("│ Step paused at WAIT, will resume after {} ms", result.getResumeAfterMs());
                                execution.setStatus(AutomationExecutionStatus.WAITING);
                                execution.setPausedAt(LocalDateTime.now());
                                execution.setResumeAt(LocalDateTime.now().plus(result.getResumeAfterMs(), ChronoUnit.MILLIS));
                                executionRepository.save(execution);
                                
                                log.info("Execution paused: {}, will resume at: {}", execution.getId(), execution.getResumeAt());
                                return;  // Stop here, scheduler will resume
                                
                            case FAILED:
                                log.error("Step returned FAILED outcome");
                                execution.setStatus(AutomationExecutionStatus.FAILED);
                                execution.setError(result.getErrorMessage());
                                execution.setFailedStepId(step.getId());
                                execution.setCompletedAt(LocalDateTime.now());
                                executionRepository.save(execution);
                                return;
                        }
                    }
                    
                } catch (Exception e) {
                    log.error("Exception during step execution", e);
                    execution.setStatus(AutomationExecutionStatus.FAILED);
                    execution.setError("Step execution error: " + e.getMessage());
                    execution.setFailedStepId(step.getId());
                    execution.setCompletedAt(LocalDateTime.now());
                    executionRepository.save(execution);
                    return;
                }
            }
            
            // All steps completed successfully
            execution.setStatus(AutomationExecutionStatus.COMPLETED);
            execution.setCompletedAt(LocalDateTime.now());
            execution = executionRepository.save(execution);
            
            log.info("╔════════════════════════════════════════════════════════════════════════════════");
            log.info("║ AUTOMATION EXECUTION COMPLETED");
            log.info("║ Execution: {} Status: COMPLETED", execution.getId());
            log.info("║ Steps: {} Lead: {}", steps.size(), lead.getName());
            log.info("╚════════════════════════════════════════════════════════════════════════════════");
            
        } catch (Exception e) {
            log.error("Unexpected error during automation execution", e);
            
            if (execution != null) {
                execution.setStatus(AutomationExecutionStatus.FAILED);
                execution.setError("Unexpected error: " + e.getMessage());
                execution.setCompletedAt(LocalDateTime.now());
                executionRepository.save(execution);
            }
        }
    }
    
    @Override
    @Async
    @Transactional
    public void resumeExecution(Long executionId) {
        log.info("Resuming execution: {}", executionId);
        
        AutomationExecution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found: " + executionId));
        
        if (execution.getStatus() != AutomationExecutionStatus.WAITING) {
            log.warn("Cannot resume execution {}: status is {} (expected WAITING)", executionId, execution.getStatus());
            return;
        }
        
        Lead lead = execution.getLead();
        Automation automation = execution.getAutomation();
        Integer currentStepOrder = execution.getCurrentStep();
        
        try {
            // Fetch remaining steps
                List<AutomationStep> remainingSteps = stepRepository.findEnabledByAutomationIdAndWorkspaceId(
                        automation.getId(), automation.getWorkspace().getId())
                    .stream().filter(s -> s.getStepOrder() > currentStepOrder).toList();
            
            // Transition back to RUNNING
            execution.setStatus(AutomationExecutionStatus.RUNNING);
            execution.setPausedAt(null);
            execution.setResumeAt(null);
            execution = executionRepository.save(execution);
            
            // Execute remaining steps
            for (AutomationStep step : remainingSteps) {
                log.info("Resuming step: {} order={}", step.getId(), step.getStepOrder());
                
                execution.setCurrentStep(step.getStepOrder());
                execution = executionRepository.save(execution);
                
                try {
                    // Check if this is a condition step
                    if (isConditionStep(step.getType())) {
                        if (!handleConditionStep(step, execution, lead, remainingSteps)) {
                            return;
                        }
                    } else {
                        AutomationStepExecutor executor = stepExecutorFactory.getExecutor(step.getType());
                        AutomationStepExecutor.StepExecutionResult result = executor.execute(step, execution, lead);
                        
                        if (!result.isSuccess()) {
                            execution.setStatus(AutomationExecutionStatus.FAILED);
                            execution.setError(result.getErrorMessage());
                            execution.setFailedStepId(step.getId());
                            execution.setCompletedAt(LocalDateTime.now());
                            executionRepository.save(execution);
                            return;
                        }
                        
                        // Handle outcomes
                        if (result.getOutcome() == AutomationStepExecutor.StepOutcome.WAIT) {
                            execution.setStatus(AutomationExecutionStatus.WAITING);
                            execution.setPausedAt(LocalDateTime.now());
                            execution.setResumeAt(LocalDateTime.now().plus(result.getResumeAfterMs(), ChronoUnit.MILLIS));
                            executionRepository.save(execution);
                            return;
                        }
                    }
                    
                } catch (Exception e) {
                    log.error("Error resuming step execution", e);
                    execution.setStatus(AutomationExecutionStatus.FAILED);
                    execution.setError("Resume error: " + e.getMessage());
                    execution.setFailedStepId(step.getId());
                    execution.setCompletedAt(LocalDateTime.now());
                    executionRepository.save(execution);
                    return;
                }
            }
            
            // All remaining steps completed
            execution.setStatus(AutomationExecutionStatus.COMPLETED);
            execution.setCompletedAt(LocalDateTime.now());
            executionRepository.save(execution);
            
            log.info("Resumed execution {} completed successfully", executionId);
            
        } catch (Exception e) {
            log.error("Error resuming execution: {}", executionId, e);
            execution.setStatus(AutomationExecutionStatus.FAILED);
            execution.setError("Resume failed: " + e.getMessage());
            execution.setCompletedAt(LocalDateTime.now());
            executionRepository.save(execution);
        }
    }
    
    /**
     * Check if a step type is a condition step
     */
    private boolean isConditionStep(AutomationStepType stepType) {
        return stepType == AutomationStepType.LEAD_SCORE_CONDITION ||
               stepType == AutomationStepType.LEAD_STATUS_CONDITION ||
               stepType == AutomationStepType.EMAIL_OPENED_CONDITION ||
               stepType == AutomationStepType.EMAIL_CLICKED_CONDITION;
    }
    
    /**
     * Handle a condition step: evaluate and branch
     * 
     * If condition is TRUE: continue with next step
     * If condition is FALSE: skip to next sequential step (for now)
     * 
     * Phase 4: Implement proper branching with alternative step paths
     */
    private boolean handleConditionStep(AutomationStep step, AutomationExecution execution, Lead lead, List<AutomationStep> allSteps) {
        log.info("Evaluating condition step: {} type={}", step.getId(), step.getType());
        
        try {
            // Get evaluator for this condition type
            ConditionEvaluator evaluator = conditionExecutorFactory.getEvaluator(step.getType());
            ConditionEvaluator.ConditionResult result = evaluator.evaluate(step, execution, lead);
            
            if (!result.isSuccess()) {
                log.error("Condition evaluation failed: {}", result.getErrorMessage());
                execution.setStatus(AutomationExecutionStatus.FAILED);
                execution.setError("Condition evaluation failed: " + result.getErrorMessage());
                execution.setFailedStepId(step.getId());
                execution.setCompletedAt(LocalDateTime.now());
                executionRepository.save(execution);
                return false;
            }
            
            log.info("CONDITION_STEP result: {} (step={}, type={})", 
                    result.getConditionValue(), step.getStepOrder(), step.getType());
            
            // Record condition result in execution notes for history
            recordConditionResult(execution, step, result.getConditionValue());
            
            // Branch logic:
            // TRUE: continue with next step (normal flow)
            // FALSE: skip to next step (no special branching in Phase 3, implement in Phase 4)
            // For now, both TRUE and FALSE continue with next sequential step
            
                log.info("Condition evaluated: {} - continuing with next step", 
                    result.getConditionValue() ? "TRUE" : "FALSE");
                return true;
            
        } catch (Exception e) {
            log.error("Error evaluating condition step: {}", step.getId(), e);
            execution.setStatus(AutomationExecutionStatus.FAILED);
            execution.setError("Condition evaluation error: " + e.getMessage());
            execution.setFailedStepId(step.getId());
            execution.setCompletedAt(LocalDateTime.now());
            executionRepository.save(execution);
            return false;
        }
    }
    
    /**
     * Record condition result in execution for history/audit
     */
    private void recordConditionResult(AutomationExecution execution, AutomationStep step, boolean result) {
        // Phase 3: Store in execution error field (temporary)
        // Phase 4: Create ExecutionHistory table for detailed audit trail
        String notes = String.format("Condition[%d]: %s = %s", 
                step.getStepOrder(), step.getType(), result ? "TRUE" : "FALSE");
        
        if (execution.getError() != null && !execution.getError().isEmpty()) {
            execution.setError(execution.getError() + "\n" + notes);
        } else {
            execution.setError(notes);
        }
    }
}
