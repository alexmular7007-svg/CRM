package com.arjun.crm.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * BrevoWebhookRequest - FEATURE #3 ANALYTICS
 *
 * Represents a webhook event from Brevo email service.
 *
 * Events:
 * - DELIVERED: Email successfully delivered
 * - OPENED: Recipient opened the email
 * - CLICKED: Recipient clicked a link in the email
 * - HARD_BOUNCE: Email bounced permanently
 * - SOFT_BOUNCE: Email bounced temporarily
 * - SPAM: Email marked as spam
 * - UNSUBSCRIBE: Recipient unsubscribed
 * - REPLY: Recipient replied to email
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrevoWebhookRequest {

    /**
     * Event type: DELIVERED, OPENED, CLICKED, HARD_BOUNCE, SOFT_BOUNCE, SPAM, UNSUBSCRIBE, REPLY
     */
    @JsonProperty("event")
    private String event;

    /**
     * Email address of the recipient
     */
    @JsonProperty("email")
    private String email;

    /**
     * Unique message ID from Brevo (use for deduplication)
     */
    @JsonProperty("message_id")
    private String providerEventId;

    /**
     * Timestamp when event occurred (ISO 8601 format)
     */
    @JsonProperty("ts")
    private Long ts;

    /**
     * Custom metadata sent with the email (contains campaign ID and recipient ID)
     * Format: {"campaign_id": 123, "recipient_id": 456}
     */
    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    /**
     * Link URL (for CLICKED events)
     */
    @JsonProperty("link")
    private String link;

    /**
     * Bounce reason (for HARD_BOUNCE and SOFT_BOUNCE events)
     */
    @JsonProperty("reason")
    private String reason;

    /**
     * Additional webhook data
     */
    @JsonProperty("data")
    private Map<String, Object> data;

    /**
     * Brevo message ID (for tracking)
     */
    @JsonProperty("id")
    private String id;

    /**
     * User agent (for opened/clicked events)
     */
    @JsonProperty("user_agent")
    private String userAgent;

    /**
     * IP address (for opened/clicked events)
     */
    @JsonProperty("ip")
    private String ip;

    /**
     * Campaign name/subject
     */
    @JsonProperty("subject")
    private String subject;

    /**
     * Validate that required fields are present for the event type
     */
    public void validate() {
        if (event == null || event.trim().isEmpty()) {
            throw new IllegalArgumentException("Event type is required");
        }

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (providerEventId == null || providerEventId.trim().isEmpty()) {
            throw new IllegalArgumentException("Message ID is required");
        }

        if (ts == null || ts <= 0) {
            throw new IllegalArgumentException("Timestamp is required");
        }
    }
}
