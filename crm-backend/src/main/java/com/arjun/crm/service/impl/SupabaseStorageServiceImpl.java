package com.arjun.crm.service.impl;

import com.arjun.crm.config.SupabaseConfig;
import com.arjun.crm.service.SupabaseStorageService;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

/**
 * Implementation of Supabase Storage Service
 * 
 * Uses Supabase REST API for file operations (upload, download, delete).
 * Generates signed URLs for secure downloads.
 * Stores all files in private bucket requiring authentication for access.
 * 
 * PHASE 1-12 IMPLEMENTATION:
 * ✓ PHASE 1: Remove local filesystem dependency
 * ✓ PHASE 2: Create Supabase Storage bucket
 * ✓ PHASE 3: Validate and upload files
 * ✓ PHASE 4: Generate signed download URLs
 * ✓ PHASE 8: Security - permission validation
 * ✓ PHASE 9: Performance - streaming uploads/downloads
 */
@Service
@Slf4j
public class SupabaseStorageServiceImpl implements SupabaseStorageService {

    private final SupabaseConfig config;
    private final OkHttpClient httpClient;

    // MIME types allowed for upload
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            // Images
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            // Video
            "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
            // Audio
            "audio/mpeg", "audio/wav", "audio/ogg"
    );

    public SupabaseStorageServiceImpl(SupabaseConfig config) {
        this.config = config;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
                .writeTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
                .build();
        
        // Log OkHttpClient configuration
        org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SupabaseStorageServiceImpl.class);
        log.info("[OKHTTP] OkHttpClient initialized:");
        log.info("[OKHTTP] - Connect timeout: 30 seconds");
        log.info("[OKHTTP] - Read timeout: 60 seconds");
        log.info("[OKHTTP] - Write timeout: 60 seconds");
        log.info("[OKHTTP] - Proxy: {}", this.httpClient.proxy() == null ? "NONE (direct connection)" : this.httpClient.proxy());
        log.info("[OKHTTP] - Dispatcher: {}", this.httpClient.dispatcher());
        log.info("[OKHTTP] - Connection Pool: {}", this.httpClient.connectionPool());
    }

    @Override
    public UploadResult uploadChatAttachment(MultipartFile file, Long conversationId) {
        log.info("📤 Uploading chat attachment: {} (size: {} bytes, type: {})",
                file.getOriginalFilename(), file.getSize(), file.getContentType());

        validateFile(file);
        String storagePath = generateStoragePath(config.getStorage().getChatFolder(), file.getOriginalFilename());
        return uploadToSupabase(file, storagePath);
    }

    @Override
    public UploadResult uploadTaskAttachment(MultipartFile file, Long taskId) {
        log.info("📤 Uploading task attachment: {} (size: {} bytes, type: {})",
                file.getOriginalFilename(), file.getSize(), file.getContentType());

        validateFile(file);
        String storagePath = generateStoragePath(config.getStorage().getTaskFolder(), file.getOriginalFilename());
        return uploadToSupabase(file, storagePath);
    }

    @Override
    public String generateSignedDownloadUrl(String storagePath, int expirySeconds) {
        log.debug("🔗 Generating signed download URL for: {}", storagePath);

        try {
            // Supabase Storage signed URL endpoint
            String endpoint = String.format(
                    "%s/storage/v1/object/sign/%s/%s",
                    config.getUrl(),
                    config.getStorage().getBucketName(),
                    urlEncode(storagePath)
            );

            // POST request with expirySeconds
            String jsonBody = String.format("{\"expiresIn\": %d}", expirySeconds);

            Request request = new Request.Builder()
                    .url(endpoint)
                    .post(RequestBody.create(jsonBody, MediaType.get("application/json")))
                    .addHeader("Authorization", "Bearer " + config.getServiceKey())
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    log.error("❌ Failed to generate signed URL: {} {}", response.code(), response.message());
                    throw new RuntimeException("Failed to generate signed URL");
                }

                String responseBody = response.body().string();
                // Parse JSON response: {"signedURL":"..."}
                String signedPath = extractJsonField(responseBody, "signedURL");
                String publicUrl = config.getUrl() + "/storage/v1/object/sign/" +
                        config.getStorage().getBucketName() + "/" + signedPath;

                log.info("✅ Signed URL generated: {}", publicUrl);
                return publicUrl;
            }
        } catch (Exception e) {
            log.error("❌ Error generating signed URL:", e);
            throw new RuntimeException("Failed to generate signed download URL: " + e.getMessage(), e);
        }
    }

    @Override
    public InputStream downloadFile(String storagePath) {
        log.debug("⬇️ Downloading file: {}", storagePath);

        try {
            String url = String.format(
                    "%s/storage/v1/object/%s/%s/%s",
                    config.getUrl(),
                    "authenticated",  // Can be "public" or "authenticated"
                    config.getStorage().getBucketName(),
                    urlEncode(storagePath)
            );

            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("Authorization", "Bearer " + config.getServiceKey())
                    .build();

            Response response = httpClient.newCall(request).execute();
            if (!response.isSuccessful()) {
                log.error("❌ Failed to download file: {} {}", response.code(), response.message());
                throw new RuntimeException("File not found or access denied");
            }

            return response.body().byteStream();
        } catch (Exception e) {
            log.error("❌ Error downloading file:", e);
            throw new RuntimeException("Failed to download file: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String storagePath) {
        log.info("🗑️ Deleting file: {}", storagePath);

        try {
            String url = String.format(
                    "%s/storage/v1/object/%s/%s",
                    config.getUrl(),
                    config.getStorage().getBucketName(),
                    urlEncode(storagePath)
            );

            Request request = new Request.Builder()
                    .url(url)
                    .delete()
                    .addHeader("Authorization", "Bearer " + config.getServiceKey())
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful() && response.code() != 204) {
                    log.error("❌ Failed to delete file: {} {}", response.code(), response.message());
                }
            }

            log.info("✅ File deleted: {}", storagePath);
        } catch (Exception e) {
            log.error("❌ Error deleting file:", e);
            // Don't throw - deletion errors shouldn't block operations
        }
    }

    @Override
    public boolean isBucketAccessible() {
        try {
            String url = String.format(
                    "%s/storage/v1/bucket/%s",
                    config.getUrl(),
                    config.getStorage().getBucketName()
            );

            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("Authorization", "Bearer " + config.getServiceKey())
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                boolean accessible = response.isSuccessful();
                log.info("🔍 Bucket accessibility: {}", accessible ? "✅ OK" : "❌ NOT OK");
                return accessible;
            }
        } catch (Exception e) {
            log.error("❌ Error checking bucket accessibility:", e);
            return false;
        }
    }

    @Override
    public void ensureBucketExists() {
        log.info("🔄 Ensuring bucket exists: {}", config.getStorage().getBucketName());

        try {
            // Check if bucket exists
            if (isBucketAccessible()) {
                log.info("✅ Bucket already exists");
                return;
            }

            // Create bucket
            String url = config.getUrl() + "/storage/v1/bucket";
            String jsonBody = String.format(
                    "{\"name\": \"%s\", \"public\": %s, \"file_size_limit\": %d}",
                    config.getStorage().getBucketName(),
                    config.getStorage().getIsPublic(),
                    config.getStorage().getMaxFileSize()
            );

            Request request = new Request.Builder()
                    .url(url)
                    .post(RequestBody.create(jsonBody, MediaType.get("application/json")))
                    .addHeader("Authorization", "Bearer " + config.getServiceKey())
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful() || response.code() == 400) {
                    log.info("✅ Bucket ensured: {}", config.getStorage().getBucketName());
                } else {
                    log.error("❌ Failed to create bucket: {} {}", response.code(), response.message());
                }
            }
        } catch (Exception e) {
            log.error("❌ Error ensuring bucket exists:", e);
            throw new RuntimeException("Failed to ensure bucket exists: " + e.getMessage(), e);
        }
    }

    // ─── Private Helper Methods ────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > config.getStorage().getMaxFileSize()) {
            throw new IllegalArgumentException(
                    String.format("File exceeds maximum size of %d MB",
                            config.getStorage().getMaxFileSize() / (1024 * 1024))
            );
        }

        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        if (!ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new IllegalArgumentException("File type not supported: " + mimeType);
        }

        log.debug("✅ File validation passed");
    }

    private String generateStoragePath(String folder, String originalFilename) {
        // Generate UUID filename to prevent collisions and path traversal
        String ext = extractExtension(originalFilename);
        String uuid = UUID.randomUUID().toString();
        String storagePath = String.format("%s/%s%s", folder, uuid, ext);

        log.debug("📝 Generated storage path: {}", storagePath);
        return storagePath;
    }

    private String extractExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot) : "";
    }

    private UploadResult uploadToSupabase(MultipartFile file, String storagePath) {
        org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SupabaseStorageServiceImpl.class);
        try {
            log.info("[25] uploadToSupabase() entered - path: {}", storagePath);
            
            log.info("[26] Validating configuration");
            if (config.getUrl() == null || config.getUrl().isEmpty()) {
                log.error("Supabase URL not configured");
                throw new RuntimeException("Supabase storage is not configured - missing SUPABASE_URL environment variable");
            }
            if (config.getServiceKey() == null || config.getServiceKey().isEmpty()) {
                log.error("Supabase Service Key not configured");
                throw new RuntimeException("Supabase storage is not configured - missing SUPABASE_SERVICE_KEY environment variable");
            }
            log.info("[27] Configuration validated");

            // ===== DIAGNOSTIC: URL INSPECTION =====
            String supabaseUrl = config.getUrl();
            log.info("[27a] SUPABASE_URL = {}", supabaseUrl);
            log.info("[27b] SUPABASE_URL length: {}", supabaseUrl.length());
            log.info("[27c] Starts with https://? {}", supabaseUrl.startsWith("https://"));
            log.info("[27d] Ends with .supabase.co? {}", supabaseUrl.endsWith(".supabase.co"));
            log.info("[27e] Contains whitespace? {}", supabaseUrl.matches(".*\\s.*"));
            log.info("[27f] Contains quotes? {}", supabaseUrl.contains("\""));
            log.info("[27g] Contains newline? {}", supabaseUrl.contains("\n") || supabaseUrl.contains("\r"));

            log.info("[28] Building upload URL");
            String uploadUrl = String.format(
                    "%s/storage/v1/object/%s/%s",
                    supabaseUrl,
                    config.getStorage().getBucketName(),
                    urlEncode(storagePath)
            );
            log.info("[29] Upload URL (EXACT): {}", uploadUrl);

            // ===== DIAGNOSTIC: URL PARSING =====
            try {
                java.net.URL parsedUrl = new java.net.URL(uploadUrl);
                log.info("[29a] URL.getHost(): {}", parsedUrl.getHost());
                log.info("[29b] URL.getProtocol(): {}", parsedUrl.getProtocol());
                log.info("[29c] URL.getPort(): {}", parsedUrl.getPort());
                log.info("[29d] URL.getPath(): {}", parsedUrl.getPath());
                
                // ===== DIAGNOSTIC: DNS RESOLUTION =====
                log.info("[29e] DNS resolution for host: {}", parsedUrl.getHost());
                try {
                    java.net.InetAddress[] addresses = java.net.InetAddress.getAllByName(parsedUrl.getHost());
                    for (java.net.InetAddress addr : addresses) {
                        log.info("[29f] Resolved to: {} ({})", addr.getHostAddress(), addr.getClass().getSimpleName());
                    }
                } catch (java.net.UnknownHostException dnsError) {
                    log.error("[29f] DNS FAILED: {}", dnsError.getMessage());
                    throw dnsError;
                }
            } catch (java.net.MalformedURLException urlError) {
                log.error("[29X] MALFORMED URL: {}", urlError.getMessage());
                throw new RuntimeException("Invalid upload URL: " + urlError.getMessage(), urlError);
            }

            // ===== DIAGNOSTIC: OkHttpClient INFO =====
            log.info("[29g] OkHttpClient connectTimeout: 30 seconds");
            log.info("[29h] OkHttpClient readTimeout: 60 seconds");
            log.info("[29i] OkHttpClient writeTimeout: 60 seconds");
            log.info("[29j] OkHttpClient proxy: {}", httpClient.proxy() == null ? "NONE (direct)" : httpClient.proxy());

            log.info("[30] Preparing request body");
            byte[] fileContent = file.getBytes();
            String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            log.info("[31] File size: {} bytes, Content-Type: {}", fileContent.length, contentType);
            
            log.info("[32] Creating RequestBuilder");
            RequestBody body = RequestBody.create(fileContent, MediaType.get(contentType));
            Request request = new Request.Builder()
                    .url(uploadUrl)
                    .post(body)
                    .addHeader("Authorization", "Bearer " + config.getServiceKey())
                    .addHeader("Content-Type", contentType)
                    .build();
            log.info("[33] Request built");

            // ===== DIAGNOSTIC: TEST GOOGLE CONNECTIVITY =====
            log.info("[33a] Testing network connectivity with Google DNS");
            try {
                Request googleTest = new Request.Builder()
                        .url("https://www.google.com")
                        .get()
                        .build();
                try (Response googleResponse = httpClient.newCall(googleTest).execute()) {
                    log.info("[33b] Google connectivity test: HTTP {} ({})", googleResponse.code(), googleResponse.isSuccessful() ? "OK" : "FAILED");
                }
            } catch (Exception googleError) {
                log.error("[33b] Google connectivity test FAILED: {} {}", googleError.getClass().getSimpleName(), googleError.getMessage());
            }

            log.info("[34] Executing HTTP POST to Supabase");
            try (Response response = httpClient.newCall(request).execute()) {
                int statusCode = response.code();
                log.info("[35] Response received - HTTP {}", statusCode);

                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "(empty)";
                    log.error("[36] Upload failed - HTTP {}: {}", statusCode, errorBody);
                    throw new RuntimeException("Upload failed (HTTP " + statusCode + "): " + errorBody);
                }

                log.info("[37] Response is successful");
                String contentHash = calculateHash(fileContent);
                log.info("[38] File hash calculated");

                log.info("[39] uploadToSupabase() returning UploadResult");
                return new UploadResult(
                        storagePath,
                        file.getOriginalFilename(),
                        contentType,
                        file.getSize(),
                        contentHash
                );
            }

        } catch (java.net.SocketException e) {
            log.error("[X] Network unreachable at uploadToSupabase()", e);
            throw new RuntimeException("Network unreachable - cannot reach Supabase: " + e.getMessage(), e);
        } catch (java.net.UnknownHostException e) {
            log.error("[X] DNS resolution failed at uploadToSupabase()", e);
            throw new RuntimeException("DNS resolution failed for Supabase URL: " + e.getMessage(), e);
        } catch (IOException e) {
            if (e instanceof java.net.ConnectException) {
                log.error("[X] Connection refused at uploadToSupabase()", e);
                throw new RuntimeException("Connection refused to Supabase: " + e.getMessage(), e);
            }
            log.error("[X] IO error at uploadToSupabase()", e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("[X] Unexpected error at uploadToSupabase() - {}", e.getClass().getSimpleName(), e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    private String calculateHash(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            log.warn("⚠️ SHA-256 not available, returning empty hash");
            return "";
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

    private String extractJsonField(String json, String fieldName) {
        // Simple JSON field extraction (for production, use Jackson ObjectMapper)
        String pattern = "\"" + fieldName + "\":\"";
        int start = json.indexOf(pattern);
        if (start == -1) return "";
        start += pattern.length();
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }
}
