package com.arjun.crm.repository;

import com.arjun.crm.entity.EmailCampaignHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * EmailCampaignHistoryRepository - FEATURE #3 ANALYTICS
 *
 * Data access layer for email campaign history (append-only audit log)
 */
@Repository
public interface EmailCampaignHistoryRepository extends JpaRepository<EmailCampaignHistory, Long> {

    /**
     * Find history by provider event ID (for deduplication)
     */
    Optional<EmailCampaignHistory> findByProviderEventId(String providerEventId);

    /**
     * Find all history events for a campaign (paginated)
     */
    Page<EmailCampaignHistory> findByCampaignIdOrderByOccurredAtDesc(Long campaignId, Pageable pageable);

    /**
     * Find all history events for a campaign by event type (paginated)
     */
    Page<EmailCampaignHistory> findByCampaignIdAndEventTypeOrderByOccurredAtDesc(
            Long campaignId, String eventType, Pageable pageable);

    /**
     * Find all history events for a recipient
     */
    List<EmailCampaignHistory> findByRecipientIdOrderByOccurredAtDesc(Long recipientId);

    /**
     * Count events by type for a campaign
     */
    long countByCampaignIdAndEventType(Long campaignId, String eventType);

    /**
     * Count events by type within a date range
     */
    @Query("""
        SELECT COUNT(h) FROM EmailCampaignHistory h
        WHERE h.campaign.id = :campaignId
        AND h.eventType = :eventType
        AND h.occurredAt BETWEEN :startDate AND :endDate
    """)
    long countByCampaignIdEventTypeAndDateRange(
            @Param("campaignId") Long campaignId,
            @Param("eventType") String eventType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Get event timeline for campaign
     */
    @Query("""
        SELECT h FROM EmailCampaignHistory h
        WHERE h.campaign.id = :campaignId
        ORDER BY h.occurredAt DESC
    """)
    Page<EmailCampaignHistory> getEventTimeline(
            @Param("campaignId") Long campaignId,
            Pageable pageable);

    /**
     * Get event counts by type for a campaign
     */
    @Query("""
        SELECT h.eventType, COUNT(h) FROM EmailCampaignHistory h
        WHERE h.campaign.id = :campaignId
        GROUP BY h.eventType
    """)
    List<Object[]> getEventCounts(@Param("campaignId") Long campaignId);
}
