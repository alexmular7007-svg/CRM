package com.arjun.crm.service.automation;

import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailCampaignRecipient;
import com.arjun.crm.enums.AutomationTriggerType;

import java.time.LocalDateTime;

/**
 * AutomationEventPublisher - PHASE 7.3: Email Event → Automation Trigger
 *
 * Service interface for publishing domain events that trigger automations.
 * Decouples email event processing from automation triggering.
 *
 * Usage:
 * - Called from EmailAnalyticsService after processing webhook events
 * - Publishes EmailEventPublished domain events
 * - Events are consumed by AutomationEventListener
 *
 * Example:
 * ```
 * // In EmailAnalyticsService.processWebhookEvent() after updating recipient
 * if ("OPENED".equalsIgnoreCase(request.getEvent())) {
 *     publisher.publishEmailEvent(
 *         AutomationTriggerType.EMAIL_OPENED,
 *         campaign,
 *         recipient,
 *         request.getEmail(),
 *         eventTime
 *     );
 * }
 * ```
 *
 * Benefits:
 * - Single Responsibility: EmailAnalyticsService focuses on email metrics
 * - Testability: Can mock publisher in tests
 * - Extensibility: Can add new event types without modifying analytics
 * - Async Processing: Events can be consumed asynchronously
 */
public interface AutomationEventPublisher {

    /**
     * Publish an email event that may trigger automations.
     *
     * @param triggerType Type of automation trigger (EMAIL_OPENED, EMAIL_CLICKED, etc.)
     * @param campaign The email campaign involved
     * @param recipient The email recipient (may be null if only email is known)
     * @param recipientEmail The recipient email address
     * @param eventOccurredAt When the event occurred in the provider system (UTC)
     */
    void publishEmailEvent(
            AutomationTriggerType triggerType,
            EmailCampaign campaign,
            EmailCampaignRecipient recipient,
            String recipientEmail,
            LocalDateTime eventOccurredAt
    );

    /**
     * Publish an email delivered event.
     *
     * @param campaign The email campaign
     * @param recipient The recipient
     * @param recipientEmail The recipient email
     * @param eventOccurredAt When the delivery occurred
     */
    void publishEmailDelivered(
            EmailCampaign campaign,
            EmailCampaignRecipient recipient,
            String recipientEmail,
            LocalDateTime eventOccurredAt
    );

    /**
     * Publish an email opened event.
     *
     * @param campaign The email campaign
     * @param recipient The recipient
     * @param recipientEmail The recipient email
     * @param eventOccurredAt When the open occurred
     */
    void publishEmailOpened(
            EmailCampaign campaign,
            EmailCampaignRecipient recipient,
            String recipientEmail,
            LocalDateTime eventOccurredAt
    );

    /**
     * Publish an email clicked event.
     *
     * @param campaign The email campaign
     * @param recipient The recipient
     * @param recipientEmail The recipient email
     * @param eventOccurredAt When the click occurred
     */
    void publishEmailClicked(
            EmailCampaign campaign,
            EmailCampaignRecipient recipient,
            String recipientEmail,
            LocalDateTime eventOccurredAt
    );

    /**
     * Publish an email bounced event.
     *
     * @param campaign The email campaign
     * @param recipient The recipient
     * @param recipientEmail The recipient email
     * @param eventOccurredAt When the bounce occurred
     */
    void publishEmailBounced(
            EmailCampaign campaign,
            EmailCampaignRecipient recipient,
            String recipientEmail,
            LocalDateTime eventOccurredAt
    );
}
