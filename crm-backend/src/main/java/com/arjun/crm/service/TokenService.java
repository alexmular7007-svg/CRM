package com.arjun.crm.service;

import java.time.LocalDateTime;

/**
 * Service for generating and validating secure tokens
 */
public interface TokenService {

    /**
     * Generate a secure random invitation token
     * Format: 36 character URL-safe random string
     * @return secure token
     */
    String generateInvitationToken();

    /**
     * Check if token is still valid (not expired)
     * @param expiresAt when token expires
     * @return true if token not expired, false if expired
     */
    boolean isTokenValid(LocalDateTime expiresAt);

    /**
     * Generate expiry time for invitation token (7 days from now)
     * @return LocalDateTime 7 days in the future
     */
    LocalDateTime generateExpiryTime();

    /**
     * Generate expiry time for invitation token (custom days from now)
     * @param days number of days until expiry
     * @return LocalDateTime specified days in the future
     */
    LocalDateTime generateExpiryTime(int days);
}
