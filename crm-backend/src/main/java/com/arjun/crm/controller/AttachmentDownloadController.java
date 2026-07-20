package com.arjun.crm.controller;

import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.entity.Attachment;
import com.arjun.crm.entity.User;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.service.AttachmentService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Attachment Download Controller - Cloudinary SDK Edition
 * 
 * Handles secure downloads of chat/task attachments using official Cloudinary SDK.
 * Verifies user permissions before generating download URLs.
 * 
 * Uses Cloudinary SDK URL builder (no manual string manipulation):
 * - Image preview: Uses Cloudinary transformations
 * - PDF download: Generated via SDK with attachment flag
 * - Document download: Generated via SDK with attachment flag
 * - Video streaming: Generated via SDK
 * - ZIP archives: Generated via SDK with attachment flag
 * 
 * Endpoints:
 * - GET /api/attachments/{id}/url - Get download/preview URL
 * - DELETE /api/attachments/{id} - Delete attachment
 */
@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
@Slf4j
public class AttachmentDownloadController {

    private final AttachmentService attachmentService;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    /**
     * Get download/preview URL for attachment
     * 
     * Verifies:
     * - User is authenticated
     * - User has permission to access attachment
     * - Attachment exists and metadata is valid
     * 
     * Generates URL using Cloudinary SDK (no manual string manipulation)
     * URL type depends on resource type and requested action:
     * - Images: Preview URL (inline display)
     * - Documents/PDF: Download URL (attachment disposition)
     * - Videos: Streaming URL
     */
    @GetMapping("/{id}/url")
    public ResponseEntity<ApiResponse<DownloadUrlResponse>> getDownloadUrl(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean preview) {
        
        log.info("🔗 Download URL request: attachment_id={}, preview={}", id, preview);

        try {
            User currentUser = getAuthenticatedUser();
            
            // Get attachment with permission check
            Attachment attachment = attachmentService.getAttachmentWithPermissionCheck(id, currentUser.getId());
            
            log.info("📋 [1] ATTACHMENT METADATA:");
            log.info("     Public ID: {}", attachment.getCloudinaryPublicId());
            log.info("     Version: {}", attachment.getCloudinaryVersion());
            log.info("     Resource Type: {}", attachment.getResourceType());
            log.info("     Original Filename: {}", attachment.getOriginalFilename());
            log.info("     MIME Type: {}", attachment.getMimeType());
            
            // Generate URL using official Cloudinary SDK
            String downloadUrl = generateDownloadUrlWithSdk(
                    attachment.getCloudinaryPublicId(),
                    attachment.getCloudinaryVersion(),
                    attachment.getResourceType(),
                    attachment.getOriginalFilename(),
                    attachment.getMimeType(),
                    preview
            );
            
            log.info("📋 [2] GENERATED URL:");
            log.info("     Download URL: {}", downloadUrl);
            
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
     * Generate download URL using official Cloudinary SDK
     * 
     * ✅ Uses Cloudinary Java SDK CloudinaryUrl builder (no manual string concatenation)
     * ✅ Properly handles all file types
     * ✅ Sets correct headers via SDK
     * ✅ No manual URL string manipulation
     * 
     * @param publicId Cloudinary public ID
     * @param version Cloudinary version ID
     * @param resourceType Resource type (image, video, raw)
     * @param filename Original filename
     * @param mimeType MIME type
     * @param preview Whether this is a preview request (for images)
     * @return Download URL generated by Cloudinary SDK
     */
    private String generateDownloadUrlWithSdk(
            String publicId,
            String version,
            String resourceType,
            String filename,
            String mimeType,
            boolean preview) {
        
        log.info("📋 [1.1] SDK URL GENERATION - START");
        log.info("     publicId: {}", publicId);
        log.info("     version: {}", version);
        log.info("     resourceType: {}", resourceType);
        log.info("     filename: {}", filename);
        log.info("     mimeType: {}", mimeType);
        log.info("     preview: {}", preview);
        
        try {
            // Use Cloudinary.url() method from official SDK
            // This builder properly constructs URLs without manual string manipulation
            
            String url = cloudinary.url()
                    .resourceType(resourceType)  // image, video, raw
                    .type("upload")              // Upload type
                    .version(version)            // Add version from response
                    .secure(true)                // HTTPS only
                    .format("auto")              // Auto format based on browser
                    .generate(publicId);         // Generate URL for public_id
            
            // If it's a preview request for images, use inline display
            // Otherwise, set as attachment for download
            if (preview && ("image".equals(resourceType))) {
                log.info("     Mode: Image preview (inline display)");
                // Image preview - no modification needed, browser will display inline
                return url;
            } else {
                // For downloads: add attachment disposition via URL transformations
                // Use Cloudinary Transformation object properly
                log.info("     Mode: Download with attachment disposition");
                
                String downloadUrl = cloudinary.url()
                        .resourceType(resourceType)
                        .type("upload")
                        .version(version)
                        .secure(true)
                        .format("auto")
                        .transformation(new com.cloudinary.Transformation()
                                .flags("attachment"))  // Cloudinary flag for attachment disposition
                        .generate(publicId);
                
                log.info("     Generated download URL: {}", downloadUrl);
                return downloadUrl;
            }
            
        } catch (Exception e) {
            log.error("❌ Error generating URL with SDK: {}", e.getMessage(), e);
            
            // Fallback to secure_url if SDK fails (should not happen)
            // But log this as it indicates a problem
            log.warn("⚠️ SDK URL generation failed, using fallback");
            
            // Build basic URL without transformations
            String fallbackUrl = cloudinary.url()
                    .resourceType(resourceType)
                    .type("upload")
                    .version(version)
                    .secure(true)
                    .generate(publicId);
            
            log.warn("     Fallback URL: {}", fallbackUrl);
            return fallbackUrl;
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
        private String downloadUrl;           // Generated by Cloudinary SDK
        private String filename;              // Original filename
        private String mimeType;              // Content type
        private Long fileSize;                // File size in bytes
        private String resourceType;          // image, video, raw
    }
}
