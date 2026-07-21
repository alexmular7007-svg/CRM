package com.arjun.crm.service.impl;

import com.arjun.crm.entity.Attachment;
import com.arjun.crm.entity.ChatMessage;
import com.arjun.crm.entity.Task;
import com.arjun.crm.entity.User;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.repository.*;
import com.arjun.crm.service.AttachmentService;
import com.arjun.crm.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Attachment Service Implementation
 *
 * Handles file uploads to Cloudinary with metadata tracking in PostgreSQL.
 * Enforces permission checks on download/delete operations.
 * Manages attachment lifecycle using Cloudinary as the storage backend.
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
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional
    public Attachment uploadChatAttachment(MultipartFile file, Long chatMessageId, Long userId) {
        log.info("📤 Uploading chat attachment: msg_id={}, user_id={}, file={}", 
                chatMessageId, userId, file.getOriginalFilename());

        // ✅ DEFENSIVE CHECK: Ensure filename is preserved
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be empty");
        }
        if (!originalFilename.contains(".")) {
            log.warn("⚠️ Filename missing extension: {} - using as-is", originalFilename);
        }

        // Validate chat message exists
        ChatMessage chatMessage = chatMessageRepository.findById(chatMessageId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat message not found"));

        // Validate user is participant in the chat room
        if (!chatRoomRepository.isUserParticipant(chatMessage.getChatRoom().getId(), userId)) {
            log.warn("⚠️ Access denied: user {} not participant in chat room {}", 
                    userId, chatMessage.getChatRoom().getId());
            throw new AccessDeniedException("You are not a participant of this chat room");
        }

        // Upload to Cloudinary
        log.debug("🚀 Starting Cloudinary upload for chat attachment");
        CloudinaryService.UploadResult uploadResult = cloudinaryService.uploadChatAttachment(
                file, chatMessage.getChatRoom().getId());

        log.debug("✅ Cloudinary upload completed - publicId: {}", uploadResult.publicId());
        log.info("✅ CRITICAL: Filename from upload result: {} ✅ HAS EXTENSION", uploadResult.filename());

        // Get uploader user
        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // ✅ DEFENSIVE CHECK: Verify filename before saving
        String filenameToSave = uploadResult.filename();
        if (filenameToSave == null || filenameToSave.isEmpty()) {
            log.error("❌ CRITICAL: Upload result filename is empty!");
            filenameToSave = originalFilename;  // Fallback to original
        }
        if (!filenameToSave.contains(".")) {
            log.error("❌ CRITICAL: Upload result filename has NO EXTENSION: {}", filenameToSave);
            // Try to add extension based on MIME type
            filenameToSave = addExtensionIfMissing(filenameToSave, uploadResult.mimeType());
            log.info("✅ Added extension: {}", filenameToSave);
        }

        // Save attachment metadata to database
        Attachment attachment = Attachment.builder()
                .storagePath(uploadResult.publicId())
                .cloudinaryPublicId(uploadResult.publicId())
                .cloudinaryVersion(uploadResult.version())  // ✅ NEW: Store version
                .secureUrl(uploadResult.secureUrl())
                .resourceType(uploadResult.resourceType())
                .originalFilename(filenameToSave)  // ✅ VERIFIED FILENAME WITH EXTENSION
                .mimeType(uploadResult.mimeType())
                .fileSize(uploadResult.fileSize())
                .uploadedBy(uploader)
                .chatMessage(chatMessage)
                .workspace(chatMessage.getChatRoom().getWorkspace())  // ✅ Set workspace directly
                .isPublic(false)
                .isDeleted(false)
                .downloadCount(0)
                .build();

        Attachment saved = attachmentRepository.save(attachment);
        log.info("✅ Chat attachment saved to database: id={}, filename={}, publicId={}", 
                saved.getId(), saved.getOriginalFilename(), saved.getCloudinaryPublicId());

        return saved;
    }

    @Override
    @Transactional
    public Attachment uploadTaskAttachment(MultipartFile file, Long taskId, Long userId) {
        log.info("📤 Uploading task attachment: task_id={}, user_id={}, file={}", 
                taskId, userId, file.getOriginalFilename());

        // ✅ DEFENSIVE CHECK: Ensure filename is preserved
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be empty");
        }
        if (!originalFilename.contains(".")) {
            log.warn("⚠️ Filename missing extension: {} - using as-is", originalFilename);
        }

        // Validate task exists
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        // TODO: Add workspace permission check for task

        // Upload to Cloudinary
        log.debug("🚀 Starting Cloudinary upload for task attachment");
        CloudinaryService.UploadResult uploadResult = cloudinaryService.uploadTaskAttachment(file, taskId);

        log.debug("✅ Cloudinary upload completed - publicId: {}", uploadResult.publicId());
        log.info("✅ CRITICAL: Filename from upload result: {} ✅ HAS EXTENSION", uploadResult.filename());

        // Get uploader user
        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // ✅ DEFENSIVE CHECK: Verify filename before saving
        String filenameToSave = uploadResult.filename();
        if (filenameToSave == null || filenameToSave.isEmpty()) {
            log.error("❌ CRITICAL: Upload result filename is empty!");
            filenameToSave = originalFilename;  // Fallback to original
        }
        if (!filenameToSave.contains(".")) {
            log.error("❌ CRITICAL: Upload result filename has NO EXTENSION: {}", filenameToSave);
            // Try to add extension based on MIME type
            filenameToSave = addExtensionIfMissing(filenameToSave, uploadResult.mimeType());
            log.info("✅ Added extension: {}", filenameToSave);
        }

        // Save attachment metadata to database
        Attachment attachment = Attachment.builder()
                .storagePath(uploadResult.publicId())
                .cloudinaryPublicId(uploadResult.publicId())
                .cloudinaryVersion(uploadResult.version())  // ✅ NEW: Store version
                .secureUrl(uploadResult.secureUrl())
                .resourceType(uploadResult.resourceType())
                .originalFilename(filenameToSave)  // ✅ VERIFIED FILENAME WITH EXTENSION
                .mimeType(uploadResult.mimeType())
                .fileSize(uploadResult.fileSize())
                .uploadedBy(uploader)
                .task(task)
                .workspace(task.getWorkspace())  // ✅ Set workspace directly
                .isPublic(false)
                .isDeleted(false)
                .downloadCount(0)
                .build();

        Attachment saved = attachmentRepository.save(attachment);
        log.info("✅ Task attachment saved to database: id={}, filename={}, publicId={}", 
                saved.getId(), saved.getOriginalFilename(), saved.getCloudinaryPublicId());

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Attachment getAttachmentWithPermissionCheck(Long attachmentId, Long userId) {
        log.debug("🔍 Getting attachment with permission check: id={}, user_id={}", attachmentId, userId);

        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

        // Verify user has access to this attachment
        if (!canUserAccessAttachment(attachment, userId)) {
            log.warn("⚠️ Access denied: user {} cannot access attachment {}", userId, attachmentId);
            throw new AccessDeniedException("You do not have permission to access this attachment");
        }

        return attachment;
    }

    @Override
    @Transactional
    public String getDownloadUrl(Long attachmentId, Long userId) {
        log.info("🔗 Getting download URL: id={}, user_id={}", attachmentId, userId);

        // Verify access with permission check
        Attachment attachment = getAttachmentWithPermissionCheck(attachmentId, userId);

        // Track download
        attachment.setDownloadCount(attachment.getDownloadCount() + 1);
        attachment.setLastDownloadedAt(java.time.Instant.now());
        attachmentRepository.save(attachment);

        log.info("✅ Download URL retrieved: {} (secureUrl: {})", attachmentId, attachment.getSecureUrl());
        
        // Return the secure URL directly from Cloudinary
        return attachment.getSecureUrl();
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

        // Delete from Cloudinary first
        try {
            log.debug("🗑️ Deleting from Cloudinary: {}", attachment.getCloudinaryPublicId());
            cloudinaryService.deleteFile(attachment.getCloudinaryPublicId());
            log.debug("✅ File deleted from Cloudinary");
        } catch (Exception e) {
            log.error("❌ Failed to delete file from Cloudinary: {}", attachment.getCloudinaryPublicId(), e);
            throw new RuntimeException("Failed to delete attachment from storage: " + e.getMessage(), e);
        }

        // Delete metadata from database
        attachmentRepository.delete(attachment);
        log.info("✅ Attachment deleted from database: id={}", attachmentId);
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

    // ─── Private Helper Methods ────────────────────────────────────────────

    /**
     * Add file extension if missing based on MIME type
     */
    private String addExtensionIfMissing(String filename, String mimeType) {
        if (filename.contains(".")) {
            return filename;  // Already has extension
        }
        
        String ext = ".bin";  // Default
        if (mimeType != null) {
            if (mimeType.contains("pdf")) ext = ".pdf";
            else if (mimeType.contains("word") || mimeType.contains("document")) ext = ".docx";
            else if (mimeType.contains("image/jpeg")) ext = ".jpg";
            else if (mimeType.contains("image/png")) ext = ".png";
            else if (mimeType.contains("video")) ext = ".mp4";
            else if (mimeType.contains("zip")) ext = ".zip";
            else if (mimeType.contains("excel")) ext = ".xlsx";
        }
        
        return filename + ext;
    }

    /**
     * Checks if user can access attachment
     * 
     * Access rules:
     * - Owner can always access
     * - For chat attachments: user must be participant in chat room
     * - For task attachments: user must be in workspace
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
