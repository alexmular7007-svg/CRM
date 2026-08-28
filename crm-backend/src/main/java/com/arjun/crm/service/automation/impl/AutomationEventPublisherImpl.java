package com.arjun.crm.service.automation.impl;

import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailCampaignRecipient;
import com.arjun.crm.enums.AutomationTriggerType;
import com.arjun.crm.event.EmailEventPublished;
import com.arjun.crm.service.automation.AutomationEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * AutomationEventPublisherImpl - PHASE 7.3: Email Event → Automation Trigger
 *
 * Implementation of AutomationEventPublisher that publishes Spring ApplicationEvents.
 *
 * Behavior:
 * 1. Validates inputs (campaign, email, trigger type)
 * 2. Creates EmailEventPublished domain event
 * 3. Publishes via Spring ApplicationEventPublisher
 * 4. Event is consumed asynchronously by AutomationEventListener
 * 5. Listener finds matching automations and executes them
 *
 * Error Handling:
 * - Invalid campaign: Logs warning and returns (non-fatal)
 * - Null email: Logs warning and returns (non-fatal)
 * - Publishing failures: Logged, not re-thrown (non-blocking to caller)
 *
 * Workspace Isolation:
 * - Campaign carries workspace via relationship
 * - AutomationEventListener uses campaign.workspace for automation queries
 * - Ensures automation execution is workspace-scoped
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AutomationEventPublisherImpl implements AutomationEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    @Override
    public void publishEmailEvent(
            AutomationTriggerType triggerType,
            EmailCampaign campaign,
            EmailCampaignRecipient recipient,
            String recipientEmail,
            LocalDateTime eventOccurredAt
    ) {
        try {
            // Validate inputs
            if (campaign == null) {
                log.warn("Cannot publish email event: campaign is null");
                return;
            }

            if (campaign.getId() == null) {
                log.warn("Cannot publish email event: campaign ID is null");
                return;
            }

            if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
                log.warn("Cannot publish email event: recipient email is empty");
                return;
            }

            if (triggerType == null) {
                log.warn("Cannot publish email event: trigger type is null");
                return;
            }

            if (eventOccurredAt == null) {
                log.warn("Cannot publish email event: event occurred at is null");
                return;
            }

            // Create and publish event
            EmailEventPublished event = new EmailEventPublished(
                    this,
                    triggerType,
                    campaign,
                    recipient,
                    recipientEmail,
                    eventOccurredAt
            );

            log.info("Publishing automation event - Type: {}, Campaign: {}, Email: {}, Time: {}",
                    triggerType, campaign.getId(), recipientEmail, eventOccurredAt);

            eventPublisher.publishEvent(event);

            log.debug("Automation event published successfully - {}", event);

        } catch (Exception ex) {
            log.error("Error publishing automation event - Type: {}, Campaign: {}, Email: {}",
                    triggerType, campaign != null ? campaign.getId() : "null", recipientEmail, ex);
            // Don't re-throw; publishing failures should not block webhook processing
        }
    }

    @Override
    public void publishEmailDelivered(
            EmailCampaign campaign,
            EmailCampaignRecipient recipient,
            String recipientEmail,
            LocalDateTime eventOccurredAt
    ) {
        publishEmailEvent(
                AutomationTriggerType.EMAIL_DELIVERED,
                campaign,
                recipient,
                recipientEmail,
                eventOccurredAt
        );
    }

    @Override
    public void publishEmailOpened(
            EmailCampaign campaign,
            EmailCampaignRecipient recipient,
            String recipientEmail,
            LocalDateTime eventOccurredAt
    ) {
        publishEmailEvent(
                AutomationTriggerType.EMAIL_OPENED,
                campaign,
                recipient,
                recipientEmail,
                eventOccurredAt
        );
    }

    @Override
    public void publishEmailClicked(
            EmailCampaign campaign,
            EmailCampaignRecipient recipient,
            String recipientEmail,
            LocalDateTime eventOccurredAt
    ) {
        publishEmailEvent(
                AutomationTriggerType.EMAIL_CLICKED,
                campaign,
                recipient,
                recipientEmail,
                eventOccurredAt
        );
    }

    @Override
    public void publishEmailBounced(
            EmailCampaign campaign,
            EmailCampaignRecipient recipient,
            String recipientEmail,
            LocalDateTime eventOccurredAt
    ) {
        publishEmailEvent(
                AutomationTriggerType.EMAIL_BOUNCED,
                campaign,
                recipient,
                recipientEmail,
                eventOccurredAt
        );
    }
}
