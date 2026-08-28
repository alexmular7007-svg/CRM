package com.arjun.crm.listener;

import com.arjun.crm.entity.Automation;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.event.EmailEventPublished;
import com.arjun.crm.event.LeadCreatedEvent;
import com.arjun.crm.enums.AutomationStatus;
import com.arjun.crm.enums.AutomationStepType;
import com.arjun.crm.repository.AutomationRepository;
import com.arjun.crm.service.automation.AutomationExecutionService;
import com.arjun.crm.service.automation.EmailEventAutomationTrigger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * AutomationEventListener - PHASE 3: Execution Engine + PHASE 7.3: Email Events
 * 
 * Listens for domain events and triggers matching automations
 * 
 * Events Handled:
 * - LeadCreatedEvent: Finds LEAD_CREATED automations and executes them
 * - EmailEventPublished: Finds EMAIL_OPENED/CLICKED/DELIVERED/BOUNCED automations
 * 
 * Behavior:
 * 1. Event is published (asynchronously via @EventListener + @Async)
 * 2. Find all ACTIVE automations matching trigger type
 * 3. For each matching automation, create execution via AutomationExecutionService
 * 4. Execution runs asynchronously in thread pool
 * 5. HTTP response returns immediately (non-blocking)
 * 
 * Duplicate Prevention:
 * - AutomationExecutionService checks for recent executions
 * - Prevents re-triggering same automation for same lead within time window
 * 
 * Error Handling:
 * - Individual automation execution failures do not affect other automations
 * - Failures are logged and recorded in execution history
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AutomationEventListener {
    
    private final AutomationRepository automationRepository;
    private final AutomationExecutionService automationExecutionService;
    private final EmailEventAutomationTrigger emailEventAutomationTrigger;
    
    /**
     * Handle LeadCreatedEvent
     * Triggered when a new lead is created
     * Finds and executes all ACTIVE automations with LEAD_CREATED trigger
     */
    @Async
    @EventListener
    public void handleLeadCreatedEvent(LeadCreatedEvent event) {
        log.info("AutomationEventListener: Processing LeadCreatedEvent for lead: {}", event.getLead().getId());
        
        try {
            Lead lead = event.getLead();
            Long workspaceId = lead.getWorkspace().getId();
            
            // Find all ACTIVE automations with LEAD_CREATED trigger in this workspace
            // Note: AutomationTriggerType uses same enum value as AutomationStepType for trigger types
            List<Automation> matchingAutomations = automationRepository
                    .findByWorkspaceIdAndTriggerTypeAndStatus(
                            workspaceId,
                            com.arjun.crm.enums.AutomationTriggerType.LEAD_CREATED,
                            AutomationStatus.ACTIVE
                    );
            
            if (matchingAutomations.isEmpty()) {
                log.debug("No LEAD_CREATED automations found for workspace: {}", workspaceId);
                return;
            }
            
            log.info("Found {} matching LEAD_CREATED automations for lead: {}", 
                    matchingAutomations.size(), lead.getId());
            
            // Execute each matching automation
            for (Automation automation : matchingAutomations) {
                try {
                    log.info("Triggering automation: {} for lead: {}", automation.getId(), lead.getId());
                    automationExecutionService.executeAutomation(automation, lead);
                } catch (Exception e) {
                    log.error("Error triggering automation: {} for lead: {}", automation.getId(), lead.getId(), e);
                    // Continue with next automation, don't let one failure affect others
                }
            }
            
            log.info("Completed triggering {} automations for lead: {}", matchingAutomations.size(), lead.getId());
            
        } catch (Exception e) {
            log.error("Error handling LeadCreatedEvent", e);
            // Don't throw, just log - failure to trigger automations should not break lead creation
        }
    }
    
    /**
     * Handle EmailEventPublished
     * Triggered when Brevo sends webhook for email events (DELIVERED, OPENED, CLICKED, BOUNCED)
     * Delegates to EmailEventAutomationTrigger to find matching automations
     *
     * PHASE 7.3: Email Event → Automation Trigger
     */
    @Async
    @EventListener
    public void handleEmailEventPublished(EmailEventPublished event) {
        log.info("AutomationEventListener: Processing EmailEventPublished - Type: {}, Email: {}",
                event.getTriggerType(), event.getRecipientEmail());
        
        try {
            emailEventAutomationTrigger.triggerAutomations(event);
        } catch (Exception e) {
            log.error("Error handling EmailEventPublished", e);
            // Don't throw, just log - failure should not break webhook processing
        }
    }
}
