package com.arjun.crm.ai.provider;

import com.arjun.crm.ai.dto.response.AIResponse;
import com.arjun.crm.exception.AIServiceException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * xAI (Grok) Provider for AI-powered features
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class XAIProvider {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.xai.api-key}")
    private String apiKey;

    @Value("${ai.xai.model}")
    private String model;

    @Value("${ai.xai.base-url}")
    private String baseUrl;

    /**
     * Generate AI response (delegates to generateResponseNoCache — caching is
     * handled at the service layer, not here, to avoid Redis type-cast issues).
     */
    @Retryable(
        value = {Exception.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public AIResponse generateResponse(String prompt) {
        return generateResponseNoCache(prompt);
    }

    /**
     * Generate AI response without caching (for dynamic content)
     */
    @Retryable(
        value = {Exception.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public AIResponse generateResponseNoCache(String prompt) {
        try {
            log.info("PROVIDER_REQUEST:\nbaseUrl={}\nmodel={}", baseUrl, model);
            
            Map<String, Object> requestBody = buildRequestBody(prompt);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                baseUrl,
                HttpMethod.POST,
                entity,
                String.class
            );
            
            log.info("PROVIDER_RESPONSE:\nHTTP status={}", response.getStatusCode());

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return parseXAIResponse(response.getBody());
            } else {
                String errorMsg = "Failed to get response from AI provider: " + response.getStatusCode();
                log.error("PROVIDER_ERROR:\nstatus={}\nmessage={}", response.getStatusCode(), errorMsg);
                return AIResponse.builder()
                    .error(errorMsg)
                    .content(errorMsg)
                    .success(false)
                    .model(model)
                    .build();
            }
            
        } catch (HttpStatusCodeException e) {
            String sanitizedError = extractErrorMessage(e.getResponseBodyAsString());
            String errorMsg = "AI provider HTTP " + e.getStatusCode().value() + ": " + sanitizedError;
            log.error("PROVIDER_ERROR:\nstatus={}\nmessage={}", e.getStatusCode().value(), sanitizedError);
            return AIResponse.builder()
                .error(errorMsg)
                .content(errorMsg)
                .success(false)
                .model(model)
                .build();
        } catch (Exception e) {
            String errorMsg = maskSecrets(e.getMessage() != null ? e.getMessage() : "Unknown error");
            log.error("PROVIDER_ERROR:\nstatus=UNKNOWN\nmessage={}", errorMsg, e);
            return AIResponse.builder()
                .error("AI provider error: " + errorMsg)
                .content("AI service is temporarily unavailable: " + errorMsg)
                .success(false)
                .model(model)
                .build();
        }
    }

    /**
     * Build xAI/Groq API request body using the OpenAI-compatible /v1/chat/completions format.
     * A system message enforces pure JSON output so the parser never gets prose.
     */
    private Map<String, Object> buildRequestBody(String prompt) {
        Map<String, Object> requestBody = new HashMap<>();

        requestBody.put("model", model);

        List<Map<String, String>> messages = new ArrayList<>();
        // System message: force strict JSON-only output
        messages.add(Map.of(
            "role", "system",
            "content", "You are a helpful AI assistant. IMPORTANT: Always respond with ONLY valid JSON. No prose, no explanations, no markdown fences. Output the raw JSON object directly."
        ));
        messages.add(Map.of("role", "user", "content", prompt));
        requestBody.put("messages", messages);

        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 1000);

        return requestBody;
    }

    /**
     * Parse xAI API response (OpenAI-compatible format)
     */
    private AIResponse parseXAIResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            
            String content = null;
            
            // Try OpenAI-compatible format (choices[0].message.content)
            if (root.has("choices")) {
                JsonNode choices = root.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    JsonNode firstChoice = choices.get(0);
                    JsonNode message = firstChoice.path("message");
                    content = message.path("content").asText();
                }
            }
            // Fallbacks for other formats
            else if (root.has("response")) {
                content = root.path("response").asText();
            }
            else if (root.has("output")) {
                content = root.path("output").asText();
            }
            else if (root.has("text")) {
                content = root.path("text").asText();
            }
            
            if (content != null && !content.trim().isEmpty()) {
                return AIResponse.builder()
                    .content(content.trim())
                    .success(true)
                    .model(model)
                    .build();
            }
            
            // Log the actual response for debugging
            log.warn("Unexpected xAI response format: {}", responseBody);
            
            String emptyError = "AI service returned an empty response from provider. Please try again.";
            return AIResponse.builder()
                .content(emptyError)
                .error(emptyError)
                .success(false)
                .model(model)
                .build();
            
        } catch (Exception e) {
            log.error("Error parsing xAI response: {}", e.getMessage(), e);
            log.error("Response body was: {}", responseBody);
            String parseError = "Failed to parse AI response: " + e.getMessage();
            return AIResponse.builder()
                .content(parseError)
                .error(parseError)
                .success(false)
                .model(model)
                .build();
        }
    }

    private String extractErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "Empty response body from provider";
        }
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            if (root.has("error")) {
                JsonNode errNode = root.path("error");
                if (errNode.isTextual()) {
                    return maskSecrets(errNode.asText());
                } else if (errNode.has("message")) {
                    return maskSecrets(errNode.path("message").asText());
                }
            } else if (root.has("message")) {
                return maskSecrets(root.path("message").asText());
            }
        } catch (Exception ignored) {
            // Non-JSON response
        }
        String sanitized = maskSecrets(responseBody.trim());
        return sanitized.length() > 200 ? sanitized.substring(0, 200) + "..." : sanitized;
    }

    private String maskSecrets(String text) {
        if (text == null) return "";
        return text.replaceAll("gsk_[a-zA-Z0-9]+", "gsk_***")
                   .replaceAll("xai-[a-zA-Z0-9]+", "xai-***")
                   .replaceAll("Bearer\\s+[a-zA-Z0-9_.-]+", "Bearer ***");
    }
}