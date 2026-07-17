package com.arjun.crm.controller;

import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.entity.Attachment;
import com.arjun.crm.entity.User;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * PHASE 4: Attachment Download Controller
 * 
 * Handles secure downloads of chat/task attachments from Supabase Storage.
 * Verifies user permissions before generating signed URLs or streaming downloads.
 * 
 * Endpoints:
 * - GET /api/attachments/{id}/download - Download file with permission check
 * - GET /api/attachments/{id}/url - Get signed download URL
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
     * PHASE 4 + PHASE 8: Download attachment with security validation
     * 
     * Verifies:
     * - User is authenticated
     * - User belongs to workspace
     * - User belongs to conversation
     * - Attachment exists
     * 
     * Returns file stream with correct content type and headers
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long id) {
        log.info("⬇️ Download request: attachment_id={}", id);

        try {
            User currentUser = getAuthenticatedUser();
            Attachment attachment = attachmentService.getAttachmentWithPermissionCheck(id, currentUser.getId());

            InputStream inputStream = attachmentService.downloadFileStream(id, currentUser.getId());
            Resource resource = new InputStreamResource(inputStream);

            // Set headers for download
            String filename = URLEncoder.encode(attachment.getOriginalFilename(), StandardCharsets.UTF_8);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(attachment.getMimeType()))
                    .contentLength(attachment.getFileSize())
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename*=UTF-8''" + filename)
                    .body(resource);
        } catch (Exception e) {
            log.error("❌ Download failed:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * PHASE 4 + PHASE 8: Generate signed download URL
     * 
     * Returns a temporary public URL (valid for 7 days) that can be shared
     * within the workspace. URL is signed to prevent tampering.
     */
    @GetMapping("/{id}/url")
    public ResponseEntity<ApiResponse<DownloadUrlResponse>> getDownloadUrl(
            @PathVariable Long id) {
        log.info("🔗 Signed URL request: attachment_id={}", id);

        try {
            User currentUser = getAuthenticatedUser();
            String signedUrl = attachmentService.generateDownloadUrl(id, currentUser.getId());
            
            DownloadUrlResponse response = DownloadUrlResponse.builder()
                    .downloadUrl(signedUrl)
                    .expiresIn(7 * 24 * 60 * 60)  // 7 days in seconds
                    .build();

            return ResponseEntity.ok(ApiResponse.success("Download URL generated", response));
        } catch (Exception e) {
            log.error("❌ URL generation failed:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to generate download URL"));
        }
    }

    /**
     * PHASE 5 + PHASE 8: Delete attachment
     * 
     * Only attachment owner can delete.
     * Marks as deleted soft-delete and triggers async storage cleanup.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable Long id) {
        log.info("🗑️ Delete request: attachment_id={}", id);

        try {
            User currentUser = getAuthenticatedUser();
            attachmentService.deleteAttachment(id, currentUser.getId());
            return ResponseEntity.ok(ApiResponse.success("Attachment deleted successfully", null));
        } catch (Exception e) {
            log.error("❌ Delete failed:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete attachment"));
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
     * Response DTO for signed download URL
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DownloadUrlResponse {
        private String downloadUrl;
        private Integer expiresIn;  // in seconds
    }
}
