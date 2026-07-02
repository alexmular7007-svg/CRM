package com.arjun.crm.service.impl;

import com.arjun.crm.service.TokenService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * Implementation of token service for generating secure invitation tokens
 */
@Service
@Slf4j
public class TokenServiceImpl implements TokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_LENGTH = 24; // 24 bytes = 32 base64 chars (close to 36)
    private static final int DEFAULT_EXPIRY_DAYS = 7;

    @Override
    public String generateInvitationToken() {
        byte[] randomBytes = new byte[TOKEN_LENGTH];
        SECURE_RANDOM.nextBytes(randomBytes);
        
        // Use URL-safe Base64 encoding
        String token = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
        
        log.debug("Generated new invitation token");
        return token;
    }

    @Override
    public boolean isTokenValid(LocalDateTime expiresAt) {
        boolean valid = LocalDateTime.now().isBefore(expiresAt);
        if (!valid) {
            log.debug("Token validation failed: token expired at {}", expiresAt);
        }
        return valid;
    }

    @Override
    public LocalDateTime generateExpiryTime() {
        return generateExpiryTime(DEFAULT_EXPIRY_DAYS);
    }

    @Override
    public LocalDateTime generateExpiryTime(int days) {
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(days);
        log.debug("Generated expiry time: {} ({} days from now)", expiresAt, days);
        return expiresAt;
    }
}
