package com.arjun.crm.service;

import com.arjun.crm.dto.response.TestRunResponse;
import com.arjun.crm.entity.ChromeExtension;
import com.arjun.crm.entity.ChromeExtensionTestRun;
import com.arjun.crm.entity.ChromeExtensionTestSuite;
import com.arjun.crm.entity.User;

public interface ChromeExtensionSuiteExecutionService {

    /**
     * Queues and triggers asynchronous execution of a test suite.
     */
    TestRunResponse createSuiteRun(Long workspaceId, Long extensionId, Long suiteId);

    /**
     * Retrieves test run summary, telemetry, and per-item results for a suite run.
     */
    TestRunResponse getSuiteRun(Long workspaceId, Long extensionId, Long suiteId, Long runId);

    /**
     * Cancels an active suite run and propagates cancellation to any active browser runner child.
     */
    TestRunResponse cancelSuiteRun(Long workspaceId, Long extensionId, Long suiteId, Long runId);

    /**
     * Executes the test suite asynchronously on a background task executor.
     */
    void executeSuiteRunAsync(Long workspaceId, ChromeExtension extension, ChromeExtensionTestSuite suite, ChromeExtensionTestRun testRun, User triggeredBy, String authToken);

    /**
     * Executes the test suite sequentially across ordered enabled items.
     */
    ChromeExtensionTestRun executeSuiteRun(Long workspaceId, ChromeExtension extension, ChromeExtensionTestSuite suite, ChromeExtensionTestRun testRun, User triggeredBy, String authToken);
}
