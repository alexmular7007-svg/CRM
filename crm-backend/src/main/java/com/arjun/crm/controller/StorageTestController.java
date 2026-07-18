package com.arjun.crm.controller;

import com.arjun.crm.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.arjun.crm.config.SupabaseConfig;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * DIAGNOSTIC ENDPOINT: Storage Connectivity Testing
 * 
 * Tests direct Supabase Storage connectivity without chat/database dependencies.
 * Used to troubleshoot network, DNS, SSL, and authentication issues.
 * 
 * Endpoints:
 * - POST /api/test/storage/upload - Upload file directly to Supabase
 * - GET /api/test/storage/config - Show resolved configuration (no secrets)
 * - GET /api/test/storage/connectivity - Test connectivity to Supabase API
 */
@RestController
@RequestMapping("/api/test/storage")
@RequiredArgsConstructor
@Slf4j
public class StorageTestController {

    private final SupabaseConfig config;

    /**
     * Show resolved Supabase configuration (without sensitive data)
     */
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<?>> getConfig() {
        log.info("🔧 Storage Config Diagnostic");
        
        return ResponseEntity.ok(ApiResponse.success("Configuration resolved", new Object() {
            public final String url = config.getUrl();
            public final String bucketName = config.getStorage().getBucketName();
            public final String chatFolder = config.getStorage().getChatFolder();
            public final String taskFolder = config.getStorage().getTaskFolder();
            public final String serviceKeyConfigured = config.getServiceKey() != null && !config.getServiceKey().isEmpty() ? "✓ YES" : "✗ NO";
            public final String anonKeyConfigured = config.getAnonKey() != null && !config.getAnonKey().isEmpty() ? "✓ YES" : "✗ NO";
        }));
    }

