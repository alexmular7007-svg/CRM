package com.arjun.crm.controller;

import com.arjun.crm.dto.request.CreateTestSuiteRequest;
import com.arjun.crm.dto.request.UpdateTestSuiteRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.TestRunResponse;
import com.arjun.crm.dto.response.TestSuiteResponse;
import com.arjun.crm.service.ChromeExtensionSuiteExecutionService;
import com.arjun.crm.service.ChromeExtensionTestSuiteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/chrome-extensions/{extensionId}/suites")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ChromeExtensionTestSuiteController {

    private final ChromeExtensionTestSuiteService testSuiteService;
    private final ChromeExtensionSuiteExecutionService suiteExecutionService;

    // ─────────────────────────────────────────────────────────────────────────
    // Suite CRUD Endpoints
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<TestSuiteResponse>> createSuite(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @Valid @RequestBody CreateTestSuiteRequest request) {
        log.info("POST /api/workspaces/{}/chrome-extensions/{}/suites - Creating test suite: {}",
                workspaceId, extensionId, request.getName());
        TestSuiteResponse response = testSuiteService.createSuite(workspaceId, extensionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Test suite created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TestSuiteResponse>>> listSuites(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId) {
        log.info("GET /api/workspaces/{}/chrome-extensions/{}/suites - Listing test suites",
                workspaceId, extensionId);
        List<TestSuiteResponse> response = testSuiteService.listSuites(workspaceId, extensionId);
        return ResponseEntity.ok(ApiResponse.success("Test suites retrieved successfully", response));
    }

    @GetMapping("/{suiteId}")
    public ResponseEntity<ApiResponse<TestSuiteResponse>> getSuite(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long suiteId) {
        log.info("GET /api/workspaces/{}/chrome-extensions/{}/suites/{} - Getting test suite",
                workspaceId, extensionId, suiteId);
        TestSuiteResponse response = testSuiteService.getSuite(workspaceId, extensionId, suiteId);
        return ResponseEntity.ok(ApiResponse.success("Test suite retrieved successfully", response));
    }

    @PutMapping("/{suiteId}")
    public ResponseEntity<ApiResponse<TestSuiteResponse>> updateSuite(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long suiteId,
            @Valid @RequestBody UpdateTestSuiteRequest request) {
        log.info("PUT /api/workspaces/{}/chrome-extensions/{}/suites/{} - Updating test suite",
                workspaceId, extensionId, suiteId);
        TestSuiteResponse response = testSuiteService.updateSuite(workspaceId, extensionId, suiteId, request);
        return ResponseEntity.ok(ApiResponse.success("Test suite updated successfully", response));
    }

    @DeleteMapping("/{suiteId}")
    public ResponseEntity<ApiResponse<Void>> deleteSuite(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long suiteId) {
        log.info("DELETE /api/workspaces/{}/chrome-extensions/{}/suites/{} - Deleting test suite",
                workspaceId, extensionId, suiteId);
        testSuiteService.deleteSuite(workspaceId, extensionId, suiteId);
        return ResponseEntity.ok(ApiResponse.success("Test suite deleted successfully", null));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Suite Run Execution Endpoints (Phase 6D Step 3)
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/{suiteId}/runs")
    public ResponseEntity<ApiResponse<TestRunResponse>> createSuiteRun(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long suiteId) {
        log.info("POST /api/workspaces/{}/chrome-extensions/{}/suites/{}/runs - Queuing suite run",
                workspaceId, extensionId, suiteId);
        TestRunResponse response = suiteExecutionService.createSuiteRun(workspaceId, extensionId, suiteId);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Test suite run queued successfully", response));
    }

    @GetMapping("/{suiteId}/runs/{runId}")
    public ResponseEntity<ApiResponse<TestRunResponse>> getSuiteRun(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long suiteId,
            @PathVariable Long runId) {
        log.info("GET /api/workspaces/{}/chrome-extensions/{}/suites/{}/runs/{} - Getting suite run details",
                workspaceId, extensionId, suiteId, runId);
        TestRunResponse response = suiteExecutionService.getSuiteRun(workspaceId, extensionId, suiteId, runId);
        return ResponseEntity.ok(ApiResponse.success("Test suite run retrieved successfully", response));
    }

    @PostMapping("/{suiteId}/runs/{runId}/cancel")
    public ResponseEntity<ApiResponse<TestRunResponse>> cancelSuiteRun(
            @PathVariable Long workspaceId,
            @PathVariable Long extensionId,
            @PathVariable Long suiteId,
            @PathVariable Long runId) {
        log.info("POST /api/workspaces/{}/chrome-extensions/{}/suites/{}/runs/{}/cancel - Cancelling suite run",
                workspaceId, extensionId, suiteId, runId);
        TestRunResponse response = suiteExecutionService.cancelSuiteRun(workspaceId, extensionId, suiteId, runId);
        return ResponseEntity.ok(ApiResponse.success("Test suite run cancelled successfully", response));
    }
}
