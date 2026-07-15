package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.LoginRequest;
import com.arjun.crm.dto.request.RegisterRequest;
import com.arjun.crm.dto.response.AuthResponse;
import com.arjun.crm.dto.response.UserResponse;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.WorkspaceInvitation;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.InvitationStatus;
import com.arjun.crm.enums.UserStatus;
import com.arjun.crm.exception.DuplicateEmailException;
import com.arjun.crm.exception.InvalidCredentialsException;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.repository.WorkspaceInvitationRepository;
import com.arjun.crm.repository.WorkspaceMemberRepository;
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

import java.time.LocalDateTime;
import java.util.List;
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
    private final WorkspaceInvitationRepository workspaceInvitationRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

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
        User user = User.builder()
                .fullName(request.getFullName())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(com.arjun.crm.enums.Role.USER)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        // Auto-accept pending invitations for this email
        autoAcceptPendingInvitations(savedUser, normalizedEmail);

        // Generate JWT token
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String token = jwtService.generateToken(Map.of("userId", savedUser.getId()), userDetails);

        return AuthResponse.of(token, UserResponse.fromEntity(savedUser));
    }

    /**
     * Auto-accept all pending invitations for the newly registered user's email
     * and add them to the corresponding workspaces
     */
    private void autoAcceptPendingInvitations(User user, String email) {
        log.info("Checking for pending invitations for email: {}", email);

        // Find all pending invitations for this email
        List<WorkspaceInvitation> pendingInvitations = workspaceInvitationRepository
                .findByEmailAndStatus(email, InvitationStatus.PENDING);

        if (pendingInvitations.isEmpty()) {
            log.info("No pending invitations found for email: {}", email);
            return;
        }

        log.info("Found {} pending invitations for email: {}", pendingInvitations.size(), email);

        for (WorkspaceInvitation invitation : pendingInvitations) {
            try {
                // Check if not already a member
                if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(invitation.getWorkspace().getId(), user.getId())) {
                    log.warn("User {} already a member of workspace {}, skipping", user.getId(), invitation.getWorkspace().getId());
                    continue;
                }

                // Create workspace member with invitation role
                WorkspaceMember member = WorkspaceMember.builder()
                        .workspace(invitation.getWorkspace())
                        .user(user)
                        .role(invitation.getRole())
                        .status("ACTIVE")
                        .invitedAt(invitation.getInvitedAt())
                        .invitedBy(invitation.getInvitedBy())
                        .build();

                workspaceMemberRepository.save(member);

                // Mark invitation as accepted
                invitation.setStatus(InvitationStatus.ACCEPTED);
                invitation.setAcceptedAt(LocalDateTime.now());
                invitation.setAcceptedBy(user);
                workspaceInvitationRepository.save(invitation);

                log.info("Auto-accepted invitation for workspace {} during registration of user {}", 
                        invitation.getWorkspace().getId(), user.getId());

            } catch (Exception e) {
                log.error("Error auto-accepting invitation for workspace {} during registration: {}", 
                        invitation.getWorkspace().getId(), e.getMessage(), e);
                // Continue with next invitation even if one fails
            }
        }

        log.info("Auto-invitation process completed for user: {}", email);
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
