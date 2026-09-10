package com.arjun.crm.service;

import com.arjun.crm.entity.ChromeExtension;
import com.arjun.crm.entity.ChromeExtensionTestCase;
import com.arjun.crm.entity.ChromeExtensionTestResult;
import com.arjun.crm.entity.ChromeExtensionTestRun;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Preservation Property Tests
 * 
 * Property 2: API_CRUD Test Cases Execute Through executeSingleTestCase Unchanged
 * 
 * IMPORTANT: Run on UNFIXED code to observe baseline behavior to preserve.
 * Tests should PASS on unfixed code, confirming existing API_CRUD execution works correctly.
 * After implementing the fix, these same tests should still PASS, confirming no regressions.
 */
@ExtendWith(MockitoExtension.class)
class ChromeExtensionApiCrudPreservationTest {

    @Mock
    private ChromeExtensionTestCaseRepository testCaseRepository;

    @Mock
    private ChromeExtensionTestRunRepository testRunRepository;

    @Mock
    private ChromeExtensionTestResultRepository testResultRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private ChromeExtensionRunnerClient runnerClient;

    @InjectMocks
    private ChromeExtensionTestExecutionServiceImpl testExecutionService;

    private Workspace workspace;
    private ChromeExtension extension;
    private ChromeExtensionTestRun testRun;
    private User triggeredBy;

    @BeforeEach
    void setUp() {
        workspace = new Workspace();
        workspace.setId(1L);
        workspace.setName("Test Workspace");

        extension = new ChromeExtension();
        extension.setId(1L);
        extension.setName("Test Extension");
        extension.setWorkspace(workspace);

        triggeredBy = new User();
        triggeredBy.setId(1L);
        triggeredBy.setEmail("test@example.com");

        testRun = new ChromeExtensionTestRun();
        testRun.setId(200L);
        testRun.setExtension(extension);
        testRun.setTriggeredBy(triggeredBy);
        testRun.setStatus(TestRunStatus.QUEUED);
    }

    /**
     * Verify API_CRUD test cases execute through the existing executeSingleTestCase() path.
     * This behavior must be preserved after adding BROWSER routing logic.
     */
    @Test
    void testApiCrudTestCase_ExecutesThroughHttpExecutor() {
        // Arrange: API_CRUD test case with valid endpoint
        ChromeExtensionTestCase apiTestCase = new ChromeExtensionTestCase();
        apiTestCase.setId(20L);
        apiTestCase.setName("GET /api/users");
        apiTestCase.setTestType(TestCaseType.API_CRUD);
        apiTestCase.setEnabled(true);
        apiTestCase.setExtension(extension);
        
        Map<String, Object> apiConfig = Map.of(
            "method", "GET",
            "endpoint", "/api/users",
            "headers", Map.of("Content-Type", "application/json")
        );
        apiTestCase.setConfiguration(apiConfig);
        
        Map<String, Object> expectedResult = Map.of(
            "statusCode", 200
        );
        apiTestCase.setExpectedResult(expectedResult);

        when(testRunRepository.findById(200L))
            .thenReturn(Optional.of(testRun));
        
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(1L))
            .thenReturn(List.of(apiTestCase));

