package com.arjun.crm.controller;

import com.arjun.crm.dto.request.BrevoWebhookRequest;
import com.arjun.crm.service.EmailAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * BrevoWebhookController - FEATURE #3 ANALYTICS
 *
 * Receives webhook events from Brevo email service.
 * 
 * Webhook Path: POST /api/webhooks/brevo
 * No authentication required (webhook from external service)
 * Validates webhook payload from Brevo
 * Delegates to EmailAnalyticsService for processing
 */
@RestController
@RequestMapping("/api/webhooks/brevo")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class BrevoWebhookController {

    private final EmailAnalyticsService emailAnalyticsService;

    /**
     * POST /api/webhooks/brevo
     *
     * Receive Brevo email events (DELIVERED, OPENED, CLICKED, BOUNCED, etc.)
     *
     * @param request Brevo webhook payload
     * @return 200 OK
     */
    @PostMapping
    public ResponseEntity<Void> handleBrevoWebhook(@RequestBody BrevoWebhookRequest request) {
        try {
            log.info("🟢 [BrevoWebhookController] Received webhook event - Event: {}", request.getEvent());
            
            // Validate and process the webhook
            emailAnalyticsService.processWebhookEvent(request);
            
            log.info("✓ Webhook processed successfully");
            return ResponseEntity.ok().build();
            
        } catch (IllegalArgumentException ex) {
            log.warn("⚠️ Invalid webhook payload: {}", ex.getMessage());
            // Return 200 OK to Brevo (acknowledge receipt even if invalid)
            return ResponseEntity.ok().build();
            
        } catch (Exception ex) {
            log.error("❌ Error processing webhook: {}", ex.getMessage(), ex);
            // Return 200 OK to Brevo to prevent retries
            // The event will be logged and can be investigated
            return ResponseEntity.ok().build();
        }
    }
}
