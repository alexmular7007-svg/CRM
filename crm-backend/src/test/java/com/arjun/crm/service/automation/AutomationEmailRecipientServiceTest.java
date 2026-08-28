package com.arjun.crm.service.automation;

import com.arjun.crm.entity.Automation;
import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailCampaignRecipient;
import com.arjun.crm.entity.Lead;
import com.arjun.crm.repository.EmailCampaignRecipientRepository;
import com.arjun.crm.service.impl.EmailCampaignSendingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutomationEmailRecipientServiceTest {

    @Mock EmailCampaignRecipientRepository recipientRepository;
    @Mock EmailCampaignSendingService campaignSendingService;

    private AutomationEmailRecipientService service;
    private Automation automation;
    private AutomationExecution execution;
    private AutomationStep step;
    private EmailCampaign campaign;
    private Lead lead;

    @BeforeEach
    void setUp() {
        service = new AutomationEmailRecipientService(recipientRepository, campaignSendingService);
        var workspace = com.arjun.crm.entity.Workspace.builder().id(10L).build();
        automation = Automation.builder().id(20L).workspace(workspace).build();
        execution = AutomationExecution.builder().id(30L).automation(automation).build();
        step = AutomationStep.builder().id(40L).automation(automation).build();
        campaign = EmailCampaign.builder().id(50L).workspace(workspace).build();
        lead = Lead.builder().id(60L).email("lead@example.com").workspace(workspace).build();
    }

    @Test
    void createsAndSendsOneAutomationRecipientContext() {
        when(recipientRepository.findByIdempotencyKey("automation:20:execution:30:step:40"))
                .thenReturn(Optional.empty());
        when(recipientRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            EmailCampaignRecipient recipient = invocation.getArgument(0);
            recipient.setId(70L);
            return recipient;
        });
        when(recipientRepository.claimForSending(70L)).thenReturn(1);

        service.send(automation, execution, step, lead, campaign);

        verify(recipientRepository).saveAndFlush(any(EmailCampaignRecipient.class));
        verify(recipientRepository).claimForSending(70L);
        verify(campaignSendingService).sendSingleRecipient(50L, 70L);
    }

    @Test
    void doesNotSendAlreadySentContext() {
        EmailCampaignRecipient recipient = EmailCampaignRecipient.builder()
                .id(70L).campaign(campaign).status("SENT").build();
        when(recipientRepository.findByIdempotencyKey("automation:20:execution:30:step:40"))
                .thenReturn(Optional.of(recipient));

        service.send(automation, execution, step, lead, campaign);

        verify(recipientRepository, never()).claimForSending(any());
        verifyNoInteractions(campaignSendingService);
    }

    @Test
    void reusesExistingContextAfterConcurrentUniqueConflict() {
        EmailCampaignRecipient existing = EmailCampaignRecipient.builder()
                .id(70L).campaign(campaign).status("PENDING").build();
        when(recipientRepository.findByIdempotencyKey("automation:20:execution:30:step:40"))
                .thenReturn(Optional.empty(), Optional.of(existing));
        when(recipientRepository.saveAndFlush(any()))
                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("duplicate"));
        when(recipientRepository.claimForSending(70L)).thenReturn(1);

        service.send(automation, execution, step, lead, campaign);

        verify(recipientRepository).claimForSending(70L);
        verify(campaignSendingService).sendSingleRecipient(50L, 70L);
        assertEquals("PENDING", existing.getStatus());
    }

    @Test
    void reclaimsOnlyStaleSendingContext() {
        EmailCampaignRecipient existing = EmailCampaignRecipient.builder()
                .id(70L).campaign(campaign).status("SENDING")
                .updatedAt(LocalDateTime.now().minusMinutes(20)).build();
        when(recipientRepository.findByIdempotencyKey("automation:20:execution:30:step:40"))
                .thenReturn(Optional.of(existing));
        when(recipientRepository.claimForSending(70L)).thenReturn(0);
        when(recipientRepository.reclaimStaleSending(eq(70L), any())).thenReturn(1);

        service.send(automation, execution, step, lead, campaign);

        verify(recipientRepository).reclaimStaleSending(eq(70L), any());
        verify(campaignSendingService).sendSingleRecipient(50L, 70L);
    }

        @Test
        void rejectsLeadFromDifferentWorkspaceBeforeCreatingRecipient() {
                lead.setWorkspace(com.arjun.crm.entity.Workspace.builder().id(99L).build());

                assertThrows(IllegalArgumentException.class,
                                () -> service.send(automation, execution, step, lead, campaign));

                verifyNoInteractions(recipientRepository, campaignSendingService);
        }
}