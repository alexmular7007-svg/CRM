package com.arjun.crm.controller;

import com.arjun.crm.dto.request.BrevoWebhookRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.arjun.crm.service.EmailAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.security.MessageDigest;

/**
 * BrevoWebhookController - FEATURE #3 ANALYTICS
 *
 * Receives webhook events from Brevo email service.
 * 
 * Webhook Path: POST /api/webhooks/brevo
 * No authentication required (webhook from external service)
 * Validates webhook payload signature from Brevo
 * Delegates to EmailAnalyticsService for processing
 * 
 * Security:
 * - Verifies X-Brevo-Signature header using HMAC-SHA256
 * - No CORS wildcard (restricted to Brevo requests only)
 */
@RestController
@RequestMapping("/api/webhooks/brevo")
@RequiredArgsConstructor
@Slf4j
public class BrevoWebhookController {

    private final EmailAnalyticsService emailAnalyticsService;
    private final ObjectMapper objectMapper;
    
    @Value("${brevo.webhook.secret:}")
    private String brevoWebhookSecret;

    /**
     * POST /api/webhooks/brevo
     *
     * Receive Brevo email events (DELIVERED, OPENED, CLICKED, BOUNCED, etc.)
     *
     * @param request Brevo webhook payload
     * @param brevoSignature X-Brevo-Signature header for HMAC verification
     * @return 200 OK
     */
    @PostMapping
    public ResponseEntity<Void> handleBrevoWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Brevo-Signature", required = false) String brevoSignature) {
        try {
            if (!verifyWebhookSignature(brevoSignature, rawBody)) {
                log.warn("❌ Webhook signature verification failed - rejecting request");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            BrevoWebhookRequest request = objectMapper.readValue(rawBody, BrevoWebhookRequest.class);
            log.info("🟢 [BrevoWebhookController] Received webhook event - Event: {}", request.getEvent());
            
            // Validate and process the webhook
            emailAnalyticsService.processWebhookEvent(request);
            
            log.info("✓ Webhook processed successfully");
            return ResponseEntity.ok().build();
            
        } catch (JsonProcessingException | IllegalArgumentException ex) {
            log.warn("⚠️ Invalid webhook payload: {}", ex.getMessage());
            return ResponseEntity.badRequest().build();
            
        } catch (Exception ex) {
            log.error("❌ Error processing webhook: {}", ex.getMessage(), ex);
            // Return 200 OK to Brevo to prevent retries
            // The event will be logged and can be investigated
            return ResponseEntity.ok().build();
        }
    }
    
    /**
     * Verify Brevo webhook signature using HMAC-SHA256
     * 
     * Brevo signs webhooks with: HMAC-SHA256(webhook_body, webhook_secret)
     * and sends it in X-Brevo-Signature header
     * 
     * @param signature X-Brevo-Signature header value
    * @param rawBody Exact raw webhook request body
     * @return true if signature is valid, false otherwise
     */
    private boolean verifyWebhookSignature(String signature, String rawBody) {
        if (rawBody == null) {
            log.warn("Webhook request body is missing");
            return false;
        }

        if (brevoWebhookSecret == null || brevoWebhookSecret.isEmpty()) {
            log.error("Brevo webhook secret is not configured");
            return false;
        }
        
        if (signature == null || signature.isEmpty()) {
            log.warn("❌ Missing X-Brevo-Signature header");
            return false;
        }
        
        try {
            // Compute HMAC-SHA256 of the request body
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    brevoWebhookSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(secretKeySpec);
            
            byte[] hash = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String computedSignature = Base64.getEncoder().encodeToString(hash);
            
            // Compare signatures (constant-time comparison to prevent timing attacks)
            boolean isValid = MessageDigest.isEqual(
                    signature.getBytes(StandardCharsets.UTF_8),
                    computedSignature.getBytes(StandardCharsets.UTF_8));

            if (isValid) {
                log.info("✓ Webhook signature verified successfully");
            }
            
            return isValid;
        } catch (Exception ex) {
            log.error("❌ Error verifying webhook signature: {}", ex.getMessage(), ex);
            return false;
        }
    }
    
    /**
     * Constant-time string comparison to prevent timing attacks
     */
    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return a == b;
        }
        
        byte[] aBytes = a.getBytes(StandardCharsets.UTF_8);
        byte[] bBytes = b.getBytes(StandardCharsets.UTF_8);
        
        int result = 0;
        if (aBytes.length != bBytes.length) {
            result = 1;
        }
        
        for (int i = 0; i < Math.min(aBytes.length, bBytes.length); i++) {
            result |= aBytes[i] ^ bBytes[i];
        }
        
        return result == 0;
    }
    
}
