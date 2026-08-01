package com.arjun.crm.repository;

import com.arjun.crm.entity.EmailCampaignAnalyticsSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * EmailCampaignAnalyticsSnapshotRepository - FEATURE #3
 * 
 * Data access layer for analytics snapshots (pre-computed metrics)
 */
@Repository
public interface EmailCampaignAnalyticsSnapshotRepository extends JpaRepository<EmailCampaignAnalyticsSnapshot, Long> {
    
    /**
     * Find latest snapshot for campaign
     */
    Optional<EmailCampaignAnalyticsSnapshot> findFirstByCampaignIdOrderBySnapshotAtDesc(Long campaignId);
    
    /**
     * List snapshots for campaign (paginated, most recent first)
     */
    Page<EmailCampaignAnalyticsSnapshot> findByCampaignIdOrderBySnapshotAtDesc(Long campaignId, Pageable pageable);
    
    /**
     * Find snapshots in time range
     */
    List<EmailCampaignAnalyticsSnapshot> findByCampaignIdAndSnapshotAtBetween(
            Long campaignId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Count snapshots for campaign
     */
    long countByCampaignId(Long campaignId);
}
