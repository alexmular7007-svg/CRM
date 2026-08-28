package com.arjun.crm.service.email;

import com.arjun.crm.dto.request.AIEmailGenerationRequest;
import com.arjun.crm.dto.response.AIEmailGenerationResponse;

/**
 * AIEmailGenerationService - PHASE 10: AI Email Generation
 *
 * Service for AI-powered email content generation.
 * Generates professional email subject, body (both HTML and plain text), and CTA.
 *
 * Architecture:
 * - Frontend sends form data to backend (no API keys exposed)
 * - Backend constructs prompt and calls AI provider (XAI/Groq)
 * - AI returns raw JSON response with generated content
 * - Backend parses and formats as HTML + plain text email
 * - Frontend displays for preview, regeneration, and customization
 *
 * Security:
 * - API keys kept in backend (.env, not visible to frontend)
 * - Input validation on all request fields
 * - Output sanitization for HTML content
 * - Error handling without exposing internal API details
 */
public interface AIEmailGenerationService {

    /**
     * Generate email content from AI based on user inputs.
     *
     * Flow:
     * 1. Validate request inputs
     * 2. Construct detailed prompt with all parameters
     * 3. Call XAIProvider.generateResponse()
     * 4. Parse AI response (expected JSON format)
     * 5. Extract: subject, body, offer elements
     * 6. Generate HTML version with styling
     * 7. Generate plain-text fallback
     * 8. Return both formats + metadata
     *
     * @param request User inputs for email generation
     * @return Generated email content (subject, HTML body, plain text, CTA, etc.)
     */
    AIEmailGenerationResponse generateEmail(AIEmailGenerationRequest request);

    /**
     * Regenerate email with same inputs (for retry/refresh)
     * Calls AI again with same parameters, useful for getting alternative versions
     */
    AIEmailGenerationResponse regenerateEmail(AIEmailGenerationRequest request);
}
