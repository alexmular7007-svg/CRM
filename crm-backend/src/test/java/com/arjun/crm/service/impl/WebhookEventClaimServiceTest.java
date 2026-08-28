package com.arjun.crm.service.impl;

import com.arjun.crm.entity.EmailCampaignHistory;
import com.arjun.crm.repository.EmailCampaignHistoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

class WebhookEventClaimServiceTest {

    @Test
    void claimsNewProviderEvent() {
        EmailCampaignHistoryRepository repository = mock(EmailCampaignHistoryRepository.class);
        WebhookEventClaimService service = new WebhookEventClaimService(repository);

        assertTrue(service.claim(new EmailCampaignHistory()));
    }

    @Test
    void treatsUniqueConstraintViolationAsDuplicate() {
        EmailCampaignHistoryRepository repository = mock(EmailCampaignHistoryRepository.class);
        doThrow(new DataIntegrityViolationException("duplicate provider event"))
                .when(repository).saveAndFlush(org.mockito.ArgumentMatchers.any());
        WebhookEventClaimService service = new WebhookEventClaimService(repository);

        assertFalse(service.claim(new EmailCampaignHistory()));
    }
}
