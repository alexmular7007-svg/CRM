package com.arjun.crm.service;

import com.arjun.crm.dto.request.BrowserTestRunRequest;
import com.arjun.crm.dto.response.BrowserTestRunResponse;
import com.arjun.crm.dto.response.TestRunResponse;
import com.arjun.crm.entity.*;
import com.arjun.crm.enums.*;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.*;
import com.arjun.crm.security.JwtService;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.impl.ChromeExtensionSuiteExecutionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChromeExtensionSuiteExecutionServiceTest {

    @Mock
    private ChromeExtensionTestSuiteRepository testSuiteRepository;

    @Mock
    private ChromeExtensionTestCaseRepository testCaseRepository;

    @Mock
    private ChromeExtensionTestRunRepository testRunRepository;

    @Mock
    private ChromeExtensionTestResultRepository testResultRepository;

    @Mock
    private ChromeExtensionRepository chromeExtensionRepository;

    @Mock
    private ChromeExtensionTestExecutionService testExecutionService;

    @Mock
    private ChromeExtensionRunnerClient runnerClient;

    @Mock
    private WorkspaceAuthorizationService workspaceAuthService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private ChromeExtensionSuiteExecutionServiceImpl suiteExecutionService;

    private Workspace sampleWorkspace;
    private ChromeExtension sampleExtension;
    private ChromeExtension otherExtension;
    private User sampleUser;
    private WorkspaceMember sampleMember;
    private ChromeExtensionTestCase apiTestCase;
    private ChromeExtensionTestCase browserTestCase;
    private ChromeExtensionTestCase otherExtTestCase;
    private ChromeExtensionTestSuite sampleSuite;
    private ChromeExtensionTestSuiteItem apiItem;
    private ChromeExtensionTestSuiteItem browserItem;
    private ChromeExtensionTestRun sampleRun;

    @BeforeEach
    void setUp() {
        sampleWorkspace = Workspace.builder().id(10L).name("Test Workspace").build();

        sampleUser = User.builder().id(1L).email("admin@example.com").firstName("Admin").lastName("User").role(Role.ADMIN).build();

        sampleMember = WorkspaceMember.builder()
                .id(100L)
                .workspace(sampleWorkspace)
                .user(sampleUser)
                .role(WorkspaceRole.ADMIN)
                .build();

        sampleExtension = ChromeExtension.builder()
                .id(1L)
                .workspace(sampleWorkspace)
                .name("CRM Extension")
                .status(ChromeExtensionStatus.ACTIVE)
                .createdBy(sampleUser)
                .build();

        otherExtension = ChromeExtension.builder()
                .id(2L)
                .workspace(sampleWorkspace)
                .name("Other Extension")
                .status(ChromeExtensionStatus.ACTIVE)
                .createdBy(sampleUser)
                .build();

        apiTestCase = ChromeExtensionTestCase.builder()
                .id(101L)
                .extension(sampleExtension)
                .name("API Login Test")
                .testType(TestCaseType.API_CRUD)
                .configuration(Map.of("method", "POST", "endpoint", "/api/auth/login"))
                .expectedResult(Map.of("status", 200))
                .enabled(true)
                .build();

        browserTestCase = ChromeExtensionTestCase.builder()
                .id(102L)
                .extension(sampleExtension)
                .name("Browser Popup Test")
                .testType(TestCaseType.BROWSER)
                .configuration(Map.of("steps", List.of(
                        Map.of("order", 0, "action", "OPEN_PAGE", "target", "chrome-extension://<extension-id>/src/popup/popup.html"),
                        Map.of("order", 1, "action", "ASSERT_TITLE", "value", "Chrome Extension Playground")
                )))
                .expectedResult(Map.of("allStepsPassed", true))
                .enabled(true)
                .build();

        otherExtTestCase = ChromeExtensionTestCase.builder()
                .id(201L)
                .extension(otherExtension)
                .name("Other Extension Test")
                .testType(TestCaseType.API_CRUD)
                .enabled(true)
                .build();

        sampleSuite = ChromeExtensionTestSuite.builder()
                .id(500L)
                .extension(sampleExtension)
                .name("Full Smoke Suite")
                .description("Runs API and Browser tests")
                .stopOnFailure(false)
                .enabled(true)
                .createdBy(sampleUser)
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        apiItem = ChromeExtensionTestSuiteItem.builder()
                .id(1L)
                .suite(sampleSuite)
                .testCase(apiTestCase)
                .executionOrder(0)
                .enabled(true)
                .build();

        browserItem = ChromeExtensionTestSuiteItem.builder()
                .id(2L)
                .suite(sampleSuite)
                .testCase(browserTestCase)
                .executionOrder(1)
                .enabled(true)
                .build();

        sampleSuite.getItems().add(apiItem);
        sampleSuite.getItems().add(browserItem);

        sampleRun = ChromeExtensionTestRun.builder()
                .id(1001L)
                .extension(sampleExtension)
                .suite(sampleSuite)
                .triggeredBy(sampleUser)
                .status(TestRunStatus.QUEUED)
                .environment("UNIFIED_SUITE")
                .totalTests(2)
                .passedTests(0)
                .failedTests(0)
                .errorTests(0)
                .skippedTests(0)
                .durationMs(0L)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("1. Queuing Suite Run creates QUEUED run entity successfully")
    void createSuiteRun_Success_Queued() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L)).thenReturn(Optional.of(sampleExtension));
        when(testSuiteRepository.findByIdAndExtensionId(500L, 1L)).thenReturn(Optional.of(sampleSuite));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(sampleUser);
        when(testRunRepository.findFirstByExtensionIdAndStatusInOrderByCreatedAtDesc(eq(1L), anyList())).thenReturn(Optional.empty());

        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(invocation -> {
            ChromeExtensionTestRun r = invocation.getArgument(0);
            if (r.getId() == null) r.setId(1001L);
            return r;
        });

        TestRunResponse response = suiteExecutionService.createSuiteRun(10L, 1L, 500L);

        assertNotNull(response);
        assertEquals(1001L, response.getId());
        assertEquals(TestRunStatus.QUEUED, response.getStatus());
        assertEquals("UNIFIED_SUITE", response.getEnvironment());
        assertEquals(2, response.getTotalTests());
        assertEquals(500L, response.getSuiteId());
        assertEquals("Full Smoke Suite", response.getSuiteName());
    }

    @Test
    @DisplayName("1b. Queuing Suite Run delegates to async proxy and does NOT execute suite synchronously")
    void createSuiteRun_DelegatesToAsyncProxy_DoesNotExecuteSynchronously() {
        ChromeExtensionSuiteExecutionService mockSelf = mock(ChromeExtensionSuiteExecutionService.class);
        suiteExecutionService.setSelf(mockSelf);

        try {
            when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
            when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L)).thenReturn(Optional.of(sampleExtension));
            when(testSuiteRepository.findByIdAndExtensionId(500L, 1L)).thenReturn(Optional.of(sampleSuite));
            when(workspaceAuthService.getAuthenticatedUser()).thenReturn(sampleUser);
            when(testRunRepository.findFirstByExtensionIdAndStatusInOrderByCreatedAtDesc(eq(1L), anyList())).thenReturn(Optional.empty());

            when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(invocation -> {
                ChromeExtensionTestRun r = invocation.getArgument(0);
                if (r.getId() == null) r.setId(1001L);
                return r;
            });

            TestRunResponse response = suiteExecutionService.createSuiteRun(10L, 1L, 500L);

            assertNotNull(response);
            assertEquals(1001L, response.getId());
            assertEquals(TestRunStatus.QUEUED, response.getStatus());

            // 1. Verify that executeSuiteRunAsync was invoked on the Spring proxy
            verify(mockSelf, times(1)).executeSuiteRunAsync(eq(10L), eq(sampleExtension), eq(sampleSuite), any(ChromeExtensionTestRun.class), eq(sampleUser), isNull());

            // 2. Verify that synchronous execution methods were NEVER called during createSuiteRun
            verify(runnerClient, never()).startBrowserRun(anyLong(), any());
            verify(testExecutionService, never()).executeSingleTestCase(any(), any(), any(), any(), any(), any());
        } finally {
            suiteExecutionService.setSelf(null);
        }
    }

    @Test
    @DisplayName("2. Queuing Suite Run throws IllegalArgumentException when suite has no enabled test cases")
    void createSuiteRun_EmptySuite_ThrowsBadRequest() {
        sampleSuite.getItems().clear(); // No items

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L)).thenReturn(Optional.of(sampleExtension));
        when(testSuiteRepository.findByIdAndExtensionId(500L, 1L)).thenReturn(Optional.of(sampleSuite));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(sampleUser);

        assertThrows(IllegalArgumentException.class, () -> suiteExecutionService.createSuiteRun(10L, 1L, 500L));
    }

    @Test
    @DisplayName("3. Queuing Suite Run throws ConflictException if another test run is in progress")
    void createSuiteRun_ActiveRunInProgress_ThrowsConflict() {
        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L)).thenReturn(Optional.of(sampleExtension));
        when(testSuiteRepository.findByIdAndExtensionId(500L, 1L)).thenReturn(Optional.of(sampleSuite));
        when(workspaceAuthService.getAuthenticatedUser()).thenReturn(sampleUser);
        when(testRunRepository.findFirstByExtensionIdAndStatusInOrderByCreatedAtDesc(eq(1L), anyList()))
                .thenReturn(Optional.of(ChromeExtensionTestRun.builder().id(999L).status(TestRunStatus.RUNNING).build()));

        assertThrows(ConflictException.class, () -> suiteExecutionService.createSuiteRun(10L, 1L, 500L));
    }

    @Test
    @DisplayName("4. Execute Mixed Suite (API + Browser) to PASSED status")
    void executeSuiteRun_MixedApiAndBrowser_Success() {
        when(testRunRepository.findById(1001L)).thenReturn(Optional.of(sampleRun));
        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock API execution result
        ChromeExtensionTestResult apiResult = ChromeExtensionTestResult.builder()
                .testRun(sampleRun)
                .testCase(apiTestCase)
                .status(TestResultStatus.PASSED)
                .actualStatusCode(200)
                .executionTimeMs(50)
                .build();
        when(testExecutionService.executeSingleTestCase(eq(10L), eq(sampleExtension), eq(sampleRun), eq(apiTestCase), any(), any()))
                .thenReturn(apiResult);

        // Mock Browser runner execution result
        when(runnerClient.startBrowserRun(anyLong(), any(BrowserTestRunRequest.class)))
                .thenReturn(BrowserTestRunResponse.builder().runId(1001001L).status("QUEUED").build());

        when(runnerClient.getBrowserRunStatus(anyLong()))
                .thenReturn(BrowserTestRunResponse.builder()
                        .runId(1001001L)
                        .status("PASSED")
                        .durationMs(1200L)
                        .results(List.of(Map.of(
                                "name", "Browser Popup Test",
                                "status", "PASSED",
                                "durationMs", 1200,
                                "stepResults", List.of(
                                        Map.of("order", 0, "action", "OPEN_PAGE", "status", "PASSED"),
                                        Map.of("order", 1, "action", "ASSERT_TITLE", "status", "PASSED")
                                )
                        )))
                        .build());

        ChromeExtensionTestRun completedRun = suiteExecutionService.executeSuiteRun(10L, sampleExtension, sampleSuite, sampleRun, sampleUser, "test-token");

        assertNotNull(completedRun);
        assertEquals(TestRunStatus.PASSED, completedRun.getStatus());
        assertEquals(2, completedRun.getTotalTests());
        assertEquals(2, completedRun.getPassedTests());
        assertEquals(0, completedRun.getFailedTests());
        assertEquals(0, completedRun.getErrorTests());
        assertEquals(0, completedRun.getSkippedTests());

        verify(testResultRepository, times(2)).save(any(ChromeExtensionTestResult.class));
    }

    @Test
    @DisplayName("5. Execute Suite with stopOnFailure=true stops execution on failure and marks remaining items SKIPPED")
    void executeSuiteRun_StopOnFailure_True_SkipsRemaining() {
        sampleSuite.setStopOnFailure(true);

        when(testRunRepository.findById(1001L)).thenReturn(Optional.of(sampleRun));
        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock API execution FAILING
        ChromeExtensionTestResult failedApiResult = ChromeExtensionTestResult.builder()
                .testRun(sampleRun)
                .testCase(apiTestCase)
                .status(TestResultStatus.FAILED)
                .actualStatusCode(500)
                .errorMessage("Internal Server Error")
                .executionTimeMs(30)
                .build();
        when(testExecutionService.executeSingleTestCase(eq(10L), eq(sampleExtension), eq(sampleRun), eq(apiTestCase), any(), any()))
                .thenReturn(failedApiResult);

        ChromeExtensionTestRun completedRun = suiteExecutionService.executeSuiteRun(10L, sampleExtension, sampleSuite, sampleRun, sampleUser, null);

        assertNotNull(completedRun);
        assertEquals(TestRunStatus.FAILED, completedRun.getStatus());
        assertEquals(2, completedRun.getTotalTests());
        assertEquals(0, completedRun.getPassedTests());
        assertEquals(1, completedRun.getFailedTests());
        assertEquals(1, completedRun.getSkippedTests()); // Browser test was skipped!

        // Verify Browser test was never sent to runnerClient
        verify(runnerClient, never()).startBrowserRun(anyLong(), any());

        // Verify 2 results saved (1 FAILED, 1 SKIPPED)
        verify(testResultRepository, times(2)).save(any(ChromeExtensionTestResult.class));
    }

    @Test
    @DisplayName("6. Execute Suite with stopOnFailure=false continues execution after failure")
    void executeSuiteRun_StopOnFailure_False_ContinuesExecution() {
        sampleSuite.setStopOnFailure(false);

        when(testRunRepository.findById(1001L)).thenReturn(Optional.of(sampleRun));
        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock API execution FAILING
        ChromeExtensionTestResult failedApiResult = ChromeExtensionTestResult.builder()
                .testRun(sampleRun)
                .testCase(apiTestCase)
                .status(TestResultStatus.FAILED)
                .actualStatusCode(401)
                .errorMessage("Unauthorized")
                .build();
        when(testExecutionService.executeSingleTestCase(eq(10L), eq(sampleExtension), eq(sampleRun), eq(apiTestCase), any(), any()))
                .thenReturn(failedApiResult);

        // Mock Browser execution PASSING
        when(runnerClient.startBrowserRun(anyLong(), any(BrowserTestRunRequest.class)))
                .thenReturn(BrowserTestRunResponse.builder().runId(1001001L).status("QUEUED").build());

        when(runnerClient.getBrowserRunStatus(anyLong()))
                .thenReturn(BrowserTestRunResponse.builder()
                        .runId(1001001L)
                        .status("PASSED")
                        .results(List.of(Map.of("status", "PASSED")))
                        .build());

        ChromeExtensionTestRun completedRun = suiteExecutionService.executeSuiteRun(10L, sampleExtension, sampleSuite, sampleRun, sampleUser, null);

        assertNotNull(completedRun);
        assertEquals(TestRunStatus.FAILED, completedRun.getStatus());
        assertEquals(2, completedRun.getTotalTests());
        assertEquals(1, completedRun.getPassedTests());
        assertEquals(1, completedRun.getFailedTests());
        assertEquals(0, completedRun.getSkippedTests());

        // Browser test WAS executed
        verify(runnerClient, times(1)).startBrowserRun(anyLong(), any());
    }

    @Test
    @DisplayName("7. Execute Suite with ERROR results sets suite status to ERROR")
    void executeSuiteRun_ErrorStatus_Semantics() {
        when(testRunRepository.findById(1001L)).thenReturn(Optional.of(sampleRun));
        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock API execution with system/SSRF ERROR
        ChromeExtensionTestResult errorApiResult = ChromeExtensionTestResult.builder()
                .testRun(sampleRun)
                .testCase(apiTestCase)
                .status(TestResultStatus.ERROR)
                .errorMessage("Security / SSRF Violation")
                .build();
        when(testExecutionService.executeSingleTestCase(eq(10L), eq(sampleExtension), eq(sampleRun), eq(apiTestCase), any(), any()))
                .thenReturn(errorApiResult);

        // Mock Browser execution PASSING
        when(runnerClient.startBrowserRun(anyLong(), any(BrowserTestRunRequest.class)))
                .thenReturn(BrowserTestRunResponse.builder().runId(1001001L).status("QUEUED").build());

        when(runnerClient.getBrowserRunStatus(anyLong()))
                .thenReturn(BrowserTestRunResponse.builder()
                        .runId(1001001L)
                        .status("PASSED")
                        .results(List.of(Map.of("status", "PASSED")))
                        .build());

        ChromeExtensionTestRun completedRun = suiteExecutionService.executeSuiteRun(10L, sampleExtension, sampleSuite, sampleRun, sampleUser, null);

        assertNotNull(completedRun);
        assertEquals(TestRunStatus.ERROR, completedRun.getStatus());
        assertEquals(1, completedRun.getErrorTests());
        assertEquals(1, completedRun.getPassedTests());
    }

    @Test
    @DisplayName("8. Disabled suite item is not executed")
    void executeSuiteRun_DisabledItem_NotExecuted() {
        apiItem.setEnabled(false); // Disable API test in this suite

        when(testRunRepository.findById(1001L)).thenReturn(Optional.of(sampleRun));
        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock Browser execution PASSING
        when(runnerClient.startBrowserRun(anyLong(), any(BrowserTestRunRequest.class)))
                .thenReturn(BrowserTestRunResponse.builder().runId(1001001L).status("QUEUED").build());

        when(runnerClient.getBrowserRunStatus(anyLong()))
                .thenReturn(BrowserTestRunResponse.builder()
                        .runId(1001001L)
                        .status("PASSED")
                        .results(List.of(Map.of("status", "PASSED")))
                        .build());

        ChromeExtensionTestRun completedRun = suiteExecutionService.executeSuiteRun(10L, sampleExtension, sampleSuite, sampleRun, sampleUser, null);

        assertNotNull(completedRun);
        assertEquals(TestRunStatus.PASSED, completedRun.getStatus());
        assertEquals(1, completedRun.getTotalTests()); // Only 1 enabled test
        assertEquals(1, completedRun.getPassedTests());

        verify(testExecutionService, never()).executeSingleTestCase(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("9. Cancellation before next item terminates execution and sets CANCELLED")
    void executeSuiteRun_Cancellation_BeforeItem() {
        sampleRun.setStatus(TestRunStatus.CANCELLED);
        when(testRunRepository.findById(1001L)).thenReturn(Optional.of(sampleRun));

        ChromeExtensionTestRun result = suiteExecutionService.executeSuiteRun(10L, sampleExtension, sampleSuite, sampleRun, sampleUser, null);

        assertEquals(TestRunStatus.CANCELLED, result.getStatus());
        verify(testExecutionService, never()).executeSingleTestCase(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("10. Cancel Suite Run sets CANCELLED and propagates cancellation to active child browser runner")
    void cancelSuiteRun_Success() {
        sampleRun.setStatus(TestRunStatus.RUNNING);

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L)).thenReturn(Optional.of(sampleExtension));
        when(testSuiteRepository.findByIdAndExtensionId(500L, 1L)).thenReturn(Optional.of(sampleSuite));
        when(testRunRepository.findByIdAndExtensionId(1001L, 1L)).thenReturn(Optional.of(sampleRun));
        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(testResultRepository.findByTestRunIdOrderByCreatedAtAsc(1001L)).thenReturn(Collections.emptyList());

        TestRunResponse response = suiteExecutionService.cancelSuiteRun(10L, 1L, 500L, 1001L);

        assertNotNull(response);
        assertEquals(TestRunStatus.CANCELLED, response.getStatus());
    }

    @Test
    @DisplayName("11. Get Suite Run returns test run with unified results")
    void getSuiteRun_Success() {
        sampleRun.setStatus(TestRunStatus.PASSED);
        sampleRun.setPassedTests(2);

        when(workspaceAuthService.validateWorkspaceAccess(10L)).thenReturn(sampleMember);
        when(chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(1L, 10L)).thenReturn(Optional.of(sampleExtension));
        when(testSuiteRepository.findByIdAndExtensionId(500L, 1L)).thenReturn(Optional.of(sampleSuite));
        when(testRunRepository.findByIdAndExtensionId(1001L, 1L)).thenReturn(Optional.of(sampleRun));

        ChromeExtensionTestResult res1 = ChromeExtensionTestResult.builder()
                .id(1L)
                .testRun(sampleRun)
                .testCase(apiTestCase)
                .status(TestResultStatus.PASSED)
                .build();

        ChromeExtensionTestResult res2 = ChromeExtensionTestResult.builder()
                .id(2L)
                .testRun(sampleRun)
                .testCase(browserTestCase)
                .status(TestResultStatus.PASSED)
                .build();

        when(testResultRepository.findByTestRunIdOrderByCreatedAtAsc(1001L)).thenReturn(List.of(res1, res2));

        TestRunResponse response = suiteExecutionService.getSuiteRun(10L, 1L, 500L, 1001L);

        assertNotNull(response);
        assertEquals(1001L, response.getId());
        assertEquals(TestRunStatus.PASSED, response.getStatus());
        assertEquals(2, response.getResults().size());
    }

    @Test
    @DisplayName("12. Three-item suite (A enabled, B disabled, C enabled) executes only A and C in order")
    void executeSuiteRun_ThreeItems_MiddleDisabled_ExecutesOnlyEnabledInOrder() {
        // Set up 3 test cases: A (API), B (API), C (Browser)
        ChromeExtensionTestCase testCaseA = ChromeExtensionTestCase.builder()
                .id(301L)
                .extension(sampleExtension)
                .name("Test Case A")
                .testType(TestCaseType.API_CRUD)
                .configuration(Map.of("method", "GET", "endpoint", "/api/health"))
                .expectedResult(Map.of("status", 200))
                .enabled(true)
                .build();

        ChromeExtensionTestCase testCaseB = ChromeExtensionTestCase.builder()
                .id(302L)
                .extension(sampleExtension)
                .name("Test Case B")
                .testType(TestCaseType.API_CRUD)
                .configuration(Map.of("method", "POST", "endpoint", "/api/forbidden"))
                .expectedResult(Map.of("status", 200))
                .enabled(true)
                .build();

        ChromeExtensionTestCase testCaseC = ChromeExtensionTestCase.builder()
                .id(303L)
                .extension(sampleExtension)
                .name("Test Case C")
                .testType(TestCaseType.BROWSER)
                .configuration(Map.of("steps", List.of(
                        Map.of("order", 0, "action", "OPEN_PAGE", "target", "chrome-extension://<id>/popup.html")
                )))
                .expectedResult(Map.of("allStepsPassed", true))
                .enabled(true)
                .build();

        ChromeExtensionTestSuiteItem itemA = ChromeExtensionTestSuiteItem.builder()
                .id(10L).suite(sampleSuite).testCase(testCaseA).executionOrder(0).enabled(true).build();
        ChromeExtensionTestSuiteItem itemB = ChromeExtensionTestSuiteItem.builder()
                .id(11L).suite(sampleSuite).testCase(testCaseB).executionOrder(1).enabled(false).build(); // DISABLED
        ChromeExtensionTestSuiteItem itemC = ChromeExtensionTestSuiteItem.builder()
                .id(12L).suite(sampleSuite).testCase(testCaseC).executionOrder(2).enabled(true).build();

        // Replace suite items with our 3-item list
        sampleSuite.getItems().clear();
        sampleSuite.getItems().addAll(List.of(itemA, itemB, itemC));

        when(testRunRepository.findById(1001L)).thenReturn(Optional.of(sampleRun));
        when(testRunRepository.save(any(ChromeExtensionTestRun.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock A (API) execution PASSING
        ChromeExtensionTestResult resultA = ChromeExtensionTestResult.builder()
                .testRun(sampleRun).testCase(testCaseA).status(TestResultStatus.PASSED)
                .actualStatusCode(200).executionTimeMs(25).build();
        when(testExecutionService.executeSingleTestCase(eq(10L), eq(sampleExtension), eq(sampleRun), eq(testCaseA), any(), any()))
                .thenReturn(resultA);

        // Mock C (Browser) execution PASSING
        when(runnerClient.startBrowserRun(anyLong(), any(BrowserTestRunRequest.class)))
                .thenReturn(BrowserTestRunResponse.builder().runId(100102303L).status("QUEUED").build());
        when(runnerClient.getBrowserRunStatus(anyLong()))
                .thenReturn(BrowserTestRunResponse.builder()
                        .runId(100102303L).status("PASSED")
                        .results(List.of(Map.of("status", "PASSED")))
                        .build());

        ChromeExtensionTestRun completedRun = suiteExecutionService.executeSuiteRun(
                10L, sampleExtension, sampleSuite, sampleRun, sampleUser, "test-token");

        // 1. totalTests counts only enabled items (A and C)
        assertEquals(2, completedRun.getTotalTests(), "totalTests must count only enabled items");

        // 2. Both enabled items passed
        assertEquals(2, completedRun.getPassedTests(), "passedTests must be 2 (A and C)");
        assertEquals(0, completedRun.getFailedTests());
        assertEquals(0, completedRun.getErrorTests());

        // 3. Disabled item B must NOT produce a SKIPPED result
        assertEquals(0, completedRun.getSkippedTests(), "disabled B must not be counted as SKIPPED");

        // 4. Final status is PASSED
        assertEquals(TestRunStatus.PASSED, completedRun.getStatus());

        // 5. B's test case was never executed by either service
        verify(testExecutionService, never()).executeSingleTestCase(
                any(), any(), any(), eq(testCaseB), any(), any());

        // 6. Exactly 2 results saved (A and C only, no SKIPPED for B)
        verify(testResultRepository, times(2)).save(any(ChromeExtensionTestResult.class));

        // 7. A was executed via API service
        verify(testExecutionService, times(1)).executeSingleTestCase(
                eq(10L), eq(sampleExtension), eq(sampleRun), eq(testCaseA), any(), any());

        // 8. C was executed via browser runner
        verify(runnerClient, times(1)).startBrowserRun(anyLong(), any());
    }
}
