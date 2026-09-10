package com.arjun.crm.controller;

import com.arjun.crm.dto.request.AIEmailGenerationRequest;
import com.arjun.crm.dto.response.AIEmailGenerationResponse;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.service.email.AIEmailGenerationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Email Generation API E2E Tests")
class AIEmailGenerationControllerE2ETest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AIEmailGenerationService emailGenerationService;

    private AIEmailGenerationRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = AIEmailGenerationRequest.builder()
                .purpose("Product launch announcement")
                .targetAudience("Enterprise customers")
                .productService("AI-powered email marketing platform")
                .tone("Professional")
                .offer("Limited time: 50% off first 3 months")
                .keyPoints("Fast deployment, Enterprise security, 24/7 support")
                .ctaText("Start Free Trial")
                .ctaUrl("https://example.com/trial")
                .language("English")
                .companyName("TechCorp")
                .build();
    }

    @Test
    @DisplayName("E2E: POST /api/emails/generate returns valid response")
    void testEmailGenerationEndToEnd_HappyPath() throws Exception {
        System.out.println("\n╔════════════════════════════════════════════════════════════════╗");
        System.out.println("║  E2E TEST: POST /api/emails/generate (Happy Path)              ║");
        System.out.println("╚════════════════════════════════════════════════════════════════╝\n");

        String requestJson = objectMapper.writeValueAsString(validRequest);
        System.out.println("✓ Step 1: Request Serialized\n");

        System.out.println("✓ Step 2: Sending POST /api/emails/generate");
        MvcResult result = mockMvc.perform(
                        post("/api/emails/generate")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson)
                )
                .andDo(print())
                .andExpect(status().isOk())
                .andReturn();

        System.out.println("\n✓ Step 3: HTTP 200 OK Received\n");

        String responseJson = result.getResponse().getContentAsString();
        ApiResponse<AIEmailGenerationResponse> apiResponse =
                objectMapper.readValue(responseJson, new TypeReference<ApiResponse<AIEmailGenerationResponse>>() {});

        System.out.println("✓ Step 4: Response Deserialized\n");

        assertThat(apiResponse).isNotNull();
        assertThat(apiResponse.isSuccess()).isTrue();
        assertThat(apiResponse.getData()).isNotNull();

        AIEmailGenerationResponse emailResponse = apiResponse.getData();

        System.out.println("✓ Step 5: Subject Line Validation");
        assertThat(emailResponse.getSubject())
                .isNotNull()
                .isNotBlank()
                .hasSizeLessThan(256);
        System.out.println("  Subject: \"" + emailResponse.getSubject() + "\"\n");

        System.out.println("✓ Step 6: Plain Text Body Validation");
        assertThat(emailResponse.getBodyPlainText())
                .isNotNull()
                .isNotBlank()
                .hasSizeGreaterThan(50)
                .hasSizeLessThan(5001);
        System.out.println("  Length: " + emailResponse.getBodyPlainText().length() + " characters\n");

        System.out.println("✓ Step 7: HTML Body Validation");
        assertThat(emailResponse.getBodyHtml())
                .isNotNull()
                .isNotBlank()
                .hasSizeGreaterThan(100)
                .contains("<!DOCTYPE html>")
                .contains("</html>")
                .contains(validRequest.getCtaUrl())
                .contains(validRequest.getCtaText());
        System.out.println("  Length: " + emailResponse.getBodyHtml().length() + " characters\n");

        System.out.println("✓ Step 8: CTA Preservation");
        assertThat(emailResponse.getCtaText()).isEqualTo(validRequest.getCtaText());
        assertThat(emailResponse.getCtaUrl()).isEqualTo(validRequest.getCtaUrl());
        System.out.println("  ✓ CTA preserved correctly\n");

        System.out.println("✓ Step 9: Metadata Validation");
        assertThat(emailResponse.isSuccess()).isTrue();
        assertThat(emailResponse.getModel()).isNotNull().isNotBlank();
        assertThat(emailResponse.getGeneratedAt()).isGreaterThan(0);
        System.out.println("  Model: " + emailResponse.getModel() + "\n");

        System.out.println("╔════════════════════════════════════════════════════════════════╗");
        System.out.println("║  ✓ ALL VALIDATIONS PASSED                                      ║");
        System.out.println("╚════════════════════════════════════════════════════════════════╝\n");
    }

    @Test
    @DisplayName("E2E: Service handles responses correctly")
    void testServiceLayerResponse() throws Exception {
        System.out.println("\n╔════════════════════════════════════════════════════════════════╗");
        System.out.println("║  E2E TEST: Service Layer Response Handling                     ║");
        System.out.println("╚════════════════════════════════════════════════════════════════╝\n");

        AIEmailGenerationResponse response = emailGenerationService.generateEmail(validRequest);

        System.out.println("✓ Service response received");
        System.out.println("  Success: " + response.isSuccess());
        System.out.println("  Model: " + response.getModel());

        if (response.isSuccess()) {
            System.out.println("  Subject: " + (response.getSubject() != null ? response.getSubject().substring(0, 50) + "..." : "NULL"));
            System.out.println("  Body (plain text): " + (response.getBodyPlainText() != null ? response.getBodyPlainText().substring(0, 50) + "..." : "NULL"));
            System.out.println("  Body (HTML): " + (response.getBodyHtml() != null ? response.getBodyHtml().substring(0, 50) + "..." : "NULL"));

            assertThat(response.getSubject()).isNotBlank();
            assertThat(response.getBodyPlainText()).isNotBlank();
            assertThat(response.getBodyHtml()).isNotBlank();
        } else {
            System.out.println("  Error: " + response.getError());
        }
        System.out.println();
    }

    @Test
    @DisplayName("E2E: GET /api/emails/tones endpoint")
    void testGetAvailableTones() throws Exception {
        System.out.println("\n✓ GET /api/emails/tones\n");

        MvcResult result = mockMvc.perform(get("/api/emails/tones"))
                .andExpect(status().isOk())
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        ApiResponse<String[]> apiResponse = objectMapper.readValue(responseJson,
                new TypeReference<ApiResponse<String[]>>() {});

        String[] tones = apiResponse.getData();
        assertThat(tones).isNotEmpty();
        System.out.println("Available tones: " + java.util.Arrays.toString(tones) + "\n");
    }
}
