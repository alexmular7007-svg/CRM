package com.arjun.crm.service.automation.impl;

import com.arjun.crm.entity.Automation;
import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailCampaignRecipient;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.enums.AutomationStatus;
import com.arjun.crm.event.EmailEventPublished;
import com.arjun.crm.repository.AutomationExecutionRepository;
import com.arjun.crm.repository.AutomationRepository;
import com.arjun.crm.repository.EmailCampaignRecipientRepository;
import com.arjun.crm.service.automation.AutomationExecutionService;
import com.arjun.crm.service.automation.EmailEventAutomationTrigger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * EmailEventAutomationTriggerImpl - PHASE 7.3: Email Event → Automation Trigger
 *
 * Implementation that handles triggering automations from email events.
 *
 * Flow:
 * 1. Receive EmailEventPublished event from AutomationEventListener
 * 2. Extract campaign and trigger type
 * 3. Find all ACTIVE automations in workspace with matching trigger type
 * 4. For each automation:
 *    a. Try to find lead from recipient (recipient.lead or lookup by email)
 *    b. Check for duplicate recent execution (within 5 minutes)
 *    c. If not duplicate, execute automation
 * 5. Log summary
 *
 * Duplicate Prevention:
 * - Uses AutomationExecutionRepository.countRecentExecutions()
 * - Looks for executions within 5 minutes
 * - Prevents rapid re-triggering of same automation for same lead
 *
 * Lead Resolution:
 * - Prefer: recipient.lead (direct relationship if populated)
 * - Fallback: None (cannot execute automation without lead)
 * - Non-blocking: If lead not found, automation is skipped with log warning
 *
 * Workspace Isolation:
 * - Campaign carries workspace
 * - All automation queries scoped by workspace.id
 * - Ensures no cross-workspace automation execution
 *
 * Error Handling:
 * - Individual automation failures don't affect others
 * - All errors logged but not re-thrown
 * - Ensures non-blocking webhook processing
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailEventAutomationTriggerImpl implements EmailEventAutomationTrigger {

    private final AutomationRepository automationRepository;
    private final AutomationExecutionService automationExecutionService;
    private final AutomationExecutionRepository automationExecutionRepository;
    private final EmailCampaignRecipientRepository recipientRepository;

    // Duplicate detection time window (minutes)
    private static final int DEDUP_WINDOW_MINUTES = 5;

    @Override
    public void triggerAutomations(EmailEventPublished event) {
        try {
            EmailCampaign campaign = event.getCampaign();
            String triggerType = event.getTriggerType().name();
            String recipientEmail = event.getRecipientEmail();

            if (campaign == null || campaign.getWorkspace() == null) {
                log.warn("Cannot trigger automations: campaign or workspace is null");
                return;
            }

            Long workspaceId = campaign.getWorkspace().getId();

            log.info("🔍 EmailEventAutomationTrigger: Processing {} for workspace: {}, email: {}",
                    triggerType, workspaceId, recipientEmail);

            // Find all ACTIVE automations with matching trigger type in workspace
            List<Automation> matchingAutomations = automationRepository
                    .findByWorkspaceIdAndTriggerTypeAndStatus(
                            workspaceId,
                            event.getTriggerType(),
                            AutomationStatus.ACTIVE
                    );

            if (matchingAutomations.isEmpty()) {
                log.debug("No {} automations found for workspace: {}", triggerType, workspaceId);
                return;
            }

            log.info("Found {} matching {} automations for workspace: {}",
                    matchingAutomations.size(), triggerType, workspaceId);

            // Determine lead for this email event
            Lead lead = resolveLead(event);
            if (lead == null) {
                log.warn("Cannot resolve lead for email: {}. Email event automations require lead association.",
                        recipientEmail);
                return;
            }

            log.debug("Resolved lead: {} for email: {}", lead.getId(), recipientEmail);

            // Execute matching automations
            int executedCount = 0;
            for (Automation automation : matchingAutomations) {
                try {
                    if (isDuplicateExecution(automation.getId(), lead.getId())) {
                        log.debug("Skipping automation {} for lead {}: recent execution detected",
                                automation.getId(), lead.getId());
                        continue;
                    }

                    log.info("⚡ Triggering {} automation: {} for lead: {}",
                            triggerType, automation.getId(), lead.getId());

                    automationExecutionService.executeAutomation(automation, lead);
                    executedCount++;

                } catch (Exception e) {
                    log.error("Error executing automation {} for lead {}: {}",
                            automation.getId(), lead.getId(), e.getMessage(), e);
                    // Continue with next automation
                }
            }

            log.info("✓ Completed email event automation trigger: {} automations executed out of {} matched " +
                            "for {} in workspace: {}",
                    executedCount, matchingAutomations.size(), triggerType, workspaceId);

        } catch (Exception e) {
            log.error("Error in EmailEventAutomationTrigger.triggerAutomations()", e);
            // Don't re-throw; webhook processing should not be blocked
        }
    }

    /**
     * Resolve the lead from the email event.
     *
     * Strategy:
     * 1. Use event.recipient.lead if available
     * 2. If no direct lead, try to find recipient and use its lead
     * 3. If still no lead found, return null
     *
     * Note: Leads are only associated with recipients if:
     * - Recipient was added from lead's email during campaign creation
     * - Or lead was manually linked to recipient
     * - Email-only recipients (not from lead) cannot trigger lead-based automations
     *
     * @param event Email event with recipient and campaign info
     * @return Lead if found, null otherwise
     */
    private Lead resolveLead(EmailEventPublished event) {
        // Prefer direct lead relationship in event
        if (event.getRecipient() != null && event.getRecipient().getLead() != null) {
            return event.getRecipient().getLead();
        }

        // Try to find recipient and get its lead
        EmailCampaign campaign = event.getCampaign();
        String recipientEmail = event.getRecipientEmail();

        if (campaign == null || recipientEmail == null) {
            return null;
        }

        Optional<EmailCampaignRecipient> recipient = recipientRepository
                .findByCampaignIdAndRecipientEmail(campaign.getId(), recipientEmail);

        if (recipient.isPresent() && recipient.get().getLead() != null) {
            return recipient.get().getLead();
        }

        return null;
    }

    /**
     * Check if automation was recently executed for this lead (dedup detection).
     *
     * Strategy:
     * - Query AutomationExecutionRepository for recent executions
     * - Look back 5 minutes (DEDUP_WINDOW_MINUTES)
     * - If any execution found, return true
     *
     * This prevents rapid re-triggering of same automation for same lead.
     * For example: if EMAIL_OPENED automation triggered 2 minutes ago,
     * and webhook fires again for same email, this detects the duplicate.
     *
     * @param automationId automation ID
     * @param leadId lead ID
     * @return true if recent execution found, false if safe to execute
     */
    private boolean isDuplicateExecution(Long automationId, Long leadId) {
        try {
            LocalDateTime cutoff = LocalDateTime.now().minus(DEDUP_WINDOW_MINUTES, ChronoUnit.MINUTES);
            long recentExecutions = automationExecutionRepository.countRecentExecutions(
                    automationId,
                    leadId,
                    cutoff
            );
            return recentExecutions > 0;
        } catch (Exception e) {
            log.error("Error checking for duplicate execution: automationId={}, leadId={}",
                    automationId, leadId, e);
            // On error, assume NOT duplicate (allow execution)
            return false;
        }
    }
}
