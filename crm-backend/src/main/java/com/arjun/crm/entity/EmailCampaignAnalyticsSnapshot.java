package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * EmailCampaignAnalyticsSnapshot Entity - FEATURE #3
 * 
 * Pre-computed hourly snapshots of campaign analytics.
 * Used for fast dashboard queries instead of real-time aggregation.
 */
@Entity
@Table(
    name = "email_campaign_analytics_snapshot",
    indexes = {
        @Index(name = "idx_analytics_campaign_id", columnList = "campaign_id"),
        @Index(name = "idx_analytics_snapshot_at", columnList = "snapshot_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignAnalyticsSnapshot {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private EmailCampaign campaign;
    
    @Column(nullable = false)
    private LocalDateTime snapshotAt;
    
    @Column
    private Long totalSent;
    
    @Column
    private Long totalDelivered;
    
    @Column
    private Long totalOpened;
    
    @Column
    private Long totalClicked;
    
    @Column
    private Long totalBounced;
    
    @Column
    private Long totalFailed;
    
    @Column
    private Long totalUnsubscribed;
    
    @Column
    private Long totalReplies;
    
    @Column
    private Long uniqueOpens;
    
    @Column
    private Long uniqueClicks;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal deliveryRatePercent;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal openRatePercent;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal clickRatePercent;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal bounceRatePercent;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal replyRatePercent;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
