package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.BrevoWebhookRequest;
import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailCampaignHistory;
import com.arjun.crm.entity.EmailCampaignRecipient;
import com.arjun.crm.repository.EmailCampaignHistoryRepository;
import com.arjun.crm.repository.EmailCampaignRecipientRepository;
import com.arjun.crm.repository.EmailCampaignRepository;
import com.arjun.crm.service.EmailAnalyticsService;
import com.arjun.crm.service.EmailCampaignAnalyticsResponse;
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
     */
    @Override
    public void processWebhookEvent(BrevoWebhookRequest request) {
        try {
            // Step 1: Validate webhook
            request.validate();
            log.info("🟢 Processing webhook - Event: {}, Email: {}, MessageId: {}", 
                    request.getEvent(), request.getEmail(), request.getProviderEventId());

            // Step 2: Check for duplicate events
            String effectiveEventId = request.getEffectiveProviderEventId();
            if (effectiveEventId != null) {
                Optional<EmailCampaignHistory> existing = historyRepository.findByProviderEventId(
                        effectiveEventId);
                if (existing.isPresent()) {
                    log.warn("⚠️ Duplicate webhook event (providerEventId: {}). Ignoring.", 
                            effectiveEventId);
                    return;
                }
            }

            // Step 3: Extract campaign and recipient IDs from metadata
            Long campaignId = extractLongFromMetadata(request.getMetadata(), "campaign_id");
            Long recipientId = extractLongFromMetadata(request.getMetadata(), "recipient_id");

            if (campaignId == null) {
                log.warn("⚠️ Campaign ID not found in webhook metadata. Email: {}", request.getEmail());
                return;
            }

            // Load campaign
            EmailCampaign campaign = campaignRepository.findById(campaignId)
                    .orElse(null);
            if (campaign == null) {
                log.warn("⚠️ Campaign not found (ID: {})", campaignId);
                return;
            }

            // Find recipient by campaign and email
            EmailCampaignRecipient recipient = recipientRepository
                    .findByCampaignIdAndRecipientEmail(campaignId, request.getEmail())
                    .orElse(null);

            if (recipient == null) {
                log.warn("⚠️ Recipient not found for campaign {} and email {}", campaignId, request.getEmail());
                return;
            }

            // Step 4: Update recipient based on event type
            updateRecipientFromEvent(recipient, request);

            // Step 5: Save recipient
            recipientRepository.save(recipient);
            log.info("✓ Recipient updated - Event: {}, Status: {}", request.getEvent(), recipient.getStatus());

            // Step 6: Create history record
            EmailCampaignHistory history = createHistoryRecord(campaign, recipient, request);
            historyRepository.save(history);
            log.info("✓ History record created - Event: {}", request.getEvent());

            // Step 7: Update campaign metrics
            updateCampaignMetrics(campaign);
            campaignRepository.save(campaign);
            log.info("✓ Campaign metrics updated");

        } catch (IllegalArgumentException ex) {
            log.warn("⚠️ Validation error: {}", ex.getMessage());
        } catch (Exception ex) {
            log.error("❌ Error processing webhook: {}", ex.getMessage(), ex);
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
     * Extract Long value from metadata map
     */
    private Long extractLongFromMetadata(Map<String, Object> metadata, String key) {
        if (metadata == null) {
            return null;
        }
        Object value = metadata.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        } else if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException ex) {
                return null;
            }
        }
        return null;
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
}