    /**
     * Test DNS resolution and basic connectivity
     */
    @GetMapping("/connectivity")
    public ResponseEntity<ApiResponse<?>> testConnectivity() {
        log.info("🌐 Testing Supabase connectivity...");
        
        StringBuilder results = new StringBuilder();
        
        try {
            // Step 1: Check configuration
            results.append("1. Configuration check: ");
            if (config.getUrl() == null || config.getUrl().isEmpty()) {
                results.append("✗ URL not set\n");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Supabase URL not configured"));
            }
            if (config.getServiceKey() == null || config.getServiceKey().isEmpty()) {
                results.append("✗ Service Key not set\n");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Supabase Service Key not configured"));
            }
            results.append("✓ Configured\n");

            // Step 2: Test DNS resolution
            results.append("2. DNS resolution: ");
            try {
                java.net.InetAddress.getByName(config.getUrl().replaceAll("https://", "").replaceAll("/.*", ""));
                results.append("✓ Resolved\n");
            } catch (Exception e) {
                results.append("✗ Failed - ").append(e.getMessage()).append("\n");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(ApiResponse.error("DNS resolution failed: " + e.getMessage()));
            }

            // Step 3: Test HTTPS connection
            results.append("3. HTTPS connectivity: ");
            OkHttpClient testClient = new OkHttpClient.Builder()
                    .connectTimeout(10, TimeUnit.SECONDS)
                    .readTimeout(10, TimeUnit.SECONDS)
                    .build();

            Request healthCheck = new Request.Builder()
                    .url(config.getUrl() + "/storage/v1/bucket/" + config.getStorage().getBucketName())
                    .addHeader("Authorization", "Bearer " + config.getServiceKey())
                    .build();

            try (Response response = testClient.newCall(healthCheck).execute()) {
                results.append("✓ Connected (HTTP ").append(response.code()).append(")\n");
            } catch (Exception e) {
                results.append("✗ Failed - ").append(e.getClass().getSimpleName()).append(": ").append(e.getMessage()).append("\n");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(ApiResponse.error("HTTPS connection failed: " + e.getMessage()));
            }

            results.append("\n✅ All connectivity checks passed!");
            return ResponseEntity.ok(ApiResponse.success("Connectivity test passed", results.toString()));

        } catch (Exception e) {
            log.error("❌ Connectivity test failed:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Connectivity test failed: " + e.getMessage()));
        }
    }

    /**
     * Upload a test file directly to Supabase Storage
     * 
     * No chat, no database, no WebSocket - just pure storage upload.
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<?>> uploadTestFile(
            @RequestParam("file") MultipartFile file) {
        
        log.info("📤 Storage upload test: {} ({} bytes)", file.getOriginalFilename(), file.getSize());

        try {
            // Validation
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("File is empty"));
            }

            if (config.getUrl() == null || config.getUrl().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("SUPABASE_URL environment variable not set"));
            }

            if (config.getServiceKey() == null || config.getServiceKey().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("SUPABASE_SERVICE_KEY environment variable not set"));
            }

            // Generate unique storage path
            String filename = file.getOriginalFilename();
            String uuid = UUID.randomUUID().toString();
            String fileExtension = filename != null && filename.contains(".") 
                    ? filename.substring(filename.lastIndexOf(".")) 
                    : "";
            String storagePath = "test/" + uuid + fileExtension;

            // Build upload URL (log without auth header)
            String uploadUrl = String.format(
                    "%s/storage/v1/object/%s/%s",
                    config.getUrl(),
                    config.getStorage().getBucketName(),
                    urlEncode(storagePath)
            );
            log.info("📍 Upload URL (bucket path): {}", uploadUrl.replaceAll(config.getUrl(), "[SUPABASE_URL]"));

            // Create OkHttp client
            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(60, TimeUnit.SECONDS)
                    .writeTimeout(60, TimeUnit.SECONDS)
                    .build();

            // Prepare request
            byte[] fileContent = file.getBytes();
            okhttp3.RequestBody body = okhttp3.RequestBody.create(
                    fileContent, 
                    MediaType.get(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
            );

            Request request = new Request.Builder()
                    .url(uploadUrl)
                    .post(body)
                    .addHeader("Authorization", "Bearer " + config.getServiceKey())
                    .addHeader("Content-Type", file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .build();

            log.info("🚀 Sending upload request...");

            // Execute request
            try (Response response = client.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                
                log.info("📊 Upload response: HTTP {} - {}", response.code(), response.message());
                log.debug("Response body: {}", responseBody);

                if (!response.isSuccessful()) {
                    log.error("❌ Upload failed: {} {}", response.code(), response.message());
                    return ResponseEntity.status(response.code() < 500 ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(ApiResponse.error(String.format("Upload failed (HTTP %d): %s", response.code(), responseBody)));
                }

                // Success - generate public URL
                String publicUrl = config.getUrl() + "/storage/v1/object/public/" 
                        + config.getStorage().getBucketName() + "/" + storagePath;

                log.info("✅ Upload successful!");
                log.info("📝 Storage path: {}", storagePath);
                log.info("🌐 Public URL: {}", publicUrl);

                return ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("File uploaded successfully", new Object() {
                            public final String storagePath_ = storagePath;
                            public final String filename_ = filename;
                            public final Long fileSize = file.getSize();
                            public final String contentType = file.getContentType();
                            public final String publicUrl_ = publicUrl;
                            public final String uploadedAt = java.time.Instant.now().toString();
                        }));
            }

        } catch (java.net.SocketException e) {
            log.error("❌ Network error - Socket exception: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("Network unreachable: " + e.getMessage() + 
                            " (Check: Railway network connectivity, firewall, DNS resolution)"));
        } catch (java.net.UnknownHostException e) {
            log.error("❌ DNS resolution error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("DNS resolution failed: " + e.getMessage() + 
                            " (Check: SUPABASE_URL format and DNS configuration)"));
        } catch (IOException e) {
            // Catches all IO errors including ConnectException
            if (e instanceof java.net.ConnectException) {
                log.error("❌ Connection error: {}", e.getMessage(), e);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(ApiResponse.error("Connection refused: " + e.getMessage() + 
                                " (Check: Supabase API availability, SUPABASE_URL correctness)"));
            }
            log.error("❌ IO error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("IO error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Unexpected error:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Unexpected error: " + e.getMessage()));
        }
    }

    private String urlEncode(String value) {
        try {
            return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8.toString())
                    .replace("+", "%20");
        } catch (Exception e) {
            return value;
        }
    }
}
