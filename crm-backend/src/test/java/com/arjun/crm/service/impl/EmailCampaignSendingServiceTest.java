package com.arjun.crm.service.impl;

import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailCampaignRecipient;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.repository.EmailCampaignRecipientRepository;
import com.arjun.crm.repository.EmailCampaignRepository;
import com.arjun.crm.service.brevo.BrevoEmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailCampaignSendingServiceTest {

    @Test
    void sendsCampaignRecipientAndPersistsProviderMessageId() {
        EmailCampaignRepository campaignRepository = mock(EmailCampaignRepository.class);
        EmailCampaignRecipientRepository recipientRepository = mock(EmailCampaignRecipientRepository.class);
        BrevoEmailService brevo = mock(BrevoEmailService.class);
        EmailCampaign campaign = EmailCampaign.builder()
                .id(10L)
                .name("Launch")
                .subject("Hello {{firstName}}")
                .customHtmlContent("<p>Welcome {{firstName}}</p>")
                .status("SENDING")
                .workspace(Workspace.builder().id(3L).build())
                .build();
        EmailCampaignRecipient recipient = EmailCampaignRecipient.builder()
                .id(20L)
                .campaign(campaign)
                .recipientEmail("recipient@example.com")
                .recipientName("Sam")
                .status("PENDING")
                .build();
        campaign.setRecipients(List.of(recipient));

        when(campaignRepository.findById(10L)).thenReturn(Optional.of(campaign));
        when(recipientRepository.findByCampaignIdAndStatusOrderByCreatedAtDesc(eq(10L), eq("PENDING"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(recipient)), new PageImpl<>(List.of()));
        when(brevo.sendEmail(any(String.class), any(String.class), any(String.class), any(String.class), anyMap()))
                .thenReturn("{\"messageId\":\"provider-123\"}");

        EmailCampaignSendingService service = new EmailCampaignSendingService(
                campaignRepository, recipientRepository, brevo, new ObjectMapper());
        ReflectionTestUtils.setField(service, "campaignTrackingBaseUrl", "https://app.example.com");

        service.sendCampaignAsync(10L);

        assertEquals("SENT", campaign.getStatus());
        assertEquals("SENT", recipient.getStatus());
        assertEquals("provider-123", recipient.getProviderMessageId());
        verify(brevo).sendEmail(eq("recipient@example.com"), eq("Hello Sam"), any(String.class), any(String.class), anyMap());
        verify(recipientRepository, org.mockito.Mockito.atLeastOnce()).save(recipient);
        verify(campaignRepository, org.mockito.Mockito.atLeastOnce()).save(campaign);
    }

    @Test
    void marksRecipientFailedWhenProviderRejectsMessage() {
        EmailCampaignRepository campaignRepository = mock(EmailCampaignRepository.class);
        EmailCampaignRecipientRepository recipientRepository = mock(EmailCampaignRecipientRepository.class);
        BrevoEmailService brevo = mock(BrevoEmailService.class);
        EmailCampaign campaign = EmailCampaign.builder()
                .id(10L).name("Launch").subject("Hello")
                .customHtmlContent("<p>Welcome</p>").status("SENDING")
                .workspace(Workspace.builder().id(3L).build()).build();
        EmailCampaignRecipient recipient = EmailCampaignRecipient.builder()
                .id(20L).campaign(campaign).recipientEmail("recipient@example.com")
                .status("PENDING").build();
        when(campaignRepository.findById(10L)).thenReturn(Optional.of(campaign));
        when(recipientRepository.findByCampaignIdAndStatusOrderByCreatedAtDesc(eq(10L), eq("PENDING"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(recipient)), new PageImpl<>(List.of()));
        when(brevo.sendEmail(any(String.class), any(String.class), any(String.class), any(String.class), anyMap()))
                .thenThrow(new IllegalStateException("provider rejected"));

        EmailCampaignSendingService service = new EmailCampaignSendingService(
                campaignRepository, recipientRepository, brevo, new ObjectMapper());
        ReflectionTestUtils.setField(service, "campaignTrackingBaseUrl", "https://app.example.com");

        service.sendCampaignAsync(10L);

        assertEquals("FAILED", recipient.getStatus());
        assertEquals("FAILED", campaign.getStatus());
        verify(recipientRepository, org.mockito.Mockito.atLeastOnce()).save(recipient);
    }
}
