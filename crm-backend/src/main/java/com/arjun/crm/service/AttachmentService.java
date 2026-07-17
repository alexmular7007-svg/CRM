package com.arjun.crm.service;

import com.arjun.crm.entity.Attachment;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

/**
 * Service for managing file attachments with Supabase Storage backend
 */
public interface AttachmentService {

    /**
     * Upload a file for a chat message
     *
     * @param file The file to upload
     * @param chatMessageId The chat message ID
     * @param userId The user uploading the file
     * @return Attachment metadata
     */
    Attachment uploadChatAttachment(MultipartFile file, Long chatMessageId, Long userId);

    /**
     * Upload a file for a task
     *
     * @param file The file to upload
     * @param taskId The task ID
     * @param userId The user uploading the file
     * @return Attachment metadata
     */
    Attachment uploadTaskAttachment(MultipartFile file, Long taskId, Long userId);

    /**
     * Get attachment by ID with permission check
     *
     * @param attachmentId The attachment ID
     * @param userId The user requesting access
     * @return Attachment if user has access
     */
    Attachment getAttachmentWithPermissionCheck(Long attachmentId, Long userId);

    /**
     * Generate a signed download URL with permission validation
     *
     * @param attachmentId The attachment ID
     * @param userId The user requesting download
     * @return Signed download URL valid for 7 days
     */
    String generateDownloadUrl(Long attachmentId, Long userId);

    /**
     * Download file as stream with permission check
     *
     * @param attachmentId The attachment ID
     * @param userId The user requesting download
     * @return InputStream of the file
     */
    InputStream downloadFileStream(Long attachmentId, Long userId);

    /**
     * Delete an attachment
     *
     * @param attachmentId The attachment ID
     * @param userId The user requesting deletion (must be owner)
     */
    void deleteAttachment(Long attachmentId, Long userId);

    /**
     * Get all attachments for a chat message
     */
    List<Attachment> getAttachmentsForChatMessage(Long chatMessageId);

    /**
     * Get all attachments for a task
     */
    List<Attachment> getAttachmentsForTask(Long taskId);

    /**
     * Clean up old deleted attachments from storage
     * Should be called periodically (e.g., daily)
     */
    void cleanupOldDeletedAttachments();
}
