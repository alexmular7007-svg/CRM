package com.arjun.crm.service.email.impl;

import com.arjun.crm.ai.dto.response.AIResponse;
import com.arjun.crm.ai.provider.XAIProvider;
import com.arjun.crm.dto.request.AIEmailGenerationRequest;
import com.arjun.crm.dto.response.AIEmailGenerationResponse;
import com.arjun.crm.service.email.AIEmailGenerationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;

import java.net.SocketTimeoutException;
import java.util.regex.Pattern;

/**
 * AIEmailGenerationServiceImpl - PHASE 11.2: AI Email Generation Backend
 *
 * Implementation of AI email generation.
 * Orchestrates XAI provider calls and formats output as HTML + plain text emails.
 * 
 * Comprehensive error handling:
 * - Timeout detection and handling
 * - AI provider failures (rate limit, unavailability)
 * - Malformed responses
 * - Empty responses
 * - JSON parsing errors
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIEmailGenerationServiceImpl implements AIEmailGenerationService {

    private final XAIProvider xaiProvider;
    private final ObjectMapper objectMapper;

    // Constants for error messages
    private static final String AI_TIMEOUT_ERROR = "AI service request timed out. Please try again.";
    private static final String AI_UNAVAILABLE_ERROR = "AI service is currently unavailable. Please try again later.";
    private static final String AI_MALFORMED_RESPONSE_ERROR = "AI service returned invalid data format.";
    private static final String AI_EMPTY_RESPONSE_ERROR = "AI service returned empty response.";
    private static final String GENERAL_ERROR_PREFIX = "Failed to generate email";

    @Override
    public AIEmailGenerationResponse generateEmail(AIEmailGenerationRequest request) {
        try {
            if (request == null) {
                return buildErrorResponse("Email generation request is required.", "unknown");
            }

            AIEmailGenerationRequest.GenerationMode mode = request.getMode() != null
                ? request.getMode()
                : (request.getPrompt() != null && !request.getPrompt().isBlank()
                    ? AIEmailGenerationRequest.GenerationMode.PROMPT
                    : AIEmailGenerationRequest.GenerationMode.TEMPLATE);

            log.info("Generating email in {} mode", mode);

            // Step 1: Construct prompt based on mode
            String prompt = mode == AIEmailGenerationRequest.GenerationMode.PROMPT
                ? constructPromptModePrompt(request)
                : constructEmailGenerationPrompt(request);

            // Step 2: Call AI provider
            AIResponse aiResponse = callAIProviderWithErrorHandling(prompt);

            if (!aiResponse.isSuccess() || aiResponse.getContent() == null) {
                String errorMessage = aiResponse.getError() != null ? aiResponse.getError() : AI_EMPTY_RESPONSE_ERROR;
                log.error("AI generation failed: {}", errorMessage);
                return buildErrorResponse(errorMessage, aiResponse.getModel());
            }

            // Step 3: Validate and parse AI response
            JsonNode parsedContent = parseAIResponseWithValidation(aiResponse.getContent());

            // Step 4: Extract email components with defaults
            String subject = extractSubject(parsedContent);
            String bodyPlainText = extractBody(parsedContent);

            if (subject.isEmpty() || bodyPlainText.isEmpty()) {
                log.error("AI response missing required fields: subject={}, body={}", 
                    !subject.isEmpty(), !bodyPlainText.isEmpty());
                return buildErrorResponse(AI_MALFORMED_RESPONSE_ERROR, aiResponse.getModel());
            }

            // Step 5: Generate HTML version
            String bodyHtml = generateHtmlEmail(bodyPlainText, request);

            String effectiveCtaText = request.getCtaText() != null && !request.getCtaText().isBlank()
                ? request.getCtaText()
                : "Learn More";
            String effectiveCtaUrl = request.getCtaUrl() != null && !request.getCtaUrl().isBlank()
                ? request.getCtaUrl()
                : "https://example.com";

            // Step 6: Build successful response
            return AIEmailGenerationResponse.builder()
                    .subject(subject)
                    .bodyPlainText(bodyPlainText)
                    .bodyHtml(bodyHtml)
                    .ctaText(effectiveCtaText)
                    .ctaUrl(effectiveCtaUrl)
                    .success(true)
                    .model(aiResponse.getModel())
                    .generatedAt(System.currentTimeMillis())
                    .build();

        } catch (Exception e) {
            log.error("Unexpected error generating email: {}", e.getMessage(), e);
            return buildErrorResponse(GENERAL_ERROR_PREFIX + ": " + e.getMessage(), null);
        }
    }

    @Override
    public AIEmailGenerationResponse regenerateEmail(AIEmailGenerationRequest request) {
        log.info("Regenerating email with same parameters");
        // Same implementation as generateEmail (calls AI again for alternative version)
        return generateEmail(request);
    }

    /**
     * Call AI provider with comprehensive error handling for timeout and failures
     */
    private AIResponse callAIProviderWithErrorHandling(String prompt) {
        try {
            return xaiProvider.generateResponseNoCache(prompt);
        } catch (ResourceAccessException e) {
            log.error("AI service connection error: {}", e.getMessage());
            // Check for timeout in the cause chain
            Throwable cause = e.getCause();
            if (cause instanceof SocketTimeoutException) {
                return AIResponse.builder()
                        .success(false)
                        .error(AI_TIMEOUT_ERROR)
                        .model("unknown")
                        .build();
            }
            return AIResponse.builder()
                    .success(false)
                    .error(AI_UNAVAILABLE_ERROR)
                    .model("unknown")
                    .build();
        } catch (RestClientException e) {
            log.error("AI provider error (rate limit/unavailable): {}", e.getMessage());
            String errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.contains("429")) {
                errorMsg = "AI service rate limit exceeded. Please try again in a few moments.";
            } else if (errorMsg != null && (errorMsg.contains("503") || errorMsg.contains("502"))) {
                errorMsg = AI_UNAVAILABLE_ERROR;
            } else if (errorMsg != null && (errorMsg.contains("timeout") || errorMsg.contains("Timeout"))) {
                errorMsg = AI_TIMEOUT_ERROR;
            }
            return AIResponse.builder()
                    .success(false)
                    .error(errorMsg != null ? errorMsg : AI_UNAVAILABLE_ERROR)
                    .model("unknown")
                    .build();
        } catch (Exception e) {
            log.error("Unexpected error calling AI provider: {}", e.getMessage(), e);
            return AIResponse.builder()
                    .success(false)
                    .error("AI service error: " + e.getMessage())
                    .model("unknown")
                    .build();
        }
    }

    /**
     * Parse and validate AI response with comprehensive error handling
     */
    private JsonNode parseAIResponseWithValidation(String responseContent) {
        if (responseContent == null || responseContent.trim().isEmpty()) {
            log.warn("AI response is empty");
            return objectMapper.createObjectNode();
        }

        try {
            // Try to parse as JSON
            JsonNode parsed = objectMapper.readTree(responseContent);
            
            // Validate that parsed content is an object (not array or primitive)
            if (!parsed.isObject()) {
                log.warn("AI response is not a JSON object, attempting extraction");
                // If response is wrapped in an array or has extra structure, try to extract it
                return extractJsonObjectFromResponse(parsed);
            }
            
            return parsed;
        } catch (com.fasterxml.jackson.core.JsonParseException e) {
            log.warn("Failed to parse AI response as JSON: {}", e.getMessage());
            // Try to extract JSON from response (might be wrapped in text)
            return extractJsonFromText(responseContent);
        } catch (Exception e) {
            log.warn("Failed to parse AI response: {}", e.getMessage());
            // Fallback: wrap response as plain text
            try {
                return objectMapper.createObjectNode()
                        .put("subject", "Generated Email")
                        .put("body", responseContent);
            } catch (Exception ex) {
                log.error("Failed to create fallback response: {}", ex.getMessage());
                return objectMapper.createObjectNode();
            }
        }
    }

    /**
     * Extract JSON object from array or nested structure
     */
    private JsonNode extractJsonObjectFromResponse(JsonNode node) {
        if (node.isArray() && node.size() > 0) {
            JsonNode first = node.get(0);
            if (first.isObject()) {
                return first;
            }
        }
        return node.isObject() ? node : objectMapper.createObjectNode();
    }

    /**
     * Extract JSON from text response (might have markdown or extra formatting)
     */
    private JsonNode extractJsonFromText(String responseContent) {
        try {
            // Look for JSON block: {...}
            Pattern jsonPattern = Pattern.compile("\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}");
            java.util.regex.Matcher matcher = jsonPattern.matcher(responseContent);
            
            if (matcher.find()) {
                String jsonStr = matcher.group();
                return objectMapper.readTree(jsonStr);
            }
        } catch (Exception e) {
            log.debug("Failed to extract JSON from text: {}", e.getMessage());
        }
        
        // Fallback: wrap entire response as body
        try {
            return objectMapper.createObjectNode()
                    .put("subject", "Generated Email")
                    .put("body", responseContent);
        } catch (Exception e) {
            log.error("Failed to create wrapper: {}", e.getMessage());
            return objectMapper.createObjectNode();
        }
    }

    /**
     * Extract subject from parsed JSON with validation
     */
    private String extractSubject(JsonNode parsedContent) {
        if (parsedContent == null) {
            return "";
        }
        
        String subject = parsedContent.path("subject").asText("");
        
        // Validate subject length and content
        if (subject.length() > 255) {
            log.warn("Subject exceeds 255 chars, truncating");
            subject = subject.substring(0, 255);
        }
        
        return subject.trim();
    }

    /**
     * Extract body from parsed JSON with validation
     */
    private String extractBody(JsonNode parsedContent) {
        if (parsedContent == null) {
            return "";
        }
        
        String body = parsedContent.path("body").asText("");
        
        // Validate body content
        if (body.length() > 5000) {
            log.warn("Body exceeds 5000 chars, truncating");
            body = body.substring(0, 5000);
        }
        
        return body.trim();
    }

    /**
     * Build error response with consistent format
     */
    private AIEmailGenerationResponse buildErrorResponse(String errorMessage, String model) {
        return AIEmailGenerationResponse.builder()
                .success(false)
                .error(errorMessage)
                .model(model != null ? model : "unknown")
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    /**
     * Construct a prompt for PROMPT mode using natural-language instruction
     */
    private String constructPromptModePrompt(AIEmailGenerationRequest request) {
        String prompt = request.getPrompt() != null ? request.getPrompt().trim() : "";
        String tone = request.getTone() != null && !request.getTone().isBlank() ? request.getTone() : "Professional";
        String language = request.getLanguage() != null && !request.getLanguage().isBlank() ? request.getLanguage() : "English";
        String companySignature = request.getCompanyName() != null && !request.getCompanyName().isBlank()
            ? "COMPANY: " + request.getCompanyName() + "\n"
            : "";
        String ctaText = request.getCtaText() != null && !request.getCtaText().isBlank() ? request.getCtaText() : "Learn More";
        String ctaUrl = request.getCtaUrl() != null && !request.getCtaUrl().isBlank() ? request.getCtaUrl() : "https://example.com";

        return String.format("""
            Generate a professional email marketing message in %s with a %s tone based on the following instruction:
            
            USER INSTRUCTION:
            %s
            
            %sCTA TEXT: %s
            CTA URL: %s
            
            REQUIREMENTS:
            - Generate a compelling email subject line (max 60 characters)
            - Write the email body in a clear, engaging manner (150-250 words)
            - Include the company signature if provided
            - End with a strong call-to-action using the CTA text
            - DO NOT modify the CTA URL
            - Make it persuasive but not pushy
            - Include spacing and line breaks for readability
            - Avoid HTML, JavaScript, or unsupported markup
            - Use plain text formatting only
            
            RESPONSE FORMAT (STRICT JSON):
            {
              "subject": "Email subject line here",
              "body": "Email body text here with natural line breaks for readability"
            }
            
            IMPORTANT:
            - Respond ONLY with the JSON object above. No additional text or explanation.
            - Preserve the exact CTA URL provided: %s
            - Use %s for the entire email
            """,
            language,
            tone,
            prompt,
            companySignature,
            ctaText,
            ctaUrl,
            ctaUrl,
            language
        );
    }

    /**
     * Construct a detailed prompt for AI to generate professional email content
     * Supports: purpose, audience, product, tone, offer, keyPoints, language
     */
    private String constructEmailGenerationPrompt(AIEmailGenerationRequest request) {
        String offerText = request.getOffer() != null && !request.getOffer().isEmpty() 
            ? "SPECIAL OFFER: " + request.getOffer() + "\n" 
            : "";

        String keyPointsText = request.getKeyPoints() != null && !request.getKeyPoints().isEmpty()
            ? "KEY POINTS/FEATURES:\n" + request.getKeyPoints() + "\n"
            : "";

        String companySignature = request.getCompanyName() != null && !request.getCompanyName().isEmpty()
            ? "COMPANY: " + request.getCompanyName() + "\n"
            : "";

        String language = request.getLanguage() != null && !request.getLanguage().isEmpty()
            ? request.getLanguage()
            : "English";

        String prompt = String.format("""
            Generate a professional email marketing message in %s with the following requirements:
            
            PURPOSE: %s
            TARGET AUDIENCE: %s
            PRODUCT/SERVICE: %s
            TONE: %s
            %s%s%sCTA TEXT: %s
            CTA URL: %s
            
            REQUIREMENTS:
            - Generate a compelling email subject line (max 60 characters)
            - Write the email body in a clear, professional manner (150-250 words)
            - Include the special offer if provided
            - Highlight the key points/features if provided
            - Include company signature if provided
            - End with a strong call-to-action using the exact CTA text provided
            - DO NOT modify the CTA URL
            - Make it persuasive but not pushy
            - Include spacing and line breaks for readability
            - Avoid HTML, JavaScript, or unsupported markup
            - Use plain text formatting only
            
            RESPONSE FORMAT (STRICT JSON):
            {
              "subject": "Email subject line here",
              "body": "Email body text here with natural line breaks for readability"
            }
            
            IMPORTANT: 
            - Respond ONLY with the JSON object above. No additional text or explanation.
            - Preserve the exact CTA URL provided: %s
            - Use %s for the entire email
            """,
            language,
            request.getPurpose(),
            request.getTargetAudience(),
            request.getProductService(),
            request.getTone(),
            offerText,
            keyPointsText,
            companySignature,
            request.getCtaText(),
            request.getCtaUrl(),
            request.getCtaUrl(),
            language
        );

        return prompt;
    }

    /**
     * Generate HTML email from plain text body
     * Adds professional styling and CTA button
     */
    private String generateHtmlEmail(String bodyText, AIEmailGenerationRequest request) {
        // Escape HTML special characters
        String safeBody = escapeHtml(bodyText);
        
        // Convert line breaks to <br> tags
        String htmlBody = safeBody.replace("\n\n", "</p><p>").replace("\n", "<br>");

        String effectiveCtaUrl = request.getCtaUrl() != null && !request.getCtaUrl().isBlank()
            ? request.getCtaUrl()
            : "https://example.com";
        String effectiveCtaText = request.getCtaText() != null && !request.getCtaText().isBlank()
            ? request.getCtaText()
            : "Learn More";

        // Build CTA button HTML
        String ctaButton = String.format(
            "<a href=\"%s\" style=\"background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 20px;\">%s</a>",
            escapeHtml(effectiveCtaUrl),
            escapeHtml(effectiveCtaText)
        );

        // Build complete HTML email
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { margin-bottom: 20px; }
                    .content { margin: 20px 0; }
                    .content p { margin: 15px 0; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    .cta-button { background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <p>%s</p>
                        %s
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            htmlBody,
            ctaButton
        );
    }

    /**
     * Escape HTML special characters for safety (XSS prevention)
     */
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}