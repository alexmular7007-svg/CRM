package com.arjun.crm.service.impl;

import com.arjun.crm.entity.ChromeExtension;
import com.arjun.crm.entity.ChromeExtensionTestCase;
import com.arjun.crm.entity.ChromeExtensionTestResult;
import com.arjun.crm.entity.ChromeExtensionTestRun;
import com.arjun.crm.entity.User;
import com.arjun.crm.enums.TestResultStatus;
import com.arjun.crm.enums.TestRunStatus;
import com.arjun.crm.repository.ChromeExtensionTestCaseRepository;
import com.arjun.crm.repository.ChromeExtensionTestResultRepository;
import com.arjun.crm.repository.ChromeExtensionTestRunRepository;
import com.arjun.crm.security.JwtService;
import com.arjun.crm.service.ChromeExtensionTestExecutionService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChromeExtensionTestExecutionServiceImpl implements ChromeExtensionTestExecutionService {

    private final ChromeExtensionTestCaseRepository testCaseRepository;
    private final ChromeExtensionTestRunRepository testRunRepository;
    private final ChromeExtensionTestResultRepository testResultRepository;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    @Value("${crm.backend.base-url:http://localhost:${server.port:8080}}")
    private String defaultBaseUrl;

    private static final DateTimeFormatter LOG_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Override
    @Async("taskExecutor")
    public void executeTestRunAsync(Long workspaceId, ChromeExtension extension, ChromeExtensionTestRun testRun, User triggeredBy, String authToken) {
        log.info("[TEST_RUN_STARTED] Async test run execution started for Run ID: {}", testRun.getId());
        executeTestRun(workspaceId, extension, testRun, triggeredBy, authToken);
    }

    @Override
    @Transactional
    public ChromeExtensionTestRun executeTestRun(Long workspaceId, ChromeExtension extension, ChromeExtensionTestRun testRun, User triggeredBy, String authToken) {
        long startTime = System.currentTimeMillis();
        StringBuilder runLogs = new StringBuilder();

        // 1. Fetch fresh test run and check initial state
        testRun = testRunRepository.findById(testRun.getId()).orElse(testRun);
        if (testRun.getStatus() == TestRunStatus.CANCELLED) {
            log.info("[TEST_RUN_COMPLETED] Run ID: {} was cancelled before execution started", testRun.getId());
            return testRun;
        }

        testRun.setStatus(TestRunStatus.RUNNING);
        testRun.setStartedAt(LocalDateTime.now());
        testRun = testRunRepository.save(testRun);

        appendLog(runLogs, "TEST_RUN_STARTED", "Starting test suite for extension '" + extension.getName() + "' (ID: " + extension.getId() + ")");
        log.info("[TEST_RUN_STARTED] Run ID: {} for extension '{}' (ID: {})", testRun.getId(), extension.getName(), extension.getId());

        // 2. Fetch enabled test cases
        List<ChromeExtensionTestCase> testCases = testCaseRepository
                .findByExtensionIdOrderByDisplayOrderAscCreatedAtAsc(extension.getId())
                .stream()
                .filter(tc -> Boolean.TRUE.equals(tc.getEnabled()))
                .toList();

        appendLog(runLogs, "TEST_RUN_STARTED", "Loaded " + testCases.size() + " enabled test case(s) for execution");
        log.info("[TEST_RUN_STARTED] Run ID: {}, total test cases to execute: {}", testRun.getId(), testCases.size());

        int passedCount = 0;
        int failedCount = 0;
        int errorCount = 0;

        // Effective auth token: caller's token or newly generated user token
        String effectiveToken = authToken;
        if ((effectiveToken == null || effectiveToken.isBlank()) && triggeredBy != null) {
            try {
                org.springframework.security.core.userdetails.UserDetails userDetails =
                        org.springframework.security.core.userdetails.User.builder()
                                .username(triggeredBy.getEmail())
                                .password(triggeredBy.getPassword() != null ? triggeredBy.getPassword() : "")
                                .authorities("ROLE_" + (triggeredBy.getRole() != null ? triggeredBy.getRole().name() : "USER"))
                                .build();
                effectiveToken = jwtService.generateToken(Map.of("userId", triggeredBy.getId()), userDetails);
            } catch (Exception e) {
                log.warn("Could not generate JWT token for test execution: {}", e.getMessage());
            }
        }

        // 3. Execution loop
        for (ChromeExtensionTestCase tc : testCases) {
            // Check cancellation before each test case
            Optional<ChromeExtensionTestRun> currentRunCheck = testRunRepository.findById(testRun.getId());
            if (currentRunCheck.isPresent() && currentRunCheck.get().getStatus() == TestRunStatus.CANCELLED) {
                appendLog(runLogs, "TEST_RUN_CANCELLED", "Test run cancelled by user during execution");
                log.info("[TEST_RUN_COMPLETED] Run ID: {} execution cancelled by user", testRun.getId());
                testRun.setStatus(TestRunStatus.CANCELLED);
                testRun.setCompletedAt(LocalDateTime.now());
                testRun.setDurationMs(System.currentTimeMillis() - startTime);
                testRun.setLogs(runLogs.toString());
                return testRunRepository.save(testRun);
            }

            ChromeExtensionTestResult result = executeSingleTestCase(workspaceId, extension, testRun, tc, effectiveToken, runLogs);
            testResultRepository.save(result);

            if (result.getStatus() == TestResultStatus.PASS || result.getStatus() == TestResultStatus.PASSED) {
                passedCount++;
            } else if (result.getStatus() == TestResultStatus.FAIL || result.getStatus() == TestResultStatus.FAILED) {
                failedCount++;
            } else if (result.getStatus() == TestResultStatus.ERROR) {
                errorCount++;
            }
        }

        long totalDuration = System.currentTimeMillis() - startTime;
        testRun.setTotalTests(testCases.size());
        testRun.setPassedTests(passedCount);
        testRun.setFailedTests(failedCount);
        testRun.setErrorTests(errorCount);
        testRun.setDurationMs(totalDuration);
        testRun.setCompletedAt(LocalDateTime.now());

        // Determine overall terminal status
        if (errorCount > 0) {
            testRun.setStatus(TestRunStatus.ERROR);
        } else if (failedCount > 0) {
            testRun.setStatus(TestRunStatus.FAILED);
        } else {
            testRun.setStatus(TestRunStatus.PASSED);
        }

        appendLog(runLogs, "TEST_RUN_COMPLETED", String.format(
                "Completed suite in %dms. Total: %d, Passed: %d, Failed: %d, Errors: %d -> Status: %s",
                totalDuration, testCases.size(), passedCount, failedCount, errorCount, testRun.getStatus()
        ));
        log.info("[TEST_RUN_COMPLETED] Run ID: {}, Status: {}, Total: {}, Passed: {}, Failed: {}, Errors: {}, Duration: {}ms",
                testRun.getId(), testRun.getStatus(), testCases.size(), passedCount, failedCount, errorCount, totalDuration);

        testRun.setLogs(runLogs.toString());
        return testRunRepository.save(testRun);
    }

    /**
     * Executes an individual test case against the CRM backend API.
     */
    @Override
    public ChromeExtensionTestResult executeSingleTestCase(
            Long workspaceId,
            ChromeExtension extension,
            ChromeExtensionTestRun testRun,
            ChromeExtensionTestCase testCase,
            String authToken,
            StringBuilder runLogs
    ) {
        long caseStartTime = System.currentTimeMillis();
        Map<String, Object> config = testCase.getConfiguration() != null ? testCase.getConfiguration() : Collections.emptyMap();
        Map<String, Object> expected = testCase.getExpectedResult() != null ? testCase.getExpectedResult() : Collections.emptyMap();

        String rawMethod = (String) config.getOrDefault("operation", config.getOrDefault("method", "GET"));
        String httpMethod = (rawMethod != null ? rawMethod.trim().toUpperCase() : "GET");

        String rawEndpoint = (String) config.getOrDefault("endpoint", config.getOrDefault("url", ""));
        String resolvedEndpoint = resolveVariables(rawEndpoint, workspaceId, extension.getId());

        appendLog(runLogs, "TEST_CASE_STARTED", String.format(
                "Test Case #%d: '%s' [%s %s]", testCase.getId(), testCase.getName(), httpMethod, resolvedEndpoint
        ));
        log.info("[TEST_CASE_STARTED] Run ID: {}, Test Case ID: {}, Name: '{}', Method: {}, Endpoint: {}",
                testRun.getId(), testCase.getId(), testCase.getName(), httpMethod, resolvedEndpoint);

        Map<String, Object> assertionDetails = new LinkedHashMap<>();
        Map<String, Object> sanitizedRequestInfo = new LinkedHashMap<>();
        sanitizedRequestInfo.put("method", httpMethod);
        sanitizedRequestInfo.put("endpoint", resolvedEndpoint);

        try {
            // Validate URL and enforce SSRF Protection
            URI targetUri = validateAndResolveUrl(resolvedEndpoint);
            sanitizedRequestInfo.put("resolvedUrl", targetUri.toString());

            // Build HTTP Request
            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(targetUri)
                    .timeout(Duration.ofSeconds(10));

            // Headers
            Map<String, String> headers = extractHeaders(config);
            boolean hasAuthHeader = false;
            for (Map.Entry<String, String> entry : headers.entrySet()) {
                if ("authorization".equalsIgnoreCase(entry.getKey())) {
                    hasAuthHeader = true;
                }
                reqBuilder.header(entry.getKey(), entry.getValue());
            }

            // Inject bearer token if no explicit authorization header was given
            if (!hasAuthHeader && authToken != null && !authToken.isBlank()) {
                reqBuilder.header("Authorization", "Bearer " + authToken);
            }

            // Payload / Body
            Object payloadObj = config.getOrDefault("payload", config.get("body"));
            HttpRequest.BodyPublisher bodyPublisher;
            if (payloadObj != null && !List.of("GET", "HEAD", "OPTIONS").contains(httpMethod)) {
                String bodyStr = (payloadObj instanceof String str) ? str : objectMapper.writeValueAsString(payloadObj);
                bodyPublisher = HttpRequest.BodyPublishers.ofString(bodyStr);
                if (!headers.containsKey("Content-Type") && !headers.containsKey("content-type")) {
                    reqBuilder.header("Content-Type", "application/json");
                }
                sanitizedRequestInfo.put("payload", payloadObj);
            } else {
                bodyPublisher = HttpRequest.BodyPublishers.noBody();
            }

            reqBuilder.method(httpMethod, bodyPublisher);
            HttpRequest request = reqBuilder.build();

            // Execute HTTP Request
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long executionTimeMs = System.currentTimeMillis() - caseStartTime;

            int actualStatusCode = response.statusCode();
            String responseBodyStr = response.body();

            // Parse response body as JSON if possible
            Map<String, Object> parsedResponsePayload = null;
            if (responseBodyStr != null && !responseBodyStr.isBlank()) {
                try {
                    String trimmed = responseBodyStr.trim();
                    if (trimmed.startsWith("{")) {
                        parsedResponsePayload = objectMapper.readValue(trimmed, new TypeReference<Map<String, Object>>() {});
                    } else if (trimmed.startsWith("[")) {
                        List<Object> list = objectMapper.readValue(trimmed, new TypeReference<List<Object>>() {});
                        parsedResponsePayload = Map.of("data", list);
                    } else {
                        parsedResponsePayload = Map.of("raw", trimmed);
                    }
                } catch (Exception e) {
                    parsedResponsePayload = Map.of("raw", responseBodyStr);
                }
            }

            // Evaluate assertions
            AssertionEvaluation eval = evaluateAssertions(expected, actualStatusCode, responseBodyStr, parsedResponsePayload);

            assertionDetails.put("request", sanitizedRequestInfo);
            assertionDetails.put("expected", expected);
            assertionDetails.put("actual", Map.of(
                    "statusCode", actualStatusCode,
                    "payload", parsedResponsePayload != null ? parsedResponsePayload : Collections.emptyMap()
            ));
            assertionDetails.put("assertions", eval.assertionsList);

            if (eval.allPassed) {
                appendLog(runLogs, "TEST_CASE_PASSED", String.format(
                        "Test Case #%d PASSED (Status: %d, Duration: %dms)",
                        testCase.getId(), actualStatusCode, executionTimeMs
                ));
                log.info("[TEST_CASE_PASSED] Run ID: {}, Test Case ID: {}, Status: {}, Duration: {}ms",
                        testRun.getId(), testCase.getId(), actualStatusCode, executionTimeMs);

                return ChromeExtensionTestResult.builder()
                        .testRun(testRun)
                        .testCase(testCase)
                        .status(TestResultStatus.PASSED)
                        .executionTimeMs((int) executionTimeMs)
                        .actualStatusCode(actualStatusCode)
                        .actualResponsePayload(parsedResponsePayload)
                        .assertionDetails(assertionDetails)
                        .build();
            } else {
                String failureReason = String.join("; ", eval.failureMessages);
                appendLog(runLogs, "TEST_CASE_FAILED", String.format(
                        "Test Case #%d FAILED: %s (Duration: %dms)",
                        testCase.getId(), failureReason, executionTimeMs
                ));
                log.warn("[TEST_CASE_FAILED] Run ID: {}, Test Case ID: {}, Reason: {}",
                        testRun.getId(), testCase.getId(), failureReason);

                return ChromeExtensionTestResult.builder()
                        .testRun(testRun)
                        .testCase(testCase)
                        .status(TestResultStatus.FAILED)
                        .executionTimeMs((int) executionTimeMs)
                        .actualStatusCode(actualStatusCode)
                        .actualResponsePayload(parsedResponsePayload)
                        .errorMessage(failureReason)
                        .assertionDetails(assertionDetails)
                        .build();
            }

        } catch (SecurityException se) {
            long executionTimeMs = System.currentTimeMillis() - caseStartTime;
            String errorMsg = "Security / SSRF Violation: " + se.getMessage();
            appendLog(runLogs, "TEST_CASE_ERROR", "Test Case #" + testCase.getId() + " ERROR: " + errorMsg);
            log.error("[TEST_CASE_ERROR] Run ID: {}, Test Case ID: {}, Error: {}", testRun.getId(), testCase.getId(), errorMsg);

            assertionDetails.put("request", sanitizedRequestInfo);
            assertionDetails.put("error", errorMsg);

            return ChromeExtensionTestResult.builder()
                    .testRun(testRun)
                    .testCase(testCase)
                    .status(TestResultStatus.ERROR)
                    .executionTimeMs((int) executionTimeMs)
                    .errorMessage(errorMsg)
                    .assertionDetails(assertionDetails)
                    .build();

        } catch (Exception e) {
            long executionTimeMs = System.currentTimeMillis() - caseStartTime;
            String errorMsg = "Execution failed: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            appendLog(runLogs, "TEST_CASE_ERROR", "Test Case #" + testCase.getId() + " ERROR: " + errorMsg);
            log.error("[TEST_CASE_ERROR] Run ID: {}, Test Case ID: {}, Error: {}", testRun.getId(), testCase.getId(), errorMsg, e);

            assertionDetails.put("request", sanitizedRequestInfo);
            assertionDetails.put("error", errorMsg);

            return ChromeExtensionTestResult.builder()
                    .testRun(testRun)
                    .testCase(testCase)
                    .status(TestResultStatus.ERROR)
                    .executionTimeMs((int) executionTimeMs)
                    .errorMessage(errorMsg)
                    .assertionDetails(assertionDetails)
                    .build();
        }
    }

    /**
     * Resolves variables like {workspaceId} and {extensionId} in strings.
     */
    private String resolveVariables(String template, Long workspaceId, Long extensionId) {
        if (template == null) return "";
        return template
                .replace("{workspaceId}", String.valueOf(workspaceId != null ? workspaceId : ""))
                .replace("{extensionId}", String.valueOf(extensionId != null ? extensionId : ""));
    }

    /**
     * SSRF Protection & URL resolution.
     * Enforces that test cases target only the CRM backend host.
     */
    private URI validateAndResolveUrl(String endpoint) {
        if (endpoint == null || endpoint.isBlank()) {
            throw new IllegalArgumentException("Endpoint URL cannot be empty");
        }

        String targetUrl = endpoint.trim();
        String base = defaultBaseUrl.endsWith("/") ? defaultBaseUrl.substring(0, defaultBaseUrl.length() - 1) : defaultBaseUrl;

        // Relative path starting with /
        if (targetUrl.startsWith("/")) {
            targetUrl = base + targetUrl;
        }

        URI uri = URI.create(targetUrl);
        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            throw new SecurityException("Invalid URI scheme '" + scheme + "'. Only HTTP and HTTPS are permitted.");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new SecurityException("URL must contain a valid hostname");
        }

        // SSRF: Prohibit cloud metadata IPs, link-local, and non-CRM domains
        String lowerHost = host.toLowerCase();
        if (lowerHost.equals("169.254.169.254") || lowerHost.contains("metadata.google") || lowerHost.equals("100.100.100.200")) {
            throw new SecurityException("Access to cloud metadata endpoints is prohibited");
        }

        URI baseUri = URI.create(base);
        String baseHost = baseUri.getHost() != null ? baseUri.getHost().toLowerCase() : "localhost";

        // Allow localhost, 127.0.0.1, or the configured CRM backend host
        boolean isLocalhost = lowerHost.equals("localhost") || lowerHost.equals("127.0.0.1") || lowerHost.equals("[::1]");
        boolean isBaseHost = lowerHost.equalsIgnoreCase(baseHost);

        if (!isLocalhost && !isBaseHost) {
            throw new SecurityException("Requests to external host '" + host + "' are prohibited. Endpoints must target the CRM backend (" + baseHost + ").");
        }

        return uri;
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> extractHeaders(Map<String, Object> config) {
        Map<String, String> result = new LinkedHashMap<>();
        Object headersObj = config.get("headers");
        if (headersObj instanceof Map<?, ?> map) {
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (entry.getKey() != null && entry.getValue() != null) {
                    result.put(entry.getKey().toString(), entry.getValue().toString());
                }
            }
        }
        return result;
    }

    /**
     * Evaluates configured assertions against the actual HTTP response.
     */
    private AssertionEvaluation evaluateAssertions(
            Map<String, Object> expected,
            int actualStatusCode,
            String responseBodyStr,
            Map<String, Object> parsedJson
    ) {
        List<Map<String, Object>> assertionsList = new ArrayList<>();
        List<String> failureMessages = new ArrayList<>();
        boolean allPassed = true;

        if (expected == null || expected.isEmpty()) {
            // Default: expect 200/201/204 success range if no assertions configured
            boolean is2xx = actualStatusCode >= 200 && actualStatusCode < 300;
            assertionsList.add(Map.of(
                    "type", "statusCode_default",
                    "expected", "2xx Success",
                    "actual", actualStatusCode,
                    "passed", is2xx,
                    "message", is2xx ? "HTTP status " + actualStatusCode + " is in success range" : "Expected 2xx status, got " + actualStatusCode
            ));
            if (!is2xx) {
                allPassed = false;
                failureMessages.add("Expected 2xx status, received " + actualStatusCode);
            }
            return new AssertionEvaluation(allPassed, assertionsList, failureMessages);
        }

        // 1. Status Code Assertion (statusCode or status)
        Object expectedStatusObj = expected.containsKey("statusCode") ? expected.get("statusCode") : expected.get("status");
        if (expectedStatusObj != null) {
            int expectedStatusCode = parseInteger(expectedStatusObj, 200);
            boolean passed = (actualStatusCode == expectedStatusCode);
            assertionsList.add(Map.of(
                    "type", "statusCode",
                    "expected", expectedStatusCode,
                    "actual", actualStatusCode,
                    "passed", passed,
                    "message", passed
                            ? "Expected status " + expectedStatusCode + ", got " + actualStatusCode
                            : "Expected status " + expectedStatusCode + ", but received " + actualStatusCode
            ));
            if (!passed) {
                allPassed = false;
                failureMessages.add("Expected status " + expectedStatusCode + ", but received " + actualStatusCode);
            }
        }

        // 2. matchFields Assertion (dot notation)
        Object matchFieldsObj = expected.get("matchFields");
        if (matchFieldsObj instanceof Map<?, ?> matchMap) {
            for (Map.Entry<?, ?> entry : matchMap.entrySet()) {
                String fieldPath = entry.getKey().toString();
                Object expectedVal = entry.getValue();
                Object actualVal = extractNestedField(parsedJson, fieldPath);

                boolean passed = valuesAreEqual(actualVal, expectedVal);
                assertionsList.add(Map.of(
                        "type", "matchField",
                        "field", fieldPath,
                        "expected", expectedVal != null ? expectedVal : "null",
                        "actual", actualVal != null ? actualVal : "null",
                        "passed", passed,
                        "message", passed
                                ? "Field '" + fieldPath + "' matched value (" + expectedVal + ")"
                                : "Field '" + fieldPath + "' expected '" + expectedVal + "', but got '" + actualVal + "'"
                ));
                if (!passed) {
                    allPassed = false;
                    failureMessages.add("Field '" + fieldPath + "' mismatch: expected '" + expectedVal + "', got '" + actualVal + "'");
                }
            }
        }

        // 3. bodyContains / textContains Assertion
        Object bodyContainsObj = expected.containsKey("bodyContains") ? expected.get("bodyContains") : expected.get("textContains");
        if (bodyContainsObj != null) {
            String expectedSubstring = bodyContainsObj.toString();
            boolean passed = responseBodyStr != null && responseBodyStr.contains(expectedSubstring);
            assertionsList.add(Map.of(
                    "type", "bodyContains",
                    "expectedSubstring", expectedSubstring,
                    "passed", passed,
                    "message", passed
                            ? "Response body contains '" + expectedSubstring + "'"
                            : "Response body does not contain expected substring '" + expectedSubstring + "'"
            ));
            if (!passed) {
                allPassed = false;
                failureMessages.add("Response body does not contain '" + expectedSubstring + "'");
            }
        }

        // 4. bodyEquals Assertion
        Object bodyEqualsObj = expected.get("bodyEquals");
        if (bodyEqualsObj != null) {
            String expectedText = bodyEqualsObj.toString().trim();
            String actualText = responseBodyStr != null ? responseBodyStr.trim() : "";
            boolean passed = actualText.equals(expectedText);
            assertionsList.add(Map.of(
                    "type", "bodyEquals",
                    "expected", expectedText,
                    "passed", passed,
                    "message", passed
                            ? "Response body matches expected content"
                            : "Response body does not match expected exact content"
            ));
            if (!passed) {
                allPassed = false;
                failureMessages.add("Response body exact match failed");
            }
        }

        return new AssertionEvaluation(allPassed, assertionsList, failureMessages);
    }

    private Object extractNestedField(Object root, String path) {
        if (root == null || path == null) return null;
        String[] parts = path.split("\\.");
        Object current = root;

        for (String part : parts) {
            if (current instanceof Map<?, ?> map) {
                current = map.get(part);
            } else if (current instanceof List<?> list) {
                try {
                    int index = Integer.parseInt(part);
                    current = (index >= 0 && index < list.size()) ? list.get(index) : null;
                } catch (NumberFormatException e) {
                    return null;
                }
            } else {
                return null;
            }
            if (current == null) break;
        }
        return current;
    }

    private boolean valuesAreEqual(Object actual, Object expected) {
        if (actual == null && expected == null) return true;
        if (actual == null || expected == null) return false;

        // Number equality (Integer vs Long vs Double)
        if (actual instanceof Number num1 && expected instanceof Number num2) {
            return Double.compare(num1.doubleValue(), num2.doubleValue()) == 0;
        }

        // Boolean equality
        if (actual instanceof Boolean b1 && expected instanceof Boolean b2) {
            return b1.equals(b2);
        }

        return actual.toString().trim().equals(expected.toString().trim());
    }

    private int parseInteger(Object obj, int defaultVal) {
        if (obj instanceof Number num) return num.intValue();
        if (obj instanceof String str) {
            try {
                return Integer.parseInt(str.trim());
            } catch (NumberFormatException ignored) {}
        }
        return defaultVal;
    }

    private void appendLog(StringBuilder builder, String tag, String message) {
        String timestamp = LocalDateTime.now().format(LOG_DATE_FORMAT);
        builder.append("[").append(timestamp).append("] [").append(tag).append("] ").append(message).append("\n");
    }

    private record AssertionEvaluation(
            boolean allPassed,
            List<Map<String, Object>> assertionsList,
            List<String> failureMessages
    ) {}
}
