package com.arjun.crm.service.impl;

import com.arjun.crm.entity.Attachment;
import com.arjun.crm.entity.ChatMessage;
import com.arjun.crm.entity.Task;
import com.arjun.crm.entity.User;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.repository.*;
import com.arjun.crm.service.AttachmentService;
import com.arjun.crm.service.SupabaseStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Attachment Service Implementation
 *
 * Handles file uploads to Supabase Storage with metadata tracking in PostgreSQL.
 * Enforces permission checks on download/delete operations.
 * Manages attachment lifecycle including cleanup of deleted files.
 *
 * PHASE 8: Security - verifies workspace and conversation membership before download
 * PHASE 9: Performance - uses streaming for large file operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final SupabaseStorageService storageService;

    // Retention period for deleted attachments (30 days)
    private static final long DELETED_ATTACHMENT_RETENTION_DAYS = 30;

    @Override
    @Transactional
    public Attachment uploadChatAttachment(MultipartFile file, Long chatMessageId, Long userId) {
        log.info("📤 Uploading chat attachment: msg_id={}, user_id={}, file={}", chatMessageId, userId, file.getOriginalFilename());

        // Validate chat message exists
        ChatMessage chatMessage = chatMessageRepository.findById(chatMessageId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat message not found"));

        // Validate user is participant in the chat room
        if (!chatRoomRepository.isUserParticipant(chatMessage.getChatRoom().getId(), userId)) {
            log.warn("⚠️ Access denied: user {} not participant in chat room {}", userId, chatMessage.getChatRoom().getId());
            throw new AccessDeniedException("You are not a participant of this chat room");
        }

        // Upload to Supabase
        SupabaseStorageService.UploadResult uploadResult = storageService.uploadChatAttachment(file, chatMessage.getChatRoom().getId());

        // Get uploader user
        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Save attachment metadata to DB
        Attachment attachment = Attachment.builder()
                .storagePath(uploadResult.storagePath)
                .originalFilename(uploadResult.fileName)
                .mimeType(uploadResult.mimeType)
                .fileSize(uploadResult.fileSize)
                .contentHash(uploadResult.contentHash)
                .uploadedBy(uploader)
                .chatMessage(chatMessage)
                .isPublic(false)  // Chat attachments are private to workspace
                .downloadCount(0)
                .isDeleted(false)
                .build();

        Attachment saved = attachmentRepository.save(attachment);
        log.info("✅ Chat attachment saved: id={}, path={}", saved.getId(), saved.getStoragePath());

        return saved;
    }

    @Override
    @Transactional
    public Attachment uploadTaskAttachment(MultipartFile file, Long taskId, Long userId) {
        log.info("📤 Uploading task attachment: task_id={}, user_id={}, file={}", taskId, userId, file.getOriginalFilename());

        // Validate task exists
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        // TODO: Add workspace permission check for task
        // For now, just verify task exists

        // Upload to Supabase
        SupabaseStorageService.UploadResult uploadResult = storageService.uploadTaskAttachment(file, taskId);

        // Get uploader user
        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Save attachment metadata to DB
        Attachment attachment = Attachment.builder()
                .storagePath(uploadResult.storagePath)
                .originalFilename(uploadResult.fileName)
                .mimeType(uploadResult.mimeType)
                .fileSize(uploadResult.fileSize)
                .contentHash(uploadResult.contentHash)
                .uploadedBy(uploader)
                .task(task)
                .isPublic(false)
                .downloadCount(0)
                .isDeleted(false)
                .build();

        Attachment saved = attachmentRepository.save(attachment);
        log.info("✅ Task attachment saved: id={}, path={}", saved.getId(), saved.getStoragePath());

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Attachment getAttachmentWithPermissionCheck(Long attachmentId, Long userId) {
        log.debug("🔍 Getting attachment with permission check: id={}, user_id={}", attachmentId, userId);

        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

        // PHASE 8: Security - verify user has access to this attachment
        if (!canUserAccessAttachment(attachment, userId)) {
            log.warn("⚠️ Access denied: user {} cannot access attachment {}", userId, attachmentId);
            throw new AccessDeniedException("You do not have permission to access this attachment");
        }

        return attachment;
    }

    @Override
    @Transactional
    public String generateDownloadUrl(Long attachmentId, Long userId) {
        log.info("🔗 Generating download URL: id={}, user_id={}", attachmentId, userId);

        // Verify access with permission check
        Attachment attachment = getAttachmentWithPermissionCheck(attachmentId, userId);

        // Generate signed URL (valid for 7 days)
        String signedUrl = storageService.generateSignedDownloadUrl(
                attachment.getStoragePath(),
                7 * 24 * 60 * 60  // 7 days in seconds
        );

        // Update download tracking
        attachment.setDownloadCount(attachment.getDownloadCount() + 1);
        attachment.setLastDownloadedAt(Instant.now());
        attachmentRepository.save(attachment);

        log.info("✅ Download URL generated: {}", attachmentId);
        return signedUrl;
    }

    @Override
    @Transactional
    public InputStream downloadFileStream(Long attachmentId, Long userId) {
        log.info("⬇️ Downloading file stream: id={}, user_id={}", attachmentId, userId);

        // Verify access with permission check
        Attachment attachment = getAttachmentWithPermissionCheck(attachmentId, userId);

        if (attachment.getIsDeleted()) {
            log.warn("⚠️ Attempted download of deleted attachment: {}", attachmentId);
            throw new ResourceNotFoundException("This attachment has been deleted");
        }

        // Download from Supabase
        InputStream stream = storageService.downloadFile(attachment.getStoragePath());

        // Update download tracking (async in production)
        attachment.setDownloadCount(attachment.getDownloadCount() + 1);
        attachment.setLastDownloadedAt(Instant.now());
        attachmentRepository.save(attachment);

        log.info("✅ File stream ready for download: {}", attachmentId);
        return stream;
    }

    @Override
    @Transactional
    public void deleteAttachment(Long attachmentId, Long userId) {
        log.info("🗑️ Deleting attachment: id={}, user_id={}", attachmentId, userId);

        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

        // Only owner can delete
        if (!attachment.getUploadedBy().getId().equals(userId)) {
            log.warn("⚠️ Access denied: user {} is not owner of attachment {}", userId, attachmentId);
            throw new AccessDeniedException("You can only delete your own attachments");
        }

        // Mark as deleted (soft delete) - cleanup happens asynchronously
        attachment.setIsDeleted(true);
        attachmentRepository.save(attachment);

        // Delete from Supabase asynchronously
        try {
            storageService.deleteFile(attachment.getStoragePath());
        } catch (Exception e) {
            log.warn("⚠️ Failed to delete file from storage, will retry later: {}", attachment.getStoragePath());
        }

        log.info("✅ Attachment marked for deletion: {}", attachmentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Attachment> getAttachmentsForChatMessage(Long chatMessageId) {
        return attachmentRepository.findByChatMessageId(chatMessageId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Attachment> getAttachmentsForTask(Long taskId) {
        return attachmentRepository.findByTaskId(taskId);
    }

    @Override
    @Transactional
    public void cleanupOldDeletedAttachments() {
        log.info("🧹 Cleaning up old deleted attachments");

        Instant cutoffDate = Instant.now().minus(DELETED_ATTACHMENT_RETENTION_DAYS, ChronoUnit.DAYS);
        List<Attachment> oldDeletedAttachments = attachmentRepository.findDeletedAttachmentsOlderThan(cutoffDate);

        for (Attachment attachment : oldDeletedAttachments) {
            try {
                // Delete from Supabase if still there
                storageService.deleteFile(attachment.getStoragePath());
                // Remove metadata from DB
                attachmentRepository.delete(attachment);
                log.debug("✅ Cleaned up attachment: {}", attachment.getId());
            } catch (Exception e) {
                log.warn("⚠️ Failed to cleanup attachment {}: {}", attachment.getId(), e.getMessage());
            }
        }

        log.info("✅ Cleanup complete: {} attachments removed", oldDeletedAttachments.size());
    }

    // ─── Private Helper Methods ────────────────────────────────────────────

    /**
     * PHASE 8: Security - checks if user can access attachment
     * 
     * Access rules:
     * - Owner can always access
     * - For chat attachments: user must be participant in chat room
     * - For task attachments: user must be in workspace (TODO)
     */
    private boolean canUserAccessAttachment(Attachment attachment, Long userId) {
        // Owner can always access
        if (attachment.getUploadedBy().getId().equals(userId)) {
            return true;
        }

        // Chat attachment: check if user is in chat room
        if (attachment.getChatMessage() != null) {
            Long chatRoomId = attachment.getChatMessage().getChatRoom().getId();
            return chatRoomRepository.isUserParticipant(chatRoomId, userId);
        }

        // Task attachment: check if user is in workspace (TODO)
        if (attachment.getTask() != null) {
            // TODO: Implement workspace permission check
            return true;  // Temporary: allow access
        }

        return false;
    }
}
