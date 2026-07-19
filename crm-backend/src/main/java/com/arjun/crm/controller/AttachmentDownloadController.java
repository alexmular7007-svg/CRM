package com.arjun.crm.controller;

import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.entity.Attachment;
import com.arjun.crm.entity.User;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Attachment Download Controller - Cloudinary Edition
 * 
 * Handles secure downloads of chat/task attachments.
 * Verifies user permissions before returning download URLs.
 * 
 * Cloudinary serves files directly via secure URLs, so we just verify
 * permissions and return the secure URL for the frontend to handle.
 * 
 * Endpoints:
 * - GET /api/attachments/{id}/url - Get download URL
 * - DELETE /api/attachments/{id} - Delete attachment
 */
@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
@Slf4j
public class AttachmentDownloadController {

    private final AttachmentService attachmentService;
    private final UserRepository userRepository;

    /**
     * Get download URL for attachment
     * 
     * Verifies:
     * - User is authenticated
     * - User has permission to access attachment
     * - Attachment exists in Cloudinary
     * 
     * Returns the secure Cloudinary URL for download
     */
    @GetMapping("/{id}/url")
    public ResponseEntity<ApiResponse<DownloadUrlResponse>> getDownloadUrl(
            @PathVariable Long id) {
        log.info("🔗 Download URL request: attachment_id={}", id);

        try {
            User currentUser = getAuthenticatedUser();
            String downloadUrl = attachmentService.getDownloadUrl(id, currentUser.getId());
            Attachment attachment = attachmentService.getAttachmentWithPermissionCheck(id, currentUser.getId());
            
            DownloadUrlResponse response = DownloadUrlResponse.builder()
                    .downloadUrl(downloadUrl)
                    .filename(attachment.getOriginalFilename())
                    .mimeType(attachment.getMimeType())
                    .fileSize(attachment.getFileSize())
                    .resourceType(attachment.getResourceType())
                    .build();

            return ResponseEntity.ok(ApiResponse.success("Download URL retrieved", response));
        } catch (Exception e) {
            log.error("❌ URL retrieval failed:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve download URL: " + e.getMessage()));
        }
    }

    /**
     * Delete attachment
     * 
     * Only attachment owner can delete.
     * Deletes from both Cloudinary and database immediately.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable Long id) {
        log.info("🗑️ Delete attachment request: id={}", id);

        try {
            User currentUser = getAuthenticatedUser();
            attachmentService.deleteAttachment(id, currentUser.getId());
            return ResponseEntity.ok(ApiResponse.success("Attachment deleted successfully", null));
        } catch (Exception e) {
            log.error("❌ Delete failed:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete attachment: " + e.getMessage()));
        }
    }

    /**
     * Get authenticated user from security context
     */
    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResourceNotFoundException("User not authenticated");
        }
        String email = ((UserDetails) auth.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    /**
     * Response DTO for download URL
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DownloadUrlResponse {
        private String downloadUrl;           // Cloudinary secure URL
        private String filename;              // Original filename
        private String mimeType;              // Content type
        private Long fileSize;                // File size in bytes
        private String resourceType;          // image, video, raw
    }
}
