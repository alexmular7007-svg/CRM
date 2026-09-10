package com.arjun.crm.controller;

import com.arjun.crm.BaseIntegrationTest;
import com.arjun.crm.dto.request.AIEmailGenerationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AIEmailGenerationController
 * Tests: endpoint validation, request validation, response format
 */
@DisplayName("AI Email Generation Controller Integration Tests")
class AIEmailGenerationControllerTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("POST /api/emails/tones should return available tones")
    void testGetAvailableTones() throws Exception {
        mockMvc.perform(get("/api/emails/tones")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", isA(java.util.List.class)))
                .andExpect(jsonPath("$.data[0]", is("Professional")))
                .andExpect(jsonPath("$.data", hasItems(
                        "Professional",
                        "Friendly",
                        "Urgent",
                        "Casual",
                        "Formal",
                        "Persuasive",
                        "Humorous"
                )));
    }

    @Test
    @DisplayName("GET /api/emails/health should return operational status")
    void testHealthCheck() throws Exception {
        mockMvc.perform(get("/api/emails/health")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("operational")));
    }

    @Test
    @DisplayName("POST /api/emails/generate should reject missing required fields")
    void testGenerateEmailMissingPurpose() throws Exception {
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                // Missing purpose
                .targetAudience("New leads")
                .productService("Cloud CRM")
                .tone("Professional")
                .ctaText("Get Started")
                .ctaUrl("https://example.com/signup")
                .build();

        mockMvc.perform(post("/api/emails/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/emails/generate should reject invalid tone")
    void testGenerateEmailInvalidTone() throws Exception {
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Product launch")
                .targetAudience("New leads")
                .productService("Cloud CRM")
                .tone("InvalidTone") // Invalid tone
                .ctaText("Get Started")
                .ctaUrl("https://example.com/signup")
                .build();

        mockMvc.perform(post("/api/emails/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/emails/generate should reject invalid CTA URL")
    void testGenerateEmailInvalidCtaUrl() throws Exception {
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Product launch")
                .targetAudience("New leads")
                .productService("Cloud CRM")
                .tone("Professional")
                .ctaText("Get Started")
                .ctaUrl("not-a-valid-url") // Invalid URL format
                .build();

        mockMvc.perform(post("/api/emails/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/emails/generate should reject overly long fields")
    void testGenerateEmailFieldTooLong() throws Exception {
        String veryLongString = "a".repeat(300); // Exceeds 200 char limit for purpose

        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose(veryLongString) // Exceeds limit
                .targetAudience("New leads")
                .productService("Cloud CRM")
                .tone("Professional")
                .ctaText("Get Started")
                .ctaUrl("https://example.com/signup")
                .build();

        mockMvc.perform(post("/api/emails/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/emails/generate should accept valid request with all optional fields")
    void testGenerateEmailValidWithOptionalFields() throws Exception {
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Product launch")
                .targetAudience("New leads")
                .productService("Cloud CRM")
                .tone("Professional")
                .offer("20% discount")
                .keyPoints("Fast, Secure, Scalable")
                .ctaText("Get Started")
                .ctaUrl("https://example.com/signup")
                .language("English")
                .companyName("TechCorp")
                .build();

        mockMvc.perform(post("/api/emails/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.subject", notNullValue()))
                .andExpect(jsonPath("$.data.bodyHtml", notNullValue()))
                .andExpect(jsonPath("$.data.bodyPlainText", notNullValue()))
                .andExpect(jsonPath("$.data.ctaText", is("Get Started")))
                .andExpect(jsonPath("$.data.ctaUrl", is("https://example.com/signup")))
                .andExpect(jsonPath("$.data.success", is(true)))
                .andExpect(jsonPath("$.data.model", notNullValue()))
                .andExpect(jsonPath("$.data.generatedAt", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/emails/generate should return properly formatted response")
    void testGenerateEmailResponseFormat() throws Exception {
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Product launch")
                .targetAudience("New leads")
                .productService("Cloud CRM")
                .tone("Professional")
                .ctaText("Get Started")
                .ctaUrl("https://example.com/signup")
                .build();

        mockMvc.perform(post("/api/emails/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", notNullValue()))
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.subject", notNullValue()))
                .andExpect(jsonPath("$.data.bodyHtml", notNullValue()))
                .andExpect(jsonPath("$.data.bodyPlainText", notNullValue()))
                .andExpect(jsonPath("$.data.ctaText", notNullValue()))
                .andExpect(jsonPath("$.data.ctaUrl", notNullValue()))
                .andExpect(jsonPath("$.data.success", is(true)))
                .andExpect(jsonPath("$.data.model", notNullValue()))
                .andExpect(jsonPath("$.data.generatedAt", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/emails/generate should accept PROMPT mode request")
    void testGenerateEmailPromptModeValid() throws Exception {
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .mode(AIEmailGenerationRequest.GenerationMode.PROMPT)
                .prompt("Write a friendly launch email for our AI CRM to startup founders.")
                .tone("Friendly")
                .ctaText("Book a Demo")
                .ctaUrl("https://example.com/demo")
                .build();

        mockMvc.perform(post("/api/emails/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.subject", notNullValue()))
                .andExpect(jsonPath("$.data.ctaUrl", is("https://example.com/demo")));
    }

    @Test
    @DisplayName("POST /api/emails/regenerate should accept valid request")
    void testRegenerateEmailValid() throws Exception {
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Product launch")
                .targetAudience("New leads")
                .productService("Cloud CRM")
                .tone("Professional")
                .ctaText("Get Started")
                .ctaUrl("https://example.com/signup")
                .build();

        mockMvc.perform(post("/api/emails/regenerate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.subject", notNullValue()))
                .andExpect(jsonPath("$.data.bodyHtml", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/emails/generate should escape HTML in output")
    void testHTMLEscaping() throws Exception {
        AIEmailGenerationRequest request = AIEmailGenerationRequest.builder()
                .purpose("Test <script>alert('xss')</script>")
                .targetAudience("New leads")
                .productService("Cloud CRM")
                .tone("Professional")
                .ctaText("Get Started")
                .ctaUrl("https://example.com/signup")
                .build();

        mockMvc.perform(post("/api/emails/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bodyHtml", not(containsString("<script>"))));
    }
}
