package com.arjun.crm.repository;

import com.arjun.crm.entity.EmailCampaignRecipient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * EmailCampaignRecipientRepository - FEATURE #3
 * 
 * Data access layer for email campaign recipients
 */
@Repository
public interface EmailCampaignRecipientRepository extends JpaRepository<EmailCampaignRecipient, Long> {
    
    /**
     * Find recipient by campaign and ID
     */
    Optional<EmailCampaignRecipient> findByIdAndCampaignId(Long id, Long campaignId);
    
    /**
     * Find recipient by campaign and email
     */
    Optional<EmailCampaignRecipient> findByCampaignIdAndRecipientEmail(Long campaignId, String email);
    
    /**
     * List all recipients for a campaign (paginated)
     */
    Page<EmailCampaignRecipient> findByCampaignIdOrderByCreatedAtDesc(Long campaignId, Pageable pageable);
    
    /**
     * List recipients by campaign and status
     */
    Page<EmailCampaignRecipient> findByCampaignIdAndStatusOrderByCreatedAtDesc(
            Long campaignId, String status, Pageable pageable);
    
    /**
     * List recipients by status (for analytics)
     */
    Page<EmailCampaignRecipient> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    
    /**
     * Find recipients that opened email
     */
    List<EmailCampaignRecipient> findByCampaignIdAndOpenedAtNotNull(Long campaignId);
    
    /**
     * Find recipients that clicked links
     */
    List<EmailCampaignRecipient> findByCampaignIdAndFirstClickedAtNotNull(Long campaignId);
    
    /**
     * Find recipients that bounced
     */
    List<EmailCampaignRecipient> findByCampaignIdAndBounceTypeNotNull(Long campaignId);
    
    /**
     * Count recipients for a campaign
     */
    long countByCampaignId(Long campaignId);
    
    /**
     * Count recipients by status
     */
    long countByCampaignIdAndStatus(Long campaignId, String status);
    
    /**
     * Count opened emails
     */
    long countByCampaignIdAndOpenedAtNotNull(Long campaignId);
    
    /**
     * Count clicked emails
     */
    long countByCampaignIdAndFirstClickedAtNotNull(Long campaignId);

    /**
     * Count sent emails (sentAt is set)
     */
    long countByCampaignIdAndSentAtNotNull(Long campaignId);

    /**
     * Count delivered emails (deliveredAt is set)
     */
    long countByCampaignIdAndDeliveredAtNotNull(Long campaignId);
}
