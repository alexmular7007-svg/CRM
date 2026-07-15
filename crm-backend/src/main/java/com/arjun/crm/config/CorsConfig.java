package com.arjun.crm.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS Configuration
 * Configures Cross-Origin Resource Sharing for the application
 *
 * Uses setAllowedOriginPatterns() to support wildcard patterns (e.g. *.vercel.app)
 * while still allowing credentials. This prevents breakage on every new Vercel
 * preview deployment URL.
 */
@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001,http://localhost:5173}")
    private String allowedOriginsRaw;

    /**
     * CORS Configuration Source
     * Reads allowed origins from application config (cors.allowed-origins).
     * Supports wildcard patterns via setAllowedOriginPatterns().
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Parse comma-separated origins/patterns from config
        List<String> configOrigins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        // Add all configured origins directly (Spring handles both plain URLs and patterns)
        configuration.setAllowedOriginPatterns(configOrigins);
        
        // Add fixed localhost and vercel patterns
        java.util.List<String> patterns = new java.util.ArrayList<>(configOrigins);
        patterns.addAll(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3001",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://*.vercel.app"   // wildcard pattern for vercel
        ));

        // Set patterns using setAllowedOriginPatterns (supports both plain URLs and wildcards)
        configuration.setAllowedOriginPatterns(patterns);

        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        configuration.addAllowedHeader("*");

        configuration.setExposedHeaders(Arrays.asList(
                "Authorization", "Content-Type"
        ));

        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
