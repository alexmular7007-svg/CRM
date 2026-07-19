package com.arjun.crm.config;

import com.cloudinary.Cloudinary;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Cloudinary Configuration
 * 
 * Initializes Cloudinary SDK with credentials from environment variables.
 * Validates configuration on startup and fails fast if credentials are missing.
 */
@Configuration
@Slf4j
public class CloudinaryConfig {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    /**
     * Initialize Cloudinary bean
     * Fails startup if required credentials are missing
     */
    @Bean
    public Cloudinary cloudinary() {
        log.info("🔧 Initializing Cloudinary configuration");

        // Validate required credentials
        if (cloudName == null || cloudName.isEmpty()) {
            log.error("❌ CLOUDINARY_CLOUD_NAME environment variable is not set");
            throw new IllegalArgumentException(
                    "Cloudinary configuration error: CLOUDINARY_CLOUD_NAME is required. " +
                    "Please set the environment variable and restart."
            );
        }

        if (apiKey == null || apiKey.isEmpty()) {
            log.error("❌ CLOUDINARY_API_KEY environment variable is not set");
            throw new IllegalArgumentException(
                    "Cloudinary configuration error: CLOUDINARY_API_KEY is required. " +
                    "Please set the environment variable and restart."
            );
        }

        if (apiSecret == null || apiSecret.isEmpty()) {
            log.error("❌ CLOUDINARY_API_SECRET environment variable is not set");
            throw new IllegalArgumentException(
                    "Cloudinary configuration error: CLOUDINARY_API_SECRET is required. " +
                    "Please set the environment variable and restart."
            );
        }

        // Create Cloudinary configuration map
        Map<String, Object> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);

        Cloudinary cloudinary = new Cloudinary(config);

        log.info("✅ Cloudinary initialized successfully");
        log.info("   Cloud Name: {}", cloudName);
        log.info("   API Key configured: YES");
        log.info("   API Secret configured: YES");

        return cloudinary;
    }
}
