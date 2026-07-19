package com.arjun.crm.controller;

import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.entity.Attachment;
import com.arjun.crm.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Attachment Controller - Unified API for file uploads and downloads
 * 
 * Handles all attachment operations using Cloudinary backend.
 * Supports both chat and task attachments.
 * 
 * Endpoints:
 * - POST /api/attachments/chat/{chatMessageId} - Upload chat attachment
 * - POST /api/attachments/task/{taskId} - Upload task attachment
 * - GET /api/attachments/{attachmentId}/download - Get download URL
 * - DELETE /api/attachments/{attachmentId} - Delete attachment
 * - GET /api/attachments/chat/{chatMessageId} - List chat attachments
 * - GET /api/attachments/task/{taskId} - List task attachments
 */
@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class AttachmentController {

    private final AttachmentService attachmentService;

    /**
     * Upload attachment for a chat message
     * 
     * POST /api/attachments/chat/{chatMessageId}
     * 
     * @param chatMessageId The chat message ID
     * @param file The file to upload
     * @param auth Authentication context
     * @return Attachment metadata with Cloudinary details
     */
    @PostMapping("/chat/{chatMessageId}")
    public ResponseEntity<ApiResponse<AttachmentResponse>> uploadChatAttachment(
            @PathVariable Long chatMessageId,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        log.info("📤 Upload chat attachment request: msg_id={}, file={}", chatMessageId, file.getOriginalFilename());

        Long userId = extractUserId(auth);
        Attachment attachment = attachmentService.uploadChatAttachment(file, chatMessageId, userId);

        AttachmentResponse response = toAttachmentResponse(attachment);
        log.info("✅ Chat attachment uploaded successfully: id={}", attachment.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chat attachment uploaded successfully", response));
    }

    /**
     * Upload attachment for a task
     * 
     * POST /api/attachments/task/{taskId}
     * 
     * @param taskId The task ID
     * @param file The file to upload
     * @param auth Authentication context
     * @return Attachment metadata with Cloudinary details
     */
    @PostMapping("/task/{taskId}")
    public ResponseEntity<ApiResponse<AttachmentResponse>> uploadTaskAttachment(
            @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        log.info("📤 Upload task attachment request: task_id={}, file={}", taskId, file.getOriginalFilename());

        Long userId = extractUserId(auth);
        Attachment attachment = attachmentService.uploadTaskAttachment(file, taskId, userId);

        AttachmentResponse response = toAttachmentResponse(attachment);
        log.info("✅ Task attachment uploaded successfully: id={}", attachment.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task attachment uploaded successfully", response));
    }

    /**
     * Get download URL for attachment
     * 
     * GET /api/attachments/{attachmentId}/download
     * 
     * Frontend receives the secure URL and can:
     * - Display images: <img src={secureUrl} />
     * - Play videos: <video src={secureUrl} />
     * - Download files: <a href={secureUrl} download>
     * 
     * @param attachmentId The attachment ID
     * @param auth Authentication context
     * @return Attachment with secure URL
     */
    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<ApiResponse<AttachmentResponse>> getDownloadUrl(
            @PathVariable Long attachmentId,
            Authentication auth) {

        log.info("🔗 Download URL request: attachment_id={}", attachmentId);

        Long userId = extractUserId(auth);
        String downloadUrl = attachmentService.getDownloadUrl(attachmentId, userId);
        
        // Return the attachment with the secure URL
        Attachment attachment = attachmentService.getAttachmentWithPermissionCheck(attachmentId, userId);
        AttachmentResponse response = toAttachmentResponse(attachment);

        log.info("✅ Download URL retrieved: {}", attachmentId);

        return ResponseEntity.ok(
                ApiResponse.success("Download URL retrieved successfully", response));
    }

    /**
     * Get attachment metadata
     * 
     * GET /api/attachments/{attachmentId}
     * 
     * @param attachmentId The attachment ID
     * @param auth Authentication context
     * @return Attachment metadata including secure URL
     */
    @GetMapping("/{attachmentId}")
    public ResponseEntity<ApiResponse<AttachmentResponse>> getAttachment(
            @PathVariable Long attachmentId,
            Authentication auth) {

        log.info("🔍 Get attachment request: id={}", attachmentId);

        Long userId = extractUserId(auth);
        Attachment attachment = attachmentService.getAttachmentWithPermissionCheck(attachmentId, userId);

        AttachmentResponse response = toAttachmentResponse(attachment);

        return ResponseEntity.ok(
                ApiResponse.success("Attachment retrieved successfully", response));
    }

    /**
     * Delete attachment
     * 
     * DELETE /api/attachments/{attachmentId}
     * 
     * Only the uploader can delete their attachments.
     * Deletes from both Cloudinary and database.
     * 
     * @param attachmentId The attachment ID
     * @param auth Authentication context
     * @return Success response
     */
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable Long attachmentId,
            Authentication auth) {

        log.info("🗑️ Delete attachment request: id={}", attachmentId);

        Long userId = extractUserId(auth);
        attachmentService.deleteAttachment(attachmentId, userId);

        log.info("✅ Attachment deleted successfully: {}", attachmentId);

        return ResponseEntity.ok(
                ApiResponse.success("Attachment deleted successfully", null));
    }

    /**
     * List attachments for a chat message
     * 
     * GET /api/attachments/chat/{chatMessageId}/list
     * 
     * @param chatMessageId The chat message ID
     * @return List of attachments
     */
    @GetMapping("/chat/{chatMessageId}/list")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> listChatAttachments(
            @PathVariable Long chatMessageId) {

        log.info("📋 List chat attachments request: msg_id={}", chatMessageId);

        List<Attachment> attachments = attachmentService.getAttachmentsForChatMessage(chatMessageId);
        List<AttachmentResponse> responses = attachments.stream()
                .map(this::toAttachmentResponse)
                .toList();

        return ResponseEntity.ok(
                ApiResponse.success("Chat attachments retrieved successfully", responses));
    }

    /**
     * List attachments for a task
     * 
     * GET /api/attachments/task/{taskId}/list
     * 
     * @param taskId The task ID
     * @return List of attachments
     */
    @GetMapping("/task/{taskId}/list")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> listTaskAttachments(
            @PathVariable Long taskId) {

        log.info("📋 List task attachments request: task_id={}", taskId);

        List<Attachment> attachments = attachmentService.getAttachmentsForTask(taskId);
        List<AttachmentResponse> responses = attachments.stream()
                .map(this::toAttachmentResponse)
                .toList();

        return ResponseEntity.ok(
                ApiResponse.success("Task attachments retrieved successfully", responses));
    }

    // ─── Helper Methods ─────────────────────────────────────────────────

    /**
     * Extract user ID from authentication context
     */
    private Long extractUserId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        // Assuming the principal contains user ID - adjust based on your auth implementation
        return ((Number) auth.getPrincipal()).longValue();
    }

    /**
     * Convert Attachment entity to DTO response
     */
    private AttachmentResponse toAttachmentResponse(Attachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getCloudinaryPublicId(),
                attachment.getSecureUrl(),
                attachment.getResourceType(),
                attachment.getOriginalFilename(),
                attachment.getMimeType(),
                attachment.getFileSize(),
                attachment.getUploadedBy().getId(),
                attachment.getUploadedBy().getFullName(),
                attachment.getDownloadCount(),
                attachment.getCreatedAt()
        );
    }

    /**
     * Attachment Response DTO
     */
    public record AttachmentResponse(
            Long id,
            String cloudinaryPublicId,
            String secureUrl,
            String resourceType,
            String originalFilename,
            String mimeType,
            Long fileSize,
            Long uploadedById,
            String uploadedByName,
            Integer downloadCount,
            java.time.Instant createdAt
    ) {}
}
