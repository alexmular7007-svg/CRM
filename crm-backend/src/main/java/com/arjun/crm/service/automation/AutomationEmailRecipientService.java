package com.arjun.crm.service.automation;

import com.arjun.crm.entity.Automation;
import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailCampaignRecipient;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.repository.EmailCampaignRecipientRepository;
import com.arjun.crm.service.impl.EmailCampaignSendingService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AutomationEmailRecipientService {

    private static final long STALE_SENDING_MINUTES = 15;

    private final EmailCampaignRecipientRepository recipientRepository;
    private final EmailCampaignSendingService campaignSendingService;

    public void send(Automation automation, AutomationExecution execution,
                     AutomationStep step, Lead lead, EmailCampaign campaign) {
        validateContext(automation, execution, step, lead, campaign);

        String idempotencyKey = String.format("automation:%d:execution:%d:step:%d",
                automation.getId(), execution.getId(), step.getId());

        EmailCampaignRecipient recipient = recipientRepository.findByIdempotencyKey(idempotencyKey)
                .orElseGet(() -> createContext(automation, execution, step, lead, campaign, idempotencyKey));

        if (!recipient.getCampaign().getId().equals(campaign.getId())) {
            throw new IllegalStateException("Idempotency context belongs to a different campaign");
        }
        if ("SENT".equals(recipient.getStatus())) {
            return;
        }
        int claimed = recipientRepository.claimForSending(recipient.getId());
        if (claimed == 0 && "SENDING".equals(recipient.getStatus())) {
            claimed = recipientRepository.reclaimStaleSending(
                    recipient.getId(), LocalDateTime.now().minusMinutes(STALE_SENDING_MINUTES));
        }
        if (claimed == 0) {
            return;
        }

        campaignSendingService.sendSingleRecipient(campaign.getId(), recipient.getId());
    }

    private EmailCampaignRecipient createContext(Automation automation, AutomationExecution execution,
                                                  AutomationStep step, Lead lead, EmailCampaign campaign,
                                                  String idempotencyKey) {
        EmailCampaignRecipient recipient = EmailCampaignRecipient.builder()
                .campaign(campaign)
                .lead(lead)
                .automation(automation)
                .execution(execution)
                .automationStep(step)
                .idempotencyKey(idempotencyKey)
                .recipientEmail(lead.getEmail())
                .status("PENDING")
                .deliveryAttempts(0)
                .clickCount(0)
                .build();
        try {
            return recipientRepository.saveAndFlush(recipient);
        } catch (DataIntegrityViolationException duplicate) {
            return recipientRepository.findByIdempotencyKey(idempotencyKey)
                    .orElseThrow(() -> duplicate);
        }
    }

    private void validateContext(Automation automation, AutomationExecution execution,
                                 AutomationStep step, Lead lead, EmailCampaign campaign) {
        requireIds(automation, execution, step, lead, campaign);
        Long workspaceId = automation.getWorkspace().getId();
        if (!workspaceId.equals(execution.getAutomation().getWorkspace().getId()) ||
                !automation.getId().equals(execution.getAutomation().getId()) ||
                !workspaceId.equals(step.getAutomation().getWorkspace().getId()) ||
                !automation.getId().equals(step.getAutomation().getId()) ||
                !workspaceId.equals(campaign.getWorkspace().getId()) ||
                lead.getWorkspace() == null || !workspaceId.equals(lead.getWorkspace().getId())) {
            throw new IllegalArgumentException("Automation email context crosses workspace or ownership boundaries");
        }
        if (lead.getEmail() == null || lead.getEmail().isBlank()) {
            throw new IllegalArgumentException("Lead has no email address");
        }
    }

    private void requireIds(Automation automation, AutomationExecution execution,
                            AutomationStep step, Lead lead, EmailCampaign campaign) {
        if (automation.getId() == null || execution.getId() == null || step.getId() == null ||
                lead.getId() == null || campaign.getId() == null) {
            throw new IllegalArgumentException("Automation email context requires persisted entities");
        }
    }
}