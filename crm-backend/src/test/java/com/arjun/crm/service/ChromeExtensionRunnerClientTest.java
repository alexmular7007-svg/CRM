package com.arjun.crm.service;

import com.arjun.crm.dto.request.BrowserTestCaseDto;
import com.arjun.crm.dto.request.BrowserTestRunRequest;
import com.arjun.crm.dto.response.BrowserTestRunResponse;
import com.arjun.crm.service.impl.ChromeExtensionRunnerClientImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ChromeExtensionRunnerClientTest {

    private static HttpServer mockServer;
    private static int serverPort;
    private static ChromeExtensionRunnerClientImpl runnerClient;
    private static ObjectMapper objectMapper = new ObjectMapper();

    @BeforeAll
    static void startMockServer() throws Exception {
        mockServer = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        serverPort = mockServer.getAddress().getPort();

        // 1. Health handler
        mockServer.createContext("/health", exchange -> {
            String response = "{\"status\":\"UP\",\"version\":\"1.0.0\",\"runner\":\"Playwright Chrome Extension Runner\"}";
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.getBytes().length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
        });

        // 2. Start test run handler
        mockServer.createContext("/api/test-runs", exchange -> {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String response = "{\"runId\":1001,\"status\":\"QUEUED\",\"message\":\"Browser test run accepted\"}";
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(202, response.getBytes().length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        });

        // 3. Status handler
        mockServer.createContext("/api/test-runs/1001", exchange -> {
            String response = "{\"runId\":1001,\"status\":\"PASSED\",\"totalTests\":1,\"passedTests\":1,\"failedTests\":0,\"errorTests\":0,\"durationMs\":350}";
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.getBytes().length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
        });

        // 4. Cancel handler
        mockServer.createContext("/api/test-runs/1001/cancel", exchange -> {
            String response = "{\"runId\":1001,\"status\":\"CANCELLED\",\"message\":\"Job cancelled successfully\"}";
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.getBytes().length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
        });

        // 5. Artifact handler
        mockServer.createContext("/api/artifacts/1001/shot.png", exchange -> {
            byte[] response = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
            exchange.getResponseHeaders().set("Content-Type", "image/png");
            exchange.sendResponseHeaders(200, response.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response);
            }
        });

        mockServer.start();

        runnerClient = new ChromeExtensionRunnerClientImpl("http://127.0.0.1:" + serverPort, "", objectMapper);
    }

    @AfterAll
    static void stopMockServer() {
        if (mockServer != null) {
            mockServer.stop(0);
        }
    }

    @Test
    @DisplayName("Should check runner health successfully")
    void testCheckHealth() {
        Map<String, Object> health = runnerClient.checkHealth();
        assertNotNull(health);
        assertEquals("UP", health.get("status"));
        assertEquals("1.0.0", health.get("version"));
    }

    @Test
    @DisplayName("Should start browser test run on runner")
    void testStartBrowserRun() {
        BrowserTestRunRequest request = BrowserTestRunRequest.builder()
                .runId(1001L)
                .testCases(List.of(
                        BrowserTestCaseDto.builder().type("POPUP_SMOKE").name("Popup Test").build()
                ))
                .build();

        BrowserTestRunResponse response = runnerClient.startBrowserRun(1001L, request);
        assertNotNull(response);
        assertEquals(1001L, response.getRunId());
        assertEquals("QUEUED", response.getStatus());
    }

    @Test
    @DisplayName("Should query browser test run status from runner")
    void testGetBrowserRunStatus() {
        BrowserTestRunResponse response = runnerClient.getBrowserRunStatus(1001L);
        assertNotNull(response);
        assertEquals(1001L, response.getRunId());
        assertEquals("PASSED", response.getStatus());
        assertEquals(1, response.getTotalTests());
        assertEquals(1, response.getPassedTests());
    }

    @Test
    @DisplayName("Should cancel browser test run on runner")
    void testCancelBrowserRun() {
        BrowserTestRunResponse response = runnerClient.cancelBrowserRun(1001L);
        assertNotNull(response);
        assertEquals(1001L, response.getRunId());
        assertEquals("CANCELLED", response.getStatus());
    }

    @Test
    @DisplayName("Should retrieve artifact bytes from runner")
    void testGetArtifact() {
        byte[] bytes = runnerClient.getArtifact(1001L, "shot.png");
        assertNotNull(bytes);
        assertEquals(4, bytes.length);
        assertEquals((byte) 0x89, bytes[0]);
    }

    @Test
    @DisplayName("Should handle unreachable runner gracefully without throwing fatal exceptions")
    void testUnreachableRunner() {
        ChromeExtensionRunnerClientImpl unreachableClient =
                new ChromeExtensionRunnerClientImpl("http://127.0.0.1:59999", "", objectMapper);

        Map<String, Object> health = unreachableClient.checkHealth();
        assertEquals("DOWN", health.get("status"));

        BrowserTestRunResponse response = unreachableClient.startBrowserRun(9999L, new BrowserTestRunRequest());
        assertEquals("ERROR", response.getStatus());
        assertTrue(response.getMessage().contains("Extension Runner unavailable"));
    }
}
