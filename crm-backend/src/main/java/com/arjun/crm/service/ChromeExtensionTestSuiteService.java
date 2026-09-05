package com.arjun.crm.service;

import com.arjun.crm.dto.request.CreateTestSuiteRequest;
import com.arjun.crm.dto.request.UpdateTestSuiteRequest;
import com.arjun.crm.dto.response.TestSuiteResponse;

import java.util.List;

public interface ChromeExtensionTestSuiteService {

    TestSuiteResponse createSuite(Long workspaceId, Long extensionId, CreateTestSuiteRequest request);

    List<TestSuiteResponse> listSuites(Long workspaceId, Long extensionId);

    TestSuiteResponse getSuite(Long workspaceId, Long extensionId, Long suiteId);

    TestSuiteResponse updateSuite(Long workspaceId, Long extensionId, Long suiteId, UpdateTestSuiteRequest request);

    void deleteSuite(Long workspaceId, Long extensionId, Long suiteId);
}
