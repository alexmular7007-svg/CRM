package com.arjun.crm.automation.condition;

import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.enums.AutomationStepType;
import com.arjun.crm.repository.EmailCampaignRecipientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * EmailOpenedConditionEvaluator - PHASE 7.2: Automation Condition Engine
 * 
 * Evaluates whether an email has been opened.
 * Queries EmailCampaignRecipient table for openedAt timestamp.
 * 
 * Configuration:
 * {
 *   "campaignId": 123,    // Email campaign ID
 *   "operator": "ANY"     // ANY or ALL (for Phase 4)
 * }
 * 
 * Behavior:
 * 1. Parse campaign ID from configuration
 * 2. Get lead email from Lead entity
 * 3. Query EmailCampaignRecipient for:
 *    WHERE campaign_id = campaignId AND recipient_email = lead.email AND opened_at IS NOT NULL
 * 4. Return TRUE if found, FALSE if not found
 * 
 * Error Handling:
 * - Missing campaign ID: failure
 * - Non-numeric campaign ID: failure
 * - Lead has no email: failure
 * - Database query error: failure
 * - No recipient record found: return FALSE (not opened yet)
 * 
 * Notes:
 * - openedAt is set by Brevo webhook when email is opened
 * - Relies on Brevo tracking pixel and webhook integration
 * - If email has never been sent, no recipient record exists
 * - If email sent but not opened, recipient record exists with openedAt=NULL
 * 
 * Example Configuration:
 * - Check if email from campaign 5 was opened: { "campaignId": 5 }
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmailOpenedConditionEvaluator implements ConditionEvaluator {
    
    private final EmailCampaignRecipientRepository recipientRepository;
    
    @Override
    public ConditionResult evaluate(AutomationStep step, AutomationExecution execution, Lead lead) {
        log.info("Evaluating EMAIL_OPENED_CONDITION for lead: {}", lead.getId());
        
        try {
            // Get configuration
            Map<String, Object> config = step.getConfiguration();
            if (config == null || config.isEmpty()) {
                return ConditionResult.error("EMAIL_OPENED_CONDITION configuration is empty");
            }
            
            // Parse campaign ID
            Object campaignIdObj = config.get("campaignId");
            if (campaignIdObj == null) {
                return ConditionResult.error("campaignId is required in EMAIL_OPENED_CONDITION configuration");
            }
            
            Long campaignId;
            if (campaignIdObj instanceof Number) {
                campaignId = ((Number) campaignIdObj).longValue();
            } else if (campaignIdObj instanceof String) {
                try {
                    campaignId = Long.parseLong((String) campaignIdObj);
                } catch (NumberFormatException e) {
                    return ConditionResult.error("campaignId must be a number");
                }
            } else {
                return ConditionResult.error("campaignId has invalid type");
            }
            
            // Validate lead has email
            String leadEmail = lead.getEmail();
            if (leadEmail == null || leadEmail.isEmpty()) {
                log.warn("Lead {} has no email address", lead.getId());
                return ConditionResult.FALSE();
            }
            
            // Query: find recipient record with opened_at NOT NULL
            var recipient = recipientRepository.findByCampaignIdAndRecipientEmail(campaignId, leadEmail);
            
            if (recipient.isEmpty()) {
                log.info("No recipient record found for campaign {} and email {}", campaignId, leadEmail);
                return ConditionResult.FALSE();
            }
            
            // Check if opened_at is not null
            var recipientRecord = recipient.get();
            boolean emailOpened = recipientRecord.getOpenedAt() != null;
            
            log.info("EMAIL_OPENED_CONDITION result: {} (campaign={}, email={}, openedAt={})", 
                    emailOpened, campaignId, leadEmail, recipientRecord.getOpenedAt());
            
            return emailOpened ? ConditionResult.TRUE() : ConditionResult.FALSE();
            
        } catch (Exception e) {
            log.error("Error evaluating EMAIL_OPENED_CONDITION step: {}", step.getId(), e);
            return ConditionResult.error("Email opened condition evaluation failed: " + e.getMessage());
        }
    }
    
    @Override
    public AutomationStepType getConditionType() {
        return AutomationStepType.EMAIL_OPENED_CONDITION;
    }
}
