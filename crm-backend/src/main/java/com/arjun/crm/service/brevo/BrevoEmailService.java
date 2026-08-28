package com.arjun.crm.service.brevo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BrevoEmailService {

    @Value("${BREVO_API_KEY:}")
    private String apiKey;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    private final RestTemplate restTemplate;

    /**
     * Send email without campaign metadata (used for invitations, etc.)
     */
    public String sendEmail(String to, String subject, String html) {
        return sendEmail(to, subject, html, null);
    }

    /**
     * Send email with optional campaign metadata.
     *
     * The metadata map is passed to Brevo and echoed back in webhook events,
     * allowing the analytics service to identify which campaign and recipient
     * an event belongs to.
     *
     * @param metadata e.g. {"campaign_id": 1, "recipient_id": 42}
     */
    public String sendEmail(String to, String subject, String html, Map<String, Object> metadata) {
        log.info("Brevo Email Service - Sending email to: {}", to);
        // API key logging removed for security - never log credentials

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("sender", Map.of(
                "name", fromName,
                "email", fromEmail
        ));
        body.put("to", List.of(
                Map.of("email", to)
        ));
        body.put("subject", subject);
        body.put("htmlContent", html);
        if (metadata != null && !metadata.isEmpty()) {
            body.put("metadata", metadata);
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        log.info("Calling Brevo API endpoint");
        try {
            var response = restTemplate.exchange(
                    "https://api.brevo.com/v3/smtp/email",
                    HttpMethod.POST,
                    entity,
                    String.class
            );
            log.info("✓ Email sent successfully - Brevo HTTP {}", response.getStatusCode());
            return response.getBody();
        } catch (HttpStatusCodeException ex) {
            log.error("Brevo API error - STATUS: {}", ex.getStatusCode());
            log.error("Brevo API error - BODY: {}", ex.getResponseBodyAsString());
            throw ex;
        }
    }

}
