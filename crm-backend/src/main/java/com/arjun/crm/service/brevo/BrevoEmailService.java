package com.arjun.crm.service.brevo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

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

    public void sendEmail(String to, String subject, String html) {
        log.info("Brevo Email Service - Sending email");
        log.info("  API Key starts with: {}", apiKey == null ? "NULL" : apiKey.substring(0, Math.min(10, apiKey.length())));
        log.info("  From Email: {}", fromEmail);
        log.info("  From Name: {}", fromName);
        log.info("  To: {}", to);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        Map<String, Object> body = Map.of(
                "sender", Map.of(
                        "name", fromName,
                        "email", fromEmail
                ),
                "to", List.of(
                        Map.of("email", to)
                ),
                "subject", subject,
                "htmlContent", html
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        log.info("Calling Brevo API: https://api.brevo.com/v3/smtp/email");
        try {
            var response = restTemplate.exchange(
                    "https://api.brevo.com/v3/smtp/email",
                    HttpMethod.POST,
                    entity,
                    String.class
            );
            log.info("✓ Brevo API Response: {}", response.getStatusCode());
        } catch (HttpStatusCodeException ex) {
            log.error("STATUS = {}", ex.getStatusCode());
            log.error("BODY = {}", ex.getResponseBodyAsString());
            throw ex;
        }
    }

}
