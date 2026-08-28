package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.BrevoWebhookRequest;
import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailCampaignHistory;
import com.arjun.crm.entity.EmailCampaignRecipient;
import com.arjun.crm.enums.AutomationTriggerType;
import com.arjun.crm.repository.EmailCampaignHistoryRepository;
import com.arjun.crm.repository.EmailCampaignRecipientRepository;
import com.arjun.crm.repository.EmailCampaignRepository;
import com.arjun.crm.service.EmailAnalyticsService;
import com.arjun.crm.service.EmailCampaignAnalyticsResponse;
import com.arjun.crm.service.automation.AutomationEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * EmailAnalyticsServiceImpl - FEATURE #3 ANALYTICS
 *
 * Processes webhook events from Brevo email service.
 * Updates recipient statuses, timestamps, and campaign metrics.
 * Maintains append-only audit log in email_campaign_history.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmailAnalyticsServiceImpl implements EmailAnalyticsService {

    private final EmailCampaignRecipientRepository recipientRepository;
    private final EmailCampaignHistoryRepository historyRepository;
    private final EmailCampaignRepository campaignRepository;
    private final AutomationEventPublisher automationEventPublisher;
    private final WebhookEventClaimService webhookEventClaimService;

    /**
     * Process webhook event from Brevo
     *
     * Flow:
     * 1. Validate webhook payload
     * 2. Check for duplicate events (using providerEventId)
     * 3. Find campaign and recipient
     * 4. Update recipient status and timestamps
     * 5. Create history record
     * 6. Update campaign metrics
     * 7. Publish automation event (PHASE 7.3)
     */
    @Override
    public void processWebhookEvent(BrevoWebhookRequest request) {
        try {
            // Step 1: Validate webhook
            request.validate();
            log.info("🟢 Processing webhook - Event: {}, Email: {}, MessageId: {}", 
                    request.getEvent(), request.getEmail(), request.getProviderEventId());

            // Step 2: Check for duplicate events using idempotency key
            // Generate idempotency key from provider event ID or webhook metadata
            String idempotencyKey = request.getEffectiveProviderEventId();
            if (idempotencyKey != null) {
                // Check if this exact event has already been processed
                Optional<EmailCampaignHistory> existing = historyRepository.findByProviderEventId(
                        idempotencyKey);
                if (existing.isPresent()) {
                    log.warn("⚠️ Duplicate webhook event detected (idempotencyKey: {}). Already processed. Rejecting.", 
                            idempotencyKey);
                    return;
                }
            }

            // Step 3: Extract campaign and recipient IDs from metadata
            Long campaignId = extractLongFromMetadata(request.getMetadata(), "campaign_id");
            Long recipientId = extractLongFromMetadata(request.getMetadata(), "recipient_id");

            if (campaignId == null || recipientId == null) {
                log.warn("⚠️ Campaign ID and recipient ID are required in webhook metadata. Email: {}", request.getEmail());
                return;
            }

            // Load campaign
            EmailCampaign campaign = campaignRepository.findById(campaignId)
                    .orElse(null);
            if (campaign == null) {
                log.warn("⚠️ Campaign not found (ID: {})", campaignId);
                return;
            }

            // Recipient ID is authoritative. Email is only a consistency check.
            EmailCampaignRecipient recipient = recipientRepository
                    .findByIdAndWorkspaceId(recipientId, campaign.getWorkspace().getId())
                    .orElse(null);

            if (recipient == null) {
                log.warn("⚠️ Recipient {} not found in campaign workspace {}", recipientId, campaign.getWorkspace().getId());
                return;
            }
            if (!recipient.getCampaign().getId().equals(campaignId)) {
                log.warn("⚠️ Webhook recipient {} does not belong to campaign {}", recipientId, campaignId);
                return;
            }
            if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(recipient.getRecipientEmail())) {
                log.warn("⚠️ Webhook email does not match recipient {}", recipientId);
                return;
            }
            Long automationId = extractLongFromMetadata(request.getMetadata(), "automation_id");
            Long executionId = extractLongFromMetadata(request.getMetadata(), "execution_id");
            Long automationStepId = extractLongFromMetadata(request.getMetadata(), "automation_step_id");
            Long workspaceId = extractLongFromMetadata(request.getMetadata(), "workspace_id");
            boolean hasAutomationMetadata = automationId != null || executionId != null ||
                    automationStepId != null || workspaceId != null;
            if (recipient.getAutomation() != null || hasAutomationMetadata) {
                if (recipient.getAutomation() == null || workspaceId == null || automationId == null ||
                        executionId == null || automationStepId == null ||
                        !workspaceId.equals(campaign.getWorkspace().getId()) ||
                        !workspaceId.equals(recipient.getAutomation().getWorkspace().getId()) ||
                        !automationId.equals(recipient.getAutomation().getId()) ||
                        recipient.getExecution() == null || !executionId.equals(recipient.getExecution().getId()) ||
                        recipient.getAutomationStep() == null ||
                        !automationStepId.equals(recipient.getAutomationStep().getId()) ||
                        !automationId.equals(recipient.getExecution().getAutomation().getId()) ||
                        !automationId.equals(recipient.getAutomationStep().getAutomation().getId())) {
                    log.warn("⚠️ Inconsistent automation metadata for recipient {}", recipientId);
                    return;
                }
            }

            // Claim the provider event before mutating metrics. The unique database
            // constraint makes concurrent duplicate deliveries harmless.
            EmailCampaignHistory history = createHistoryRecord(campaign, recipient, request);
            if (!webhookEventClaimService.claim(history)) {
                log.warn("Duplicate webhook event ignored");
                return;
            }
            log.info("✓ History record created - Event: {}", request.getEvent());

            // Update recipient and metrics only after this request owns the event.
            updateRecipientFromEvent(recipient, request);
            recipientRepository.save(recipient);
            log.info("✓ Recipient updated - Event: {}, Status: {}", request.getEvent(), recipient.getStatus());

            updateCampaignMetrics(campaign);
            campaignRepository.save(campaign);
            log.info("✓ Campaign metrics updated");

            // Step 8: Publish automation event (PHASE 7.3)
            publishAutomationEvent(request, campaign, recipient);

        } catch (IllegalArgumentException ex) {
            log.warn("⚠️ Validation error: {}", ex.getMessage());
        } catch (Exception ex) {
            log.error("❌ Error processing webhook: {}", ex.getMessage(), ex);
        }
    }

    /**
     * Publish automation event based on webhook event type (PHASE 7.3)
     * This allows automations to be triggered by email events
     *
     * Supported automations:
     * - EMAIL_DELIVERED: When email is successfully delivered
     * - EMAIL_OPENED: When recipient opens the email
     * - EMAIL_CLICKED: When recipient clicks a link
     * - EMAIL_BOUNCED: When email bounces (hard or soft)
     *
     * Non-blocking: Publishing failures do not affect webhook processing
     */
    private void publishAutomationEvent(BrevoWebhookRequest request, EmailCampaign campaign, EmailCampaignRecipient recipient) {
        try {
            String eventType = request.getEvent().toUpperCase();
            LocalDateTime eventTime = convertTimestamp(request.getTs());

            switch (eventType) {
                case "DELIVERED":
                    log.debug("Publishing EMAIL_DELIVERED automation event");
                    automationEventPublisher.publishEmailDelivered(
                            campaign, recipient, request.getEmail(), eventTime);
                    break;

                case "OPENED":
                    log.debug("Publishing EMAIL_OPENED automation event");
                    automationEventPublisher.publishEmailOpened(
                            campaign, recipient, request.getEmail(), eventTime);
                    break;

                case "CLICKED":
                    log.debug("Publishing EMAIL_CLICKED automation event");
                    automationEventPublisher.publishEmailClicked(
                            campaign, recipient, request.getEmail(), eventTime);
                    break;

                case "HARD_BOUNCE":
                case "SOFT_BOUNCE":
                    log.debug("Publishing EMAIL_BOUNCED automation event");
                    automationEventPublisher.publishEmailBounced(
                            campaign, recipient, request.getEmail(), eventTime);
                    break;

                // Other events (SENT, SPAM, UNSUBSCRIBE, REPLY) do not trigger automations yet
                default:
                    log.debug("No automation event for webhook type: {}", eventType);
            }

        } catch (Exception e) {
            log.error("Error publishing automation event: {}", e.getMessage(), e);
            // Non-blocking: don't re-throw or fail webhook processing
        }
    }

    /**
     * Update recipient status and timestamps based on event type
     */
    private void updateRecipientFromEvent(EmailCampaignRecipient recipient, BrevoWebhookRequest request) {
        LocalDateTime eventTime = convertTimestamp(request.getTs());

        switch (request.getEvent().toUpperCase()) {
            case "SENT":
                recipient.setStatus("SENT");
                recipient.setSentAt(eventTime);
                break;

            case "DELIVERED":
                recipient.setStatus("DELIVERED");
                recipient.setDeliveredAt(eventTime);
                break;

            case "OPENED":
                recipient.setStatus("OPENED");
                if (recipient.getOpenedAt() == null) {
                    recipient.setOpenedAt(eventTime);
                }
                break;

            case "CLICKED":
                recipient.setStatus("CLICKED");
                if (recipient.getFirstClickedAt() == null) {
                    recipient.setFirstClickedAt(eventTime);
                }
                recipient.setLastClickedAt(eventTime);
                recipient.setClickCount((recipient.getClickCount() != null ? recipient.getClickCount() : 0) + 1);
                break;

            case "HARD_BOUNCE":
                recipient.setStatus("BOUNCED");
                recipient.setBounceType("PERMANENT");
                recipient.setDeliveredAt(null); // Mark as not delivered
                break;

            case "SOFT_BOUNCE":
                recipient.setStatus("BOUNCED");
                recipient.setBounceType("TEMPORARY");
                break;

            case "SPAM":
                recipient.setStatus("SPAM");
                break;

            case "UNSUBSCRIBE":
                recipient.setStatus("UNSUBSCRIBED");
                recipient.setUnsubscribedAt(eventTime);
                break;

            case "REPLY":
                // Treat reply as engagement but don't change main status
                if (recipient.getFirstClickedAt() == null) {
                    recipient.setFirstClickedAt(eventTime);
                }
                break;

            default:
                log.warn("Unknown event type: {}", request.getEvent());
        }
    }

    /**
     * Create history record for audit log
     */
    private EmailCampaignHistory createHistoryRecord(EmailCampaign campaign, EmailCampaignRecipient recipient,
                                                     BrevoWebhookRequest request) {
        Map<String, Object> metadata = new HashMap<>();
        if (request.getUserAgent() != null) {
            metadata.put("user_agent", request.getUserAgent());
        }
        if (request.getIp() != null) {
            metadata.put("ip", request.getIp());
        }
        if (request.getSubject() != null) {
            metadata.put("subject", request.getSubject());
        }
        if (request.getData() != null) {
            metadata.putAll(request.getData());
        }

        return EmailCampaignHistory.builder()
                .campaign(campaign)
                .recipient(recipient)
                .recipientEmail(request.getEmail())
                .eventType(request.getEvent().toUpperCase())
                .linkUrl(request.getLink())
                .bounceReason(request.getReason())
                .providerEventId(request.getEffectiveProviderEventId())
                .occurredAt(convertTimestamp(request.getTs()))
                .metadata(metadata)
                .build();
    }

    /**
     * Update campaign metrics from recipient counts.
     *
     * IMPORTANT: Counts are based on timestamps (deliveredAt/openedAt/firstClickedAt),
     * NOT on the current status field. A recipient's status transitions
     * DELIVERED → OPENED → CLICKED (final state wins), so counting by status
     * would undercount delivered/opened recipients who later engaged.
     */
    private void updateCampaignMetrics(EmailCampaign campaign) {
        Long campaignId = campaign.getId();

        // Count recipients by timestamp (accurate regardless of status transitions)
        long sentCount = recipientRepository.countByCampaignIdAndSentAtNotNull(campaignId);
        long deliveredCount = recipientRepository.countByCampaignIdAndDeliveredAtNotNull(campaignId);
        long openedCount = recipientRepository.countByCampaignIdAndOpenedAtNotNull(campaignId);
        long clickedCount = recipientRepository.countByCampaignIdAndFirstClickedAtNotNull(campaignId);
        long bouncedCount = recipientRepository.countByCampaignIdAndStatus(campaignId, "BOUNCED");
        long failedCount = recipientRepository.countByCampaignIdAndStatus(campaignId, "FAILED");

        // Update campaign
        campaign.setSentCount(sentCount);
        campaign.setDeliveredCount(deliveredCount);
        campaign.setOpenedCount(openedCount);
        campaign.setClickedCount(clickedCount);
        campaign.setBouncedCount(bouncedCount);
        campaign.setFailedCount(failedCount);

        log.debug("Campaign metrics updated - Sent: {}, Delivered: {}, Opened: {}, Clicked: {}, Bounced: {}",
                sentCount, deliveredCount, openedCount, clickedCount, bouncedCount);
    }

    /**
     * Convert Unix timestamp to LocalDateTime
     */
    private LocalDateTime convertTimestamp(Long timestamp) {
        if (timestamp == null) {
            return LocalDateTime.now(ZoneOffset.UTC);
        }
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(timestamp), ZoneOffset.UTC);
    }

    /**
     * Extract Long value from metadata map with validation
     * 
     * SECURITY:
     * - Null-safe: returns null if metadata is null
     * - Type-safe: only accepts Number or String types
     * - Validates numeric strings before parsing
     * - Logs warnings for invalid metadata
     * 
     * @param metadata Webhook metadata from Brevo
     * @param key Key to extract
     * @return Long value or null if not found or invalid
     */
    private Long extractLongFromMetadata(Map<String, Object> metadata, String key) {
        if (metadata == null) {
            log.debug("Metadata is null, cannot extract {}", key);
            return null;
        }

        Object value = metadata.get(key);
        if (value == null) {
            log.debug("Metadata key '{}' not found", key);
            return null;
        }

        try {
            if (value instanceof Number) {
                Long longValue = ((Number) value).longValue();
                // Validate that the value is positive (IDs should never be 0 or negative)
                if (longValue <= 0) {
                    log.warn("⚠️ Invalid metadata value for '{}': {} (must be positive)", key, longValue);
                    return null;
                }
                return longValue;
            } else if (value instanceof String) {
                String stringValue = ((String) value).trim();
                if (stringValue.isEmpty()) {
                    log.warn("⚠️ Empty string value for metadata key '{}'", key);
                    return null;
                }
                try {
                    Long longValue = Long.parseLong(stringValue);
                    // Validate that the value is positive
                    if (longValue <= 0) {
                        log.warn("⚠️ Invalid metadata value for '{}': {} (must be positive)", key, longValue);
                        return null;
                    }
                    return longValue;
                } catch (NumberFormatException ex) {
                    log.warn("⚠️ Failed to parse metadata key '{}' as number: {}", key, stringValue);
                    return null;
                }
            } else {
                log.warn("⚠️ Unexpected metadata type for '{}': {} (expected Number or String)", 
                        key, value.getClass().getSimpleName());
                return null;
            }
        } catch (Exception ex) {
            log.error("❌ Error extracting metadata key '{}': {}", key, ex.getMessage());
            return null;
        }
    }

    @Override
    public EmailCampaignAnalyticsResponse getCampaignAnalytics(Long campaignId) {
        EmailCampaign campaign = campaignRepository.findById(campaignId).orElse(null);
        if (campaign == null) {
            return EmailCampaignAnalyticsResponse.builder()
                    .campaignId(campaignId)
                    .build();
        }

        Long totalSent = campaign.getSentCount() != null ? campaign.getSentCount() : 0L;
        Long totalDelivered = campaign.getDeliveredCount() != null ? campaign.getDeliveredCount() : 0L;
        Long totalOpened = campaign.getOpenedCount() != null ? campaign.getOpenedCount() : 0L;
        Long totalClicked = campaign.getClickedCount() != null ? campaign.getClickedCount() : 0L;
        Long totalBounced = campaign.getBouncedCount() != null ? campaign.getBouncedCount() : 0L;
        Long totalFailed = campaign.getFailedCount() != null ? campaign.getFailedCount() : 0L;

        EmailCampaignAnalyticsResponse response = EmailCampaignAnalyticsResponse.builder()
                .campaignId(campaign.getId())
                .campaignName(campaign.getName())
                .campaignStatus(campaign.getStatus())
                .sentAt(campaign.getSendStartedAt())
                .totalSent(totalSent)
                .totalDelivered(totalDelivered)
                .totalOpened(totalOpened)
                .totalClicked(totalClicked)
                .totalBounced(totalBounced)
                .totalFailed(totalFailed)
                .uniqueOpens(totalOpened)
                .uniqueClicks(totalClicked)
                .build();
        response.calculateAllRates();
        return response;
    }

    @Override
    public void updateAnalyticsSnapshot(Long campaignId) {
        // Implementation for manual snapshot update
        log.info("Analytics snapshot update requested for campaign: {}", campaignId);
    }

    /**
     * Record a click event for a recipient (server-side click tracking)
     * Called when recipient clicks the tracking redirect link
     */
    @Override
    public void recordClick(Long campaignId, Long recipientId) {
        log.info("Recording click - campaignId: {}, recipientId: {}", campaignId, recipientId);
        
        // Load recipient
        EmailCampaignRecipient recipient = recipientRepository.findById(recipientId)
                .orElse(null);
        
        if (recipient == null) {
            log.warn("Recipient not found for click tracking - ID: {}", recipientId);
            return;
        }
        
        // Update click tracking fields
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (recipient.getFirstClickedAt() == null) {
            recipient.setFirstClickedAt(now);
        }
        recipient.setLastClickedAt(now);
        recipient.setClickCount((recipient.getClickCount() != null ? recipient.getClickCount() : 0) + 1);
        recipient.setStatus("CLICKED");
        
        // Save recipient
        recipientRepository.save(recipient);
        
        // Update campaign metrics
        EmailCampaign campaign = campaignRepository.findById(campaignId).orElse(null);
        if (campaign != null) {
            updateCampaignMetrics(campaign);
            campaignRepository.save(campaign);
        }
        
        // Create history record
        if (campaign != null) {
            EmailCampaignHistory history = EmailCampaignHistory.builder()
                    .campaign(campaign)
                    .recipient(recipient)
                    .recipientEmail(recipient.getRecipientEmail())
                    .eventType("CLICKED")
                    .occurredAt(now)
                    .metadata(Map.of("source", "server_side_tracking"))
                    .build();
            historyRepository.save(history);
        }
        
        log.info("Click recorded successfully - campaignId: {}, recipientId: {}", campaignId, recipientId);
    }

    /**
     * Record an open event for a recipient (server-side open tracking)
     * Called when tracking pixel is loaded in email client
     */
    @Override
    public void recordOpen(Long campaignId, Long recipientId) {
        log.info("Recording open - campaignId: {}, recipientId: {}", campaignId, recipientId);
        
        // Load recipient
        EmailCampaignRecipient recipient = recipientRepository.findById(recipientId)
                .orElse(null);
        
        if (recipient == null) {
            log.warn("Recipient not found for open tracking - ID: {}", recipientId);
            return;
        }
        
        // Only record first open
        if (recipient.getOpenedAt() != null) {
            log.debug("Email already marked as opened - ID: {}", recipientId);
            return;
        }
        
        // Update open tracking fields
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        recipient.setOpenedAt(now);
        recipient.setStatus("OPENED");
        
        // Save recipient
        recipientRepository.save(recipient);
        
        // Update campaign metrics
        EmailCampaign campaign = campaignRepository.findById(campaignId).orElse(null);
        if (campaign != null) {
            updateCampaignMetrics(campaign);
            campaignRepository.save(campaign);
        }
        
        // Create history record
        if (campaign != null) {
            EmailCampaignHistory history = EmailCampaignHistory.builder()
                    .campaign(campaign)
                    .recipient(recipient)
                    .recipientEmail(recipient.getRecipientEmail())
                    .eventType("OPENED")
                    .occurredAt(now)
                    .metadata(Map.of("source", "server_side_tracking"))
                    .build();
            historyRepository.save(history);
        }
        
        log.info("Open recorded successfully - campaignId: {}, recipientId: {}", campaignId, recipientId);
    }
}
