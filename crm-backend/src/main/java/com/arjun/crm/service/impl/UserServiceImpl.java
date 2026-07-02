package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.AvatarUploadRequest;
import com.arjun.crm.dto.request.ChangePasswordRequest;
import com.arjun.crm.dto.request.UpdateProfileRequest;
import com.arjun.crm.dto.response.UserResponse;
import com.arjun.crm.entity.User;
import com.arjun.crm.enums.UserStatus;
import com.arjun.crm.exception.InvalidCredentialsException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.exception.UnauthorizedException;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        User user = getAuthenticatedUser();
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(String query, Pageable pageable) {
        User currentUser = getAuthenticatedUser();
        String safeQuery = query == null ? "" : query.trim();
        return userRepository
                .searchActiveUsers(safeQuery, UserStatus.ACTIVE, currentUser.getId(), pageable)
                .map(UserResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> searchWorkspaceUsers(Long workspaceId, String query, Pageable pageable) {
        User currentUser = getAuthenticatedUser();
        String safeQuery = query == null ? "" : query.trim();
        
        log.info("Searching workspace {} users for: '{}'", workspaceId, safeQuery);
        
        // Multi-tenant isolation: Only return workspace members
        // Never return all application users
        return userRepository
                .searchWorkspaceActiveUsers(workspaceId, safeQuery, UserStatus.ACTIVE, currentUser.getId(), pageable)
                .map(UserResponse::fromEntity);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = getAuthenticatedUser();
        log.info("Updating profile for user: {}", user.getEmail());

        // Core field (always required)
        user.setFullName(request.getFullName());

        // Extended fields — only overwrite if provided
        if (request.getFirstName()         != null) user.setFirstName(request.getFirstName());
        if (request.getLastName()          != null) user.setLastName(request.getLastName());
        if (request.getDisplayName()       != null) user.setDisplayName(request.getDisplayName());
        if (request.getBio()               != null) user.setBio(request.getBio());
        if (request.getDesignation()       != null) user.setDesignation(request.getDesignation());
        if (request.getDepartment()        != null) user.setDepartment(request.getDepartment());
        if (request.getPhoneNumber()       != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getLocation()          != null) user.setLocation(request.getLocation());
        if (request.getWebsite()           != null) user.setWebsite(request.getWebsite());
        if (request.getLinkedinUrl()       != null) user.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getGithubUrl()         != null) user.setGithubUrl(request.getGithubUrl());
        if (request.getTimezone()          != null) user.setTimezone(request.getTimezone());
        if (request.getPreferredLanguage() != null) user.setPreferredLanguage(request.getPreferredLanguage());

        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateAvatar(AvatarUploadRequest request) {
        User user = getAuthenticatedUser();
        log.info("Updating avatar for user: {}", user.getEmail());
        user.setProfileImageUrl(request.getAvatarUrl());
        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse removeAvatar() {
        User user = getAuthenticatedUser();
        log.info("Removing avatar for user: {}", user.getEmail());
        user.setProfileImageUrl(null);
        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getAuthenticatedUser();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        User currentUser = getAuthenticatedUser();
        if (currentUser.getId().equals(userId)) {
            throw new UnauthorizedException("You cannot delete your own account");
        }
        User userToDelete = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        userToDelete.setStatus(UserStatus.INACTIVE);
        userRepository.save(userToDelete);
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("User is not authenticated");
        }
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetails)) {
            throw new UnauthorizedException("Invalid authentication principal");
        }
        String email = ((UserDetails) principal).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
