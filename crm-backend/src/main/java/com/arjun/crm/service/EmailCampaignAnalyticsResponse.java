package com.arjun.crm.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * EmailCampaignAnalyticsResponse - FEATURE #3 ANALYTICS
 *
 * Represents campaign analytics summary with metrics and timeline
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignAnalyticsResponse {

    // Campaign Info
    private Long campaignId;
    private String campaignName;
    private String campaignStatus;
    private LocalDateTime sentAt;

    // Summary Metrics
    private Long totalSent;
    private Long totalDelivered;
    private Long totalOpened;
    private Long totalClicked;
    private Long totalBounced;
    private Long totalFailed;
    private Long totalUnsubscribed;
    private Long totalReplies;

    // Rates (percentage)
    private Double deliveryRate;
    private Double openRate;
    private Double clickRate;
    private Double bounceRate;
    private Double replyRate;

    // Engagement
    private Long uniqueOpens;
    private Long uniqueClicks;
    private Double averageClicksPerRecipient;

    // Timeline (last event occurrence)
    private LocalDateTime firstDeliveredAt;
    private LocalDateTime firstOpenedAt;
    private LocalDateTime firstClickedAt;
    private LocalDateTime lastOpenedAt;
    private LocalDateTime lastClickedAt;

    // Bounce Details
    private Long hardBounceCount;
    private Long softBounceCount;
    private Long spamReportCount;

    /**
     * Calculate delivery rate
     */
    public void calculateDeliveryRate() {
        if (totalSent != null && totalSent > 0) {
            this.deliveryRate = (double) (totalDelivered != null ? totalDelivered : 0) / totalSent * 100;
        } else {
            this.deliveryRate = 0.0;
        }
    }

    /**
     * Calculate open rate
     */
    public void calculateOpenRate() {
        if (totalDelivered != null && totalDelivered > 0) {
            this.openRate = (double) (totalOpened != null ? totalOpened : 0) / totalDelivered * 100;
        } else {
            this.openRate = 0.0;
        }
    }

    /**
     * Calculate click rate
     */
    public void calculateClickRate() {
        if (totalDelivered != null && totalDelivered > 0) {
            this.clickRate = (double) (totalClicked != null ? totalClicked : 0) / totalDelivered * 100;
        } else {
            this.clickRate = 0.0;
        }
    }

    /**
     * Calculate bounce rate
     */
    public void calculateBounceRate() {
        if (totalSent != null && totalSent > 0) {
            this.bounceRate = (double) (totalBounced != null ? totalBounced : 0) / totalSent * 100;
        } else {
            this.bounceRate = 0.0;
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
