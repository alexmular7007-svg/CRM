package com.arjun.crm.automation.executor;

import com.arjun.crm.entity.*;
import com.arjun.crm.enums.AutomationStepType;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.EmailTemplateRepository;
import com.arjun.crm.repository.EmailCampaignRepository;
import com.arjun.crm.service.brevo.BrevoEmailService;
import com.arjun.crm.service.automation.AutomationEmailRecipientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * SendEmailActionExecutor - PHASE 3: Execution Engine
 * 
 * Executes SEND_EMAIL action steps
 * Reuses existing BrevoEmailService and EmailTemplate infrastructure
 * 
 * Configuration:
 * {
 *   "emailTemplateId": 123,           // Template ID
 *   "subject": "Welcome!",             // Subject (can override template)
 *   "recipientField": "email"          // Which lead field to send to
 * }
 * 
 * Behavior:
 * 1. Load template by ID
 * 2. Get recipient email from lead (by recipientField)
 * 3. Call BrevoEmailService.sendEmail()
 * 4. Return success/failure
 * 
 * No changes to existing email infrastructure
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SendEmailActionExecutor implements AutomationStepExecutor {
    
    private final BrevoEmailService brevoEmailService;
    private final EmailTemplateRepository emailTemplateRepository;
    private final EmailCampaignRepository emailCampaignRepository;
    private final AutomationEmailRecipientService automationEmailRecipientService;
    
    @Override
    public StepExecutionResult execute(AutomationStep step, AutomationExecution execution, Lead lead) {
        log.info("Executing SEND_EMAIL step: {} for lead: {}", step.getId(), lead.getId());
        
        try {
            // Get configuration
            Map<String, Object> config = step.getConfiguration();
            if (config == null || config.isEmpty()) {
                return StepExecutionResult.failure("SEND_EMAIL configuration is empty");
            }
            
            Object campaignIdObj = config.get("emailCampaignId");
            if (campaignIdObj == null) {
                return StepExecutionResult.failure("emailCampaignId is required in SEND_EMAIL configuration");
            }
            Long campaignId = ((Number) campaignIdObj).longValue();
            Long workspaceId = execution.getAutomation().getWorkspace().getId();
            EmailCampaign campaign = emailCampaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Email campaign not found: " + campaignId));
            
            // Get recipient field (default: email)
            String recipientField = (String) config.getOrDefault("recipientField", "email");
            if (!"email".equalsIgnoreCase(recipientField)) {
                return StepExecutionResult.failure("Unsupported recipientField: only 'email' is supported");
            }
            String recipientEmail = getLeadEmailField(lead, recipientField);
            
            if (recipientEmail == null || recipientEmail.isEmpty()) {
                return StepExecutionResult.failure("Lead has no email address in field: " + recipientField);
            }
            
            automationEmailRecipientService.send(
                    execution.getAutomation(), execution, step, lead, campaign);
            return StepExecutionResult.success();
            
        } catch (Exception e) {
            log.error("Error executing SEND_EMAIL step: {}", step.getId(), e);
            return StepExecutionResult.failure("Email sending failed: " + e.getMessage());
        }
    }
    
    @Override
    public AutomationStepType getStepType() {
        return AutomationStepType.SEND_EMAIL;
    }
    
    /**
     * Get email field from lead by field name
     * 
     * @param lead the lead entity
     * @param fieldName the field to retrieve (default: email)
     * @return email value or null
     */
    private String getLeadEmailField(Lead lead, String fieldName) {
        if ("email".equalsIgnoreCase(fieldName)) {
            return lead.getEmail();
        }
        // Add more field mappings as needed
        return lead.getEmail();  // Default to email field
    }

    private String renderTemplate(String content, Lead lead) {
        if (content == null) {
            return "";
        }

        String firstName = lead.getName() == null ? "" : lead.getName().trim().split("\\s+", 2)[0];
        Map<String, String> variables = new HashMap<>();
        variables.put("firstName", firstName);
        variables.put("companyName", lead.getCompany() == null ? "" : lead.getCompany());
        variables.put("leadStatus", lead.getStatus() == null ? "" : lead.getStatus().name());

        String rendered = content;
        for (Map.Entry<String, String> variable : variables.entrySet()) {
            rendered = rendered.replace("{{" + variable.getKey() + "}}", variable.getValue());
        }
        return rendered;
    }
}
