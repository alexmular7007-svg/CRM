package com.arjun.crm.util;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;

/**
 * SlugGenerator - FEATURE #2 PHASE 1B
 * 
 * Utility for generating and normalizing URL-friendly slugs
 * Used for lead magnet campaigns
 * 
 * Slug rules:
 * - lowercase
 * - alphanumeric + hyphens only
 * - spaces converted to hyphens
 * - special characters removed
 * - repeated hyphens collapsed to single hyphen
 * - leading/trailing hyphens removed
 * - max 100 characters
 * 
 * Examples:
 * "Free Website Audit" → "free-website-audit"
 * "Q4 Special Offer!!!" → "q4-special-offer"
 * "  Leading  Spaces  " → "leading-spaces"
 */
@UtilityClass
@Slf4j
public class SlugGenerator {
    
    private static final int MAX_SLUG_LENGTH = 100;
    
    /**
     * Generate a normalized slug from input text
     * 
     * @param input the input text to slugify
     * @return normalized slug, or empty string if input is null/blank
     */
    public static String generate(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "";
        }
        
        // Step 1: Convert to lowercase
        String slug = input.toLowerCase().trim();
        
        // Step 2: Replace spaces and underscores with hyphens
        slug = slug.replaceAll("[\\s_]+", "-");
        
        // Step 3: Remove all non-alphanumeric characters except hyphens
        slug = slug.replaceAll("[^a-z0-9-]", "");
        
        // Step 4: Collapse multiple consecutive hyphens into single hyphen
        slug = slug.replaceAll("-+", "-");
        
        // Step 5: Remove leading and trailing hyphens
        slug = slug.replaceAll("^-+|-+$", "");
        
        // Step 6: Truncate to max length
        if (slug.length() > MAX_SLUG_LENGTH) {
            slug = slug.substring(0, MAX_SLUG_LENGTH);
            // Remove trailing hyphen if truncation created one
            slug = slug.replaceAll("-+$", "");
        }
        
        log.debug("Generated slug: '{}' from input: '{}'", slug, input);
        return slug;
    }
    
    /**
     * Check if a slug is valid
     * 
     * @param slug the slug to validate
     * @return true if slug is valid, false otherwise
     */
    public static boolean isValid(String slug) {
        if (slug == null || slug.isEmpty()) {
            return false;
        }
        
        // Must be alphanumeric + hyphens only
        if (!slug.matches("^[a-z0-9-]+$")) {
            return false;
        }
        
        // Must not start/end with hyphen
        if (slug.startsWith("-") || slug.endsWith("-")) {
            return false;
        }
        
        // Must not exceed max length
        if (slug.length() > MAX_SLUG_LENGTH) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Generate collision-resolved slug
     * 
     * Used when generated slug conflicts with existing slug in workspace
     * Appends "-2", "-3", etc. until unique
     * 
     * Examples:
     * "free-website-audit" (exists)
     * → "free-website-audit-2" (new)
     * 
     * "free-website-audit-2" (exists)
     * → "free-website-audit-3" (new)
     * 
     * @param baseSlug the base slug
     * @param attemptNumber the attempt number (starts at 2)
     * @return collision-resolved slug
     */
    public static String withCollisionResolution(String baseSlug, int attemptNumber) {
        if (attemptNumber < 2) {
            return baseSlug;
        }
        
        String candidate = baseSlug + "-" + attemptNumber;
        
        // Ensure within max length by truncating base if needed
        int maxBaseLength = MAX_SLUG_LENGTH - (String.valueOf(attemptNumber).length() + 1);
        if (candidate.length() > MAX_SLUG_LENGTH) {
            String truncatedBase = baseSlug.substring(0, Math.min(baseSlug.length(), maxBaseLength));
            truncatedBase = truncatedBase.replaceAll("-+$", "");
            candidate = truncatedBase + "-" + attemptNumber;
        }
        
        return candidate;
    }
}
