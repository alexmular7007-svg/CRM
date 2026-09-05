package com.arjun.crm.service;

import com.arjun.crm.entity.*;
import com.arjun.crm.enums.ChromeExtensionStatus;
import com.arjun.crm.enums.Role;
import com.arjun.crm.enums.TestCaseType;
import com.arjun.crm.enums.TestResultStatus;
import com.arjun.crm.enums.TestRunStatus;
import com.arjun.crm.repository.ChromeExtensionTestCaseRepository;
import com.arjun.crm.repository.ChromeExtensionTestResultRepository;
import com.arjun.crm.repository.ChromeExtensionTestRunRepository;
import com.arjun.crm.security.JwtService;
import com.arjun.crm.service.impl.ChromeExtensionTestExecutionServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChromeExtensionTestExecutionServiceTest {

    @Mock
    private ChromeExtensionTestCaseRepository testCaseRepository;

    @Mock
    private ChromeExtensionTestRunRepository testRunRepository;

    @Mock
    private ChromeExtensionTestResultRepository testResultRepository;

    @Mock
    private JwtService jwtService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ChromeExtensionTestExecutionServiceImpl executionService;

    private Workspace testWorkspace;
    private User testUser;
    private ChromeExtension testExtension;
    private ChromeExtensionTestRun testRun;
    private ChromeExtensionTestCase testCase;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(executionService, "defaultBaseUrl", "http://localhost:8080");

        testUser = User.builder()
                .id(1L)
                .email("admin@test.com")
                .firstName("John")
                .lastName("Doe")
                .role(Role.ADMIN)
                .build();

        testWorkspace = Workspace.builder()
                .id(10L)
                .name("Test Workspace")
                .owner(testUser)
                .build();

        testExtension = ChromeExtension.builder()
                .id(50L)
                .workspace(testWorkspace)
                .name("CRM Lead Hunter")
                .status(ChromeExtensionStatus.ACTIVE)
                .createdBy(testUser)
                .build();

        testRun = ChromeExtensionTestRun.builder()
                .id(100L)
                .extension(testExtension)
                .triggeredBy(testUser)
                .status(TestRunStatus.QUEUED)
                .totalTests(1)
                .build();

        testCase = ChromeExtensionTestCase.builder()
                .id(200L)
                .extension(testExtension)
                .name("Get Extension Details")
                .testType(TestCaseType.API_CRUD)
                .configuration(Map.of(
                        "operation", "GET",
                        "endpoint", "/api/workspaces/{workspaceId}/chrome-extensions/{extensionId}"
                ))
                .expectedResult(Map.of("statusCode", 200))
                .enabled(true)
                .displayOrder(0)
                .build();
    }

    @Test
    @DisplayName("Execution Engine - Handles SSRF violation as ERROR")
    void executeTestRun_ExternalUrl_RecordsErrorResult() {
        ChromeExtensionTestCase ssrfCase = ChromeExtensionTestCase.builder()
                .id(201L)
                .extension(testExtension)
                .name("External Malicious URL Test")
                .testType(TestCaseType.API_CRUD)
                .configuration(Map.of(
                        "operation", "GET",
                        "endpoint", "https://malicious-external-domain.com/steal-data"
                ))
                .expectedResult(Map.of("statusCode", 200))
                .enabled(true)
                .build();

        when(testRunRepository.findById(100L)).thenReturn(Optional.of(testRun));
        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(i -> i.getArgument(0));
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(50L)).thenReturn(List.of(ssrfCase));
        when(testResultRepository.save(any(ChromeExtensionTestResult.class))).thenAnswer(i -> i.getArgument(0));

        ChromeExtensionTestRun result = executionService.executeTestRun(10L, testExtension, testRun, testUser, "mock-token");

        assertNotNull(result);
        assertEquals(TestRunStatus.ERROR, result.getStatus());
        assertEquals(1, result.getErrorTests());
        assertEquals(0, result.getPassedTests());
        assertEquals(0, result.getFailedTests());

        verify(testResultRepository).save(argThat(res ->
                res.getStatus() == TestResultStatus.ERROR &&
                res.getErrorMessage() != null &&
                res.getErrorMessage().contains("SSRF")
        ));
    }

    @Test
    @DisplayName("Execution Engine - Cancellation stops execution")
    void executeTestRun_CancelledRun_StopsExecution() {
        testRun.setStatus(TestRunStatus.CANCELLED);
        when(testRunRepository.findById(100L)).thenReturn(Optional.of(testRun));

        ChromeExtensionTestRun result = executionService.executeTestRun(10L, testExtension, testRun, testUser, "mock-token");

        assertNotNull(result);
        assertEquals(TestRunStatus.CANCELLED, result.getStatus());
        verify(testCaseRepository, never()).findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(any());
        verify(testResultRepository, never()).save(any());
    }

    @Test
    @DisplayName("Execution Engine - Summary calculations on multiple test cases")
    void executeTestRun_MultipleCases_AggregatesSummary() {
        ChromeExtensionTestCase invalidHostCase1 = ChromeExtensionTestCase.builder()
                .id(201L)
                .extension(testExtension)
                .name("SSRF Case 1")
                .testType(TestCaseType.API_CRUD)
                .configuration(Map.of("endpoint", "http://169.254.169.254/latest/meta-data/"))
                .enabled(true)
                .build();

        ChromeExtensionTestCase invalidHostCase2 = ChromeExtensionTestCase.builder()
                .id(202L)
                .extension(testExtension)
                .name("SSRF Case 2")
                .testType(TestCaseType.API_CRUD)
                .configuration(Map.of("endpoint", "ftp://localhost/file.txt"))
                .enabled(true)
                .build();

        when(testRunRepository.findById(100L)).thenReturn(Optional.of(testRun));
        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(i -> i.getArgument(0));
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(50L)).thenReturn(List.of(invalidHostCase1, invalidHostCase2));
        when(testResultRepository.save(any(ChromeExtensionTestResult.class))).thenAnswer(i -> i.getArgument(0));

        ChromeExtensionTestRun result = executionService.executeTestRun(10L, testExtension, testRun, testUser, "mock-token");

        assertNotNull(result);
        assertEquals(TestRunStatus.ERROR, result.getStatus());
        assertEquals(2, result.getTotalTests());
        assertEquals(2, result.getErrorTests());
        assertEquals(0, result.getPassedTests());
        assertEquals(0, result.getFailedTests());
        assertNotNull(result.getLogs());
        assertTrue(result.getLogs().contains("TEST_RUN_COMPLETED"));
    }

    @Test
    @DisplayName("Execution Engine - Real HTTP PASS (Status 200 + matchFields)")
    void executeTestRun_RealHttp_PassingAssertions() throws Exception {
        com.sun.net.httpserver.HttpServer server = com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("localhost", 0), 0);
        server.createContext("/api/leads", exchange -> {
            byte[] response = "{\"success\":true,\"data\":{\"email\":\"test.lead@example.com\"}}".getBytes();
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        try {
            int port = server.getAddress().getPort();
            ReflectionTestUtils.setField(executionService, "defaultBaseUrl", "http://localhost:" + port);

            ChromeExtensionTestCase passCase = ChromeExtensionTestCase.builder()
                    .id(300L)
                    .extension(testExtension)
                    .name("Create Lead via API")
                    .testType(TestCaseType.API_CRUD)
                    .configuration(Map.of(
                            "operation", "POST",
                            "endpoint", "/api/leads",
                            "payload", Map.of("email", "test.lead@example.com")
                    ))
                    .expectedResult(Map.of(
                            "statusCode", 200,
                            "matchFields", Map.of("success", true, "data.email", "test.lead@example.com"),
                            "bodyContains", "test.lead@example.com"
                    ))
                    .enabled(true)
                    .build();

            when(testRunRepository.findById(100L)).thenReturn(Optional.of(testRun));
            when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(i -> i.getArgument(0));
            when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(50L)).thenReturn(List.of(passCase));
            when(testResultRepository.save(any(ChromeExtensionTestResult.class))).thenAnswer(i -> i.getArgument(0));

            ChromeExtensionTestRun result = executionService.executeTestRun(10L, testExtension, testRun, testUser, "mock-token");

            assertNotNull(result);
            assertEquals(TestRunStatus.PASSED, result.getStatus());
            assertEquals(1, result.getTotalTests());
            assertEquals(1, result.getPassedTests());
            assertEquals(0, result.getFailedTests());
            assertEquals(0, result.getErrorTests());

            verify(testResultRepository).save(argThat(res ->
                    res.getStatus() == TestResultStatus.PASSED &&
                    res.getActualStatusCode() == 200 &&
                    res.getAssertionDetails() != null
            ));
        } finally {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("Execution Engine - Real HTTP FAIL (Status 200 vs Expected 201)")
    void executeTestRun_RealHttp_FailingStatusAssertion() throws Exception {
        com.sun.net.httpserver.HttpServer server = com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("localhost", 0), 0);
        server.createContext("/api/leads", exchange -> {
            byte[] response = "{\"success\":true}".getBytes();
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        try {
            int port = server.getAddress().getPort();
            ReflectionTestUtils.setField(executionService, "defaultBaseUrl", "http://localhost:" + port);

            ChromeExtensionTestCase failCase = ChromeExtensionTestCase.builder()
                    .id(301L)
                    .extension(testExtension)
                    .name("Create Lead via API - Expect 201")
                    .testType(TestCaseType.API_CRUD)
                    .configuration(Map.of(
                            "operation", "POST",
                            "endpoint", "/api/leads"
                    ))
                    .expectedResult(Map.of("statusCode", 201))
                    .enabled(true)
                    .build();

            when(testRunRepository.findById(100L)).thenReturn(Optional.of(testRun));
            when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(i -> i.getArgument(0));
            when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(50L)).thenReturn(List.of(failCase));
            when(testResultRepository.save(any(ChromeExtensionTestResult.class))).thenAnswer(i -> i.getArgument(0));

            ChromeExtensionTestRun result = executionService.executeTestRun(10L, testExtension, testRun, testUser, "mock-token");

            assertNotNull(result);
            assertEquals(TestRunStatus.FAILED, result.getStatus());
            assertEquals(1, result.getTotalTests());
            assertEquals(0, result.getPassedTests());
            assertEquals(1, result.getFailedTests());
            assertEquals(0, result.getErrorTests());

            verify(testResultRepository).save(argThat(res ->
                    res.getStatus() == TestResultStatus.FAILED &&
                    res.getActualStatusCode() == 200 &&
                    res.getErrorMessage() != null &&
                    res.getErrorMessage().contains("Expected status 201, but received 200")
            ));
        } finally {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("Execution Engine - Resolves {workspaceId} and {extensionId} template variables")
    void executeTestRun_TemplateVariables_ResolvedInEndpoint() throws Exception {
        com.sun.net.httpserver.HttpServer server = com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("localhost", 0), 0);
        server.createContext("/api/workspaces/10/chrome-extensions/50", exchange -> {
            byte[] response = "{\"name\":\"CRM Lead Hunter\"}".getBytes();
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        try {
            int port = server.getAddress().getPort();
            ReflectionTestUtils.setField(executionService, "defaultBaseUrl", "http://localhost:" + port);

            ChromeExtensionTestCase varCase = ChromeExtensionTestCase.builder()
                    .id(302L)
                    .extension(testExtension)
                    .name("Get Extension Details with Template Vars")
                    .testType(TestCaseType.API_CRUD)
                    .configuration(Map.of(
                            "operation", "GET",
                            "endpoint", "/api/workspaces/{workspaceId}/chrome-extensions/{extensionId}"
                    ))
                    .expectedResult(Map.of("statusCode", 200))
                    .enabled(true)
                    .build();

            when(testRunRepository.findById(100L)).thenReturn(Optional.of(testRun));
            when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(i -> i.getArgument(0));
            when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(50L)).thenReturn(List.of(varCase));
            when(testResultRepository.save(any(ChromeExtensionTestResult.class))).thenAnswer(i -> i.getArgument(0));

            ChromeExtensionTestRun result = executionService.executeTestRun(10L, testExtension, testRun, testUser, "mock-token");

            assertNotNull(result);
            assertEquals(TestRunStatus.PASSED, result.getStatus());
            assertEquals(1, result.getPassedTests());
        } finally {
            server.stop(0);
        }
    }
}
