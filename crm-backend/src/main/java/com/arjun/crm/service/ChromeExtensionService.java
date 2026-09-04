package com.arjun.crm.service;

import com.arjun.crm.dto.request.CreateChromeExtensionRequest;
import com.arjun.crm.dto.request.CreateTestCaseRequest;
import com.arjun.crm.dto.request.UpdateChromeExtensionRequest;
import com.arjun.crm.dto.request.UpdateTestCaseRequest;
import com.arjun.crm.dto.response.ChromeExtensionResponse;
import com.arjun.crm.dto.response.TestCaseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ChromeExtensionService {

    // Chrome Extension CRUD
    ChromeExtensionResponse createExtension(Long workspaceId, CreateChromeExtensionRequest request);

    Page<ChromeExtensionResponse> listExtensions(Long workspaceId, String search, Pageable pageable);

    ChromeExtensionResponse getExtension(Long workspaceId, Long extensionId);

    ChromeExtensionResponse updateExtension(Long workspaceId, Long extensionId, UpdateChromeExtensionRequest request);

    void deleteExtension(Long workspaceId, Long extensionId);

    // Test Case CRUD
    TestCaseResponse createTestCase(Long workspaceId, Long extensionId, CreateTestCaseRequest request);

    List<TestCaseResponse> listTestCases(Long workspaceId, Long extensionId);

    TestCaseResponse getTestCase(Long workspaceId, Long extensionId, Long testCaseId);

    TestCaseResponse updateTestCase(Long workspaceId, Long extensionId, Long testCaseId, UpdateTestCaseRequest request);

    void deleteTestCase(Long workspaceId, Long extensionId, Long testCaseId);
}
