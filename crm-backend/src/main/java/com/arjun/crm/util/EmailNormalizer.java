package com.arjun.crm.util;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;

/**
 * EmailNormalizer - Utility for consistent email normalization
 * 
 * PHASE #2 FEATURE: All emails stored in database are normalized
 * Normalization rules: trim + lowercase
 * 
 * This ensures:
 * - Case-insensitive duplicate detection across workspaces
 * - Consistent email lookup behavior
 * - Canonical storage format (one canonical representation per email)
 * 
 * Applied to:
 * - Lead creation (Feature #1)
 * - Lead update (Feature #1)
 * - LeadMagnet submission (Feature #2)
 * - All email duplicate checks
 */
@UtilityClass
@Slf4j
public class EmailNormalizer {
    
    /**
     * Normalize an email address to canonical form
     * 
     * Rules applied:
     * 1. Trim whitespace (leading/trailing)
     * 2. Convert to lowercase
     * 
     * Example transformations:
     * "  John@Example.COM  " → "john@example.com"
     * "john@example.com" → "john@example.com"
     * 
     * @param email the email to normalize
     * @return the normalized email in lowercase, or null if input is null
     * @throws IllegalArgumentException if email is empty after trimming
     */
    public static String normalize(String email) {
        if (email == null) {
            return null;
        }
        
        String normalized = email.trim().toLowerCase();
        
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty after trimming");
        }
        
        return normalized;
    }
    
    /**
     * Check if an email is already normalized
     * 
     * @param email the email to check
     * @return true if email is already normalized, false otherwise
     */
    public static boolean isNormalized(String email) {
        if (email == null) {
            return false;
        }
        return email.equals(normalize(email));
    }
}
