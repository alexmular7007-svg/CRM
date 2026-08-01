package com.arjun.crm.repository;

import com.arjun.crm.entity.EmailCampaignHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * EmailCampaignHistoryRepository - FEATURE #3
 * 
 * Data access layer for email delivery history (append-only)
 */
@Repository
public interface EmailCampaignHistoryRepository extends JpaRepository<EmailCampaignHistory, Long> {
    
    /**
     * List history for a campaign (paginated)
     */
    Page<EmailCampaignHistory> findByCampaignIdOrderByOccurredAtDesc(Long campaignId, Pageable pageable);
    
    /**
     * List history by event type
     */
    Page<EmailCampaignHistory> findByCampaignIdAndEventTypeOrderByOccurredAtDesc(
            Long campaignId, String eventType, Pageable pageable);
    
    /**
     * List history by email address
     */
    Page<EmailCampaignHistory> findByCampaignIdAndRecipientEmailOrderByOccurredAtDesc(
            Long campaignId, String email, Pageable pageable);
    
    /**
     * Find history in date range
     */
    List<EmailCampaignHistory> findByCampaignIdAndOccurredAtBetween(
            Long campaignId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Count events by type
     */
    long countByCampaignIdAndEventType(Long campaignId, String eventType);
    
    /**
     * Count total events
     */
    long countByCampaignId(Long campaignId);
}
