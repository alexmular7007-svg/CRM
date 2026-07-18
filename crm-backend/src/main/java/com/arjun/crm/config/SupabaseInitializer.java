package com.arjun.crm.config;

import com.arjun.crm.service.SupabaseStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import java.util.concurrent.TimeUnit;

/**
 * Application Startup Hook
 * 
 * Phase 1: Verify Supabase configuration is loaded
 * Phase 2: Initialize Supabase Storage
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SupabaseInitializer implements CommandLineRunner {

    private final SupabaseStorageService storageService;
    private final SupabaseConfig config;

    @Override
    public void run(String... args) throws Exception {
        log.info("═══════════════════════════════════════════════════════════════");
        log.info("🚀 Supabase Storage Initialization");
        log.info("═══════════════════════════════════════════════════════════════");

        // PHASE 1: Verify configuration
        config.logConfiguration();
        
        // Check for placeholder/corrupted service key
        if (config.getServiceKey() != null && 
            (config.getServiceKey().contains("XXXXXX") || 
             config.getServiceKey().endsWith("X") ||
             config.getServiceKey().contains("PkRzZCT1BhNnvDlW7QXnvvXX"))) {
            log.error("═══════════════════════════════════════════════════════════════");
            log.error("❌ CRITICAL: SUPABASE_SERVICE_KEY is a placeholder/corrupted!");
            log.error("═══════════════════════════════════════════════════════════════");
            log.error("File uploads will FAIL until you set a valid service key");
            log.error("Steps:");
            log.error("1. Go to Supabase Dashboard → Settings → API");
            log.error("2. Copy the 'Service Role' key");
            log.error("3. Set SUPABASE_SERVICE_KEY=<the-key> in .env or Railway");
            log.error("═══════════════════════════════════════════════════════════════");
            log.warn("⚠️ TEXT MESSAGES WILL WORK - Only FILE UPLOADS will fail");
            return;  // Skip the rest of initialization, text messages should still work
        }

        // DIAGNOSTIC: Test basic network connectivity
        log.info("═══════════════════════════════════════════════════════════════");
        log.info("🌐 NETWORK CONNECTIVITY TEST");
        log.info("═══════════════════════════════════════════════════════════════");
        testGoogleConnectivity();

        try {
            // PHASE 2: Try to initialize storage
            log.info("📦 Ensuring Supabase bucket: {}", config.getStorage().getBucketName());
            storageService.ensureBucketExists();

            // Verify connectivity
            log.info("🔍 Verifying bucket accessibility...");
            if (storageService.isBucketAccessible()) {
                log.info("✅ Supabase Storage is accessible and ready");
                log.info("   Bucket: {}", config.getStorage().getBucketName());
                log.info("   Chat folder: {}", config.getStorage().getChatFolder());
                log.info("   Task folder: {}", config.getStorage().getTaskFolder());
                log.info("   Max file size: {} MB", config.getStorage().getMaxFileSize() / (1024 * 1024));
                log.info("   Signed URL expiry: {} days", config.getStorage().getSignedUrlExpiry() / 86400);
            } else {
                log.warn("⚠️ Supabase Storage not accessible on startup");
                log.warn("   Storage will be available when needed (file uploads)");
                log.warn("   Check your Supabase configuration if uploads fail");
            }

        } catch (Exception e) {
            // Graceful failure - don't crash the application
            log.warn("⚠️ Supabase Storage initialization failed on startup: {}", e.getMessage());
            log.warn("   Application will continue - Storage will be initialized on first upload");
            log.warn("   Common causes: Network unavailable, Supabase credentials not set");
        }

        log.info("═══════════════════════════════════════════════════════════════");
    }

    private void testGoogleConnectivity() {
        try {
            okhttp3.OkHttpClient client = new okhttp3.OkHttpClient.Builder()
                    .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                    .readTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                    .build();

            log.info("[NETWORK] OkHttpClient created");
            log.info("[NETWORK] Proxy: {}", client.proxy() == null ? "NONE (direct)" : client.proxy());

            okhttp3.Request request = new okhttp3.Request.Builder()
                    .url("https://www.google.com")
                    .get()
                    .build();

            log.info("[NETWORK] Sending GET https://www.google.com");
            try (okhttp3.Response response = client.newCall(request).execute()) {
                log.info("[NETWORK] ✅ Google Status = {}", response.code());
                if (response.code() == 200) {
                    log.info("[NETWORK] ✅ Railway networking is WORKING");
                    log.info("[NETWORK] ✅ Outbound HTTPS connections are allowed");
                } else {
                    log.warn("[NETWORK] Google returned HTTP {}", response.code());
                }
            }
        } catch (java.net.SocketException e) {
            log.error("[NETWORK] ❌ SocketException: Network unreachable");
            log.error("[NETWORK] ❌ Railway has NO outbound network access");
            log.error("[NETWORK] Exception: {}", e.getMessage());
        } catch (java.net.UnknownHostException e) {
            log.error("[NETWORK] ❌ DNS resolution failed for www.google.com");
            log.error("[NETWORK] Exception: {}", e.getMessage());
        } catch (Exception e) {
            log.error("[NETWORK] ❌ Google connectivity test failed: {} - {}", e.getClass().getSimpleName(), e.getMessage());
        }
    }
}
