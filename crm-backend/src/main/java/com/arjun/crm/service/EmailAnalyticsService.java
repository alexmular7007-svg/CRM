package com.arjun.crm.service;

import com.arjun.crm.dto.request.BrevoWebhookRequest;

/**
 * EmailAnalyticsService Interface - FEATURE #3 ANALYTICS
 *
 * Processes webhook events from Brevo and updates campaign analytics.
 * Handles recipient status updates, metrics aggregation, and history tracking.
 */
public interface EmailAnalyticsService {

    /**
     * Process webhook event from Brevo
     *
     * @param request Webhook payload from Brevo
     * @throws IllegalArgumentException if webhook data is invalid
     */
    void processWebhookEvent(BrevoWebhookRequest request);

    /**
     * Get analytics for a campaign
     *
     * @param campaignId Campaign ID
     * @return Campaign analytics summary
     */
    EmailCampaignAnalyticsResponse getCampaignAnalytics(Long campaignId);

    /**
     * Manually trigger analytics snapshot update (admin operation)
     *
     * @param campaignId Campaign ID
     */
    void updateAnalyticsSnapshot(Long campaignId);

    /**
     * Record a click event for a recipient
     * Used by server-side click tracking endpoint
     *
     * @param campaignId Campaign ID
     * @param recipientId Recipient ID
     */
    void recordClick(Long campaignId, Long recipientId);

    /**
     * Record an open event for a recipient
     * Used by server-side open tracking pixel endpoint
     *
     * @param campaignId Campaign ID
     * @param recipientId Recipient ID
     */
    void recordOpen(Long campaignId, Long recipientId);
}
