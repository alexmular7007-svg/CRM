package com.arjun.crm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * EmailCampaignRecipientResponse - FEATURE #3
 * 
 * Response DTO for email campaign recipients
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignRecipientResponse {
    
    private Long id;
    
    private Long campaignId;
    
    private Long leadId;
    
    private String recipientEmail;
    
    private String recipientName;
    
    private String recipientCompany;
    
    private String status;
    
    private String bounceType;
    
    private Integer deliveryAttempts;
    
    private LocalDateTime sentAt;
    
    private LocalDateTime deliveredAt;
    
    private LocalDateTime openedAt;
    
    private LocalDateTime firstClickedAt;
    
    private LocalDateTime lastClickedAt;
    
    private Integer clickCount;
    
    private LocalDateTime unsubscribedAt;
    
    private String errorMessage;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
