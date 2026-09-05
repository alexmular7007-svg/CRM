package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.CreateChromeExtensionRequest;
import com.arjun.crm.dto.request.CreateTestCaseRequest;
import com.arjun.crm.dto.request.UpdateChromeExtensionRequest;
import com.arjun.crm.dto.request.UpdateTestCaseRequest;
import com.arjun.crm.dto.response.ChromeExtensionResponse;
import com.arjun.crm.dto.response.TestCaseResponse;
import com.arjun.crm.dto.response.TestResultResponse;
import com.arjun.crm.dto.response.TestRunResponse;
import com.arjun.crm.entity.ChromeExtension;
import com.arjun.crm.entity.ChromeExtensionTestCase;
import com.arjun.crm.entity.ChromeExtensionTestResult;
import com.arjun.crm.entity.ChromeExtensionTestRun;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.ChromeExtensionStatus;
import com.arjun.crm.enums.TestResultStatus;
import com.arjun.crm.enums.TestRunStatus;
import java.util.ArrayList;
import java.util.HashMap;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.ChromeExtensionRepository;
import com.arjun.crm.repository.ChromeExtensionTestCaseRepository;
import com.arjun.crm.repository.ChromeExtensionTestResultRepository;
import com.arjun.crm.enums.TestCaseType;
import com.arjun.crm.util.BrowserStepValidator;
import com.arjun.crm.dto.request.BrowserTestRunRequest;
import com.arjun.crm.dto.response.BrowserTestRunResponse;
import com.arjun.crm.repository.ChromeExtensionTestRunRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.ChromeExtensionRunnerClient;
import com.arjun.crm.service.ChromeExtensionService;
import com.arjun.crm.service.ChromeExtensionTestExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChromeExtensionServiceImpl implements ChromeExtensionService {

    private final ChromeExtensionRepository chromeExtensionRepository;
    private final ChromeExtensionTestCaseRepository testCaseRepository;
    private final ChromeExtensionTestRunRepository testRunRepository;
    private final ChromeExtensionTestResultRepository testResultRepository;
    private final ChromeExtensionTestExecutionService testExecutionService;
    private final ChromeExtensionRunnerClient runnerClient;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;

    // ─────────────────────────────────────────────────────────────────────────
    // Extension CRUD
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public ChromeExtensionResponse createExtension(Long workspaceId, CreateChromeExtensionRequest request) {
        log.info("Creating Chrome Extension '{}' in workspace: {}", request.getName(), workspaceId);

        // Security check: Must be OWNER or ADMIN of workspace
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with ID: " + workspaceId));

        User currentUser = workspaceAuthService.getAuthenticatedUser();

        // Check for duplicate name in the same workspace
        if (chromeExtensionRepository.existsByWorkspaceIdAndNameAndArchivedAtIsNull(workspaceId, request.getName().trim())) {
            throw new ConflictException("Chrome Extension with name '" + request.getName().trim() + "' already exists in this workspace");
        }

        ChromeExtension extension = ChromeExtension.builder()
                .workspace(workspace)
                .name(request.getName().trim())
                .description(request.getDescription())
                .version(request.getVersion() != null && !request.getVersion().isBlank() ? request.getVersion().trim() : "1.0.0")
                .status(request.getStatus() != null ? request.getStatus() : ChromeExtensionStatus.ACTIVE)
                .manifestJson(request.getManifestJson())
                .createdBy(currentUser)
                .build();

        extension = chromeExtensionRepository.save(extension);
        log.info("Chrome Extension created with ID: {}", extension.getId());
        return mapToExtensionResponse(extension, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChromeExtensionResponse> listExtensions(Long workspaceId, String search, Pageable pageable) {
        log.info("Listing Chrome Extensions for workspace: {}, search: {}", workspaceId, search);

        // Read permission: Any member of the workspace
        workspaceAuthService.validateWorkspaceAccess(workspaceId);

        Page<ChromeExtension> page;
        if (search != null && !search.isBlank()) {
            page = chromeExtensionRepository.findByWorkspaceIdAndNameContainingIgnoreCaseAndArchivedAtIsNull(
                    workspaceId, search.trim(), pageable);
        } else {
            page = chromeExtensionRepository.findByWorkspaceIdAndArchivedAtIsNull(workspaceId, pageable);
        }

        return page.map(ext -> {
            long testCaseCount = testCaseRepository.countByExtensionId(ext.getId());
            return mapToExtensionResponse(ext, testCaseCount);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public ChromeExtensionResponse getExtension(Long workspaceId, Long extensionId) {
        log.info("Getting Chrome Extension ID: {} for workspace: {}", extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);

        ChromeExtension extension = getValidExtension(workspaceId, extensionId);
        long testCaseCount = testCaseRepository.countByExtensionId(extension.getId());
        return mapToExtensionResponse(extension, testCaseCount);
    }

    @Override
    public ChromeExtensionResponse updateExtension(Long workspaceId, Long extensionId, UpdateChromeExtensionRequest request) {
        log.info("Updating Chrome Extension ID: {} for workspace: {}", extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        ChromeExtension extension = getValidExtension(workspaceId, extensionId);

        if (request.getName() != null && !request.getName().isBlank()) {
            String newName = request.getName().trim();
            if (chromeExtensionRepository.existsByWorkspaceIdAndNameAndIdNotAndArchivedAtIsNull(workspaceId, newName, extensionId)) {
                throw new ConflictException("Chrome Extension with name '" + newName + "' already exists in this workspace");
            }
            extension.setName(newName);
        }

        if (request.getDescription() != null) {
            extension.setDescription(request.getDescription());
        }

        if (request.getVersion() != null && !request.getVersion().isBlank()) {
            extension.setVersion(request.getVersion().trim());
        }

        if (request.getStatus() != null) {
            extension.setStatus(request.getStatus());
        }

        if (request.getManifestJson() != null) {
            extension.setManifestJson(request.getManifestJson());
        }

        extension = chromeExtensionRepository.save(extension);
        long testCaseCount = testCaseRepository.countByExtensionId(extension.getId());
        return mapToExtensionResponse(extension, testCaseCount);
    }

    @Override
    public void deleteExtension(Long workspaceId, Long extensionId) {
        log.info("Deleting (archiving) Chrome Extension ID: {} in workspace: {}", extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        ChromeExtension extension = getValidExtension(workspaceId, extensionId);
        extension.setArchivedAt(LocalDateTime.now());
        extension.setStatus(ChromeExtensionStatus.ARCHIVED);
        chromeExtensionRepository.save(extension);
        log.info("Chrome Extension ID: {} successfully archived", extensionId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test Case CRUD
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public TestCaseResponse createTestCase(Long workspaceId, Long extensionId, CreateTestCaseRequest request) {
        log.info("Creating test case '{}' for extension ID: {} in workspace: {}", request.getName(), extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        ChromeExtension extension = getValidExtension(workspaceId, extensionId);

        if (request.getTestType() == TestCaseType.BROWSER ||
                (request.getConfiguration() != null && request.getConfiguration().containsKey("steps"))) {
            BrowserStepValidator.validate(request.getConfiguration());
        }

        ChromeExtensionTestCase testCase = ChromeExtensionTestCase.builder()
                .extension(extension)
                .name(request.getName().trim())
                .description(request.getDescription())
                .testType(request.getTestType())
                .configuration(request.getConfiguration())
                .expectedResult(request.getExpectedResult())
                .enabled(request.getEnabled() != null ? request.getEnabled() : true)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        testCase = testCaseRepository.save(testCase);
        log.info("Test case created with ID: {}", testCase.getId());
        return mapToTestCaseResponse(testCase);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TestCaseResponse> listTestCases(Long workspaceId, Long extensionId) {
        log.info("Listing test cases for extension ID: {} in workspace: {}", extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        return testCaseRepository.findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(extensionId)
                .stream()
                .map(this::mapToTestCaseResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TestCaseResponse getTestCase(Long workspaceId, Long extensionId, Long testCaseId) {
        log.info("Getting test case ID: {} for extension ID: {} in workspace: {}", testCaseId, extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        ChromeExtensionTestCase testCase = testCaseRepository.findByIdAndExtensionId(testCaseId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found with ID: " + testCaseId));

        return mapToTestCaseResponse(testCase);
    }

    @Override
    public TestCaseResponse updateTestCase(Long workspaceId, Long extensionId, Long testCaseId, UpdateTestCaseRequest request) {
        log.info("Updating test case ID: {} for extension ID: {} in workspace: {}", testCaseId, extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        getValidExtension(workspaceId, extensionId);

        ChromeExtensionTestCase testCase = testCaseRepository.findByIdAndExtensionId(testCaseId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found with ID: " + testCaseId));

        TestCaseType effectiveType = request.getTestType() != null ? request.getTestType() : testCase.getTestType();
        Map<String, Object> effectiveConfig = request.getConfiguration() != null ? request.getConfiguration() : testCase.getConfiguration();
        if (effectiveType == TestCaseType.BROWSER ||
                (effectiveConfig != null && effectiveConfig.containsKey("steps"))) {
            BrowserStepValidator.validate(effectiveConfig);
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            testCase.setName(request.getName().trim());
        }

        if (request.getDescription() != null) {
            testCase.setDescription(request.getDescription());
        }

        if (request.getTestType() != null) {
            testCase.setTestType(request.getTestType());
        }

        if (request.getConfiguration() != null) {
            testCase.setConfiguration(request.getConfiguration());
        }

        if (request.getExpectedResult() != null) {
            testCase.setExpectedResult(request.getExpectedResult());
        }

        if (request.getEnabled() != null) {
            testCase.setEnabled(request.getEnabled());
        }

        if (request.getDisplayOrder() != null) {
            testCase.setDisplayOrder(request.getDisplayOrder());
        }

        testCase = testCaseRepository.save(testCase);
        return mapToTestCaseResponse(testCase);
    }

    @Override
    public void deleteTestCase(Long workspaceId, Long extensionId, Long testCaseId) {
        log.info("Deleting test case ID: {} for extension ID: {} in workspace: {}", testCaseId, extensionId, workspaceId);

        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);

        getValidExtension(workspaceId, extensionId);

        ChromeExtensionTestCase testCase = testCaseRepository.findByIdAndExtensionId(testCaseId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found with ID: " + testCaseId));

        testCaseRepository.delete(testCase);
        log.info("Test case ID: {} successfully deleted", testCaseId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test Run Execution & Management
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public TestRunResponse createTestRun(Long workspaceId, Long extensionId) {
        log.info("Creating Test Run for extension ID: {} in workspace: {}", extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        ChromeExtension extension = getValidExtension(workspaceId, extensionId);
        User currentUser = workspaceAuthService.getAuthenticatedUser();

        long enabledCount = testCaseRepository.countByExtensionIdAndEnabledTrue(extensionId);
        if (enabledCount == 0) {
            throw new IllegalArgumentException("Cannot start test run: No enabled test cases found for this extension. Please add or enable at least one test case.");
        }

        // Prevent accidental duplicate concurrent runs for the same extension
        Optional<ChromeExtensionTestRun> activeRun = testRunRepository
                .findFirstByExtensionIdAndStatusInOrderByCreatedAtDesc(extensionId, List.of(TestRunStatus.QUEUED, TestRunStatus.RUNNING));
        if (activeRun.isPresent()) {
            throw new ConflictException("A test run (#" + activeRun.get().getId() + ") is already in progress for this extension.");
        }

        ChromeExtensionTestRun testRun = ChromeExtensionTestRun.builder()
                .extension(extension)
                .triggeredBy(currentUser)
                .status(TestRunStatus.QUEUED)
                .environment("DEVELOPMENT")
                .totalTests((int) enabledCount)
                .passedTests(0)
                .failedTests(0)
                .errorTests(0)
                .durationMs(0L)
                .logs("[" + LocalDateTime.now() + "] [TEST_RUN_CREATED] Run queued for extension '" + extension.getName() + "' (ID: " + extensionId + ")\n")
                .build();

        testRun = testRunRepository.save(testRun);
        log.info("[TEST_RUN_CREATED] Test run created with ID: {} for extension ID: {}", testRun.getId(), extensionId);

        // Trigger asynchronous execution
        testExecutionService.executeTestRunAsync(workspaceId, extension, testRun, currentUser, null);

        return mapToTestRunResponse(testRun, Collections.emptyList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TestRunResponse> listTestRuns(Long workspaceId, Long extensionId, Pageable pageable) {
        log.info("Listing test runs for extension ID: {} in workspace: {}", extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        return testRunRepository.findByExtensionIdOrderByCreatedAtDesc(extensionId, pageable)
                .map(run -> mapToTestRunResponse(run, Collections.emptyList()));
    }

    @Override
    public TestRunResponse getTestRun(Long workspaceId, Long extensionId, Long runId) {
        log.info("Getting test run ID: {} for extension ID: {} in workspace: {}", runId, extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        ChromeExtensionTestRun testRun = testRunRepository.findByIdAndExtensionId(runId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test run not found with ID: " + runId + " for this extension"));

        if ("BROWSER_PLAYWRIGHT".equals(testRun.getEnvironment())) {
            syncBrowserRun(testRun);
        }

        List<ChromeExtensionTestResult> results = testResultRepository.findByTestRunIdOrderByCreatedAtAsc(runId);
        List<TestResultResponse> resultResponses;

        if (results.isEmpty() && "BROWSER_PLAYWRIGHT".equals(testRun.getEnvironment())) {
            resultResponses = fetchBrowserResultsFromRunner(runId);
        } else {
            resultResponses = results.stream()
                    .map(this::mapToTestResultResponse)
                    .collect(Collectors.toList());
        }

        return mapToTestRunResponse(testRun, resultResponses);
    }

    @Override
    public TestRunResponse cancelTestRun(Long workspaceId, Long extensionId, Long runId) {
        log.info("Cancelling test run ID: {} for extension ID: {} in workspace: {}", runId, extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        ChromeExtensionTestRun testRun = testRunRepository.findByIdAndExtensionId(runId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test run not found with ID: " + runId + " for this extension"));

        if ("BROWSER_PLAYWRIGHT".equals(testRun.getEnvironment())) {
            try {
                runnerClient.cancelBrowserRun(runId);
            } catch (Exception e) {
                log.warn("Failed to notify runner of cancellation for run {}: {}", runId, e.getMessage());
            }
        }

        if (testRun.getStatus() == TestRunStatus.QUEUED || testRun.getStatus() == TestRunStatus.RUNNING || testRun.getStatus() == TestRunStatus.PENDING) {
            testRun.setStatus(TestRunStatus.CANCELLED);
            testRun.setCompletedAt(LocalDateTime.now());
            testRun = testRunRepository.save(testRun);
            log.info("Test run ID: {} successfully cancelled", runId);
        }

        List<ChromeExtensionTestResult> results = testResultRepository.findByTestRunIdOrderByCreatedAtAsc(runId);
        List<TestResultResponse> resultResponses;
        if (results.isEmpty() && "BROWSER_PLAYWRIGHT".equals(testRun.getEnvironment())) {
            resultResponses = fetchBrowserResultsFromRunner(runId);
        } else {
            resultResponses = results.stream()
                    .map(this::mapToTestResultResponse)
                    .collect(Collectors.toList());
        }

        return mapToTestRunResponse(testRun, resultResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> checkRunnerHealth() {
        return runnerClient.checkHealth();
    }

    @Override
    public BrowserTestRunResponse startBrowserRun(Long workspaceId, Long extensionId, BrowserTestRunRequest request) {
        log.info("Starting browser test run for extension ID: {} in workspace: {}", extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        ChromeExtension extension = getValidExtension(workspaceId, extensionId);
        User currentUser = workspaceAuthService.getAuthenticatedUser();

        List<com.arjun.crm.dto.request.BrowserTestCaseDto> testCases = (request != null && request.getTestCases() != null && !request.getTestCases().isEmpty())
                ? request.getTestCases()
                : null;

        if (testCases == null || testCases.isEmpty()) {
            // Check if there are enabled BROWSER test cases in the database for this extension
            List<ChromeExtensionTestCase> dbBrowserCases = testCaseRepository
                    .findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(extensionId)
                    .stream()
                    .filter(tc -> Boolean.TRUE.equals(tc.getEnabled()) && tc.getTestType() == TestCaseType.BROWSER)
                    .toList();

            if (!dbBrowserCases.isEmpty()) {
                testCases = dbBrowserCases.stream().map(tc -> {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> steps = (tc.getConfiguration() != null && tc.getConfiguration().get("steps") instanceof List)
                            ? (List<Map<String, Object>>) tc.getConfiguration().get("steps")
                            : Collections.emptyList();
                    return com.arjun.crm.dto.request.BrowserTestCaseDto.builder()
                            .type("BROWSER")
                            .name(tc.getName())
                            .steps(steps)
                            .build();
                }).toList();
            } else {
                testCases = List.of(
                    com.arjun.crm.dto.request.BrowserTestCaseDto.builder().type("POPUP_SMOKE").name("Extension popup smoke test").build(),
                    com.arjun.crm.dto.request.BrowserTestCaseDto.builder().type("CONTENT_SCRIPT_SMOKE").name("Content script smoke test").build(),
                    com.arjun.crm.dto.request.BrowserTestCaseDto.builder().type("STORAGE_SMOKE").name("Storage smoke test").build()
                );
            }
        }

        // Validate any BROWSER test cases with steps
        for (com.arjun.crm.dto.request.BrowserTestCaseDto tc : testCases) {
            if ("BROWSER".equalsIgnoreCase(tc.getType()) && tc.getSteps() != null && !tc.getSteps().isEmpty()) {
                BrowserStepValidator.validateSteps(tc.getSteps());
            }
        }

        ChromeExtensionTestRun testRun = ChromeExtensionTestRun.builder()
                .extension(extension)
                .triggeredBy(currentUser)
                .status(TestRunStatus.QUEUED)
                .environment("BROWSER_PLAYWRIGHT")
                .totalTests(testCases.size())
                .passedTests(0)
                .failedTests(0)
                .errorTests(0)
                .durationMs(0L)
                .logs("[" + LocalDateTime.now() + "] [BROWSER_RUN_CREATED] Browser run initiated for extension '" + extension.getName() + "'\n")
                .build();

        testRun = testRunRepository.save(testRun);

        if (request == null) {
            request = new BrowserTestRunRequest();
        }
        request.setExtensionPath(null); // Security: do not allow client to specify filesystem paths
        request.setRunId(testRun.getId());
        request.setTestCases(testCases);

        BrowserTestRunResponse response = runnerClient.startBrowserRun(testRun.getId(), request);

        if ("ERROR".equals(response.getStatus())) {
            testRun.setStatus(TestRunStatus.ERROR);
            testRun.setLogs(testRun.getLogs() + "[BROWSER_RUN_ERROR] " + response.getMessage() + "\n");
            testRunRepository.save(testRun);
        }

        return response;
    }

    @Override
    public BrowserTestRunResponse getBrowserRunStatus(Long workspaceId, Long extensionId, Long runId) {
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        BrowserTestRunResponse response = runnerClient.getBrowserRunStatus(runId);

        Optional<ChromeExtensionTestRun> testRunOpt = testRunRepository.findByIdAndExtensionId(runId, extensionId);
        if (testRunOpt.isPresent()) {
            ChromeExtensionTestRun testRun = testRunOpt.get();
            if (response.getStatus() != null) {
                try {
                    testRun.setStatus(TestRunStatus.valueOf(response.getStatus()));
                } catch (IllegalArgumentException ignored) {}
            }
            if (response.getDurationMs() != null) {
                testRun.setDurationMs(response.getDurationMs());
            }
            if (response.getPassedTests() != null) {
                testRun.setPassedTests(response.getPassedTests());
            }
            if (response.getFailedTests() != null) {
                testRun.setFailedTests(response.getFailedTests());
            }
            if (response.getErrorTests() != null) {
                testRun.setErrorTests(response.getErrorTests());
            }
            if (response.getLogs() != null && !response.getLogs().isEmpty()) {
                testRun.setLogs(String.join("\n", response.getLogs()));
            }
            if (testRun.getStatus() == TestRunStatus.PASSED || testRun.getStatus() == TestRunStatus.FAILED ||
                testRun.getStatus() == TestRunStatus.ERROR || testRun.getStatus() == TestRunStatus.CANCELLED) {
                if (testRun.getCompletedAt() == null) {
                    testRun.setCompletedAt(LocalDateTime.now());
                }
            }
            testRunRepository.save(testRun);
        }

        return response;
    }

    @Override
    public BrowserTestRunResponse cancelBrowserRun(Long workspaceId, Long extensionId, Long runId) {
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        BrowserTestRunResponse response = runnerClient.cancelBrowserRun(runId);

        testRunRepository.findByIdAndExtensionId(runId, extensionId).ifPresent(testRun -> {
            testRun.setStatus(TestRunStatus.CANCELLED);
            testRun.setCompletedAt(LocalDateTime.now());
            testRunRepository.save(testRun);
        });

        return response;
    }

    @Override
    public byte[] getArtifact(Long workspaceId, Long extensionId, Long runId, String filename) {
        log.info("Retrieving artifact '{}' for run ID: {} in extension ID: {} and workspace: {}",
                filename, runId, extensionId, workspaceId);

        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        getValidExtension(workspaceId, extensionId);

        // Verify run belongs to extension
        testRunRepository.findByIdAndExtensionId(runId, extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Test run not found with ID: " + runId + " for this extension"));

        // Strict filename validation to protect against directory traversal
        if (filename == null || !filename.matches("^[a-zA-Z0-9_-]+\\.png$")) {
            throw new IllegalArgumentException("Invalid artifact filename: " + filename);
        }

        return runnerClient.getArtifact(runId, filename);
    }

    private void syncBrowserRun(ChromeExtensionTestRun testRun) {
        if (testRun.getStatus() == TestRunStatus.QUEUED || testRun.getStatus() == TestRunStatus.RUNNING || testRun.getStatus() == TestRunStatus.PENDING) {
            try {
                BrowserTestRunResponse runnerStatus = runnerClient.getBrowserRunStatus(testRun.getId());
                if (runnerStatus != null && runnerStatus.getStatus() != null && !"ERROR".equals(runnerStatus.getStatus())) {
                    try {
                        testRun.setStatus(TestRunStatus.valueOf(runnerStatus.getStatus()));
                    } catch (IllegalArgumentException ignored) {}
                    if (runnerStatus.getDurationMs() != null) {
                        testRun.setDurationMs(runnerStatus.getDurationMs());
                    }
                    if (runnerStatus.getPassedTests() != null) {
                        testRun.setPassedTests(runnerStatus.getPassedTests());
                    }
                    if (runnerStatus.getFailedTests() != null) {
                        testRun.setFailedTests(runnerStatus.getFailedTests());
                    }
                    if (runnerStatus.getErrorTests() != null) {
                        testRun.setErrorTests(runnerStatus.getErrorTests());
                    }
                    if (runnerStatus.getLogs() != null && !runnerStatus.getLogs().isEmpty()) {
                        testRun.setLogs(String.join("\n", runnerStatus.getLogs()));
                    }
                    if (testRun.getStatus() == TestRunStatus.PASSED || testRun.getStatus() == TestRunStatus.FAILED ||
                        testRun.getStatus() == TestRunStatus.ERROR || testRun.getStatus() == TestRunStatus.CANCELLED) {
                        if (testRun.getCompletedAt() == null) {
                            testRun.setCompletedAt(LocalDateTime.now());
                        }
                    }
                    testRunRepository.save(testRun);
                }
            } catch (Exception e) {
                log.warn("Could not sync browser run {} from runner: {}", testRun.getId(), e.getMessage());
            }
        }
    }

    private List<TestResultResponse> fetchBrowserResultsFromRunner(Long runId) {
        try {
            BrowserTestRunResponse runnerStatus = runnerClient.getBrowserRunStatus(runId);
            if (runnerStatus != null && runnerStatus.getResults() != null) {
                return mapRunnerResultsToTestResultResponses(runId, runnerStatus.getResults());
            }
        } catch (Exception e) {
            log.warn("Could not fetch runner results for run {}: {}", runId, e.getMessage());
        }
        return Collections.emptyList();
    }

    private List<TestResultResponse> mapRunnerResultsToTestResultResponses(Long runId, List<Map<String, Object>> runnerResults) {
        List<TestResultResponse> list = new ArrayList<>();
        long idCounter = 1L;
        for (Map<String, Object> r : runnerResults) {
            String name = (String) r.getOrDefault("name", "Browser Test");
            String statusStr = (String) r.getOrDefault("status", "PASSED");
            TestResultStatus status = "PASSED".equalsIgnoreCase(statusStr)
                    ? TestResultStatus.PASS
                    : ("FAILED".equalsIgnoreCase(statusStr) ? TestResultStatus.FAIL : TestResultStatus.ERROR);

            Number dur = (Number) r.get("durationMs");
            int duration = dur != null ? dur.intValue() : 0;
            String errorMsg = (String) r.get("error");

            Map<String, Object> assertionDetails = new HashMap<>();
            if (r.get("stepResults") != null) {
                assertionDetails.put("stepResults", r.get("stepResults"));
            }
            if (r.get("failedStep") != null) {
                assertionDetails.put("failedStep", r.get("failedStep"));
            }
            if (r.get("details") != null) {
                assertionDetails.put("details", r.get("details"));
            }

            if (r.get("stepResults") instanceof List<?> stepList) {
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

            list.add(TestResultResponse.builder()
                    .id(idCounter++)
                    .testRunId(runId)
                    .testCaseName(name)
                    .status(status)
                    .executionTimeMs(duration)
                    .errorMessage(errorMsg)
                    .assertionDetails(assertionDetails)
                    .requestMethod("BROWSER")
                    .requestUrl(r.get("type") != null ? r.get("type").toString() : "BROWSER")
                    .build());
        }
        return list;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper Methods
    // ─────────────────────────────────────────────────────────────────────────

    private ChromeExtension getValidExtension(Long workspaceId, Long extensionId) {
        return chromeExtensionRepository.findByIdAndWorkspaceIdAndArchivedAtIsNull(extensionId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Chrome Extension not found with ID: " + extensionId + " in this workspace"));
    }

    private ChromeExtensionResponse mapToExtensionResponse(ChromeExtension ext, long testCaseCount) {
        return ChromeExtensionResponse.builder()
                .id(ext.getId())
                .workspaceId(ext.getWorkspace() != null ? ext.getWorkspace().getId() : null)
                .name(ext.getName())
                .description(ext.getDescription())
                .version(ext.getVersion())
                .status(ext.getStatus())
                .manifestJson(ext.getManifestJson())
                .createdById(ext.getCreatedBy() != null ? ext.getCreatedBy().getId() : null)
                .createdByName(ext.getCreatedBy() != null ? (ext.getCreatedBy().getFirstName() + " " + ext.getCreatedBy().getLastName()).trim() : null)
                .testCaseCount(testCaseCount)
                .createdAt(ext.getCreatedAt())
                .updatedAt(ext.getUpdatedAt())
                .build();
    }

    private TestCaseResponse mapToTestCaseResponse(ChromeExtensionTestCase tc) {
        return TestCaseResponse.builder()
                .id(tc.getId())
                .extensionId(tc.getExtension() != null ? tc.getExtension().getId() : null)
                .name(tc.getName())
                .description(tc.getDescription())
                .testType(tc.getTestType())
                .configuration(tc.getConfiguration())
                .expectedResult(tc.getExpectedResult())
                .enabled(tc.getEnabled())
                .displayOrder(tc.getDisplayOrder())
                .createdAt(tc.getCreatedAt())
                .updatedAt(tc.getUpdatedAt())
                .build();
    }

    private TestRunResponse mapToTestRunResponse(ChromeExtensionTestRun run, List<TestResultResponse> results) {
        return TestRunResponse.builder()
                .id(run.getId())
                .workspaceId(run.getExtension() != null && run.getExtension().getWorkspace() != null ? run.getExtension().getWorkspace().getId() : null)
                .extensionId(run.getExtension() != null ? run.getExtension().getId() : null)
                .extensionName(run.getExtension() != null ? run.getExtension().getName() : null)
                .triggeredById(run.getTriggeredBy() != null ? run.getTriggeredBy().getId() : null)
                .triggeredByName(run.getTriggeredBy() != null ? (run.getTriggeredBy().getFirstName() + " " + run.getTriggeredBy().getLastName()).trim() : null)
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
