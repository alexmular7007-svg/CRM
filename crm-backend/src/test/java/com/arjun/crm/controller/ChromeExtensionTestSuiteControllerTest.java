package com.arjun.crm.controller;

import com.arjun.crm.dto.request.CreateTestSuiteRequest;
import com.arjun.crm.dto.request.TestSuiteItemRequest;
import com.arjun.crm.dto.request.UpdateTestSuiteRequest;
import com.arjun.crm.dto.response.TestRunResponse;
import com.arjun.crm.dto.response.TestSuiteItemResponse;
import com.arjun.crm.dto.response.TestSuiteResponse;
import com.arjun.crm.enums.TestCaseType;
import com.arjun.crm.enums.TestRunStatus;
import com.arjun.crm.service.ChromeExtensionSuiteExecutionService;
import com.arjun.crm.service.ChromeExtensionTestSuiteService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ChromeExtensionTestSuiteControllerTest {

    private MockMvc mockMvc;
    private ChromeExtensionTestSuiteService testSuiteService;
    private ChromeExtensionSuiteExecutionService suiteExecutionService;
    private ObjectMapper objectMapper;

    private TestSuiteResponse sampleSuite;
    private TestRunResponse sampleRun;

    @BeforeEach
    void setUp() {
        testSuiteService = mock(ChromeExtensionTestSuiteService.class);
        suiteExecutionService = mock(ChromeExtensionSuiteExecutionService.class);
        ChromeExtensionTestSuiteController controller = new ChromeExtensionTestSuiteController(testSuiteService, suiteExecutionService);

        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();

        sampleSuite = TestSuiteResponse.builder()
                .id(100L)
                .workspaceId(10L)
                .extensionId(1L)
                .extensionName("CRM Lead Hunter")
                .name("Full Smoke Suite")
                .description("API and Browser automated tests")
                .stopOnFailure(true)
                .enabled(true)
                .createdById(1L)
                .createdByName("Admin User")
                .totalItems(2)
                .items(List.of(
                        TestSuiteItemResponse.builder()
                                .id(1L)
                                .suiteId(100L)
                                .testCaseId(101L)
                                .testCaseName("API Lead Creation")
                                .testCaseType(TestCaseType.API_CRUD)
                                .executionOrder(0)
                                .enabled(true)
                                .build(),
                        TestSuiteItemResponse.builder()
                                .id(2L)
                                .suiteId(100L)
                                .testCaseId(102L)
                                .testCaseName("Browser Popup Test")
                                .testCaseType(TestCaseType.BROWSER)
                                .executionOrder(1)
                                .enabled(true)
                                .build()
                ))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        sampleRun = TestRunResponse.builder()
                .id(501L)
                .workspaceId(10L)
                .extensionId(1L)
                .extensionName("CRM Lead Hunter")
                .suiteId(100L)
                .suiteName("Full Smoke Suite")
                .status(TestRunStatus.QUEUED)
                .environment("UNIFIED_SUITE")
                .totalTests(2)
                .passedTests(0)
                .failedTests(0)
                .errorTests(0)
                .skippedTests(0)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("1. POST /suites creates a new test suite successfully")
    void createSuite_Success_Returns201() throws Exception {
        when(testSuiteService.createSuite(eq(10L), eq(1L), any(CreateTestSuiteRequest.class)))
                .thenReturn(sampleSuite);

        CreateTestSuiteRequest request = CreateTestSuiteRequest.builder()
                .name("Full Smoke Suite")
                .description("API and Browser automated tests")
                .stopOnFailure(true)
                .enabled(true)
                .items(List.of(
                        TestSuiteItemRequest.builder().testCaseId(101L).executionOrder(0).build()
                ))
                .build();

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions/1/suites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(100))
                .andExpect(jsonPath("$.data.name").value("Full Smoke Suite"))
                .andExpect(jsonPath("$.data.stopOnFailure").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(2));
    }

    @Test
    @DisplayName("2. POST /suites with blank name returns 400 Bad Request")
    void createSuite_InvalidName_Returns400() throws Exception {
        CreateTestSuiteRequest request = CreateTestSuiteRequest.builder()
                .name("") // Blank name
                .build();

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions/1/suites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("3. GET /suites lists all test suites for an extension")
    void listSuites_Success_Returns200() throws Exception {
        when(testSuiteService.listSuites(10L, 1L)).thenReturn(List.of(sampleSuite));

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions/1/suites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].name").value("Full Smoke Suite"));
    }

    @Test
    @DisplayName("4. GET /suites/{suiteId} returns test suite details")
    void getSuite_Success_Returns200() throws Exception {
        when(testSuiteService.getSuite(10L, 1L, 100L)).thenReturn(sampleSuite);

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions/1/suites/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(100))
                .andExpect(jsonPath("$.data.name").value("Full Smoke Suite"))
                .andExpect(jsonPath("$.data.items[0].testCaseName").value("API Lead Creation"))
                .andExpect(jsonPath("$.data.items[1].testCaseName").value("Browser Popup Test"));
    }

    @Test
    @DisplayName("5. PUT /suites/{suiteId} updates test suite")
    void updateSuite_Success_Returns200() throws Exception {
        TestSuiteResponse updatedSuite = TestSuiteResponse.builder()
                .id(100L)
                .name("Updated Suite Name")
                .description("Updated description")
                .stopOnFailure(false)
                .enabled(true)
                .build();

        when(testSuiteService.updateSuite(eq(10L), eq(1L), eq(100L), any(UpdateTestSuiteRequest.class)))
                .thenReturn(updatedSuite);

        UpdateTestSuiteRequest request = UpdateTestSuiteRequest.builder()
                .name("Updated Suite Name")
                .description("Updated description")
                .stopOnFailure(false)
                .build();

        mockMvc.perform(put("/api/workspaces/10/chrome-extensions/1/suites/100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Updated Suite Name"))
                .andExpect(jsonPath("$.data.stopOnFailure").value(false));
    }

    @Test
    @DisplayName("6. DELETE /suites/{suiteId} deletes test suite")
    void deleteSuite_Success_Returns200() throws Exception {
        doNothing().when(testSuiteService).deleteSuite(10L, 1L, 100L);

        mockMvc.perform(delete("/api/workspaces/10/chrome-extensions/1/suites/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Test suite deleted successfully"));

        verify(testSuiteService, times(1)).deleteSuite(10L, 1L, 100L);
    }

    @Test
    @DisplayName("7. POST /suites/{suiteId}/runs triggers suite run execution and returns 202 ACCEPTED")
    void createSuiteRun_Success_Returns202() throws Exception {
        when(suiteExecutionService.createSuiteRun(10L, 1L, 100L)).thenReturn(sampleRun);

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions/1/suites/100/runs"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(501))
                .andExpect(jsonPath("$.data.status").value("QUEUED"))
                .andExpect(jsonPath("$.data.environment").value("UNIFIED_SUITE"));

        verify(suiteExecutionService, times(1)).createSuiteRun(10L, 1L, 100L);
    }

    @Test
    @DisplayName("8. GET /suites/{suiteId}/runs/{runId} returns suite run details and results")
    void getSuiteRun_Success_Returns200() throws Exception {
        sampleRun.setStatus(TestRunStatus.PASSED);
        when(suiteExecutionService.getSuiteRun(10L, 1L, 100L, 501L)).thenReturn(sampleRun);

        mockMvc.perform(get("/api/workspaces/10/chrome-extensions/1/suites/100/runs/501"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(501))
                .andExpect(jsonPath("$.data.status").value("PASSED"));

        verify(suiteExecutionService, times(1)).getSuiteRun(10L, 1L, 100L, 501L);
    }

    @Test
    @DisplayName("9. POST /suites/{suiteId}/runs/{runId}/cancel cancels suite run")
    void cancelSuiteRun_Success_Returns200() throws Exception {
        sampleRun.setStatus(TestRunStatus.CANCELLED);
        when(suiteExecutionService.cancelSuiteRun(10L, 1L, 100L, 501L)).thenReturn(sampleRun);

        mockMvc.perform(post("/api/workspaces/10/chrome-extensions/1/suites/100/runs/501/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(501))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        verify(suiteExecutionService, times(1)).cancelSuiteRun(10L, 1L, 100L, 501L);
    }
}
