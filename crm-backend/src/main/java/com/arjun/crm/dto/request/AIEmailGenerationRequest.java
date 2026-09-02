package com.arjun.crm.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AIEmailGenerationRequest - PHASE 11.2: AI Email Generation Backend
 *
 * Request DTO for AI-powered email content generation.
 * Captures user input for prompt engineering to generate email content.
 * 
 * Validation Rules:
 * - All required fields must be non-blank
 * - Tone must be one of the allowed values
 * - CTA URL must be valid HTTP/HTTPS URL
 * - All text fields have maximum length limits
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIEmailGenerationRequest {

    public enum GenerationMode {
        TEMPLATE,
        PROMPT
    }

    /**
     * Generation mode. TEMPLATE uses structured fields; PROMPT uses a direct prompt.
     * Defaults to TEMPLATE for backward compatibility with existing UI and API clients.
     */
    @Builder.Default
    private GenerationMode mode = GenerationMode.TEMPLATE;

    /**
     * Optional template category/type used in TEMPLATE mode.
     */
    @Size(max = 100, message = "Template type must not exceed 100 characters")
    private String templateType;

    /**
     * Direct prompt content used in PROMPT mode.
     */
    @Size(max = 3000, message = "Prompt must not exceed 3000 characters")
    private String prompt;

    /**
     * Email subject purpose (what the email is about)
     * Examples: "Product launch announcement", "Customer onboarding", "Re-engagement offer"
     */
    @Size(min = 3, max = 200, message = "Purpose must be between 3 and 200 characters")
    private String purpose;

    /**
     * Target audience description
     * Examples: "New leads", "High-value customers", "Inactive users"
     */
    @Size(min = 3, max = 150, message = "Target audience must be between 3 and 150 characters")
    private String targetAudience;

    /**
     * Product or service being promoted/described
     * Examples: "Cloud storage service", "SaaS analytics platform", "Mobile app"
     */
    @Size(min = 3, max = 200, message = "Product/service must be between 3 and 200 characters")
    private String productService;

    /**
     * Email tone/style
     * Examples: "Professional", "Friendly", "Urgent", "Casual", "Formal"
     */
    @Pattern(
        regexp = "^(Professional|Friendly|Urgent|Casual|Formal|Persuasive|Humorous)$",
        message = "Tone must be one of: Professional, Friendly, Urgent, Casual, Formal, Persuasive, Humorous"
    )
    private String tone;

    /**
     * Special offer or incentive (optional)
     * Examples: "20% discount", "Free trial", "Limited time offer"
     */
    @Size(max = 150, message = "Offer must not exceed 150 characters")
    private String offer;

    /**
     * Key points or features to highlight (optional)
     * Examples: "Fast deployment, Secure infrastructure, 24/7 support"
     * Comma-separated or bullet-point format
     */
    @Size(max = 500, message = "Key points must not exceed 500 characters")
    private String keyPoints;

    /**
     * Call-to-action button text
     * Examples: "Get Started", "Learn More", "Claim Offer", "Sign Up"
     */
    @Size(min = 2, max = 50, message = "CTA text must be between 2 and 50 characters")
    private String ctaText;

    /**
     * Call-to-action button URL/link
     * Examples: "https://example.com/signup", "https://example.com/demo"
     * Must be valid HTTP or HTTPS URL
     */
    @Size(min = 10, max = 2048, message = "CTA URL must be between 10 and 2048 characters")
    @Pattern(
        regexp = "^https?://[a-zA-Z0-9\\-._~:/?#\\[\\]@!$&'()*+,;=%]*$",
        message = "CTA URL must be a valid HTTP or HTTPS URL"
    )
    private String ctaUrl;

    /**
     * Optional: Language for email generation
     * Examples: "English", "Spanish", "French", "German", "Chinese"
     * Default: "English"
     */
    @Size(max = 50, message = "Language must not exceed 50 characters")
    private String language;

    /**
     * Optional: Include a company signature (e.g., "The [Company] Team")
     */
    @Size(max = 100, message = "Company name must not exceed 100 characters")
    private String companyName;

    @AssertTrue(message = "TEMPLATE mode requires purpose, targetAudience, productService, and CTA details; PROMPT mode requires a non-empty prompt.")
    public boolean isGenerationRequestValid() {
        GenerationMode effectiveMode = mode != null ? mode : (prompt != null && !prompt.isBlank() ? GenerationMode.PROMPT : GenerationMode.TEMPLATE);

        if (effectiveMode == GenerationMode.PROMPT) {
            return prompt != null && !prompt.isBlank();
        }

        return hasText(purpose)
            && hasText(targetAudience)
            && hasText(productService)
            && hasText(ctaText)
            && hasText(ctaUrl);
    }

    public boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
