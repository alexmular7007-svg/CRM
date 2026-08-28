package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.BrevoWebhookRequest;
import com.arjun.crm.entity.*;
import com.arjun.crm.repository.*;
import com.arjun.crm.service.automation.AutomationEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailAnalyticsServiceImplMetadataTest {

    @Mock EmailCampaignRecipientRepository recipientRepository;
    @Mock EmailCampaignHistoryRepository historyRepository;
    @Mock EmailCampaignRepository campaignRepository;
    @Mock AutomationEventPublisher automationEventPublisher;
    @Mock WebhookEventClaimService webhookEventClaimService;

    private EmailAnalyticsServiceImpl service;
    private EmailCampaign campaign;
    private EmailCampaignRecipient recipient;

    @BeforeEach
    void setUp() {
        service = new EmailAnalyticsServiceImpl(recipientRepository, historyRepository,
                campaignRepository, automationEventPublisher, webhookEventClaimService);
        var workspace = com.arjun.crm.entity.Workspace.builder().id(10L).build();
        Automation automation = Automation.builder().id(20L).workspace(workspace).build();
        AutomationExecution execution = AutomationExecution.builder().id(30L).automation(automation).build();
        AutomationStep step = AutomationStep.builder().id(40L).automation(automation).build();
        Lead lead = Lead.builder().id(60L).email("lead@example.com").build();
        campaign = EmailCampaign.builder().id(50L).workspace(workspace).build();
        recipient = EmailCampaignRecipient.builder().id(70L).campaign(campaign)
                .recipientEmail("lead@example.com").automation(automation)
                .execution(execution).automationStep(step).status("SENT").lead(lead).build();
        lenient().when(historyRepository.findByProviderEventId("event-1")).thenReturn(Optional.empty());
        when(campaignRepository.findById(50L)).thenReturn(Optional.of(campaign));
        when(recipientRepository.findByIdAndWorkspaceId(70L, 10L)).thenReturn(Optional.of(recipient));
        lenient().when(webhookEventClaimService.claim(any())).thenReturn(true);
    }

    @Test
    void acceptsMatchingAutomationMetadata() {
        service.processWebhookEvent(request(Map.of(
                "workspace_id", 10L, "campaign_id", 50L, "recipient_id", 70L,
                "automation_id", 20L, "execution_id", 30L, "automation_step_id", 40L)));

        verify(webhookEventClaimService).claim(any());
        verify(recipientRepository).save(recipient);
    }

    @Test
    void rejectsMismatchedAutomationMetadata() {
        service.processWebhookEvent(request(Map.of(
                "workspace_id", 999L, "campaign_id", 50L, "recipient_id", 70L,
                "automation_id", 20L, "execution_id", 30L, "automation_step_id", 40L)));

        verify(webhookEventClaimService, never()).claim(any());
        verify(recipientRepository, never()).save(any());
    }

    private BrevoWebhookRequest request(Map<String, Object> metadata) {
        return BrevoWebhookRequest.builder().event("DELIVERED").email("lead@example.com")
                .providerEventId("event-1").ts(1L).metadata(metadata).build();
    }
}