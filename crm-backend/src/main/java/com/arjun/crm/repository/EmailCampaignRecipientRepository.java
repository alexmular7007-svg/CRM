package com.arjun.crm.repository;

import com.arjun.crm.entity.EmailCampaignRecipient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

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

    Optional<EmailCampaignRecipient> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT r FROM EmailCampaignRecipient r " +
           "WHERE r.automation.id = :automationId " +
           "AND r.execution.id = :executionId " +
           "AND r.automationStep.id = :automationStepId")
    Optional<EmailCampaignRecipient> findByAutomationContext(
            @Param("automationId") Long automationId,
            @Param("executionId") Long executionId,
            @Param("automationStepId") Long automationStepId);

    @Query("SELECT r FROM EmailCampaignRecipient r " +
           "WHERE r.id = :recipientId " +
           "AND r.campaign.workspace.id = :workspaceId")
    Optional<EmailCampaignRecipient> findByIdAndWorkspaceId(
            @Param("recipientId") Long recipientId,
            @Param("workspaceId") Long workspaceId);

    @Modifying
    @Transactional
    @Query("UPDATE EmailCampaignRecipient r SET r.status = 'SENDING', " +
           "r.deliveryAttempts = COALESCE(r.deliveryAttempts, 0) + 1 " +
           "WHERE r.id = :recipientId AND r.status IN ('PENDING', 'FAILED')")
    int claimForSending(@Param("recipientId") Long recipientId);

    @Modifying
    @Transactional
    @Query("UPDATE EmailCampaignRecipient r SET r.status = 'SENDING', " +
            "r.deliveryAttempts = COALESCE(r.deliveryAttempts, 0) + 1 " +
            "WHERE r.id = :recipientId AND r.status = 'SENDING' " +
            "AND r.updatedAt < :staleBefore")
    int reclaimStaleSending(@Param("recipientId") Long recipientId,
                                @Param("staleBefore") LocalDateTime staleBefore);
    
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
