package com.arjun.crm.service;

import com.arjun.crm.dto.request.BrowserTestCaseDto;
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

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Bug Condition Exploration Test
 * 
 * Property 1: Bug Condition - BROWSER Test Case Routes to Browser Runner (NOT API Executor)
 * 
 * CRITICAL: This test encodes the EXPECTED behavior after the fix.
 * On UNFIXED code, this test MUST FAIL - confirming the bug exists.
 * After implementing the fix, this same test MUST PASS - confirming the bug is resolved.
 */
@ExtendWith(MockitoExtension.class)
class ChromeExtensionBrowserRoutingBugConditionTest {

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
    private ChromeExtensionTestCase browserTestCase;
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
        testRun.setId(100L);
        testRun.setExtension(extension);
        testRun.setTriggeredBy(triggeredBy);
        testRun.setStatus(TestRunStatus.QUEUED);

        // Create BROWSER test case with no endpoint (empty)
        browserTestCase = new ChromeExtensionTestCase();
        browserTestCase.setId(15L);
        browserTestCase.setName("Browser Popup Smoke Test");
        browserTestCase.setTestType(TestCaseType.BROWSER);
        browserTestCase.setEnabled(true);
        browserTestCase.setExtension(extension);
        
        // BROWSER test case has browser steps, NOT an API endpoint
        Map<String, Object> browserConfig = Map.of(
            "steps", List.of(
                Map.of("action", "OPEN_PAGE", "target", "popup.html"),
                Map.of("action", "ASSERT_VISIBLE", "selector", "#ext-status-badge"),
                Map.of("action", "ASSERT_TEXT", "selector", "#ext-status-badge", "expectedText", "READY"),
                Map.of("action", "SCREENSHOT", "filename", "browser_popup_smoke")
            )
        );
        browserTestCase.setConfiguration(browserConfig);
    }

    /**
     * Test that BROWSER test cases are executed through ChromeExtensionRunnerClient,
     * NOT through executeSingleTestCase().
     * 
     * Expected Behavior (after fix):
     * - Browser runner client is called with proper BrowserTestRunRequest
     * - Test does NOT fail with "Endpoint URL cannot be empty"
     * - Result status is PASSED/FAILED/ERROR based on browser execution (not endpoint validation error)
     */
    @Test
    void testBrowserTestCase_RoutesToBrowserRunner_NotApiExecutor() {
        // Arrange: Setup mocks for browser execution path
        when(testRunRepository.findById(100L))
            .thenReturn(Optional.of(testRun));
        
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(1L))
            .thenReturn(List.of(browserTestCase));

        // Mock browser runner response (successful execution)
        BrowserTestRunResponse startResponse = new BrowserTestRunResponse();
        startResponse.setStatus("RUNNING");
        startResponse.setRunId(100000L); // Child runner ID

        BrowserTestRunResponse finalResponse = new BrowserTestRunResponse();
        finalResponse.setStatus("PASSED");
        finalResponse.setRunId(100000L);
        finalResponse.setResults(List.of(
            Map.of(
                "status", "PASSED",
                "stepResults", List.of(
                    Map.of("action", "OPEN_PAGE", "status", "PASSED"),
                    Map.of("action", "ASSERT_VISIBLE", "status", "PASSED"),
                    Map.of("action", "ASSERT_TEXT", "status", "PASSED"),
                    Map.of("action", "SCREENSHOT", "status", "PASSED")
                )
            )
        ));

        when(runnerClient.startBrowserRun(anyLong(), any(BrowserTestRunRequest.class)))
            .thenReturn(startResponse);
        
        when(runnerClient.getBrowserRunStatus(anyLong()))
            .thenReturn(finalResponse);

        when(testResultRepository.save(any(ChromeExtensionTestResult.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(testRunRepository.save(any(ChromeExtensionTestRun.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act: Execute the test run
        ChromeExtensionTestRun result = testExecutionService.executeTestRun(
            1L, 
            extension, 
            testRun, 
            triggeredBy, 
            null
        );

        // Assert: Verify expected behavior after fix
        
        // 1. Browser runner client MUST be called (not HTTP executor)
        verify(runnerClient, atLeastOnce()).startBrowserRun(anyLong(), any(BrowserTestRunRequest.class));
        verify(runnerClient, atLeastOnce()).getBrowserRunStatus(anyLong());

        // 2. Test result must NOT contain "Endpoint URL cannot be empty" error
        verify(testResultRepository).save(argThat(testResult -> {
            String errorMessage = testResult.getErrorMessage();
            return errorMessage == null || !errorMessage.contains("Endpoint URL cannot be empty");
        }));

        // 3. Test run should complete successfully (not ERROR due to endpoint validation)
        assertNotEquals(TestRunStatus.ERROR, result.getStatus(), 
            "Test run should not be in ERROR status due to empty endpoint validation");

        // 4. Result status should be based on browser execution outcome (PASSED in this mock)
        verify(testResultRepository).save(argThat(testResult -> {
            TestResultStatus status = testResult.getStatus();
            return status == TestResultStatus.PASSED || 
                   status == TestResultStatus.FAILED || 
                   status == TestResultStatus.ERROR;
        }));
    }

    /**
     * Test that verifies BROWSER test case with empty endpoint configuration
     * does NOT throw "Endpoint URL cannot be empty" error when routed correctly.
     */
    @Test
    void testBrowserTestCaseWithEmptyEndpoint_DoesNotFailWithEndpointError() {
        // Arrange: BROWSER test case with explicitly empty endpoint
        Map<String, Object> configWithEmptyEndpoint = Map.of(
            "endpoint", "",
            "steps", List.of(
                Map.of("action", "OPEN_PAGE", "target", "popup.html")
            )
        );
        browserTestCase.setConfiguration(configWithEmptyEndpoint);

        when(testRunRepository.findById(100L))
            .thenReturn(Optional.of(testRun));
        
        when(testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(1L))
            .thenReturn(List.of(browserTestCase));

        BrowserTestRunResponse runnerResponse = new BrowserTestRunResponse();
        runnerResponse.setStatus("PASSED");
        runnerResponse.setRunId(100000L);

        when(runnerClient.startBrowserRun(anyLong(), any(BrowserTestRunRequest.class)))
            .thenReturn(runnerResponse);
        
        when(runnerClient.getBrowserRunStatus(anyLong()))
            .thenReturn(runnerResponse);

        when(testResultRepository.save(any(ChromeExtensionTestResult.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(testRunRepository.save(any(ChromeExtensionTestRun.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ChromeExtensionTestRun result = testExecutionService.executeTestRun(
            1L, extension, testRun, triggeredBy, null
        );

        // Assert: No "Endpoint URL cannot be empty" error
        verify(testResultRepository).save(argThat(testResult -> {
            String error = testResult.getErrorMessage();
            boolean noEndpointError = (error == null || !error.contains("Endpoint URL cannot be empty"));
            
            if (!noEndpointError) {
                System.err.println("FAILED: BROWSER test case incorrectly routed to API executor!");
                System.err.println("Error message: " + error);
            }
            
            return noEndpointError;
        }));
    }
}
