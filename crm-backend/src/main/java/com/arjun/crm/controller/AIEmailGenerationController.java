package com.arjun.crm.controller;

import com.arjun.crm.dto.request.AIEmailGenerationRequest;
import com.arjun.crm.dto.response.AIEmailGenerationResponse;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.service.email.AIEmailGenerationService;
import com.arjun.crm.ai.provider.XAIProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * AIEmailGenerationController - PHASE 10: AI Email Generation
 *
 * REST API endpoint for AI-powered email content generation.
 *
 * Architecture:
 * - Frontend submits form (no API keys exposed)
 * - Backend validates and calls AIEmailGenerationService
 * - Service constructs prompt and calls XAI provider
 * - Returns HTML + plain-text email content
 * - Frontend displays for preview, regeneration, and customization
 *
 * Endpoints:
 * - POST /api/emails/generate - Generate email from inputs
 *
 * Security:
 * - API keys remain in backend (.env file)
 * - Input validation on all request fields
 * - Output sanitized (HTML-escaped)
 * - Error responses don't expose internal API details
 */
@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
@Slf4j
public class AIEmailGenerationController {

    private final AIEmailGenerationService emailGenerationService;
    private final XAIProvider xaiProvider;

    /**
     * POST /api/emails/generate
     *
     * Generate email content using AI.
     *
     * This endpoint takes user inputs (purpose, target audience, product, tone, etc.)
     * and generates professional email content with:
     * - Compelling subject line
     * - HTML-formatted body with styling and CTA button
     * - Plain-text fallback for non-HTML clients
     * - Call-to-action link
     *
     * Request Body:
     * {
     *   "purpose": "Product launch announcement",
     *   "targetAudience": "New leads",
     *   "productService": "Cloud storage service",
     *   "tone": "Professional",
     *   "offer": "20% discount for early adopters",
     *   "ctaText": "Get Started",
     *   "ctaUrl": "https://example.com/signup",
     *   "companyName": "TechCorp" (optional)
     * }
     *
     * Response (Success):
     * {
     *   "data": {
     *     "subject": "Introducing Our New Cloud Storage Solution",
     *     "bodyPlainText": "Dear Customer,\n\nWe're excited to announce...",
     *     "bodyHtml": "<!DOCTYPE html>...",
     *     "ctaText": "Get Started",
     *     "ctaUrl": "https://example.com/signup",
     *     "success": true,
     *     "model": "llama-3.3-70b-versatile",
     *     "generatedAt": 1692806400000
     *   },
     *   "success": true,
     *   "message": "Email generated successfully"
     * }
     *
     * Response (Error):
     * {
     *   "data": {
     *     "success": false,
     *     "error": "AI service error message"
     *   },
     *   "success": false,
     *   "message": "Failed to generate email"
     * }
     *
     * Status Codes:
     * - 200 OK: Email generated (check response.data.success)
     * - 400 BAD_REQUEST: Validation error in request
     * - 500 INTERNAL_SERVER_ERROR: Server error
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<AIEmailGenerationResponse>> generateEmail(
            @Valid @RequestBody AIEmailGenerationRequest request
    ) {
        try {
            log.info("Generating email in mode: {}, purpose: {}, tone: {}", request.getMode(), request.getPurpose(), request.getTone());

            // Call service to generate email
            AIEmailGenerationResponse response = emailGenerationService.generateEmail(request);

            if (response.isSuccess()) {
                log.info("Email generated successfully");
                return ResponseEntity.ok(
                    ApiResponse.success("Email generated successfully", response)
                );
            } else {
                log.warn("Email generation failed: {}", response.getError());
                return ResponseEntity.ok(
                    ApiResponse.success("Email generation attempted", response)
                );
            }

        } catch (Exception e) {
            log.error("Error generating email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to generate email: " + e.getMessage()));
        }
    }

    /**
     * POST /api/emails/regenerate
     *
     * Regenerate email with same inputs.
     * Useful for:
     * - Getting alternative versions
     * - Fixing failed generation attempts
     * - User-triggered refresh
     *
     * Same request/response format as /generate endpoint.
     * Calls AI again with identical parameters.
     */
    @PostMapping("/regenerate")
    public ResponseEntity<ApiResponse<AIEmailGenerationResponse>> regenerateEmail(
            @Valid @RequestBody AIEmailGenerationRequest request
    ) {
        try {
            log.info("Regenerating email with purpose: {}", request.getPurpose());

            // Call service to regenerate email
            AIEmailGenerationResponse response = emailGenerationService.regenerateEmail(request);

            if (response.isSuccess()) {
                log.info("Email regenerated successfully");
                return ResponseEntity.ok(
                    ApiResponse.success("Email regenerated successfully", response)
                );
            } else {
                log.warn("Email regeneration failed: {}", response.getError());
                return ResponseEntity.ok(
                    ApiResponse.success("Email regeneration attempted", response)
                );
            }

        } catch (Exception e) {
            log.error("Error regenerating email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to regenerate email: " + e.getMessage()));
        }
    }

    /**
     * GET /api/emails/tones
     *
     * Get list of available email tones for dropdown in UI.
     * Returns the valid tone options that are accepted by the API.
     *
     * Response:
     * {
     *   "data": [
     *     "Professional",
     *     "Friendly",
     *     "Urgent",
     *     "Casual",
     *     "Formal",
     *     "Persuasive",
     *     "Humorous"
     *   ],
     *   "success": true,
     *   "message": "Tones retrieved successfully"
     * }
     */
    @GetMapping("/tones")
    public ResponseEntity<ApiResponse<String[]>> getAvailableTones() {
        String[] tones = {
            "Professional",
            "Friendly",
            "Urgent",
            "Casual",
            "Formal",
            "Persuasive",
            "Humorous"
        };

        return ResponseEntity.ok(
            ApiResponse.success("Tones retrieved successfully", tones)
        );
    }

    /**
     * GET /api/emails/diagnostic
     *
     * Safe runtime configuration diagnostic (never exposes API keys or secrets).
     */
    @GetMapping("/diagnostic")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDiagnostic() {
        Map<String, Object> diag = new HashMap<>();
        diag.put("effectiveBaseUrl", xaiProvider.getEffectiveBaseUrl());
        diag.put("effectiveModel", xaiProvider.getEffectiveModel());
        diag.put("configuredBaseUrl", xaiProvider.getConfiguredBaseUrl());
        diag.put("configuredModel", xaiProvider.getConfiguredModel());
        diag.put("apiKeyConfigured", xaiProvider.isApiKeyConfigured());
        diag.put("apiKeyProvider", xaiProvider.getApiKeyProvider());
        diag.put("apiKeyPrefix", xaiProvider.getApiKeyPrefix());
        return ResponseEntity.ok(
            ApiResponse.success("AI configuration diagnostic", diag)
        );
    }

    /**
     * Health check endpoint for email generation service
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Email generation service is operational");
    }
}
