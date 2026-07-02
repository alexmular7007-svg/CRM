package com.arjun.crm.service;

import com.arjun.crm.dto.request.LoginRequest;
import com.arjun.crm.dto.request.RegisterRequest;
import com.arjun.crm.dto.response.AuthResponse;

public interface AuthService {
    
    /**
     * Register a new user
     * @param request registration details
     * @return authentication response with JWT token
     */
    AuthResponse register(RegisterRequest request);
    
    /**
     * Authenticate user and generate JWT token
     * @param request login credentials
     * @return authentication response with JWT token
     */
    AuthResponse login(LoginRequest request);
    
    /**
     * Refresh JWT token using refresh token
     * @param refreshToken the refresh token
     * @return authentication response with new JWT token
     */
    AuthResponse refreshToken(String refreshToken);
}
