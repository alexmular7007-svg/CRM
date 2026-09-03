package com.arjun.crm.ai.provider;

import com.arjun.crm.ai.dto.response.AIResponse;
import com.arjun.crm.exception.AIServiceException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.annotation.PostConstruct;
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
 * xAI / Groq Provider for AI-powered features
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

    @PostConstruct
    public void logConfiguration() {
        boolean configured = apiKey != null && !apiKey.isBlank();
        String keyPrefix = configured ? (apiKey.length() >= 4 ? apiKey.substring(0, 4) + "****" : "****") : "NONE";
        String provider = configured && apiKey.startsWith("gsk_") ? "Groq" : (configured && apiKey.startsWith("xai-") ? "xAI" : "unknown");
        log.info("AI_PROVIDER_CONFIG:\nbaseUrl={}\nmodel={}\napiKeyConfigured={}\napiKeyProvider={}\nkeyPrefix={}",
                resolveEffectiveBaseUrl(), resolveEffectiveModel(), configured, provider, keyPrefix);
    }

    public String getEffectiveBaseUrl() { return resolveEffectiveBaseUrl(); }
    public String getEffectiveModel() { return resolveEffectiveModel(); }
    public String getConfiguredBaseUrl() { return baseUrl; }
    public String getConfiguredModel() { return model; }
    public boolean isApiKeyConfigured() { return apiKey != null && !apiKey.isBlank(); }
    public String getApiKeyProvider() {
        if (apiKey == null || apiKey.isBlank()) return "none";
        if (apiKey.startsWith("gsk_")) return "Groq";
        if (apiKey.startsWith("xai-")) return "xAI";
        return "unknown";
    }
    public String getApiKeyPrefix() {
        if (apiKey == null || apiKey.isBlank()) return "NONE";
        return apiKey.length() >= 4 ? apiKey.substring(0, 4) + "****" : "****";
    }

    private String resolveEffectiveBaseUrl() {
        if (apiKey != null && apiKey.startsWith("gsk_") && baseUrl != null && baseUrl.contains("api.x.ai")) {
            log.warn("DETECTED CONFIGURATION MISMATCH: Groq API key (gsk_...) configured with x.ai baseUrl ({}). Auto-routing to Groq endpoint: https://api.groq.com/openai/v1/chat/completions", baseUrl);
            return "https://api.groq.com/openai/v1/chat/completions";
        }
        return baseUrl;
    }

    private String resolveEffectiveModel() {
        if (apiKey != null && apiKey.startsWith("gsk_") && (model == null || model.contains("grok"))) {
            log.warn("DETECTED CONFIGURATION MISMATCH: Groq API key (gsk_...) configured with x.ai model ({}). Auto-routing to Groq model: openai/gpt-oss-120b", model);
            return "openai/gpt-oss-120b";
        }
        return model;
    }

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
        String effectiveUrl = resolveEffectiveBaseUrl();
        String effectiveModel = resolveEffectiveModel();
        try {
            log.info("PROVIDER_REQUEST:\nbaseUrl={}\nmodel={}", effectiveUrl, effectiveModel);
            
            Map<String, Object> requestBody = buildRequestBody(prompt, effectiveModel);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                effectiveUrl,
                HttpMethod.POST,
                entity,
                String.class
            );
            
            log.info("PROVIDER_RESPONSE_STATUS={}", response.getStatusCode().value());

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return parseXAIResponse(response.getBody(), effectiveModel);
            } else {
                String errorMsg = "Failed to get response from AI provider: " + response.getStatusCode();
                log.error("PROVIDER_ERROR:\nstatus={}\nmessage={}", response.getStatusCode(), errorMsg);
                return AIResponse.builder()
                    .error(errorMsg)
                    .content(errorMsg)
                    .success(false)
                    .model(effectiveModel)
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
                .model(effectiveModel)
                .build();
        } catch (Exception e) {
            String errorMsg = maskSecrets(e.getMessage() != null ? e.getMessage() : "Unknown error");
            log.error("PROVIDER_ERROR:\nstatus=UNKNOWN\nmessage={}", errorMsg, e);
            return AIResponse.builder()
                .error("AI provider error: " + errorMsg)
                .content("AI service is temporarily unavailable: " + errorMsg)
                .success(false)
                .model(effectiveModel)
                .build();
        }
    }

    /**
     * Build xAI/Groq API request body using the OpenAI-compatible /v1/chat/completions format.
     * A system message enforces pure JSON output so the parser never gets prose.
     */
    private Map<String, Object> buildRequestBody(String prompt, String effectiveModel) {
        Map<String, Object> requestBody = new HashMap<>();

        requestBody.put("model", effectiveModel);

        List<Map<String, String>> messages = new ArrayList<>();
        // System message: force strict JSON-only output
        messages.add(Map.of(
            "role", "system",
            "content", "You are a helpful AI assistant. IMPORTANT: Always respond with ONLY valid JSON. No prose, no explanations, no markdown fences. Output the raw JSON object directly."
        ));
        messages.add(Map.of("role", "user", "content", prompt));
        requestBody.put("messages", messages);

        requestBody.put("temperature", 0.7);
        // Sufficient tokens for reasoning + JSON output
        requestBody.put("max_tokens", 4096);

        // For Groq reasoning models (e.g. gpt-oss-120b), request parsed reasoning so content is not empty
        if (effectiveModel != null && (effectiveModel.contains("oss") || effectiveModel.contains("reasoning"))) {
            requestBody.put("reasoning_format", "parsed");
        }

        return requestBody;
    }

    /**
     * Parse xAI API response (OpenAI-compatible format)
     */
    private AIResponse parseXAIResponse(String responseBody, String effectiveModel) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            
            int choicesCount = 0;
            boolean messagePresent = false;
            boolean contentPresent = false;
            int contentLength = 0;
            String content = null;
            
            // Try OpenAI-compatible format (choices[0].message.content)
            if (root.has("choices")) {
                JsonNode choices = root.path("choices");
                if (choices.isArray()) {
                    choicesCount = choices.size();
                    if (choicesCount > 0) {
                        JsonNode firstChoice = choices.get(0);
                        JsonNode message = firstChoice.path("message");
                        messagePresent = !message.isMissingNode() && !message.isNull();
                        if (messagePresent) {
                            if (message.has("content") && !message.path("content").isNull()) {
                                String raw = message.path("content").asText();
                                if (!raw.isBlank()) {
                                    content = raw;
                                }
                            }
                            // Fallback: Check reasoning / reasoning_content fields if content is blank
                            if ((content == null || content.isBlank())) {
                                if (message.has("reasoning") && !message.path("reasoning").isNull()) {
                                    String rawReasoning = message.path("reasoning").asText();
                                    if (!rawReasoning.isBlank()) {
                                        log.info("PROVIDER_FALLBACK_FIELD=message.reasoning");
                                        content = rawReasoning;
                                    }
                                } else if (message.has("reasoning_content") && !message.path("reasoning_content").isNull()) {
                                    String rawReasoning = message.path("reasoning_content").asText();
                                    if (!rawReasoning.isBlank()) {
                                        log.info("PROVIDER_FALLBACK_FIELD=message.reasoning_content");
                                        content = rawReasoning;
                                    }
                                }
                            }
                        }
                        if ((content == null || content.isBlank()) && firstChoice.has("text") && !firstChoice.path("text").isNull()) {
                            String rawText = firstChoice.path("text").asText();
                            if (!rawText.isBlank()) {
                                log.info("PROVIDER_FALLBACK_FIELD=choices[0].text");
                                content = rawText;
                            }
                        }
                    }
                }
            }
            // Fallbacks for other formats
            if (content == null || content.isBlank()) {
                if (root.has("response") && !root.path("response").isNull()) {
                    content = root.path("response").asText();
                    log.info("PROVIDER_FALLBACK_FIELD=root.response");
                } else if (root.has("output") && !root.path("output").isNull()) {
                    content = root.path("output").asText();
                    log.info("PROVIDER_FALLBACK_FIELD=root.output");
                } else if (root.has("text") && !root.path("text").isNull()) {
                    content = root.path("text").asText();
                    log.info("PROVIDER_FALLBACK_FIELD=root.text");
                }
            }

            if (content != null && !content.isBlank()) {
                contentPresent = true;
                contentLength = content.length();
            }

            // Safe diagnostics logging (strictly non-sensitive)
            log.info("PROVIDER_CHOICES_COUNT={}", choicesCount);
            log.info("PROVIDER_MESSAGE_PRESENT={}", messagePresent);
            log.info("PROVIDER_CONTENT_PRESENT={}", contentPresent);
            log.info("PROVIDER_CONTENT_LENGTH={}", contentLength);

            if (content != null && !content.trim().isEmpty()) {
                String cleaned = cleanContent(content);
                return AIResponse.builder()
                    .content(cleaned)
                    .success(true)
                    .model(effectiveModel)
                    .build();
            }
            
            // Log the actual response for debugging
            log.warn("Unexpected AI response format or empty content: {}", maskSecrets(responseBody));
            
            String emptyError = "AI service returned an empty response from provider. Please try again.";
            return AIResponse.builder()
                .content(emptyError)
                .error(emptyError)
                .success(false)
                .model(effectiveModel)
                .build();
            
        } catch (Exception e) {
            log.error("Error parsing AI response: {}", e.getMessage(), e);
            log.error("Response body was: {}", maskSecrets(responseBody));
            String parseError = "Failed to parse AI response: " + e.getMessage();
            return AIResponse.builder()
                .content(parseError)
                .error(parseError)
                .success(false)
                .model(effectiveModel)
                .build();
        }
    }

    /**
     * Clean markdown code fences (```json ... ```) and raw <think>...</think> tags if present
     */
    private String cleanContent(String raw) {
        if (raw == null) return null;
        String cleaned = raw.trim();
        cleaned = cleaned.replaceAll("(?s)<think>.*?</think>", "").trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:json)?\\s*", "");
            cleaned = cleaned.replaceFirst("\\s*```\\s*$", "");
        }
        return cleaned.trim();
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