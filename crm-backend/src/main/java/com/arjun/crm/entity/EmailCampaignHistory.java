package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * EmailCampaignHistory Entity - FEATURE #3
 * 
 * Immutable audit log of delivery events.
 * Append-only: only INSERT operations, no UPDATEs.
 */
@Entity
@Table(
    name = "email_campaign_history",
    indexes = {
        @Index(name = "idx_history_campaign_id", columnList = "campaign_id"),
        @Index(name = "idx_history_event_type", columnList = "event_type"),
        @Index(name = "idx_history_recipient_email", columnList = "recipient_email"),
        @Index(name = "idx_history_occurred_at", columnList = "occurred_at"),
        @Index(name = "idx_history_campaign_event", columnList = "campaign_id, event_type, occurred_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private EmailCampaign campaign;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    private EmailCampaignRecipient recipient;
    
    @Column(length = 255)
    private String recipientEmail;
    
    @Column(nullable = false, length = 50)
    private String eventType;  // SENT, DELIVERED, OPENED, CLICKED, BOUNCED, FAILED, UNSUBSCRIBED, COMPLAINED, REPLY
    
    @Column(columnDefinition = "TEXT")
    private String linkUrl;
    
    @Column(length = 255)
    private String bounceReason;
    
    @Column(length = 255)
    private String providerEventId;
    
    @Column(nullable = false)
    private LocalDateTime occurredAt;
    
    @Column(columnDefinition = "jsonb")
    private String metadata;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
