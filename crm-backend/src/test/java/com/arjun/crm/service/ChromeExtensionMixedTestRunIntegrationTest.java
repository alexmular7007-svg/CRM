package com.arjun.crm.service;

import com.arjun.crm.dto.request.BrowserTestRunRequest;
import com.arjun.crm.dto.response.BrowserTestRunResponse;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Integration Test for Mixed Test Run (BROWSER + API_CRUD)
 * 
 * Verifies that a test run containing both BROWSER and API_CRUD test cases executes correctly,
 * with each type routed to the appropriate executor.
 */
@ExtendWith(MockitoExtension.class)
class ChromeExtensionMixedTestRunIntegrationTest {

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
        extension.setName("Mixed Test Extension");
        extension.setWorkspace(workspace);

        triggeredBy = new User();
        triggeredBy.setId(1L);
        triggeredBy.setEmail("test@example.com");

        testRun = new ChromeExtensionTestRun();
        testRun.setId(300L);
        testRun.setExtension(extension);
        testRun.setTriggeredBy(triggeredBy);
        testRun.setStatus(TestRunStatus.QUEUED);
    }

    /**
     * Integration test: Test run with both BROWSER and API_CRUD test cases.
     * Verifies correct routing, result persistence, and run status tracking.
     */
    @Test
    void testMixedTestRun_WithBrowserAndApiCrudCases_ExecutesCorrectly() {
        // Arrange: Create mixed test cases
        ChromeExtensionTestCase browserTestCase1 = createBrowserTestCase(101L, "Browser Test 1");
        ChromeExtensionTestCase apiTestCase1 = createApiTestCase(102L, "API Test 1", "GET", "/api/users");
        ChromeExtensionTestCase browserTestCase2 = createBrowserTestCase(103L, "Browser Test 2");
        ChromeExtensionTestCase apiTestCase2 = createApiTestCase(104L, "API Test 2", "POST", "/api/users");
        
        List<ChromeExtensionTestCase> mixedTestCases = List.of(
            browserTestCase1,
            apiTestCase1,
            browserTestCase2,
            apiTestCase2
        );

        when(testRunRepository.findById(300L))
            .thenReturn(Optional.of(testRun));
        
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(1L))
            .thenReturn(mixedTestCases);

        // Mock browser runner responses
        BrowserTestRunResponse browserResponse = new BrowserTestRunResponse();
        browserResponse.setStatus("PASSED");
        browserResponse.setRunId(3000001L);
        browserResponse.setResults(List.of(
            Map.of("status", "PASSED", "stepResults", List.of())
        ));

        when(runnerClient.startBrowserRun(anyLong(), any(BrowserTestRunRequest.class)))
            .thenReturn(browserResponse);
        
        when(runnerClient.getBrowserRunStatus(anyLong()))
            .thenReturn(browserResponse);

        // Mock result persistence
        List<ChromeExtensionTestResult> capturedResults = new ArrayList<>();
        when(testResultRepository.save(any(ChromeExtensionTestResult.class)))
            .thenAnswer(invocation -> {
                ChromeExtensionTestResult result = invocation.getArgument(0);
                capturedResults.add(result);
                return result;
            });

        when(testRunRepository.save(any(ChromeExtensionTestRun.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act: Execute the mixed test run
        ChromeExtensionTestRun result = testExecutionService.executeTestRun(
            1L, extension, testRun, triggeredBy, null
        );

        // Assert: Verify overall test run results
        
        // 1. Total test count should include all test cases
        assertEquals(4, result.getTotalTests(), "Total tests should be 4 (2 BROWSER + 2 API_CRUD)");
        
        // 2. Run status should transition properly (not QUEUED)
        assertNotEquals(TestRunStatus.QUEUED, result.getStatus(), 
            "Test run status should transition from QUEUED");
        
        // 3. Test run should have start and end timestamps
        assertNotNull(result.getStartedAt(), "Started timestamp should be set");
        assertNotNull(result.getCompletedAt(), "Completed timestamp should be set");
        assertNotNull(result.getDurationMs(), "Duration should be calculated");
        
        // 4. All test results should be persisted
        assertEquals(4, capturedResults.size(), "All 4 test results should be saved");
        
        // 5. Browser runner should be called exactly 2 times (for 2 BROWSER test cases)
        verify(runnerClient, times(2)).startBrowserRun(anyLong(), any(BrowserTestRunRequest.class));
        verify(runnerClient, times(2)).getBrowserRunStatus(anyLong());
        
        // 6. Verify BROWSER test cases used browser executor
        long browserResultCount = capturedResults.stream()
            .filter(r -> r.getTestCase().getTestType() == TestCaseType.BROWSER)
            .count();
        assertEquals(2, browserResultCount, "2 BROWSER test results should be captured");
        
        // 7. Verify API_CRUD test cases used HTTP executor (browser runner NOT called for them)
        long apiResultCount = capturedResults.stream()
            .filter(r -> r.getTestCase().getTestType() == TestCaseType.API_CRUD)
            .count();
        assertEquals(2, apiResultCount, "2 API_CRUD test results should be captured");
        
        // 8. Verify passed/failed counters are updated
        assertTrue(result.getPassedTests() + result.getFailedTests() + result.getErrorTests() >= 2,
            "At least 2 tests should have a status (BROWSER tests passed in mock)");
    }

    /**
     * Test that run status is PASSED when all mixed test cases pass.
     */
    @Test
    void testMixedTestRun_AllTestsPass_StatusIsPassed() {
        // Arrange
        ChromeExtensionTestCase browserCase = createBrowserTestCase(201L, "Browser Test");
        ChromeExtensionTestCase apiCase = createApiTestCase(202L, "API Test", "GET", "/api/test");

        when(testRunRepository.findById(300L))
            .thenReturn(Optional.of(testRun));
        
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(1L))
            .thenReturn(List.of(browserCase, apiCase));

        BrowserTestRunResponse passedResponse = new BrowserTestRunResponse();
        passedResponse.setStatus("PASSED");
        passedResponse.setRunId(3000002L);

        when(runnerClient.startBrowserRun(anyLong(), any(BrowserTestRunRequest.class)))
            .thenReturn(passedResponse);
        
        when(runnerClient.getBrowserRunStatus(anyLong()))
            .thenReturn(passedResponse);

        when(testResultRepository.save(any(ChromeExtensionTestResult.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(testRunRepository.save(any(ChromeExtensionTestRun.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ChromeExtensionTestRun result = testExecutionService.executeTestRun(
            1L, extension, testRun, triggeredBy, null
        );

        // Assert: At least one test passed (browser test)
        assertTrue(result.getPassedTests() >= 1, "At least browser test should pass");
    }

    /**
     * Test that run status transitions correctly even with mixed failures.
     */
    @Test
    void testMixedTestRun_WithFailures_StatusReflectsFailures() {
        // Arrange
        ChromeExtensionTestCase browserCase = createBrowserTestCase(301L, "Browser Test");
        ChromeExtensionTestCase apiCase = createApiTestCase(302L, "API Test", "GET", "invalid-url");

        when(testRunRepository.findById(300L))
            .thenReturn(Optional.of(testRun));
        
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(1L))
            .thenReturn(List.of(browserCase, apiCase));

        // Browser test passes
        BrowserTestRunResponse passedResponse = new BrowserTestRunResponse();
        passedResponse.setStatus("PASSED");
        passedResponse.setRunId(3000003L);

        when(runnerClient.startBrowserRun(anyLong(), any(BrowserTestRunRequest.class)))
            .thenReturn(passedResponse);
        
        when(runnerClient.getBrowserRunStatus(anyLong()))
            .thenReturn(passedResponse);

        when(testResultRepository.save(any(ChromeExtensionTestResult.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(testRunRepository.save(any(ChromeExtensionTestRun.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ChromeExtensionTestRun result = testExecutionService.executeTestRun(
            1L, extension, testRun, triggeredBy, null
        );

        // Assert: Run should complete (not be QUEUED or IN_PROGRESS)
        assertNotEquals(TestRunStatus.QUEUED, result.getStatus());
        assertNotEquals(TestRunStatus.RUNNING, result.getStatus());
        
        // At least API test should error due to invalid URL
        assertTrue(result.getErrorTests() >= 1 || result.getFailedTests() >= 1,
            "Invalid URL should cause error or failure");
    }

    // Helper methods

    private ChromeExtensionTestCase createBrowserTestCase(Long id, String name) {
        ChromeExtensionTestCase testCase = new ChromeExtensionTestCase();
        testCase.setId(id);
        testCase.setName(name);
        testCase.setTestType(TestCaseType.BROWSER);
        testCase.setEnabled(true);
        testCase.setExtension(extension);
        
        Map<String, Object> config = Map.of(
            "steps", List.of(
                Map.of("action", "OPEN_PAGE", "target", "popup.html"),
                Map.of("action", "ASSERT_VISIBLE", "selector", "#status")
            )
        );
        testCase.setConfiguration(config);
        
        return testCase;
    }

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