        when(testResultRepository.save(any(ChromeExtensionTestResult.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(testRunRepository.save(any(ChromeExtensionTestRun.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act: Execute the test run
        ChromeExtensionTestRun result = testExecutionService.executeTestRun(
            1L, extension, testRun, triggeredBy, null
        );

        // Assert: Verify API_CRUD execution behavior is preserved
        
        // 1. Browser runner client should NOT be called for API_CRUD tests
        verify(runnerClient, never()).startBrowserRun(anyLong(), any());
        verify(runnerClient, never()).getBrowserRunStatus(anyLong());
        
        // 2. Test result should be saved (HTTP execution completed)
        verify(testResultRepository, times(1)).save(any(ChromeExtensionTestResult.class));
        
        // 3. Run status should be updated appropriately
        verify(testRunRepository, atLeastOnce()).save(any(ChromeExtensionTestRun.class));
        
        // 4. Result counters should be updated
        assertTrue(result.getTotalTests() >= 1, "Total tests should be counted");
    }

    /**
     * Verify API_CRUD test cases with different HTTP methods all execute through HTTP executor.
     */
    @Test
    void testApiCrudTestCases_WithDifferentMethods_AllExecuteThroughHttpExecutor() {
        // Arrange: Multiple API_CRUD test cases with different HTTP methods
        ChromeExtensionTestCase getTestCase = createApiTestCase(21L, "GET /api/users", "GET", "/api/users");
        ChromeExtensionTestCase postTestCase = createApiTestCase(22L, "POST /api/users", "POST", "/api/users");
        ChromeExtensionTestCase putTestCase = createApiTestCase(23L, "PUT /api/users/1", "PUT", "/api/users/1");
        ChromeExtensionTestCase deleteTestCase = createApiTestCase(24L, "DELETE /api/users/1", "DELETE", "/api/users/1");

        when(testRunRepository.findById(200L))
            .thenReturn(Optional.of(testRun));
        
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(1L))
            .thenReturn(List.of(getTestCase, postTestCase, putTestCase, deleteTestCase));

        when(testResultRepository.save(any(ChromeExtensionTestResult.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(testRunRepository.save(any(ChromeExtensionTestRun.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ChromeExtensionTestRun result = testExecutionService.executeTestRun(
            1L, extension, testRun, triggeredBy, null
        );

        // Assert: All API_CRUD tests execute through HTTP path
        verify(runnerClient, never()).startBrowserRun(anyLong(), any());
        verify(testResultRepository, times(4)).save(any(ChromeExtensionTestResult.class));
        assertEquals(4, result.getTotalTests(), "All 4 API_CRUD test cases should be counted");
    }

    /**
     * Verify non-BROWSER test types (API_CRUD, STORAGE_CRUD, DOM_INJECTION, INTEGRATION)
     * all execute through the existing HTTP executor path.
     */
    @Test
    void testNonBrowserTestTypes_ExecuteThroughHttpExecutor() {
        // Arrange: Test cases with different non-BROWSER types
        ChromeExtensionTestCase apiCrudCase = createApiTestCase(25L, "API CRUD Test", "GET", "/api/test");
        apiCrudCase.setTestType(TestCaseType.API_CRUD);
        
        ChromeExtensionTestCase storageCrudCase = createApiTestCase(26L, "Storage CRUD Test", "GET", "/api/storage");
        storageCrudCase.setTestType(TestCaseType.STORAGE_CRUD);
        
        ChromeExtensionTestCase domCase = createApiTestCase(27L, "DOM Injection Test", "GET", "/api/dom");
        domCase.setTestType(TestCaseType.DOM_INJECTION);
        
        ChromeExtensionTestCase integrationCase = createApiTestCase(28L, "Integration Test", "GET", "/api/integration");
        integrationCase.setTestType(TestCaseType.INTEGRATION);

        when(testRunRepository.findById(200L))
            .thenReturn(Optional.of(testRun));
        
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(1L))
            .thenReturn(List.of(apiCrudCase, storageCrudCase, domCase, integrationCase));

        when(testResultRepository.save(any(ChromeExtensionTestResult.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(testRunRepository.save(any(ChromeExtensionTestRun.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ChromeExtensionTestRun result = testExecutionService.executeTestRun(
            1L, extension, testRun, triggeredBy, null
        );

        // Assert: All non-BROWSER types use HTTP executor
        verify(runnerClient, never()).startBrowserRun(anyLong(), any());
        verify(testResultRepository, times(4)).save(any(ChromeExtensionTestResult.class));
        assertEquals(4, result.getTotalTests());
    }

    /**
     * Verify run status transitions remain unchanged for API_CRUD tests.
     */
    @Test
    void testApiCrudExecution_PreservesRunStatusTransitions() {
        // Arrange
        ChromeExtensionTestCase apiTestCase = createApiTestCase(29L, "Status Test", "GET", "/api/status");

        when(testRunRepository.findById(200L))
            .thenReturn(Optional.of(testRun));
        
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(1L))
            .thenReturn(List.of(apiTestCase));

        when(testResultRepository.save(any(ChromeExtensionTestResult.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(testRunRepository.save(any(ChromeExtensionTestRun.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ChromeExtensionTestRun result = testExecutionService.executeTestRun(
            1L, extension, testRun, triggeredBy, null
        );

        // Assert: Status transitions work correctly
        assertNotNull(result.getStartedAt(), "Started timestamp should be set");
        assertNotNull(result.getCompletedAt(), "Completed timestamp should be set");
        assertNotNull(result.getDurationMs(), "Duration should be calculated");
        assertNotEquals(TestRunStatus.QUEUED, result.getStatus(), "Status should transition from QUEUED");
    }

    /**
     * Verify error handling is preserved for API_CRUD tests.
     */
    @Test
    void testApiCrudExecution_PreservesErrorHandling() {
        // Arrange: API_CRUD test with invalid endpoint (triggers error)
        ChromeExtensionTestCase errorTestCase = createApiTestCase(30L, "Error Test", "GET", "invalid-url");

        when(testRunRepository.findById(200L))
            .thenReturn(Optional.of(testRun));
        
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(1L))
            .thenReturn(List.of(errorTestCase));

        when(testResultRepository.save(any(ChromeExtensionTestResult.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(testRunRepository.save(any(ChromeExtensionTestRun.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ChromeExtensionTestRun result = testExecutionService.executeTestRun(
            1L, extension, testRun, triggeredBy, null
        );

        // Assert: Error is handled and persisted
        verify(testResultRepository).save(argThat(testResult -> 
            testResult.getStatus() == TestResultStatus.ERROR
        ));
        assertTrue(result.getErrorTests() >= 1, "Error count should be incremented");
    }

    // Helper method to create API test case
    private ChromeExtensionTestCase createApiTestCase(Long id, String name, String method, String endpoint) {
        ChromeExtensionTestCase testCase = new ChromeExtensionTestCase();
        testCase.setId(id);
        testCase.setName(name);
        testCase.setTestType(TestCaseType.API_CRUD);
        testCase.setEnabled(true);
        testCase.setExtension(extension);
        
        Map<String, Object> config = Map.of(
            "method", method,
            "endpoint", endpoint
        );
        testCase.setConfiguration(config);
        
        Map<String, Object> expected = Map.of(
            "statusCode", 200
        );
        testCase.setExpectedResult(expected);
        
        return testCase;
    }
}
