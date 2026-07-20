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

/**
 * Attachment Download Controller - Production Simple Edition
 * 
 * Strategy:
 * - Backend returns secure_url from Cloudinary (stored in database)
 * - Frontend handles download via Blob API
 * - No complex URL transformations needed
 * - Works for all file types: PDF, DOCX, images, videos, ZIP, etc.
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
     * Returns:
     * - secure_url: Cloudinary HTTPS URL (stored in database at upload time)
     * - filename: Original filename for download dialog
     * - mimeType: Content type
     * - fileSize: File size in bytes
     * - resourceType: image, video, or raw
     * 
     * Frontend then:
     * 1. Fetches the URL
     * 2. Uses Blob API to download with original filename
     */
    @GetMapping("/{id}/url")
    public ResponseEntity<ApiResponse<DownloadUrlResponse>> getDownloadUrl(
            @PathVariable Long id) {
        
        log.info("🔗 Download URL request: attachment_id={}", id);

        try {
            User currentUser = getAuthenticatedUser();
            
            // Get attachment with permission check
            Attachment attachment = attachmentService.getAttachmentWithPermissionCheck(id, currentUser.getId());
            
            log.info("✅ Attachment retrieved:");
            log.info("     ID: {}", attachment.getId());
            log.info("     Filename: {}", attachment.getOriginalFilename());
            log.info("     Size: {} bytes", attachment.getFileSize());
            log.info("     Type: {}", attachment.getResourceType());
            log.info("     Secure URL: {}", attachment.getSecureUrl());
            
            // Return secure URL directly from Cloudinary
            // No transformations, no SDK URL building, just the stored URL
            DownloadUrlResponse response = DownloadUrlResponse.builder()
                    .downloadUrl(attachment.getSecureUrl())
                    .filename(attachment.getOriginalFilename())
                    .mimeType(attachment.getMimeType())
                    .fileSize(attachment.getFileSize())
                    .resourceType(attachment.getResourceType())
                    .build();

            return ResponseEntity.ok(ApiResponse.success("Download URL retrieved", response));
            
        } catch (Exception e) {
            log.error("❌ URL retrieval failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve download URL: " + e.getMessage()));
        }
    }

    /**
     * Delete attachment
     * 
     * Only attachment owner can delete.
     * Deletes from both Cloudinary and database.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(@PathVariable Long id) {
        log.info("🗑️ Delete attachment request: id={}", id);

        try {
            User currentUser = getAuthenticatedUser();
            attachmentService.deleteAttachment(id, currentUser.getId());
            return ResponseEntity.ok(ApiResponse.success("Attachment deleted successfully", null));
        } catch (Exception e) {
            log.error("❌ Delete failed: {}", e.getMessage(), e);
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
        private String downloadUrl;      // Secure URL from Cloudinary
        private String filename;         // Original filename
        private String mimeType;         // Content type
        private Long fileSize;           // File size in bytes
        private String resourceType;     // image, video, raw
    }
}
