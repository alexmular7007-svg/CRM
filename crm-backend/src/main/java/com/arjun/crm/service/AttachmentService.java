package com.arjun.crm.service;

import com.arjun.crm.entity.Attachment;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service for managing file attachments with Cloudinary backend
 */
public interface AttachmentService {

    /**
     * Upload a file for a chat message
     *
     * @param file The file to upload
     * @param chatMessageId The chat message ID
     * @param userId The user uploading the file
     * @return Attachment metadata with Cloudinary details
     */
    Attachment uploadChatAttachment(MultipartFile file, Long chatMessageId, Long userId);

    /**
     * Upload a file for a task
     *
     * @param file The file to upload
     * @param taskId The task ID
     * @param userId The user uploading the file
     * @return Attachment metadata with Cloudinary details
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
     * Get attachment secure URL (direct from Cloudinary, no additional URL generation needed)
     *
     * @param attachmentId The attachment ID
     * @param userId The user requesting access
     * @return Secure HTTPS URL for download/preview
     */
    String getDownloadUrl(Long attachmentId, Long userId);

    /**
     * Delete an attachment from Cloudinary and database
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
}
