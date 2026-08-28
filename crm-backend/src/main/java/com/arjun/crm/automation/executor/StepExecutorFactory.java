package com.arjun.crm.automation.executor;

import com.arjun.crm.enums.AutomationStepType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * StepExecutorFactory - PHASE 3: Execution Engine
 * 
 * Factory for creating step executors by type
 * Uses polymorphism to handle different step types
 * 
 * Registered Executors:
 * - SEND_EMAIL: SendEmailActionExecutor
 * - UPDATE_LEAD: UpdateLeadActionExecutor
 * - UPDATE_LEAD_SCORE: UpdateLeadScoreActionExecutor
 * - LEAD_CREATED: TriggerStepExecutor (no-op, just for execution flow)
 * - LEAD_MAGNET_SUBMITTED: TriggerStepExecutor (no-op)
 * - EMAIL_OPENED: EmailOpenedConditionEvaluator (Phase 4)
 * - EMAIL_CLICKED: EmailClickedConditionEvaluator (Phase 4)
 * - WAIT_DURATION: WaitDurationExecutor (Phase 4)
 * 
 * Example:
 * AutomationStepExecutor executor = factory.getExecutor(AutomationStepType.SEND_EMAIL);
 * StepExecutionResult result = executor.execute(step, execution, lead);
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StepExecutorFactory {
    
    private final SendEmailActionExecutor sendEmailActionExecutor;
    private final UpdateLeadActionExecutor updateLeadActionExecutor;
    private final UpdateLeadScoreActionExecutor updateLeadScoreActionExecutor;
    private final List<AutomationStepExecutor> allExecutors;
    
    private Map<AutomationStepType, AutomationStepExecutor> executorMap;
    
    /**
     * Get executor for a step type
     * 
     * @param stepType the step type
     * @return executor for this type
     * @throws IllegalArgumentException if no executor found for type
     */
    public AutomationStepExecutor getExecutor(AutomationStepType stepType) {
        // Initialize map lazily (after all beans are created)
        if (executorMap == null) {
            initializeExecutorMap();
        }
        
        AutomationStepExecutor executor = executorMap.get(stepType);
        if (executor == null) {
            throw new IllegalArgumentException("No executor registered for step type: " + stepType);
        }
        
        return executor;
    }
    
    /**
     * Initialize executor map from registered executors
     * Allows easy registration of new executors via Spring DI
     */
    private void initializeExecutorMap() {
        executorMap = new HashMap<>();
        
        // Register action executors
        executorMap.put(AutomationStepType.SEND_EMAIL, sendEmailActionExecutor);
        executorMap.put(AutomationStepType.UPDATE_LEAD, updateLeadActionExecutor);
        executorMap.put(AutomationStepType.UPDATE_LEAD_SCORE, updateLeadScoreActionExecutor);
        
        // Register other executors from autowired list
        // This allows new executors to be registered without changing factory code
        for (AutomationStepExecutor executor : allExecutors) {
            AutomationStepType stepType = executor.getStepType();
            if (!executorMap.containsKey(stepType)) {
                executorMap.put(stepType, executor);
            }
        }
        
        log.info("Initialized {} step executors", executorMap.size());
        log.debug("Registered executors: {}", executorMap.keySet());
    }
    
    /**
     * Check if executor exists for step type
     * 
     * @param stepType the step type
     * @return true if executor exists
     */
    public boolean hasExecutor(AutomationStepType stepType) {
        if (executorMap == null) {
            initializeExecutorMap();
        }
        return executorMap.containsKey(stepType);
    }
}
