package com.arjun.crm.service;

import com.arjun.crm.entity.ChromeExtension;
import com.arjun.crm.entity.ChromeExtensionTestCase;
import com.arjun.crm.entity.ChromeExtensionTestResult;
import com.arjun.crm.entity.ChromeExtensionTestRun;
import com.arjun.crm.entity.User;

public interface ChromeExtensionTestExecutionService {

    /**
     * Executes the test run asynchronously in the background.
     *
     * @param workspaceId ID of the workspace
     * @param extension   The extension entity
     * @param testRun     The initialized test run entity
     * @param triggeredBy The user triggering the run
     * @param authToken   JWT bearer token for authenticated CRM API execution
     */
    void executeTestRunAsync(Long workspaceId, ChromeExtension extension, ChromeExtensionTestRun testRun, User triggeredBy, String authToken);

    /**
     * Executes the test run synchronously (useful for direct testing or sync pipelines).
     */
    ChromeExtensionTestRun executeTestRun(Long workspaceId, ChromeExtension extension, ChromeExtensionTestRun testRun, User triggeredBy, String authToken);

    /**
     * Executes an individual API test case against the CRM backend API with full SSRF and assertion validation.
     */
    ChromeExtensionTestResult executeSingleTestCase(
            Long workspaceId,
            ChromeExtension extension,
            ChromeExtensionTestRun testRun,
            ChromeExtensionTestCase testCase,
            String authToken,
            StringBuilder runLogs
    );
}
