package com.arjun.crm.ai.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Validates AI configuration at startup and logs a clear warning if
 * the API key is missing, rather than letting it silently fail at
 * runtime when a user actually hits an AI endpoint.
 */
@Component
@Slf4j
public class AIStartupValidator {

    @Value("${ai.xai.api-key:}")
    private String apiKey;

    @Value("${ai.xai.base-url}")
    private String baseUrl;

    @Value("${ai.xai.model}")
    private String model;

    @EventListener(ApplicationReadyEvent.class)
    public void validateOnStartup() {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("╔══════════════════════════════════════════════════════════╗");
            log.error("║  AI CONFIGURATION ERROR                                  ║");
            log.error("║  XAI_API_KEY environment variable is not set.            ║");
            log.error("║  AI features (chat AI, task AI, insights) will fail.     ║");
            log.error("║  Set XAI_API_KEY in your environment or .env file.       ║");
            log.error("╚══════════════════════════════════════════════════════════╝");
        } else {
            // Log only first/last 4 chars to confirm it loaded without exposing the key
            String masked = apiKey.substring(0, Math.min(4, apiKey.length()))
                          + "****"
                          + apiKey.substring(Math.max(0, apiKey.length() - 4));
            log.info("AI provider configured: model={}, url={}, key={}", model, baseUrl, masked);
        }
    }
}
