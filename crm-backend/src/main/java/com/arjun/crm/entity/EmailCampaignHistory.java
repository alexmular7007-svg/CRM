package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * EmailCampaignHistory Entity - FEATURE #3 ANALYTICS
 *
 * Append-only audit log for email campaign events.
 * Records all delivery, engagement, and bounce events.
 *
 * Event Types:
 * - SENT: Email sent to Brevo
 * - DELIVERED: Email successfully delivered
 * - OPENED: Recipient opened the email
 * - CLICKED: Recipient clicked a link
 * - HARD_BOUNCE: Permanent delivery failure
 * - SOFT_BOUNCE: Temporary delivery failure
 * - SPAM: Email marked as spam
 * - UNSUBSCRIBE: Recipient unsubscribed
 * - REPLY: Recipient replied
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

    @Column(nullable = false, length = 255)
    private String recipientEmail;

    /**
     * Event type: SENT, DELIVERED, OPENED, CLICKED, HARD_BOUNCE, SOFT_BOUNCE, SPAM, UNSUBSCRIBE, REPLY
     */
    @Column(nullable = false, length = 50)
    private String eventType;

    /**
     * URL that was clicked (for CLICKED events)
     */
    @Column(columnDefinition = "TEXT")
    private String linkUrl;

    /**
     * Bounce reason (for HARD_BOUNCE and SOFT_BOUNCE events)
     */
    @Column(length = 255)
    private String bounceReason;

    /**
     * Brevo provider event ID (for deduplication)
     */
    @Column(length = 255, unique = true)
    private String providerEventId;

    /**
     * When the event occurred (in UTC)
     */
    @Column(nullable = false)
    private LocalDateTime occurredAt;

    /**
     * Additional metadata (user agent, IP address, etc.)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    /**
     * Record creation timestamp
     */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
