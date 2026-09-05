package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.BrowserTestRunRequest;
import com.arjun.crm.dto.response.BrowserTestRunResponse;
import com.arjun.crm.service.ChromeExtensionRunnerClient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class ChromeExtensionRunnerClientImpl implements ChromeExtensionRunnerClient {

    private final String runnerBaseUrl;
    private final String runnerSharedSecret;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public ChromeExtensionRunnerClientImpl(
            @Value("${chrome.extension.runner.base-url:http://localhost:9090}") String runnerBaseUrl,
            @Value("${chrome.extension.runner.shared-secret:}") String runnerSharedSecret,
            ObjectMapper objectMapper) {
        this.runnerBaseUrl = runnerBaseUrl.endsWith("/") ? runnerBaseUrl.substring(0, runnerBaseUrl.length() - 1) : runnerBaseUrl;
        this.runnerSharedSecret = runnerSharedSecret;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    private HttpRequest.Builder createRequestBuilder(String targetUrl) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(targetUrl));
        if (runnerSharedSecret != null && !runnerSharedSecret.trim().isEmpty()) {
            builder.header("X-Runner-Secret", runnerSharedSecret.trim());
        }
        return builder;
    }

    @Override
    public Map<String, Object> checkHealth() {
        String targetUrl = runnerBaseUrl + "/health";
        try {
            HttpRequest request = createRequestBuilder(targetUrl)
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
            } else {
                Map<String, Object> map = new HashMap<>();
                map.put("status", "DOWN");
                map.put("statusCode", response.statusCode());
                return map;
            }
        } catch (Exception e) {
            log.warn("Chrome Extension Runner is not reachable at {}: {}", targetUrl, e.getMessage());
            Map<String, Object> map = new HashMap<>();
            map.put("status", "DOWN");
            map.put("error", e.getMessage());
            return map;
        }
    }

    @Override
    public BrowserTestRunResponse startBrowserRun(Long runId, BrowserTestRunRequest request) {
        String targetUrl = runnerBaseUrl + "/api/test-runs";
        log.info("[BROWSER_RUN_REQUESTED] Run ID: {}, Target: {}", runId, targetUrl);

        try {
            if (request.getRunId() == null) {
                request.setRunId(runId);
            }
            String requestJson = objectMapper.writeValueAsString(request);

            HttpRequest httpRequest = createRequestBuilder(targetUrl)
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 202 || response.statusCode() == 200) {
                BrowserTestRunResponse res = objectMapper.readValue(response.body(), BrowserTestRunResponse.class);
                log.info("[BROWSER_RUN_ACCEPTED] Run ID: {}, Status: {}", res.getRunId(), res.getStatus());
                return res;
            } else {
                log.error("Failed to start browser test run on runner, status code: {}, body: {}", response.statusCode(), response.body());
                return BrowserTestRunResponse.builder()
                        .runId(runId)
                        .status("ERROR")
                        .message("Runner returned status " + response.statusCode() + ": " + response.body())
                        .build();
            }
        } catch (Exception e) {
            log.error("[BROWSER_RUN_ERROR] Could not connect to extension runner at {}: {}", targetUrl, e.getMessage());
            return BrowserTestRunResponse.builder()
                    .runId(runId)
                    .status("ERROR")
                    .message("Extension Runner unavailable: " + e.getMessage())
                    .logs(Collections.singletonList("Runner connection failed: " + e.getMessage()))
                    .build();
        }
    }

    @Override
    public BrowserTestRunResponse getBrowserRunStatus(Long runId) {
        String targetUrl = runnerBaseUrl + "/api/test-runs/" + runId;
        try {
            HttpRequest httpRequest = createRequestBuilder(targetUrl)
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                BrowserTestRunResponse res = objectMapper.readValue(response.body(), BrowserTestRunResponse.class);
                log.info("[BROWSER_RUN_STATUS] Run ID: {}, Status: {}", res.getRunId(), res.getStatus());
                return res;
            } else if (response.statusCode() == 404) {
                return BrowserTestRunResponse.builder()
                        .runId(runId)
                        .status("ERROR")
                        .message("Test run not found on runner")
                        .build();
            } else {
                return BrowserTestRunResponse.builder()
                        .runId(runId)
                        .status("ERROR")
                        .message("Runner query failed with status: " + response.statusCode())
                        .build();
            }
        } catch (Exception e) {
            log.warn("Could not query browser run status from runner: {}", e.getMessage());
            return BrowserTestRunResponse.builder()
                    .runId(runId)
                    .status("ERROR")
                    .message("Runner connection failed: " + e.getMessage())
                    .build();
        }
    }

    @Override
    public BrowserTestRunResponse cancelBrowserRun(Long runId) {
        String targetUrl = runnerBaseUrl + "/api/test-runs/" + runId + "/cancel";
        try {
            HttpRequest httpRequest = createRequestBuilder(targetUrl)
                    .timeout(Duration.ofSeconds(5))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), BrowserTestRunResponse.class);
            } else {
                return BrowserTestRunResponse.builder()
                        .runId(runId)
                        .status("CANCELLED")
                        .message("Cancel requested, runner status: " + response.statusCode())
                        .build();
            }
        } catch (Exception e) {
            log.warn("Could not cancel browser run on runner: {}", e.getMessage());
            return BrowserTestRunResponse.builder()
                    .runId(runId)
                    .status("CANCELLED")
                    .message("Cancellation requested locally: " + e.getMessage())
                    .build();
        }
    }

    @Override
    public byte[] getArtifact(Long runId, String filename) {
        String targetUrl = runnerBaseUrl + "/api/artifacts/" + runId + "/" + filename;
        log.info("[RUNNER_ARTIFACT_REQUEST] Run ID: {}, Filename: {}, Target: {}", runId, filename, targetUrl);

        try {
            HttpRequest httpRequest = createRequestBuilder(targetUrl)
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<byte[]> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() == 200) {
                return response.body();
            } else if (response.statusCode() == 404) {
                throw new com.arjun.crm.exception.ResourceNotFoundException("Artifact not found: " + filename);
            } else if (response.statusCode() == 403) {
                throw new com.arjun.crm.exception.AccessDeniedException("Access denied to artifact: " + filename);
            } else if (response.statusCode() == 400) {
                throw new IllegalArgumentException("Invalid artifact request: " + filename);
            } else {
                throw new RuntimeException("Runner returned status " + response.statusCode() + " when retrieving artifact");
            }
        } catch (com.arjun.crm.exception.ResourceNotFoundException | com.arjun.crm.exception.AccessDeniedException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("[RUNNER_ARTIFACT_ERROR] Could not retrieve artifact from {}: {}", targetUrl, e.getMessage());
            throw new RuntimeException("Failed to retrieve artifact from extension runner: " + e.getMessage(), e);
        }
    }
}
