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
 * EmailCampaignAnalyticsSnapshot Entity - FEATURE #3 ANALYTICS
 *
 * Pre-computed analytics aggregates for a campaign.
 * Snapshots are taken periodically to capture metrics at specific points in time.
 *
 * Metrics:
 * - total_sent: Total emails sent
 * - total_delivered: Successfully delivered
 * - total_opened: Recipient opened email
 * - total_clicked: Recipient clicked link
 * - total_bounced: Email bounced (hard or soft)
 * - total_failed: Failed to send
 * - total_unsubscribed: Recipient unsubscribed
 * - total_replies: Recipient replied
 *
 * Rates:
 * - delivery_rate: (delivered / sent) * 100
 * - open_rate: (opened / delivered) * 100
 * - click_rate: (clicked / delivered) * 100
 * - bounce_rate: (bounced / sent) * 100
 * - reply_rate: (replies / delivered) * 100
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

    // Counts
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

    // Rates (percentage with 2 decimal places)
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

    /**
     * Calculate delivery rate percentage
     */
    public void calculateDeliveryRate() {
        if (totalSent != null && totalSent > 0) {
            long delivered = totalDelivered != null ? totalDelivered : 0;
            this.deliveryRatePercent = new BigDecimal(delivered).multiply(new BigDecimal(100))
                    .divide(new BigDecimal(totalSent), 2, java.math.RoundingMode.HALF_UP);
        } else {
            this.deliveryRatePercent = BigDecimal.ZERO;
        }
    }

    /**
     * Calculate open rate percentage
     */
    public void calculateOpenRate() {
        if (totalDelivered != null && totalDelivered > 0) {
            long opened = totalOpened != null ? totalOpened : 0;
            this.openRatePercent = new BigDecimal(opened).multiply(new BigDecimal(100))
                    .divide(new BigDecimal(totalDelivered), 2, java.math.RoundingMode.HALF_UP);
        } else {
            this.openRatePercent = BigDecimal.ZERO;
        }
    }

    /**
     * Calculate click rate percentage
     */
    public void calculateClickRate() {
        if (totalDelivered != null && totalDelivered > 0) {
            long clicked = totalClicked != null ? totalClicked : 0;
            this.clickRatePercent = new BigDecimal(clicked).multiply(new BigDecimal(100))
                    .divide(new BigDecimal(totalDelivered), 2, java.math.RoundingMode.HALF_UP);
        } else {
            this.clickRatePercent = BigDecimal.ZERO;
        }
    }

    /**
     * Calculate bounce rate percentage
     */
    public void calculateBounceRate() {
        if (totalSent != null && totalSent > 0) {
            long bounced = totalBounced != null ? totalBounced : 0;
            this.bounceRatePercent = new BigDecimal(bounced).multiply(new BigDecimal(100))
                    .divide(new BigDecimal(totalSent), 2, java.math.RoundingMode.HALF_UP);
        } else {
            this.bounceRatePercent = BigDecimal.ZERO;
        }
    }

    /**
     * Calculate all rates
     */
    public void calculateAllRates() {
        calculateDeliveryRate();
        calculateOpenRate();
        calculateClickRate();
        calculateBounceRate();
    }
}
