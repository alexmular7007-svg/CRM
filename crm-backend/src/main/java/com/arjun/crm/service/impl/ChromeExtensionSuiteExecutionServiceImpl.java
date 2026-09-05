package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.BrowserTestCaseDto;
import com.arjun.crm.dto.request.BrowserTestRunRequest;
import com.arjun.crm.dto.response.BrowserTestRunResponse;
import com.arjun.crm.dto.response.TestResultResponse;
import com.arjun.crm.dto.response.TestRunResponse;
import com.arjun.crm.entity.*;
import com.arjun.crm.enums.TestCaseType;
import com.arjun.crm.enums.TestResultStatus;
import com.arjun.crm.enums.TestRunStatus;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.*;
import com.arjun.crm.security.JwtService;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.ChromeExtensionRunnerClient;
import com.arjun.crm.service.ChromeExtensionSuiteExecutionService;
import com.arjun.crm.service.ChromeExtensionTestExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChromeExtensionSuiteExecutionServiceImpl implements ChromeExtensionSuiteExecutionService {

    private final ChromeExtensionTestSuiteRepository testSuiteRepository;
    private final ChromeExtensionTestCaseRepository testCaseRepository;
    private final ChromeExtensionTestRunRepository testRunRepository;
    private final ChromeExtensionTestResultRepository testResultRepository;
    private final ChromeExtensionRepository chromeExtensionRepository;
    private final ChromeExtensionTestExecutionService testExecutionService;
    private final ChromeExtensionRunnerClient runnerClient;
    private final WorkspaceAuthorizationService workspaceAuthService;
    private final JwtService jwtService;

    private static final DateTimeFormatter LOG_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Tracks currently executing child browser runner run ID per active suite run ID for cancellation propagation
    private final Map<Long, Long> activeChildRunners = new ConcurrentHashMap<>();

    @Override
    @Transactional
    public TestRunResponse createSuiteRun(Long workspaceId, Long extensionId, Long suiteId) {
        log.info("Queuing Suite Run for suite ID: {} and extension ID: {} in workspace: {}", suiteId, extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        ChromeExtension extension = getValidExtension(workspaceId, extensionId);
        ChromeExtensionTestSuite suite = getValidSuite(extensionId, suiteId);
        User currentUser = workspaceAuthService.getAuthenticatedUser();

        // 1. Validate enabled items
        List<ChromeExtensionTestSuiteItem> enabledItems = suite.getItems().stream()
                .filter(item -> Boolean.TRUE.equals(item.getEnabled()) && Boolean.TRUE.equals(item.getTestCase().getEnabled()))
                .sorted(Comparator.comparingInt(ChromeExtensionTestSuiteItem::getExecutionOrder))
                .toList();

        if (enabledItems.isEmpty()) {
            throw new IllegalArgumentException("Cannot start suite run: No enabled test cases found in this suite.");
        }

        // 2. Concurrency check: Prevent duplicate concurrent active runs for the same extension
        Optional<ChromeExtensionTestRun> activeRun = testRunRepository
                .findFirstByExtensionIdAndStatusInOrderByCreatedAtDesc(extensionId, List.of(TestRunStatus.QUEUED, TestRunStatus.RUNNING));
        if (activeRun.isPresent()) {
            throw new ConflictException("A test run (#" + activeRun.get().getId() + ") is already in progress for this extension.");
        }

        // 3. Create Suite Test Run
        ChromeExtensionTestRun testRun = ChromeExtensionTestRun.builder()
                .extension(extension)
                .suite(suite)
                .triggeredBy(currentUser)
                .status(TestRunStatus.QUEUED)
                .environment("UNIFIED_SUITE")
                .totalTests(enabledItems.size())
                .passedTests(0)
                .failedTests(0)
                .errorTests(0)
                .skippedTests(0)
                .durationMs(0L)
                .logs("[" + LocalDateTime.now().format(LOG_DATE_FORMAT) + "] [SUITE_RUN_CREATED] Suite run queued for suite '" +
                        suite.getName() + "' (ID: " + suiteId + ") with " + enabledItems.size() + " test(s)\n")
                .build();

        testRun = testRunRepository.save(testRun);
        log.info("[SUITE_RUN_CREATED] Suite run created with ID: {} for suite ID: {}", testRun.getId(), suiteId);

        TestRunResponse response = mapToTestRunResponse(testRun, Collections.emptyList());

        // 4. Trigger asynchronous execution
        executeSuiteRunAsync(workspaceId, extension, suite, testRun, currentUser, null);

        return response;
    }

    @Override
    @Async("taskExecutor")
    public void executeSuiteRunAsync(
            Long workspaceId,
            ChromeExtension extension,
            ChromeExtensionTestSuite suite,
            ChromeExtensionTestRun testRun,
            User triggeredBy,
            String authToken
    ) {
        log.info("[SUITE_RUN_STARTED] Async suite run execution started for Run ID: {}", testRun.getId());
        executeSuiteRun(workspaceId, extension, suite, testRun, triggeredBy, authToken);
    }

    @Override
    @Transactional
    public ChromeExtensionTestRun executeSuiteRun(
            Long workspaceId,
            ChromeExtension extension,
            ChromeExtensionTestSuite suite,
            ChromeExtensionTestRun testRun,
            User triggeredBy,
            String authToken
    ) {
        long startTime = System.currentTimeMillis();
        StringBuilder runLogs = new StringBuilder();

        testRun = testRunRepository.findById(testRun.getId()).orElse(testRun);
        if (testRun.getStatus() == TestRunStatus.CANCELLED) {
            log.info("[SUITE_RUN_COMPLETED] Suite Run ID: {} was cancelled before execution started", testRun.getId());
            return testRun;
        }

        testRun.setStatus(TestRunStatus.RUNNING);
        testRun.setStartedAt(LocalDateTime.now());
        testRun = testRunRepository.save(testRun);

        appendLog(runLogs, "SUITE_RUN_STARTED", "Starting execution of suite '" + suite.getName() + "' (ID: " + suite.getId() + ")");

        // Reload fresh suite items
        List<ChromeExtensionTestSuiteItem> enabledItems = suite.getItems().stream()
                .filter(item -> Boolean.TRUE.equals(item.getEnabled()) && Boolean.TRUE.equals(item.getTestCase().getEnabled()))
                .sorted(Comparator.comparingInt(ChromeExtensionTestSuiteItem::getExecutionOrder))
                .toList();

        appendLog(runLogs, "SUITE_RUN_STARTED", "Loaded " + enabledItems.size() + " enabled suite item(s) for execution");

        int passedCount = 0;
        int failedCount = 0;
        int errorCount = 0;
        int skippedCount = 0;
        boolean stopOnFailureTriggered = false;

        // Effective auth token for API test cases
        String effectiveToken = authToken;
        if ((effectiveToken == null || effectiveToken.isBlank()) && triggeredBy != null) {
            try {
                org.springframework.security.core.userdetails.UserDetails userDetails =
                        org.springframework.security.core.userdetails.User.builder()
                                .username(triggeredBy.getEmail())
                                .password(triggeredBy.getPassword() != null ? triggeredBy.getPassword() : "")
                                .authorities("ROLE_" + (triggeredBy.getRole() != null ? triggeredBy.getRole().name() : "USER"))
                                .build();
                effectiveToken = jwtService.generateToken(Map.of("userId", triggeredBy.getId()), userDetails);
            } catch (Exception e) {
                log.warn("Could not generate JWT token for suite test execution: {}", e.getMessage());
            }
        }

        for (int i = 0; i < enabledItems.size(); i++) {
            ChromeExtensionTestSuiteItem item = enabledItems.get(i);
            ChromeExtensionTestCase testCase = item.getTestCase();

            // 1. Check cancellation before starting next item
            Optional<ChromeExtensionTestRun> currentRunCheck = testRunRepository.findById(testRun.getId());
            if (currentRunCheck.isPresent() && currentRunCheck.get().getStatus() == TestRunStatus.CANCELLED) {
                appendLog(runLogs, "SUITE_RUN_CANCELLED", "Suite run cancelled by user during execution");
                log.info("[SUITE_RUN_COMPLETED] Run ID: {} execution cancelled by user", testRun.getId());
                testRun.setStatus(TestRunStatus.CANCELLED);
                testRun.setCompletedAt(LocalDateTime.now());
                testRun.setDurationMs(System.currentTimeMillis() - startTime);
                testRun.setLogs(runLogs.toString());
                return testRunRepository.save(testRun);
            }

            // 2. Validate testCase belongs to this extension
            if (!testCase.getExtension().getId().equals(extension.getId())) {
                String crossError = "Security Violation: Test case #" + testCase.getId() + " does not belong to extension #" + extension.getId();
                appendLog(runLogs, "SUITE_ITEM_ERROR", crossError);
                ChromeExtensionTestResult errResult = ChromeExtensionTestResult.builder()
                        .testRun(testRun)
                        .testCase(testCase)
                        .status(TestResultStatus.ERROR)
                        .errorMessage(crossError)
                        .assertionDetails(Map.of("error", crossError))
                        .build();
                testResultRepository.save(errResult);
                errorCount++;
                if (Boolean.TRUE.equals(suite.getStopOnFailure())) {
                    stopOnFailureTriggered = true;
                    // Mark remaining items as SKIPPED
                    skippedCount += markRemainingItemsSkipped(testRun, enabledItems, i + 1, testCase.getId(), runLogs);
                    break;
                }
                continue;
            }

            // 3. Execute according to type
            ChromeExtensionTestResult result;
            if (testCase.getTestType() == TestCaseType.BROWSER) {
                result = executeBrowserSuiteItem(workspaceId, extension, testRun, testCase, item.getExecutionOrder(), runLogs);
            } else {
                // REUSE existing API CRUD execution service without duplicating logic
                result = testExecutionService.executeSingleTestCase(workspaceId, extension, testRun, testCase, effectiveToken, runLogs);
            }

            if (result == null) {
                result = ChromeExtensionTestResult.builder()
                        .testRun(testRun)
                        .testCase(testCase)
                        .status(TestResultStatus.ERROR)
                        .errorMessage("Test execution returned null result")
                        .build();
            }

            testResultRepository.save(result);

            if (result.getStatus() == TestResultStatus.PASS || result.getStatus() == TestResultStatus.PASSED) {
                passedCount++;
            } else if (result.getStatus() == TestResultStatus.FAIL || result.getStatus() == TestResultStatus.FAILED) {
                failedCount++;
                if (Boolean.TRUE.equals(suite.getStopOnFailure())) {
                    stopOnFailureTriggered = true;
                    skippedCount += markRemainingItemsSkipped(testRun, enabledItems, i + 1, testCase.getId(), runLogs);
                    break;
                }
            } else if (result.getStatus() == TestResultStatus.ERROR) {
                errorCount++;
                if (Boolean.TRUE.equals(suite.getStopOnFailure())) {
                    stopOnFailureTriggered = true;
                    skippedCount += markRemainingItemsSkipped(testRun, enabledItems, i + 1, testCase.getId(), runLogs);
                    break;
                }
            }
        }

        long totalDuration = System.currentTimeMillis() - startTime;
        testRun.setTotalTests(enabledItems.size());
        testRun.setPassedTests(passedCount);
        testRun.setFailedTests(failedCount);
        testRun.setErrorTests(errorCount);
        testRun.setSkippedTests(skippedCount);
        testRun.setDurationMs(totalDuration);
        testRun.setCompletedAt(LocalDateTime.now());

        // Check cancellation one final time to preserve terminal immutability
        Optional<ChromeExtensionTestRun> finalCheck = testRunRepository.findById(testRun.getId());
        if (finalCheck.isPresent() && finalCheck.get().getStatus() == TestRunStatus.CANCELLED) {
            testRun.setStatus(TestRunStatus.CANCELLED);
        } else {
            if (errorCount > 0) {
                testRun.setStatus(TestRunStatus.ERROR);
            } else if (failedCount > 0) {
                testRun.setStatus(TestRunStatus.FAILED);
            } else {
                testRun.setStatus(TestRunStatus.PASSED);
            }
        }

        appendLog(runLogs, "SUITE_RUN_COMPLETED", String.format(
                "Completed suite run in %dms. Total: %d, Passed: %d, Failed: %d, Errors: %d, Skipped: %d -> Status: %s",
                totalDuration, enabledItems.size(), passedCount, failedCount, errorCount, skippedCount, testRun.getStatus()
        ));
        log.info("[SUITE_RUN_COMPLETED] Suite Run ID: {}, Status: {}, Total: {}, Passed: {}, Failed: {}, Errors: {}, Skipped: {}, Duration: {}ms",
                testRun.getId(), testRun.getStatus(), enabledItems.size(), passedCount, failedCount, errorCount, skippedCount, totalDuration);

        testRun.setLogs(runLogs.toString());
        return testRunRepository.save(testRun);
    }

    @Override
    @Transactional(readOnly = true)
    public TestRunResponse getSuiteRun(Long workspaceId, Long extensionId, Long suiteId, Long runId) {
        log.info("Getting Suite Run ID: {} for suite ID: {} and extension ID: {} in workspace: {}", runId, suiteId, extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);
        getValidSuite(extensionId, suiteId);

        ChromeExtensionTestRun testRun = testRunRepository.findByIdAndExtensionId(runId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test run not found with ID: " + runId + " for this extension"));

        List<ChromeExtensionTestResult> results = testResultRepository.findByTestRunIdOrderByCreatedAtAsc(runId);
        List<TestResultResponse> resultResponses = results.stream()
                .map(this::mapToTestResultResponse)
                .collect(Collectors.toList());

        return mapToTestRunResponse(testRun, resultResponses);
    }

    @Override
    @Transactional
    public TestRunResponse cancelSuiteRun(Long workspaceId, Long extensionId, Long suiteId, Long runId) {
        log.info("Cancelling Suite Run ID: {} for suite ID: {} and extension ID: {} in workspace: {}", runId, suiteId, extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);
        getValidSuite(extensionId, suiteId);

        ChromeExtensionTestRun testRun = testRunRepository.findByIdAndExtensionId(runId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test run not found with ID: " + runId + " for this extension"));

        // 1. Propagate cancellation to active child browser runner if one is running
        Long activeChildRunnerId = activeChildRunners.get(runId);
        if (activeChildRunnerId != null) {
            try {
                log.info("[SUITE_CANCEL_PROPAGATED] Propagating cancellation to active child browser runner ID: {}", activeChildRunnerId);
                runnerClient.cancelBrowserRun(activeChildRunnerId);
            } catch (Exception e) {
                log.warn("Failed to propagate cancellation to child browser runner {}: {}", activeChildRunnerId, e.getMessage());
            }
        }

        // 2. Set terminal CANCELLED status on suite run
        if (testRun.getStatus() == TestRunStatus.QUEUED || testRun.getStatus() == TestRunStatus.RUNNING || testRun.getStatus() == TestRunStatus.PENDING) {
            testRun.setStatus(TestRunStatus.CANCELLED);
            testRun.setCompletedAt(LocalDateTime.now());
            testRun = testRunRepository.save(testRun);
            log.info("Suite Run ID: {} successfully cancelled", runId);
        }

        List<ChromeExtensionTestResult> results = testResultRepository.findByTestRunIdOrderByCreatedAtAsc(runId);
        List<TestResultResponse> resultResponses = results.stream()
                .map(this::mapToTestResultResponse)
                .collect(Collectors.toList());

        return mapToTestRunResponse(testRun, resultResponses);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper Methods & Browser Execution Orchestration
    // ─────────────────────────────────────────────────────────────────────────

    private ChromeExtension getValidExtension(Long workspaceId, Long extensionId) {
        return chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(extensionId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Chrome Extension not found with ID: " + extensionId + " in this workspace"));
    }

    private ChromeExtensionTestSuite getValidSuite(Long extensionId, Long suiteId) {
        return testSuiteRepository.findByIdAndExtensionId(suiteId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test suite not found with ID: " + suiteId + " for this extension"));
    }

    /**
     * Executes a single Browser test case via the Playwright runner client with a dedicated child run ID.
     */
    private ChromeExtensionTestResult executeBrowserSuiteItem(
            Long workspaceId,
            ChromeExtension extension,
            ChromeExtensionTestRun testRun,
            ChromeExtensionTestCase testCase,
            int order,
            StringBuilder runLogs
    ) {
        long caseStartTime = System.currentTimeMillis();

        // Separate child runner ID: guarantees suiteRunId != browserRunnerRunId
        long childRunnerRunId = generateChildRunnerId(testRun.getId(), testCase.getId(), order);

        appendLog(runLogs, "BROWSER_ITEM_STARTED", String.format(
                "Starting Browser Test Case #%d: '%s' (Child Runner ID: %d)", testCase.getId(), testCase.getName(), childRunnerRunId
        ));
        log.info("[BROWSER_ITEM_STARTED] Suite Run ID: {}, Test Case ID: {}, Child Runner ID: {}",
                testRun.getId(), testCase.getId(), childRunnerRunId);

        // Register active child runner for cancellation propagation
        activeChildRunners.put(testRun.getId(), childRunnerRunId);

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> steps = (testCase.getConfiguration() != null && testCase.getConfiguration().get("steps") instanceof List)
                    ? (List<Map<String, Object>>) testCase.getConfiguration().get("steps")
                    : Collections.emptyList();

            BrowserTestCaseDto browserCase = BrowserTestCaseDto.builder()
                    .type("BROWSER")
                    .name(testCase.getName())
                    .steps(steps)
                    .build();

            BrowserTestRunRequest runnerRequest = BrowserTestRunRequest.builder()
                    .runId(childRunnerRunId)
                    .extensionPath(null) // Security: force null
                    .testCases(List.of(browserCase))
                    .build();

            BrowserTestRunResponse startResponse = runnerClient.startBrowserRun(childRunnerRunId, runnerRequest);
            if (startResponse == null || "ERROR".equals(startResponse.getStatus())) {
                String errorMsg = (startResponse == null) ? "Runner start failed: null response from runner client" : "Runner start error: " + startResponse.getMessage();
                appendLog(runLogs, "BROWSER_ITEM_ERROR", errorMsg);
                return ChromeExtensionTestResult.builder()
                        .testRun(testRun)
                        .testCase(testCase)
                        .status(TestResultStatus.ERROR)
                        .executionTimeMs((int) (System.currentTimeMillis() - caseStartTime))
                        .errorMessage(errorMsg)
                        .assertionDetails(Map.of("error", errorMsg, "childRunnerRunId", childRunnerRunId))
                        .build();
            }

            // Poll runner until completion
            BrowserTestRunResponse finalResponse = null;
            for (int p = 0; p < 60; p++) {
                // Check if suite run was cancelled during polling
                Optional<ChromeExtensionTestRun> cancelCheck = testRunRepository.findById(testRun.getId());
                if (cancelCheck.isPresent() && cancelCheck.get().getStatus() == TestRunStatus.CANCELLED) {
                    log.info("[BROWSER_ITEM_CANCEL] Suite run cancelled during browser execution. Cancelling child runner ID: {}", childRunnerRunId);
                    runnerClient.cancelBrowserRun(childRunnerRunId);
                    break;
                }

                try {
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }

                BrowserTestRunResponse pollStatus = runnerClient.getBrowserRunStatus(childRunnerRunId);
                if (pollStatus != null && List.of("PASSED", "FAILED", "ERROR", "CANCELLED").contains(pollStatus.getStatus())) {
                    finalResponse = pollStatus;
                    break;
                }
            }

            long duration = System.currentTimeMillis() - caseStartTime;

            if (finalResponse == null) {
                String timeoutMsg = "Browser test timed out waiting for runner completion";
                appendLog(runLogs, "BROWSER_ITEM_TIMEOUT", timeoutMsg);
                return ChromeExtensionTestResult.builder()
                        .testRun(testRun)
                        .testCase(testCase)
                        .status(TestResultStatus.ERROR)
                        .executionTimeMs((int) duration)
                        .errorMessage(timeoutMsg)
                        .assertionDetails(Map.of("error", timeoutMsg, "childRunnerRunId", childRunnerRunId))
                        .build();
            }

            // Extract results
            TestResultStatus itemStatus;
            String errorMsg = null;
            Map<String, Object> assertionDetails = new HashMap<>();
            assertionDetails.put("childRunnerRunId", childRunnerRunId);

            if (finalResponse.getResults() != null && !finalResponse.getResults().isEmpty()) {
                Map<String, Object> tcResult = finalResponse.getResults().get(0);
                String resStatus = (String) tcResult.getOrDefault("status", finalResponse.getStatus());
                if ("PASSED".equalsIgnoreCase(resStatus)) {
                    itemStatus = TestResultStatus.PASSED;
                } else if ("FAILED".equalsIgnoreCase(resStatus)) {
                    itemStatus = TestResultStatus.FAILED;
                } else {
                    itemStatus = TestResultStatus.ERROR;
                }

                errorMsg = (String) tcResult.get("error");
                if (tcResult.get("stepResults") != null) {
                    assertionDetails.put("stepResults", tcResult.get("stepResults"));
                }
                if (tcResult.get("failedStep") != null) {
                    assertionDetails.put("failedStep", tcResult.get("failedStep"));
                }

                // Map stepResults to generic assertions for UI compatibility
                if (tcResult.get("stepResults") instanceof List<?> stepList) {
                    List<Map<String, Object>> assertions = new ArrayList<>();
                    for (Object item : stepList) {
                        if (item instanceof Map<?, ?> step) {
                            Map<String, Object> asst = new HashMap<>();
                            asst.put("passed", "PASSED".equals(step.get("status")));
                            asst.put("message", (step.get("action") != null ? step.get("action") : "") + " " + (step.get("target") != null ? step.get("target") : ""));
                            asst.put("expected", step.get("expected"));
                            asst.put("actual", step.get("actual"));
                            assertions.add(asst);
                        }
                    }
                    assertionDetails.put("assertions", assertions);
                }
            } else {
                if ("PASSED".equalsIgnoreCase(finalResponse.getStatus())) {
                    itemStatus = TestResultStatus.PASSED;
                } else if ("FAILED".equalsIgnoreCase(finalResponse.getStatus())) {
                    itemStatus = TestResultStatus.FAILED;
                } else {
                    itemStatus = TestResultStatus.ERROR;
                }
                errorMsg = finalResponse.getMessage();
            }

            appendLog(runLogs, "BROWSER_ITEM_COMPLETED", String.format(
                    "Browser Test Case #%d %s (Duration: %dms)", testCase.getId(), itemStatus, duration
            ));

            return ChromeExtensionTestResult.builder()
                    .testRun(testRun)
                    .testCase(testCase)
                    .status(itemStatus)
                    .executionTimeMs((int) duration)
                    .errorMessage(errorMsg)
                    .assertionDetails(assertionDetails)
                    .build();

        } finally {
            activeChildRunners.remove(testRun.getId());
        }
    }

    /**
     * Marks remaining enabled items in a suite as SKIPPED when stopOnFailure is triggered.
     */
    private int markRemainingItemsSkipped(
            ChromeExtensionTestRun testRun,
            List<ChromeExtensionTestSuiteItem> items,
            int startIndex,
            Long failedTestCaseId,
            StringBuilder runLogs
    ) {
        int skipped = 0;
        for (int j = startIndex; j < items.size(); j++) {
            ChromeExtensionTestCase skippedCase = items.get(j).getTestCase();
            String reason = "Skipped due to stopOnFailure policy following failure of test case #" + failedTestCaseId;

            appendLog(runLogs, "SUITE_ITEM_SKIPPED", "Test Case #" + skippedCase.getId() + " (" + skippedCase.getName() + ") SKIPPED: " + reason);

            ChromeExtensionTestResult skipResult = ChromeExtensionTestResult.builder()
                    .testRun(testRun)
                    .testCase(skippedCase)
                    .status(TestResultStatus.SKIPPED)
                    .executionTimeMs(0)
                    .errorMessage(reason)
                    .assertionDetails(Map.of("message", reason))
                    .build();

            testResultRepository.save(skipResult);
            skipped++;
        }
        return skipped;
    }

    /**
     * Generates a unique, non-overlapping child runner run ID separate from the suite run ID.
     */
    private long generateChildRunnerId(Long suiteRunId, Long testCaseId, int order) {
        return (suiteRunId * 100000L) + (order * 1000L) + (testCaseId % 1000L);
    }

    private void appendLog(StringBuilder builder, String tag, String message) {
        String timestamp = LocalDateTime.now().format(LOG_DATE_FORMAT);
        builder.append("[").append(timestamp).append("] [").append(tag).append("] ").append(message).append("\n");
    }

    private TestRunResponse mapToTestRunResponse(ChromeExtensionTestRun run, List<TestResultResponse> results) {
        return TestRunResponse.builder()
                .id(run.getId())
                .workspaceId(run.getExtension() != null && run.getExtension().getWorkspace() != null
                        ? run.getExtension().getWorkspace().getId() : null)
                .extensionId(run.getExtension() != null ? run.getExtension().getId() : null)
                .extensionName(run.getExtension() != null ? run.getExtension().getName() : null)
                .triggeredById(run.getTriggeredBy() != null ? run.getTriggeredBy().getId() : null)
                .triggeredByName(run.getTriggeredBy() != null
                        ? (run.getTriggeredBy().getFirstName() + " " + run.getTriggeredBy().getLastName()).trim() : null)
                .suiteId(run.getSuite() != null ? run.getSuite().getId() : null)
                .suiteName(run.getSuite() != null ? run.getSuite().getName() : null)
                .status(run.getStatus())
                .environment(run.getEnvironment())
                .totalTests(run.getTotalTests())
                .passedTests(run.getPassedTests())
                .failedTests(run.getFailedTests())
                .errorTests(run.getErrorTests())
                .skippedTests(run.getSkippedTests() != null ? run.getSkippedTests() : 0)
                .durationMs(run.getDurationMs())
                .startedAt(run.getStartedAt())
                .completedAt(run.getCompletedAt())
                .logs(run.getLogs())
                .results(results != null && !results.isEmpty() ? results : null)
                .createdAt(run.getCreatedAt())
                .build();
    }

    private TestResultResponse mapToTestResultResponse(ChromeExtensionTestResult result) {
        String requestMethod = null;
        String requestUrl = null;
        if (result.getAssertionDetails() != null && result.getAssertionDetails().get("request") instanceof Map<?, ?> reqMap) {
            if (reqMap.get("method") != null) requestMethod = reqMap.get("method").toString();
            if (reqMap.get("endpoint") != null) requestUrl = reqMap.get("endpoint").toString();
        } else if (result.getTestCase() != null && result.getTestCase().getTestType() == TestCaseType.BROWSER) {
            requestMethod = "BROWSER";
            requestUrl = "BROWSER";
        }

        return TestResultResponse.builder()
                .id(result.getId())
                .testRunId(result.getTestRun() != null ? result.getTestRun().getId() : null)
                .testCaseId(result.getTestCase() != null ? result.getTestCase().getId() : null)
                .testCaseName(result.getTestCase() != null ? result.getTestCase().getName() : null)
                .status(result.getStatus())
                .executionTimeMs(result.getExecutionTimeMs())
                .actualStatusCode(result.getActualStatusCode())
                .actualResponsePayload(result.getActualResponsePayload())
                .errorMessage(result.getErrorMessage())
                .assertionDetails(result.getAssertionDetails())
                .requestMethod(requestMethod)
                .requestUrl(requestUrl)
                .createdAt(result.getCreatedAt())
                .build();
    }
}
