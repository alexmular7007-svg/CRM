package com.arjun.crm.automation.condition;

import com.arjun.crm.enums.AutomationStepType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ConditionExecutorFactory - PHASE 7.2: Automation Condition Engine
 * 
 * Factory for creating condition evaluators by type
 * Uses polymorphism to handle different condition types
 * 
 * Registered Evaluators:
 * - LEAD_SCORE_CONDITION: LeadScoreConditionEvaluator
 * - LEAD_STATUS_CONDITION: LeadStatusConditionEvaluator
 * - EMAIL_OPENED_CONDITION: EmailOpenedConditionEvaluator
 * - EMAIL_CLICKED_CONDITION: EmailClickedConditionEvaluator
 * 
 * Example:
 * ConditionEvaluator evaluator = factory.getEvaluator(AutomationStepType.LEAD_SCORE_CONDITION);
 * ConditionResult result = evaluator.evaluate(step, execution, lead);
 * if (result.isSuccess() && result.getConditionValue()) {
 *   // Branch to next step
 * }
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ConditionExecutorFactory {
    
    private final List<ConditionEvaluator> allEvaluators;
    private Map<AutomationStepType, ConditionEvaluator> evaluatorMap;
    
    /**
     * Get evaluator for a condition type
     * 
     * @param conditionType the condition step type
     * @return evaluator for this type
     * @throws IllegalArgumentException if no evaluator found for type
     */
    public ConditionEvaluator getEvaluator(AutomationStepType conditionType) {
        // Initialize map lazily (after all beans are created)
        if (evaluatorMap == null) {
            initializeEvaluatorMap();
        }
        
        ConditionEvaluator evaluator = evaluatorMap.get(conditionType);
        if (evaluator == null) {
            throw new IllegalArgumentException("No evaluator registered for condition type: " + conditionType);
        }
        
        return evaluator;
    }
    
    /**
     * Initialize evaluator map from registered evaluators
     * Allows easy registration of new evaluators via Spring DI
     */
    private void initializeEvaluatorMap() {
        evaluatorMap = new HashMap<>();
        
        // Register evaluators from autowired list
        for (ConditionEvaluator evaluator : allEvaluators) {
            AutomationStepType conditionType = evaluator.getConditionType();
            evaluatorMap.put(conditionType, evaluator);
        }
        
        log.info("Initialized {} condition evaluators", evaluatorMap.size());
        log.debug("Registered condition evaluators: {}", evaluatorMap.keySet());
    }
    
    /**
     * Check if evaluator exists for condition type
     * 
     * @param conditionType the condition step type
     * @return true if evaluator exists
     */
    public boolean hasEvaluator(AutomationStepType conditionType) {
        if (evaluatorMap == null) {
            initializeEvaluatorMap();
        }
        return evaluatorMap.containsKey(conditionType);
    }
}
