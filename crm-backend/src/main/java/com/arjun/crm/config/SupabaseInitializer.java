package com.arjun.crm.config;

import com.arjun.crm.service.SupabaseStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

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
}
