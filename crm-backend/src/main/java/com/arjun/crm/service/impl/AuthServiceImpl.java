package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.LoginRequest;
import com.arjun.crm.dto.request.RegisterRequest;
import com.arjun.crm.dto.response.AuthResponse;
import com.arjun.crm.dto.response.UserResponse;
import com.arjun.crm.entity.User;
import com.arjun.crm.enums.UserStatus;
import com.arjun.crm.exception.DuplicateEmailException;
import com.arjun.crm.exception.InvalidCredentialsException;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.security.JwtService;
import com.arjun.crm.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail();
        String normalizedEmail = email.trim().toLowerCase();
        
        log.info("Registering new user with email: {}", email);
        log.debug("Normalized email for checking: {}", normalizedEmail);

        // Check if email already exists (case-insensitive)
        boolean exists = userRepository.existsByEmailCaseInsensitive(normalizedEmail);
        log.debug("Email exists in database: {}", exists);
        
        if (exists) {
            log.warn("Duplicate email registration attempt: {}", email);
            throw new DuplicateEmailException("Email already registered: " + email);
        }
        
        log.debug("Email check passed, proceeding with user creation");

        // Create new user with default USER role
        // Workspace roles are assigned separately when users join/create workspaces
        User user = User.builder()
                .fullName(request.getFullName())
                .email(normalizedEmail)  // Store normalized email
                .password(passwordEncoder.encode(request.getPassword()))
                .role(com.arjun.crm.enums.Role.USER)  // Always default to USER for new registrations
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        // Generate JWT token
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String token = jwtService.generateToken(Map.of("userId", savedUser.getId()), userDetails);

        return AuthResponse.of(token, UserResponse.fromEntity(savedUser));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        log.info("User login attempt: {}", email);

        try {
            // Authenticate user (Spring Security handles case-sensitivity)
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            request.getPassword()
                    )
            );

            // Get user details
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

            // Check if user is active
            if (user.getStatus() == UserStatus.INACTIVE) {
                throw new InvalidCredentialsException("User account is inactive");
            }

            // Generate JWT token
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtService.generateToken(Map.of("userId", user.getId()), userDetails);

            log.info("User logged in successfully: {}", email);
            return AuthResponse.of(token, UserResponse.fromEntity(user));

        } catch (AuthenticationException e) {
            log.error("Authentication failed for user: {}", email);
            throw new InvalidCredentialsException("Invalid email or password");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        log.info("Refresh token request received");
        
        try {
            // Extract user ID from token
            Long userId = jwtService.extractUserId(refreshToken);
            
            // Get user from database
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new InvalidCredentialsException("User not found"));
            
            // Check if user is active
            if (user.getStatus() == UserStatus.INACTIVE) {
                throw new InvalidCredentialsException("User account is inactive");
            }
            
            // Validate token with user details
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            if (!jwtService.isTokenValid(refreshToken, userDetails)) {
                log.warn("Refresh token validation failed");
                throw new InvalidCredentialsException("Refresh token is invalid or expired");
            }
            
            // Generate new JWT token
            String newToken = jwtService.generateToken(Map.of("userId", user.getId()), userDetails);
            
            log.info("Token refreshed successfully for user: {}", user.getEmail());
            return AuthResponse.of(newToken, UserResponse.fromEntity(user));
            
        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            throw new InvalidCredentialsException("Failed to refresh token: " + e.getMessage());
        }
    }
}
