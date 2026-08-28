package com.arjun.crm.event;

import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailCampaignRecipient;
import com.arjun.crm.enums.AutomationTriggerType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;

/**
 * EmailEventPublished - PHASE 7.3: Email Event → Automation Trigger
 *
 * Domain event published when email events occur (DELIVERED, OPENED, CLICKED, BOUNCED).
 * Consumed by AutomationEventListener to trigger matching automations.
 *
 * Event Flow:
 * 1. Brevo webhook received (BrevoWebhookController)
 * 2. Email event processed (EmailAnalyticsService)
 * 3. This event published after recipient updated
 * 4. AutomationEventListener receives event
 * 5. Finds matching automations in workspace
 * 6. Executes automations via AutomationExecutionService
 *
 * Properties:
 * - source: Application/service that published the event
 * - triggerType: Which automation trigger type (EMAIL_OPENED, EMAIL_CLICKED, etc.)
 * - campaign: The email campaign involved
 * - recipient: The email recipient (if available, may be null if only email known)
 * - recipientEmail: The recipient email address (always present)
 * - eventOccurredAt: When the event occurred in Brevo system (UTC)
 * - publishedAt: When the event was published locally (UTC)
 *
 * Workspace Isolation:
 * - Campaign carries workspace relationship transitively
 * - AutomationEventListener uses campaign.workspace.id for finding automations
 */
@Getter
public class EmailEventPublished extends ApplicationEvent {

    private final AutomationTriggerType triggerType;
    private final EmailCampaign campaign;
    private final EmailCampaignRecipient recipient;
    private final String recipientEmail;
    private final LocalDateTime eventOccurredAt;
    private final LocalDateTime publishedAt;

    public EmailEventPublished(
            Object source,
            AutomationTriggerType triggerType,
            EmailCampaign campaign,
            EmailCampaignRecipient recipient,
            String recipientEmail,
            LocalDateTime eventOccurredAt
    ) {
        super(source);
        this.triggerType = triggerType;
        this.campaign = campaign;
        this.recipient = recipient;
        this.recipientEmail = recipientEmail;
        this.eventOccurredAt = eventOccurredAt;
        this.publishedAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "EmailEventPublished{" +
                "triggerType=" + triggerType +
                ", campaignId=" + (campaign != null ? campaign.getId() : "null") +
                ", recipientEmail='" + recipientEmail + '\'' +
                ", eventOccurredAt=" + eventOccurredAt +
                ", publishedAt=" + publishedAt +
                '}';
    }
}
