package com.arjun.crm.controller;

import com.arjun.crm.dto.request.AvatarUploadRequest;
import com.arjun.crm.dto.request.ChangePasswordRequest;
import com.arjun.crm.dto.request.UpdateProfileRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.UserResponse;
import com.arjun.crm.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    /** GET /api/users/me */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        return ResponseEntity.ok(ApiResponse.success("User fetched", userService.getCurrentUser()));
    }

    /** GET /api/users/search?workspaceId={id} */
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> searchUsers(
            @RequestParam(required = false) Long workspaceId,
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // If workspaceId is provided, search within workspace members only
        // If workspaceId is null, search ALL registered users (for adding new members)
        if (workspaceId != null) {
            return ResponseEntity.ok(ApiResponse.success("Workspace users retrieved", 
                    userService.searchWorkspaceUsers(workspaceId, query, pageable)));
        } else {
            return ResponseEntity.ok(ApiResponse.success("All users retrieved", 
                    userService.searchUsers(query, pageable)));
        }
    }

    /** PUT /api/users/profile */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated", userService.updateProfile(request)));
    }

    /** POST /api/users/profile/avatar — saves Cloudinary URL */
    @PostMapping("/profile/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> updateAvatar(
            @Valid @RequestBody AvatarUploadRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Avatar updated", userService.updateAvatar(request)));
    }

    /** DELETE /api/users/profile/avatar */
    @DeleteMapping("/profile/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> removeAvatar() {
        return ResponseEntity.ok(ApiResponse.success("Avatar removed", userService.removeAvatar()));
    }

    /** PUT /api/users/change-password */
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password changed", null));
    }

    /** DELETE /api/users/{id} (Admin only) */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }
}
