package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * EmailCampaignRecipient Entity - FEATURE #3
 * 
 * Represents a single recipient of an email campaign.
 * Tracks individual delivery status and engagement metrics.
 */
@Entity
@Table(
    name = "email_campaign_recipients",
    indexes = {
        @Index(name = "idx_recipient_campaign_id", columnList = "campaign_id"),
        @Index(name = "idx_recipient_status", columnList = "status"),
        @Index(name = "idx_recipient_email", columnList = "recipient_email"),
        @Index(name = "idx_recipient_opened_at", columnList = "opened_at"),
        @Index(name = "idx_recipient_campaign_status", columnList = "campaign_id, status")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignRecipient {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private EmailCampaign campaign;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private Lead lead;
    
    @Column(nullable = false, length = 255)
    private String recipientEmail;
    
    @Column(length = 255)
    private String recipientName;
    
    @Column(length = 255)
    private String recipientCompany;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String recipientVariables;  // {firstName, company, etc.}
    
    @Column(length = 50)
    private String status;  // PENDING, QUEUED, SENT, DELIVERED, OPENED, CLICKED, BOUNCED, FAILED, UNSUBSCRIBED
    
    @Column(length = 50)
    private String bounceType;  // PERMANENT, TEMPORARY
    
    @Column
    private Integer deliveryAttempts;
    
    @Column
    private LocalDateTime sentAt;
    
    @Column
    private LocalDateTime deliveredAt;
    
    @Column
    private LocalDateTime openedAt;
    
    @Column
    private LocalDateTime firstClickedAt;
    
    @Column
    private LocalDateTime lastClickedAt;
    
    @Column
    private Integer clickCount;
    
    @Column
    private LocalDateTime unsubscribedAt;
    
    @Column(length = 255)
    private String providerMessageId;
    
    @Column(columnDefinition = "TEXT")
    private String errorMessage;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String metadata;  // Provider-specific data
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
