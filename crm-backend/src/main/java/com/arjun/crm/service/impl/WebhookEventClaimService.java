package com.arjun.crm.service.impl;

import com.arjun.crm.entity.EmailCampaignHistory;
import com.arjun.crm.repository.EmailCampaignHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WebhookEventClaimService {

    private final EmailCampaignHistoryRepository historyRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean claim(EmailCampaignHistory history) {
        try {
            historyRepository.saveAndFlush(history);
            return true;
        } catch (DataIntegrityViolationException duplicateEvent) {
            return false;
        }
    }
}
