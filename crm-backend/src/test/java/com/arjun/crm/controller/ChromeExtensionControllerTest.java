package com.arjun.crm.controller;

import com.arjun.crm.dto.request.CreateChromeExtensionRequest;
import com.arjun.crm.dto.request.CreateTestCaseRequest;
import com.arjun.crm.dto.request.UpdateChromeExtensionRequest;
import com.arjun.crm.dto.request.UpdateTestCaseRequest;
import com.arjun.crm.dto.response.ChromeExtensionResponse;
import com.arjun.crm.dto.response.TestCaseResponse;
import com.arjun.crm.enums.ChromeExtensionStatus;
import com.arjun.crm.enums.TestCaseType;
import com.arjun.crm.service.ChromeExtensionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ChromeExtensionControllerTest {

    private MockMvc mockMvc;
    private ChromeExtensionService chromeExtensionService;
    private ObjectMapper objectMapper;

    private ChromeExtensionResponse sampleExtension;
    private TestCaseResponse sampleTestCase;

    @BeforeEach
    void setUp() {
        chromeExtensionService = mock(ChromeExtensionService.class);
        ChromeExtensionController controller = new ChromeExtensionController(chromeExtensionService);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();

        objectMapper = new ObjectMapper();

        sampleExtension = ChromeExtensionResponse.builder()
                .id(1L)
                .workspaceId(10L)
                .name("CRM Lead Hunter")
                .description("Automated lead test extension")
                .version("1.0.0")
                .status(ChromeExtensionStatus.ACTIVE)
                .manifestJson(Map.of("manifest_version", 3))
                .createdById(1L)
                .createdByName("Admin User")
                .testCaseCount(2)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        sampleTestCase = TestCaseResponse.builder()
                .id(100L)
                .extensionId(1L)
                .name("Test Lead Creation")
                .description("Tests POST /api/leads")
                .testType(TestCaseType.API_CRUD)
                .configuration(Map.of("method", "POST"))
                .expectedResult(Map.of("status", 201))
                .enabled(true)
                .displayOrder(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Chrome Extension Endpoint Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/workspaces/{workspaceId}/chrome-extensions - 201 Created")
    void createExtension_Success() throws Exception {
        CreateChromeExtensionRequest request = CreateChromeExtensionRequest.builder()
                .name("CRM Lead Hunter")
                .version("1.0.0")
                .build();

        when(chromeExtensionService.createExtension(eq(10L), any(CreateChromeExtensionRequest.class)))
                .thenReturn(sampleExtension);

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.name").value("CRM Lead Hunter"));
    }

    @Test
    @DisplayName("POST /api/workspaces/{workspaceId}/chrome-extensions - 400 Bad Request on blank name")
    void createExtension_BlankName_ReturnsBadRequest() throws Exception {
        CreateChromeExtensionRequest request = CreateChromeExtensionRequest.builder()
                .name("")
                .build();

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/chrome-extensions - 200 OK")
    void listExtensions_Success() throws Exception {
        when(chromeExtensionService.listExtensions(eq(10L), any(), any()))
                .thenReturn(new PageImpl<>(List.of(sampleExtension), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(1));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/chrome-extensions/{id} - 200 OK")
    void getExtension_Success() throws Exception {
        when(chromeExtensionService.getExtension(10L, 1L)).thenReturn(sampleExtension);

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("PUT /api/workspaces/{workspaceId}/chrome-extensions/{id} - 200 OK")
    void updateExtension_Success() throws Exception {
        UpdateChromeExtensionRequest request = UpdateChromeExtensionRequest.builder()
                .name("Updated Extension")
                .build();

        when(chromeExtensionService.updateExtension(eq(10L), eq(1L), any(UpdateChromeExtensionRequest.class)))
                .thenReturn(sampleExtension);

        mockMvc.perform(put("/api/workspaces/10/chrome-extensions/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /api/workspaces/{workspaceId}/chrome-extensions/{id} - 200 OK")
    void deleteExtension_Success() throws Exception {
        doNothing().when(chromeExtensionService).deleteExtension(10L, 1L);

        mockMvc.perform(delete("/api/workspaces/10/chrome-extensions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(chromeExtensionService).deleteExtension(10L, 1L);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test Case Endpoint Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/workspaces/{workspaceId}/chrome-extensions/{id}/test-cases - 201 Created")
    void createTestCase_Success() throws Exception {
        CreateTestCaseRequest request = CreateTestCaseRequest.builder()
                .name("Test Lead Creation")
                .testType(TestCaseType.API_CRUD)
                .build();

        when(chromeExtensionService.createTestCase(eq(10L), eq(1L), any(CreateTestCaseRequest.class)))
                .thenReturn(sampleTestCase);

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions/1/test-cases")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(100));
    }

    @Test
    @DisplayName("POST /api/workspaces/{workspaceId}/chrome-extensions/{id}/test-cases - 400 Bad Request on blank name")
    void createTestCase_BlankName_ReturnsBadRequest() throws Exception {
        CreateTestCaseRequest request = CreateTestCaseRequest.builder()
                .name("")
                .testType(TestCaseType.API_CRUD)
                .build();

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions/1/test-cases")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/chrome-extensions/{id}/test-cases - 200 OK")
    void listTestCases_Success() throws Exception {
        when(chromeExtensionService.listTestCases(10L, 1L)).thenReturn(List.of(sampleTestCase));

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions/1/test-cases")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(100));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/chrome-extensions/{id}/test-cases/{testCaseId} - 200 OK")
    void getTestCase_Success() throws Exception {
        when(chromeExtensionService.getTestCase(10L, 1L, 100L)).thenReturn(sampleTestCase);

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions/1/test-cases/100")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(100));
    }

    @Test
    @DisplayName("PUT /api/workspaces/{workspaceId}/chrome-extensions/{id}/test-cases/{testCaseId} - 200 OK")
    void updateTestCase_Success() throws Exception {
        UpdateTestCaseRequest request = UpdateTestCaseRequest.builder()
                .name("Updated Test Case")
                .build();

        when(chromeExtensionService.updateTestCase(eq(10L), eq(1L), eq(100L), any(UpdateTestCaseRequest.class)))
                .thenReturn(sampleTestCase);

        mockMvc.perform(put("/api/workspaces/10/chrome-extensions/1/test-cases/100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /api/workspaces/{workspaceId}/chrome-extensions/{id}/test-cases/{testCaseId} - 200 OK")
    void deleteTestCase_Success() throws Exception {
        doNothing().when(chromeExtensionService).deleteTestCase(10L, 1L, 100L);

        mockMvc.perform(delete("/api/workspaces/10/chrome-extensions/1/test-cases/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(chromeExtensionService).deleteTestCase(10L, 1L, 100L);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test Run Endpoint Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/workspaces/{workspaceId}/chrome-extensions/{id}/runs - 201 Created")
    void createTestRun_Success() throws Exception {
        com.arjun.crm.dto.response.TestRunResponse runResponse = com.arjun.crm.dto.response.TestRunResponse.builder()
                .id(1L)
                .workspaceId(10L)
                .extensionId(1L)
                .extensionName("CRM Lead Hunter")
                .status(com.arjun.crm.enums.TestRunStatus.QUEUED)
                .totalTests(2)
                .passedTests(0)
                .failedTests(0)
                .errorTests(0)
                .build();

        when(chromeExtensionService.createTestRun(10L, 1L)).thenReturn(runResponse);

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions/1/runs")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.status").value("QUEUED"));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/chrome-extensions/{id}/runs - 200 OK")
    void listTestRuns_Success() throws Exception {
        com.arjun.crm.dto.response.TestRunResponse runResponse = com.arjun.crm.dto.response.TestRunResponse.builder()
                .id(1L)
                .workspaceId(10L)
                .extensionId(1L)
                .status(com.arjun.crm.enums.TestRunStatus.PASSED)
                .totalTests(2)
                .passedTests(2)
                .build();

        when(chromeExtensionService.listTestRuns(eq(10L), eq(1L), any()))
                .thenReturn(new PageImpl<>(List.of(runResponse), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions/1/runs")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(1));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/chrome-extensions/{id}/runs/{runId} - 200 OK")
    void getTestRun_Success() throws Exception {
        com.arjun.crm.dto.response.TestRunResponse runResponse = com.arjun.crm.dto.response.TestRunResponse.builder()
                .id(1L)
                .workspaceId(10L)
                .extensionId(1L)
                .status(com.arjun.crm.enums.TestRunStatus.PASSED)
                .totalTests(1)
                .passedTests(1)
                .results(List.of(
                        com.arjun.crm.dto.response.TestResultResponse.builder()
                                .id(10L)
                                .testRunId(1L)
                                .testCaseId(100L)
                                .testCaseName("Test Lead Creation")
                                .status(com.arjun.crm.enums.TestResultStatus.PASSED)
                                .actualStatusCode(200)
                                .build()
                ))
                .build();

        when(chromeExtensionService.getTestRun(10L, 1L, 1L)).thenReturn(runResponse);

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions/1/runs/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.results[0].status").value("PASSED"));
    }

    @Test
    @DisplayName("POST /api/workspaces/{workspaceId}/chrome-extensions/{id}/runs/{runId}/cancel - 200 OK")
    void cancelTestRun_Success() throws Exception {
        com.arjun.crm.dto.response.TestRunResponse runResponse = com.arjun.crm.dto.response.TestRunResponse.builder()
                .id(1L)
                .workspaceId(10L)
                .extensionId(1L)
                .status(com.arjun.crm.enums.TestRunStatus.CANCELLED)
                .build();

        when(chromeExtensionService.cancelTestRun(10L, 1L, 1L)).thenReturn(runResponse);

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions/1/runs/1/cancel")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/chrome-extensions/runner/health - 200 OK")
    void getRunnerHealth_Success() throws Exception {
        when(chromeExtensionService.checkRunnerHealth()).thenReturn(Map.of("status", "UP"));

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions/runner/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    @DisplayName("POST /api/workspaces/{workspaceId}/chrome-extensions/{id}/browser-runs - 202 Accepted")
    void startBrowserRun_Success() throws Exception {
        com.arjun.crm.dto.response.BrowserTestRunResponse response = com.arjun.crm.dto.response.BrowserTestRunResponse.builder()
                .runId(101L)
                .status("QUEUED")
                .message("Browser test run initiated successfully")
                .build();

        when(chromeExtensionService.startBrowserRun(eq(10L), eq(1L), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions/1/browser-runs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.runId").value(101))
                .andExpect(jsonPath("$.data.status").value("QUEUED"));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/chrome-extensions/{id}/browser-runs/{runId} - 200 OK")
    void getBrowserRunStatus_Success() throws Exception {
        com.arjun.crm.dto.response.BrowserTestRunResponse response = com.arjun.crm.dto.response.BrowserTestRunResponse.builder()
                .runId(101L)
                .status("PASSED")
                .totalTests(3)
                .passedTests(3)
                .build();

        when(chromeExtensionService.getBrowserRunStatus(10L, 1L, 101L))
                .thenReturn(response);

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions/1/browser-runs/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PASSED"))
                .andExpect(jsonPath("$.data.passedTests").value(3));
    }

    @Test
    @DisplayName("POST /api/workspaces/{workspaceId}/chrome-extensions/{id}/browser-runs/{runId}/cancel - 200 OK")
    void cancelBrowserRun_Success() throws Exception {
        com.arjun.crm.dto.response.BrowserTestRunResponse response = com.arjun.crm.dto.response.BrowserTestRunResponse.builder()
                .runId(101L)
                .status("CANCELLED")
                .build();

        when(chromeExtensionService.cancelBrowserRun(10L, 1L, 101L))
                .thenReturn(response);

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions/1/browser-runs/101/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/chrome-extensions/{id}/browser-runs/{runId}/artifacts/{filename} - 200 OK image/png")
    void getArtifact_Success() throws Exception {
        byte[] dummyPng = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
        when(chromeExtensionService.getArtifact(10L, 1L, 101L, "shot.png"))
                .thenReturn(dummyPng);

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions/1/browser-runs/101/artifacts/shot.png"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(org.springframework.http.MediaType.IMAGE_PNG))
                .andExpect(content().bytes(dummyPng));
    }
}
