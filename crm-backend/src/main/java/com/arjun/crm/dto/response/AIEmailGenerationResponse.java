package com.arjun.crm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AIEmailGenerationResponse - PHASE 10: AI Email Generation
 *
 * Response DTO containing generated email content.
 * Includes subject, HTML body, plain-text fallback, and CTA.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIEmailGenerationResponse {

    /**
     * Generated email subject line
     */
    private String subject;

    /**
     * Generated email body (plain text)
     * Can be used as fallback or for basic text emails
     */
    private String bodyPlainText;

    /**
     * Generated email body (HTML)
     * Professionally formatted with HTML tags for rendering
     */
    private String bodyHtml;

    /**
     * Call-to-action button text (from request or generated)
     */
    private String ctaText;

    /**
     * Call-to-action URL (from request)
     */
    private String ctaUrl;

    /**
     * Whether generation was successful
     */
    private boolean success;

    /**
     * Error message (if generation failed)
     */
    private String error;

    /**
     * AI model used for generation
     */
    private String model;

    /**
     * Generation timestamp for tracking
     */
    private Long generatedAt;

}
