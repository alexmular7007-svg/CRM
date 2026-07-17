package com.arjun.crm.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * Interface for Supabase Storage Operations
 * 
 * Handles uploading/downloading files to/from Supabase Storage
 * with security validation and signed URL generation.
 */
public interface SupabaseStorageService {

    /**
     * Upload a file to Supabase Storage for chat attachments
     *
     * @param file The multipart file to upload
     * @param conversationId The chat conversation ID (for organizing files)
     * @return Upload result containing storage path and metadata
     */
    UploadResult uploadChatAttachment(MultipartFile file, Long conversationId);

    /**
     * Upload a file to Supabase Storage for task attachments
     *
     * @param file The multipart file to upload
     * @param taskId The task ID (for organizing files)
     * @return Upload result containing storage path and metadata
     */
    UploadResult uploadTaskAttachment(MultipartFile file, Long taskId);

    /**
     * Generate a secure signed download URL for a stored file
     *
     * @param storagePath The storage path (e.g., "chat/uuid-filename.pdf")
     * @param expirySeconds Expiry time in seconds
     * @return Signed URL that allows temporary public download
     */
    String generateSignedDownloadUrl(String storagePath, int expirySeconds);

    /**
     * Download a file from Supabase Storage as InputStream
     *
     * @param storagePath The storage path
     * @return InputStream of the file
     */
    InputStream downloadFile(String storagePath);

    /**
     * Delete a file from Supabase Storage
     *
     * @param storagePath The storage path
     */
    void deleteFile(String storagePath);

    /**
     * Check if bucket exists and is accessible
     *
     * @return true if bucket is healthy, false otherwise
     */
    boolean isBucketAccessible();

    /**
     * Create the chat-attachments bucket if it doesn't exist
     * Should only be called during application startup/setup
     */
    void ensureBucketExists();

    /**
     * Result of a file upload operation
     */
    class UploadResult {
        public final String storagePath;      // Path in storage (e.g., "chat/uuid-filename.pdf")
        public final String fileName;          // Original filename
        public final String mimeType;          // MIME type
        public final Long fileSize;            // File size in bytes
        public final String contentHash;       // Content hash for integrity verification

        public UploadResult(String storagePath, String fileName, String mimeType, Long fileSize, String contentHash) {
            this.storagePath = storagePath;
            this.fileName = fileName;
            this.mimeType = mimeType;
            this.fileSize = fileSize;
            this.contentHash = contentHash;
        }
    }
}
