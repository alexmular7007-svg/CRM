package com.arjun.crm.service;

import com.arjun.crm.dto.request.BrowserTestRunRequest;
import com.arjun.crm.dto.response.BrowserTestRunResponse;

import java.util.Map;

public interface ChromeExtensionRunnerClient {
    Map<String, Object> checkHealth();
    BrowserTestRunResponse startBrowserRun(Long runId, BrowserTestRunRequest request);
    BrowserTestRunResponse getBrowserRunStatus(Long runId);
    BrowserTestRunResponse cancelBrowserRun(Long runId);
    byte[] getArtifact(Long runId, String filename);
}
