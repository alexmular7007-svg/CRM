package com.arjun.crm.service.email;

import com.arjun.crm.ai.dto.response.AIResponse;
import com.arjun.crm.ai.provider.XAIProvider;
import com.arjun.crm.dto.request.AIEmailGenerationRequest;
import com.arjun.crm.dto.response.AIEmailGenerationResponse;
import com.arjun.crm.service.email.impl.AIEmailGenerationServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AIEmailGenerationService
 * Tests: valid generation, validation, error handling, malformed responses
 */
@DisplayName("AI Email Generation Service Tests")
class AIEmailGenerationServiceTest {

    private AIEmailGenerationService service;

    @Mock
    private XAIProvider xaiProvider;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        objectMapper = new ObjectMapper();
        service = new AIEmailGenerationServiceImpl(xaiProvider, objectMapper);
    }

    @Test
    @DisplayName("Should generate valid email with all required fields")
    void testGenerateEmailSuccess() {
        // Arrange
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Product launch")
                .targetAudience("New leads")
                .productService("Cloud CRM")
                .tone("Professional")
                .offer("20% discount")
                .keyPoints("Fast, Secure, Scalable")
                .ctaText("Get Started")
                .ctaUrl("https://example.com/signup")
                .companyName("TechCorp")
                .language("English")
                .build();

        String mockAiResponse = """
            {
              "subject": "Introducing TechCorp Cloud CRM - 20% Launch Discount",
              "body": "Dear Lead,\\n\\nWe are excited to introduce TechCorp Cloud CRM..."
            }
            """;

        when(xaiProvider.generateResponseNoCache(anyString()))
                .thenReturn(AIResponse.builder()
                        .content(mockAiResponse)
                        .success(true)
                        .model("llama-3.3-70b-versatile")
                        .build());

        // Act
        AIEmailGenerationResponse response = service.generateEmail(request);

        // Assert
        assertTrue(response.isSuccess());
        assertNotNull(response.getSubject());
        assertNotNull(response.getBodyPlainText());
        assertNotNull(response.getBodyHtml());
        assertEquals("Get Started", response.getCtaText());
        assertEquals("https://example.com/signup", response.getCtaUrl());
        assertEquals("llama-3.3-70b-versatile", response.getModel());
        assertNotNull(response.getGeneratedAt());
    }

    @Test
    @DisplayName("Should handle AI provider failure gracefully")
    void testGenerateEmailProviderFailure() {
        // Arrange
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Test")
                .targetAudience("Test audience")
                .productService("Test product")
                .tone("Professional")
                .ctaText("Test CTA")
                .ctaUrl("https://example.com")
                .build();

        when(xaiProvider.generateResponseNoCache(anyString()))
                .thenReturn(AIResponse.builder()
                        .success(false)
                        .error("AI service unavailable")
                        .model("unknown")
                        .build());

        // Act
        AIEmailGenerationResponse response = service.generateEmail(request);

        // Assert
        assertFalse(response.isSuccess());
        assertNotNull(response.getError());
        assertTrue(response.getError().contains("AI service unavailable"));
    }

    @Test
    @DisplayName("Should handle empty AI response")
    void testGenerateEmailEmptyResponse() {
        // Arrange
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Test")
                .targetAudience("Test audience")
                .productService("Test product")
                .tone("Professional")
                .ctaText("Test CTA")
                .ctaUrl("https://example.com")
                .build();

        when(xaiProvider.generateResponseNoCache(anyString()))
                .thenReturn(AIResponse.builder()
                        .content("")
                        .success(false)
                        .model("llama-3.3-70b-versatile")
                        .build());

        // Act
        AIEmailGenerationResponse response = service.generateEmail(request);

        // Assert
        assertFalse(response.isSuccess());
        assertNotNull(response.getError());
    }

    @Test
    @DisplayName("Should handle malformed JSON response")
    void testGenerateEmailMalformedResponse() {
        // Arrange
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Test")
                .targetAudience("Test audience")
                .productService("Test product")
                .tone("Professional")
                .ctaText("Test CTA")
                .ctaUrl("https://example.com")
                .build();

        String malformedResponse = "This is not JSON { broken";

        when(xaiProvider.generateResponseNoCache(anyString()))
                .thenReturn(AIResponse.builder()
                        .content(malformedResponse)
                        .success(true)
                        .model("llama-3.3-70b-versatile")
                        .build());

        // Act
        AIEmailGenerationResponse response = service.generateEmail(request);

        // Assert
        // Should fallback gracefully
        assertNotNull(response);
        assertNotNull(response.getBodyHtml());
        assertNotNull(response.getBodyPlainText());
    }

    @Test
    @DisplayName("Should handle missing subject field from AI response")
    void testGenerateEmailMissingSubject() {
        // Arrange
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Test")
                .targetAudience("Test audience")
                .productService("Test product")
                .tone("Professional")
                .ctaText("Test CTA")
                .ctaUrl("https://example.com")
                .build();

        String responseWithoutSubject = "{\"body\": \"Email body\"}";

        when(xaiProvider.generateResponseNoCache(anyString()))
                .thenReturn(AIResponse.builder()
                        .content(responseWithoutSubject)
                        .success(true)
                        .model("llama-3.3-70b-versatile")
                        .build());

        // Act
        AIEmailGenerationResponse response = service.generateEmail(request);

        // Assert
        // Should fail validation for missing required field
        assertFalse(response.isSuccess());
    }

    @Test
    @DisplayName("Should preserve CTA URL from request")
    void testCTAUrlPreservation() {
        // Arrange
        String expectedCtaUrl = "https://myapp.com/special-offer-xyz123";
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Special offer")
                .targetAudience("VIP customers")
                .productService("Premium plan")
                .tone("Professional")
                .ctaText("Claim Offer")
                .ctaUrl(expectedCtaUrl)
                .build();

        String mockAiResponse = """
            {
              "subject": "Exclusive Offer for VIP Members",
              "body": "We have a special offer just for you..."
            }
            """;

        when(xaiProvider.generateResponseNoCache(anyString()))
                .thenReturn(AIResponse.builder()
                        .content(mockAiResponse)
                        .success(true)
                        .model("llama-3.3-70b-versatile")
                        .build());

        // Act
        AIEmailGenerationResponse response = service.generateEmail(request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals(expectedCtaUrl, response.getCtaUrl());
        // Verify URL is preserved in HTML (not modified by AI)
        assertTrue(response.getBodyHtml().contains(expectedCtaUrl));
    }

    @Test
    @DisplayName("Should generate HTML with safe inline styles")
    void testHTMLSafety() {
        // Arrange
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Test")
                .targetAudience("Test audience")
                .productService("Test product")
                .tone("Professional")
                .ctaText("Click Me")
                .ctaUrl("https://example.com")
                .build();

        String mockAiResponse = """
            {
              "subject": "Test Email",
              "body": "This is test content"
            }
            """;

        when(xaiProvider.generateResponseNoCache(anyString()))
                .thenReturn(AIResponse.builder()
                        .content(mockAiResponse)
                        .success(true)
                        .model("llama-3.3-70b-versatile")
                        .build());

        // Act
        AIEmailGenerationResponse response = service.generateEmail(request);

        // Assert
        assertTrue(response.isSuccess());
        String html = response.getBodyHtml();
        
        // Verify no script tags
        assertFalse(html.toLowerCase().contains("<script"));
        
        // Verify DOCTYPE and proper structure
        assertTrue(html.contains("<!DOCTYPE html>"));
        assertTrue(html.contains("</html>"));
        
        // Verify inline styles only (no external scripts)
        assertTrue(html.contains("style="));
        assertFalse(html.contains("javascript:"));
    }

    @Test
    @DisplayName("Regenerate should call generateEmail again")
    void testRegenerateEmail() {
        // Arrange
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Test")
                .targetAudience("Test audience")
                .productService("Test product")
                .tone("Professional")
                .ctaText("Test CTA")
                .ctaUrl("https://example.com")
                .build();

        String mockAiResponse = """
            {
              "subject": "Alternative Subject Line",
              "body": "Alternative email body..."
            }
            """;

        when(xaiProvider.generateResponseNoCache(anyString()))
                .thenReturn(AIResponse.builder()
                        .content(mockAiResponse)
                        .success(true)
                        .model("llama-3.3-70b-versatile")
                        .build());

        // Act
        AIEmailGenerationResponse response = service.regenerateEmail(request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Alternative Subject Line", response.getSubject());
    }
}
