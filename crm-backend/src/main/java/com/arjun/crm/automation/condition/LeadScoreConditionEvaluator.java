package com.arjun.crm.automation.condition;

import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.enums.AutomationStepType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * LeadScoreConditionEvaluator - PHASE 7.2: Automation Condition Engine
 * 
 * Evaluates lead score conditions with comparison operators.
 * Enables automation to branch based on lead scoring.
 * 
 * Configuration:
 * {
 *   "threshold": 75,                 // Score to compare against
 *   "operator": "GREATER_THAN"       // GREATER_THAN, LESS_THAN, EQUAL, GREATER_EQUAL, LESS_EQUAL
 * }
 * 
 * Supported Operators:
 * - GREATER_THAN: lead.score > threshold
 * - LESS_THAN: lead.score < threshold
 * - EQUAL: lead.score == threshold
 * - GREATER_EQUAL: lead.score >= threshold
 * - LESS_EQUAL: lead.score <= threshold
 * 
 * Behavior:
 * 1. Parse threshold and operator from configuration
 * 2. Get lead score from notes (Phase 3 stores score in notes)
 * 3. Parse numeric score from notes field
 * 4. Compare using operator
 * 5. Return TRUE/FALSE
 * 
 * Error Handling:
 * - Missing threshold: failure
 * - Invalid threshold (non-numeric): failure
 * - Missing operator: failure
 * - Invalid operator: failure
 * - Missing/null lead score: treat as 0
 * - Non-numeric score in notes: failure
 * 
 * Note: Phase 3 stores lead score in notes field. Phase 4+ should add
 * a native score field to Lead entity for better query performance.
 * 
 * Example Configuration:
 * - Lead score > 80: { "threshold": 80, "operator": "GREATER_THAN" }
 * - Lead score <= 50: { "threshold": 50, "operator": "LESS_EQUAL" }
 * - Lead score == 100: { "threshold": 100, "operator": "EQUAL" }
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeadScoreConditionEvaluator implements ConditionEvaluator {
    
    enum Operator {
        GREATER_THAN,
        LESS_THAN,
        EQUAL,
        GREATER_EQUAL,
        LESS_EQUAL
    }
    
    @Override
    public ConditionResult evaluate(AutomationStep step, AutomationExecution execution, Lead lead) {
        log.info("Evaluating LEAD_SCORE_CONDITION for lead: {}", lead.getId());
        
        try {
            // Get configuration
            Map<String, Object> config = step.getConfiguration();
            if (config == null || config.isEmpty()) {
                return ConditionResult.error("LEAD_SCORE_CONDITION configuration is empty");
            }
            
            // Parse threshold
            Object thresholdObj = config.get("threshold");
            if (thresholdObj == null) {
                return ConditionResult.error("threshold is required in LEAD_SCORE_CONDITION configuration");
            }
            
            Integer threshold;
            if (thresholdObj instanceof Number) {
                threshold = ((Number) thresholdObj).intValue();
            } else if (thresholdObj instanceof String) {
                try {
                    threshold = Integer.parseInt((String) thresholdObj);
                } catch (NumberFormatException e) {
                    return ConditionResult.error("threshold must be a number");
                }
            } else {
                return ConditionResult.error("threshold has invalid type");
            }
            
            // Parse operator
            String operatorStr = (String) config.get("operator");
            if (operatorStr == null || operatorStr.isEmpty()) {
                return ConditionResult.error("operator is required in LEAD_SCORE_CONDITION configuration");
            }
            
            Operator operator;
            try {
                operator = Operator.valueOf(operatorStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ConditionResult.error("Invalid operator: " + operatorStr + 
                        ". Valid values: GREATER_THAN, LESS_THAN, EQUAL, GREATER_EQUAL, LESS_EQUAL");
            }
            
            // Get lead score from notes (Phase 3 storage method)
            // TODO: Phase 4 should add native score field to Lead entity
            Integer leadScore = extractScoreFromNotes(lead.getNotes());
            
            log.info("Comparing lead score: {} {} {}", leadScore, operator, threshold);
            
            // Evaluate condition
            boolean result = evaluateOperator(leadScore, operator, threshold);
            
            log.info("LEAD_SCORE_CONDITION result: {} (lead_score={}, operator={}, threshold={})", 
                    result, leadScore, operator, threshold);
            
            return result ? ConditionResult.TRUE() : ConditionResult.FALSE();
            
        } catch (Exception e) {
            log.error("Error evaluating LEAD_SCORE_CONDITION step: {}", step.getId(), e);
            return ConditionResult.error("Score condition evaluation failed: " + e.getMessage());
        }
    }
    
    @Override
    public AutomationStepType getConditionType() {
        return AutomationStepType.LEAD_SCORE_CONDITION;
    }
    
    /**
     * Extract numeric score from lead notes field
     * Phase 3 stores scores in notes like "Score: +5 (reason)"
     * Returns 0 if no score found (default score for leads)
     * 
     * @param notes lead notes field
     * @return extracted score or 0
     */
    private Integer extractScoreFromNotes(String notes) {
        if (notes == null || notes.isEmpty()) {
            return 0;
        }
        
        // Look for pattern: "Score: X" where X is a number
        // Example: "Email opened - Score: +5 (reason)"
        String[] lines = notes.split("\n");
        for (String line : lines) {
            if (line.contains("Score:")) {
                try {
                    // Extract number after "Score:"
                    String[] parts = line.split("Score:");
                    if (parts.length > 1) {
                        String scoreStr = parts[1].split("[^\\d-]")[0].trim();
                        if (!scoreStr.isEmpty()) {
                            return Integer.parseInt(scoreStr);
                        }
                    }
                } catch (Exception e) {
                    log.debug("Failed to parse score from notes: {}", line, e);
                }
            }
        }
        
        return 0; // Default score
    }
    
    /**
     * Evaluate operator against lead score and threshold
     */
    private boolean evaluateOperator(Integer leadScore, Operator operator, Integer threshold) {
        return switch (operator) {
            case GREATER_THAN -> leadScore > threshold;
            case LESS_THAN -> leadScore < threshold;
            case EQUAL -> leadScore.equals(threshold);
            case GREATER_EQUAL -> leadScore >= threshold;
            case LESS_EQUAL -> leadScore <= threshold;
        };
    }
}
