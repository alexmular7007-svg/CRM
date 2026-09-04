package com.arjun.crm.controller;

import com.arjun.crm.dto.request.CreateChromeExtensionRequest;
import com.arjun.crm.dto.request.CreateTestCaseRequest;
import com.arjun.crm.dto.request.UpdateChromeExtensionRequest;
import com.arjun.crm.dto.request.UpdateTestCaseRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.ChromeExtensionResponse;
import com.arjun.crm.dto.response.TestCaseResponse;
import com.arjun.crm.service.ChromeExtensionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
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
}
