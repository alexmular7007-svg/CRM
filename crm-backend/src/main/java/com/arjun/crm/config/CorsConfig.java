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
     * Supports regex patterns via setAllowedOriginPatterns() for wildcard patterns.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Parse comma-separated origins/patterns from config
        List<String> configOrigins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        // Separate plain URLs from wildcard patterns
        java.util.Set<String> plainUrls = new java.util.HashSet<>();
        java.util.List<String> patterns = new java.util.ArrayList<>();
        
        for (String origin : configOrigins) {
            if (origin.contains("*")) {
                // Wildcard pattern - convert to regex
                String regex = origin.replace(".", "\\.").replace("*", ".*");
                patterns.add(regex);
            } else {
                plainUrls.add(origin);
            }
        }
        
        // Add fixed localhost and vercel patterns
        plainUrls.addAll(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3001",
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));
        
        patterns.addAll(List.of(
                "https://.*\\.vercel\\.app"   // wildcard pattern for vercel
        ));

        // Set plain origins using setAllowedOrigins (no regex complications)
        if (!plainUrls.isEmpty()) {
            configuration.setAllowedOrigins(plainUrls.stream().toList());
        }
        
        // Set patterns using setAllowedOriginPatterns (for wildcard support)
        if (!patterns.isEmpty()) {
            configuration.setAllowedOriginPatterns(patterns);
        }

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
