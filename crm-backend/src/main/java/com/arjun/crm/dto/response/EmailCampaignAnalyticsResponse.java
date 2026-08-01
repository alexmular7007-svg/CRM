package com.arjun.crm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * EmailCampaignAnalyticsResponse - FEATURE #3
 * 
 * Response DTO for email campaign analytics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignAnalyticsResponse {
    
    private Long campaignId;
    
    private String campaignName;
    
    private Long totalSent;
    
    private Long totalDelivered;
    
    private Long totalOpened;
    
    private Long totalClicked;
    
    private Long totalBounced;
    
    private Long totalFailed;
    
    private Long totalUnsubscribed;
    
    private Long totalReplies;
    
    private Long uniqueOpens;
    
    private Long uniqueClicks;
    
    private BigDecimal deliveryRatePercent;
    
    private BigDecimal openRatePercent;
    
    private BigDecimal clickRatePercent;
    
    private BigDecimal bounceRatePercent;
    
    private BigDecimal replyRatePercent;
}
