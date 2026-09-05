package com.arjun.crm.controller;

import com.arjun.crm.dto.request.BrowserTestRunRequest;
import com.arjun.crm.dto.request.CreateChromeExtensionRequest;
import com.arjun.crm.dto.request.CreateTestCaseRequest;
import com.arjun.crm.dto.request.UpdateChromeExtensionRequest;
import com.arjun.crm.dto.request.UpdateTestCaseRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.BrowserTestRunResponse;
import com.arjun.crm.dto.response.ChromeExtensionResponse;
import com.arjun.crm.dto.response.TestCaseResponse;
import com.arjun.crm.dto.response.TestRunResponse;
import com.arjun.crm.service.ChromeExtensionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/chrome-extensions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ChromeExtensionController {

    private final ChromeExtensionService chromeExtensionService;

    // ─────────────────────────────────────────────────────────────────────────
    // Extension Endpoints
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<ChromeExtensionResponse>> createExtension(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateChromeExtensionRequest request) {
        log.info("POST /api/workspaces/{}/chrome-extensions - Creating extension: {}", workspaceId, request.getName());
        ChromeExtensionResponse response = chromeExtensionService.createExtension(workspaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chrome Extension created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ChromeExtensionResponse>>> listExtensions(
            @PathVariable Long workspaceId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("GET /api/workspaces/{}/chrome-extensions - Listing extensions", workspaceId);
        Page<ChromeExtensionResponse> response = chromeExtensionService.listExtensions(workspaceId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Chrome Extensions retrieved successfully", response));
    }

    @GetMapping("/{extensionId}")
    public ResponseEntity<ApiResponse<ChromeExtensionResponse>> getExtension(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId) {
        log.info("GET /api/workspaces/{}/chrome-extensions/{} - Getting extension", workspaceId, extensionId);
        ChromeExtensionResponse response = chromeExtensionService.getExtension(workspaceId, extensionId);
        return ResponseEntity.ok(ApiResponse.success("Chrome Extension retrieved successfully", response));
    }

    @PutMapping("/{extensionId}")
    public ResponseEntity<ApiResponse<ChromeExtensionResponse>> updateExtension(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @Valid @RequestBody UpdateChromeExtensionRequest request) {
        log.info("PUT /api/workspaces/{}/chrome-extensions/{} - Updating extension", workspaceId, extensionId);
        ChromeExtensionResponse response = chromeExtensionService.updateExtension(workspaceId, extensionId, request);
        return ResponseEntity.ok(ApiResponse.success("Chrome Extension updated successfully", response));
    }

    @DeleteMapping("/{extensionId}")
    public ResponseEntity<ApiResponse<Void>> deleteExtension(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId) {
        log.info("DELETE /api/workspaces/{}/chrome-extensions/{} - Deleting extension", workspaceId, extensionId);
        chromeExtensionService.deleteExtension(workspaceId, extensionId);
        return ResponseEntity.ok(ApiResponse.success("Chrome Extension deleted successfully", null));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test Case Endpoints
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/{extensionId}/test-cases")
    public ResponseEntity<ApiResponse<TestCaseResponse>> createTestCase(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @Valid @RequestBody CreateTestCaseRequest request) {
        log.info("POST /api/workspaces/{}/chrome-extensions/{}/test-cases - Creating test case: {}",
                workspaceId, extensionId, request.getName());
        TestCaseResponse response = chromeExtensionService.createTestCase(workspaceId, extensionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Test case created successfully", response));
    }

    @GetMapping("/{extensionId}/test-cases")
    public ResponseEntity<ApiResponse<List<TestCaseResponse>>> listTestCases(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId) {
        log.info("GET /api/workspaces/{}/chrome-extensions/{}/test-cases - Listing test cases", workspaceId, extensionId);
        List<TestCaseResponse> response = chromeExtensionService.listTestCases(workspaceId, extensionId);
        return ResponseEntity.ok(ApiResponse.success("Test cases retrieved successfully", response));
    }

    @GetMapping("/{extensionId}/test-cases/{testCaseId}")
    public ResponseEntity<ApiResponse<TestCaseResponse>> getTestCase(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long testCaseId) {
        log.info("GET /api/workspaces/{}/chrome-extensions/{}/test-cases/{} - Getting test case",
                workspaceId, extensionId, testCaseId);
        TestCaseResponse response = chromeExtensionService.getTestCase(workspaceId, extensionId, testCaseId);
        return ResponseEntity.ok(ApiResponse.success("Test case retrieved successfully", response));
    }

    @PutMapping("/{extensionId}/test-cases/{testCaseId}")
    public ResponseEntity<ApiResponse<TestCaseResponse>> updateTestCase(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long testCaseId,
            @Valid @RequestBody UpdateTestCaseRequest request) {
        log.info("PUT /api/workspaces/{}/chrome-extensions/{}/test-cases/{} - Updating test case",
                workspaceId, extensionId, testCaseId);
        TestCaseResponse response = chromeExtensionService.updateTestCase(workspaceId, extensionId, testCaseId, request);
        return ResponseEntity.ok(ApiResponse.success("Test case updated successfully", response));
    }

    @DeleteMapping("/{extensionId}/test-cases/{testCaseId}")
    public ResponseEntity<ApiResponse<Void>> deleteTestCase(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long testCaseId) {
        log.info("DELETE /api/workspaces/{}/chrome-extensions/{}/test-cases/{} - Deleting test case",
                workspaceId, extensionId, testCaseId);
        chromeExtensionService.deleteTestCase(workspaceId, extensionId, testCaseId);
        return ResponseEntity.ok(ApiResponse.success("Test case deleted successfully", null));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test Run Endpoints
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/{extensionId}/runs")
    public ResponseEntity<ApiResponse<TestRunResponse>> createTestRun(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId) {
        log.info("POST /api/workspaces/{}/chrome-extensions/{}/runs - Creating test run", workspaceId, extensionId);
        TestRunResponse response = chromeExtensionService.createTestRun(workspaceId, extensionId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Test run created successfully", response));
    }

    @GetMapping("/{extensionId}/runs")
    public ResponseEntity<ApiResponse<Page<TestRunResponse>>> listTestRuns(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("GET /api/workspaces/{}/chrome-extensions/{}/runs - Listing test runs", workspaceId, extensionId);
        Page<TestRunResponse> response = chromeExtensionService.listTestRuns(workspaceId, extensionId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Test runs retrieved successfully", response));
    }

    @GetMapping("/{extensionId}/runs/{runId}")
    public ResponseEntity<ApiResponse<TestRunResponse>> getTestRun(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long runId) {
        log.info("GET /api/workspaces/{}/chrome-extensions/{}/runs/{} - Getting test run", workspaceId, extensionId, runId);
        TestRunResponse response = chromeExtensionService.getTestRun(workspaceId, extensionId, runId);
        return ResponseEntity.ok(ApiResponse.success("Test run retrieved successfully", response));
    }

    @PostMapping("/{extensionId}/runs/{runId}/cancel")
    public ResponseEntity<ApiResponse<TestRunResponse>> cancelTestRun(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long runId) {
        log.info("POST /api/workspaces/{}/chrome-extensions/{}/runs/{}/cancel - Cancelling test run", workspaceId, extensionId, runId);
        TestRunResponse response = chromeExtensionService.cancelTestRun(workspaceId, extensionId, runId);
        return ResponseEntity.ok(ApiResponse.success("Test run cancelled successfully", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Browser Execution Endpoints (Phase 6B)
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/runner/health")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getRunnerHealth(
            @PathVariable Long workspaceId) {
        log.info("GET /api/workspaces/{}/chrome-extensions/runner/health - Checking runner health", workspaceId);
        java.util.Map<String, Object> health = chromeExtensionService.checkRunnerHealth();
        return ResponseEntity.ok(ApiResponse.success("Runner health retrieved successfully", health));
    }

    @PostMapping("/{extensionId}/browser-runs")
    public ResponseEntity<ApiResponse<BrowserTestRunResponse>> startBrowserRun(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @RequestBody(required = false) BrowserTestRunRequest request) {
        log.info("POST /api/workspaces/{}/chrome-extensions/{}/browser-runs - Starting browser test run", workspaceId, extensionId);
        BrowserTestRunResponse response = chromeExtensionService.startBrowserRun(workspaceId, extensionId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Browser test run initiated successfully", response));
    }

    @GetMapping("/{extensionId}/browser-runs/{runId}")
    public ResponseEntity<ApiResponse<BrowserTestRunResponse>> getBrowserRunStatus(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long runId) {
        log.info("GET /api/workspaces/{}/chrome-extensions/{}/browser-runs/{} - Getting browser run status", workspaceId, extensionId, runId);
        BrowserTestRunResponse response = chromeExtensionService.getBrowserRunStatus(workspaceId, extensionId, runId);
        return ResponseEntity.ok(ApiResponse.success("Browser test run status retrieved successfully", response));
    }

    @PostMapping("/{extensionId}/browser-runs/{runId}/cancel")
    public ResponseEntity<ApiResponse<BrowserTestRunResponse>> cancelBrowserRun(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long runId) {
        log.info("POST /api/workspaces/{}/chrome-extensions/{}/browser-runs/{}/cancel - Cancelling browser test run", workspaceId, extensionId, runId);
        BrowserTestRunResponse response = chromeExtensionService.cancelBrowserRun(workspaceId, extensionId, runId);
        return ResponseEntity.ok(ApiResponse.success("Browser test run cancelled successfully", response));
    }

    @GetMapping(value = "/{extensionId}/browser-runs/{runId}/artifacts/{filename}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getArtifact(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long runId,
            @PathVariable String filename) {
        log.info("GET /api/workspaces/{}/chrome-extensions/{}/browser-runs/{}/artifacts/{} - Retrieving artifact",
                workspaceId, extensionId, runId, filename);
        byte[] imageBytes = chromeExtensionService.getArtifact(workspaceId, extensionId, runId, filename);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(imageBytes);
    }
}
