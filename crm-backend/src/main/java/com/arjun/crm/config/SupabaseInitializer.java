package com.arjun.crm.config;

import com.arjun.crm.service.SupabaseStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Application Startup Hook
 * 
 * PHASE 2: Initialize Supabase Storage on application startup
 * - Ensure bucket exists
 * - Verify connectivity
 * - Log configuration
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

        try {
            // PHASE 2: Ensure bucket exists
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
                log.error("❌ Supabase Storage is NOT accessible");
                log.error("   Please check configuration and credentials");
                throw new RuntimeException("Supabase Storage not accessible");
            }

        } catch (Exception e) {
            log.error("❌ Failed to initialize Supabase Storage: {}", e.getMessage());
            throw e;
        }

        log.info("═══════════════════════════════════════════════════════════════");
    }
}
