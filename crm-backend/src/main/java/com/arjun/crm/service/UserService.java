package com.arjun.crm.service;

import com.arjun.crm.dto.request.AvatarUploadRequest;
import com.arjun.crm.dto.request.ChangePasswordRequest;
import com.arjun.crm.dto.request.UpdateProfileRequest;
import com.arjun.crm.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserResponse getCurrentUser();

    Page<UserResponse> searchUsers(String query, Pageable pageable);

    /**
     * Search users in a specific workspace (multi-tenant isolation).
     * Only returns members of the given workspace.
     */
    Page<UserResponse> searchWorkspaceUsers(Long workspaceId, String query, Pageable pageable);

    UserResponse updateProfile(UpdateProfileRequest request);

    void changePassword(ChangePasswordRequest request);

    void deleteUser(Long userId);

    /** Save Cloudinary URL as profile image */
    UserResponse updateAvatar(AvatarUploadRequest request);

    /** Remove profile image (set to null) */
    UserResponse removeAvatar();
}
