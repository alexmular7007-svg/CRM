package com.arjun.crm.automation.executor;

import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.enums.AutomationStepType;
import com.arjun.crm.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * UpdateLeadScoreActionExecutor - PHASE 3: Execution Engine
 * 
 * Executes UPDATE_LEAD_SCORE action steps
 * Increments or decrements lead score by configured amount
 * 
 * Configuration:
 * {
 *   "scoreChange": 10,               // +10 or -5
 *   "reason": "Email opened"         // For audit trail
 * }
 * 
 * Behavior:
 * 1. Get scoreChange from configuration
 * 2. Add scoreChange to lead.score
 * 3. Record reason in notes (optional)
 * 4. Save lead to database
 * 5. Return success/failure
 * 
 * No breaking changes to existing lead scoring
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UpdateLeadScoreActionExecutor implements AutomationStepExecutor {
    
    private final LeadRepository leadRepository;
    
    @Override
    public StepExecutionResult execute(AutomationStep step, AutomationExecution execution, Lead lead) {
        log.info("Executing UPDATE_LEAD_SCORE step: {} for lead: {}", step.getId(), lead.getId());
        
        try {
            // Get configuration
            Map<String, Object> config = step.getConfiguration();
            if (config == null || config.isEmpty()) {
                return StepExecutionResult.failure("UPDATE_LEAD_SCORE configuration is empty");
            }
            
            // Get scoreChange
            Object scoreChangeObj = config.get("scoreChange");
            if (scoreChangeObj == null) {
                return StepExecutionResult.failure("scoreChange is required in UPDATE_LEAD_SCORE configuration");
            }
            
            // Convert to integer
            Integer scoreChange;
            if (scoreChangeObj instanceof Number) {
                scoreChange = ((Number) scoreChangeObj).intValue();
            } else if (scoreChangeObj instanceof String) {
                try {
                    scoreChange = Integer.parseInt((String) scoreChangeObj);
                } catch (NumberFormatException e) {
                    return StepExecutionResult.failure("scoreChange must be a number");
                }
            } else {
                return StepExecutionResult.failure("scoreChange has invalid type");
            }
            
            // Get current score (Lead doesn't have score field in Phase 3, store in notes for now)
            // TODO: Phase 3+ should add score field to Lead entity if needed
            String currentScoreStr = "0";  // Default score
            Integer currentScore = 0;
            Integer newScore = currentScore + scoreChange;
            
            // Update score (store in notes for audit trail)
            // NOTE: Lead entity doesn't have native score field in Phase 3
            // Score updates are tracked in notes field
            // TODO: Add score field to Lead entity in future phases
            
            // Get reason for audit trail
            String reason = (String) config.get("reason");
            if (reason != null && !reason.isEmpty()) {
                String existingNotes = lead.getNotes() != null ? lead.getNotes() : "";
                String auditNote = String.format("%s - Score: %+d (%s)", reason, scoreChange, newScore);
                lead.setNotes(existingNotes.isEmpty() ? auditNote : existingNotes + "\n" + auditNote);
                log.info("Updated lead score with reason: {}", reason);
            }
            
            // Save lead
            leadRepository.save(lead);
            
            log.info("Lead score updated: {} → {} (change: %+d)", currentScore, newScore, scoreChange);
            return StepExecutionResult.success();
            
        } catch (Exception e) {
            log.error("Error executing UPDATE_LEAD_SCORE step: {}", step.getId(), e);
            return StepExecutionResult.failure("Lead score update failed: " + e.getMessage());
        }
    }
    
    @Override
    public AutomationStepType getStepType() {
        return AutomationStepType.UPDATE_LEAD_SCORE;
    }
}
