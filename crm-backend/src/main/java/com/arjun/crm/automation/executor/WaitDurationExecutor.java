package com.arjun.crm.automation.executor;

import com.arjun.crm.automation.executor.AutomationStepExecutor.StepOutcome;
import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.enums.AutomationStepType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * WaitDurationExecutor - PHASE 7.1: Automation Wait/Scheduler Engine
 * 
 * Executes WAIT_DURATION steps that pause automation execution
 * Returns a wait duration in milliseconds to be processed by scheduler
 * 
 * Configuration:
 * {
 *   "duration": 24,                    // Integer duration value
 *   "unit": "HOURS"                    // TimeUnit: SECONDS, MINUTES, HOURS, DAYS
 * }
 * 
 * Behavior:
 * 1. Parse duration and unit from configuration
 * 2. Convert to milliseconds using TimeUnit
 * 3. Return StepExecutionResult.wait(milliseconds)
 * 4. Service transitions execution to WAITING status
 * 5. Scheduler will resume when duration expires
 * 
 * Error Handling:
 * - Missing duration: failure
 * - Invalid duration (non-numeric): failure
 * - Missing unit: defaults to HOURS
 * - Invalid unit: failure
 * 
 * Example Configuration:
 * - Wait 2 seconds: { "duration": 2, "unit": "SECONDS" }
 * - Wait 5 minutes: { "duration": 5, "unit": "MINUTES" }
 * - Wait 24 hours: { "duration": 24, "unit": "HOURS" }
 * - Wait 3 days: { "duration": 3, "unit": "DAYS" }
 * 
 * Testing:
 * For integration tests, use short durations (SECONDS)
 * to avoid slow test execution
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WaitDurationExecutor implements AutomationStepExecutor {
    
    @Override
    public AutomationStepExecutor.StepExecutionResult execute(AutomationStep step, AutomationExecution execution, Lead lead) {
        log.info("Executing WAIT_DURATION step: {} for lead: {}", step.getId(), lead.getId());
        
        try {
            // Get configuration
            Map<String, Object> config = step.getConfiguration();
            if (config == null || config.isEmpty()) {
                return new AutomationStepExecutor.StepExecutionResult(false, "WAIT_DURATION configuration is empty", StepOutcome.FAILED);
            }
            
            // Parse duration
            Object durationObj = config.get("duration");
            if (durationObj == null) {
                return new AutomationStepExecutor.StepExecutionResult(false, "duration is required in WAIT_DURATION configuration", StepOutcome.FAILED);
            }
            
            Long duration;
            if (durationObj instanceof Number) {
                duration = ((Number) durationObj).longValue();
            } else if (durationObj instanceof String) {
                try {
                    duration = Long.parseLong((String) durationObj);
                } catch (NumberFormatException e) {
                    return new AutomationStepExecutor.StepExecutionResult(false, "duration must be a number", StepOutcome.FAILED);
                }
            } else {
                return new AutomationStepExecutor.StepExecutionResult(false, "duration has invalid type", StepOutcome.FAILED);
            }
            
            if (duration <= 0) {
                return new AutomationStepExecutor.StepExecutionResult(false, "duration must be greater than 0", StepOutcome.FAILED);
            }
            
            // Parse unit (default to HOURS for backward compatibility)
            String unitStr = (String) config.get("unit");
            if (unitStr == null || unitStr.isEmpty()) {
                unitStr = "HOURS";
                log.warn("unit not specified in WAIT_DURATION configuration, defaulting to HOURS");
            }
            
            TimeUnit unit;
            try {
                unit = TimeUnit.valueOf(unitStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return new AutomationStepExecutor.StepExecutionResult(false, "Invalid unit: " + unitStr + 
                        ". Valid values: SECONDS, MINUTES, HOURS, DAYS", StepOutcome.FAILED);
            }
            
            // Convert to milliseconds
            long milliseconds = unit.toMillis(duration);
            
            log.info("WAIT_DURATION step pausing execution: duration={} {}, resume_after={} ms", 
                    duration, unit, milliseconds);
            
            // Return wait result - service will handle WAITING status transition
            return new AutomationStepExecutor.StepExecutionResult(true, StepOutcome.WAIT, milliseconds);
            
        } catch (Exception e) {
            log.error("Error executing WAIT_DURATION step: {}", step.getId(), e);
            return new AutomationStepExecutor.StepExecutionResult(false, "Wait duration parsing failed: " + e.getMessage(), StepOutcome.FAILED);
        }
    }
    
    @Override
    public AutomationStepType getStepType() {
        return AutomationStepType.WAIT_DURATION;
    }
}
