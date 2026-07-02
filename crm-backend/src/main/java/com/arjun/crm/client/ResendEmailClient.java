package com.arjun.crm.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for Resend email service API
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ResendEmailClient {

    private final RestTemplate restTemplate;

    @Value("${app.resend.api-key:}")
    private String resendApiKey;

    @Value("${app.resend.from-email:onboarding@resend.dev}")
    private String fromEmail;

    private static final String RESEND_API_URL = "https://api.resend.com/emails";
    private static final int MAX_RETRIES = 3;
    private static final int RETRY_DELAY_MS = 1000;

    /**
     * Send email via Resend API
     */
    public boolean sendEmail(String toEmail, String subject, String htmlBody) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("Resend API key not configured, skipping email send");
            return false;
        }

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                Map<String, Object> emailRequest = new HashMap<>();
                emailRequest.put("from", fromEmail);
                emailRequest.put("to", toEmail);
                emailRequest.put("subject", subject);
                emailRequest.put("html", htmlBody);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("Authorization", "Bearer " + resendApiKey);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailRequest, headers);
                ResponseEntity<Map> response = restTemplate.postForEntity(
                    RESEND_API_URL,
                    request,
                    Map.class
                );

                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("Email sent successfully to {}", toEmail);
                    return true;
                } else {
                    log.warn("Email send failed with status {} for {}", response.getStatusCode(), toEmail);
                }
            } catch (Exception e) {
                log.warn("Attempt {} failed to send email to {}: {}", attempt, toEmail, e.getMessage());

                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY_MS * attempt);  // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                } else {
                    log.error("Failed to send email to {} after {} retries", toEmail, MAX_RETRIES, e);
                }
            }
        }

        return false;
    }
}
