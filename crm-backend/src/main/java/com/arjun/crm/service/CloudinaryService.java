package com.arjun.crm.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Cloudinary Storage Service
 * 
 * Handles file uploads, downloads, and deletions using Cloudinary API.
 * Provides simple interface for attachment operations without exposing
 * Cloudinary-specific implementation details.
 */
public interface CloudinaryService {

    /**
     * Result of a successful file upload to Cloudinary
     */
    record UploadResult(
            String publicId,      // Cloudinary public ID
            String secureUrl,     // HTTPS delivery URL
            String resourceType,  // image, video, raw
            String filename,      // Original filename
            String mimeType,      // MIME type
            Long fileSize         // File size in bytes
    ) {}

    /**
     * Upload a file to Cloudinary for chat attachment
     * 
     * @param file The multipart file to upload
     * @param chatRoomId The chat room ID (used in folder structure)
     * @return Upload result with public ID and secure URL
     */
    UploadResult uploadChatAttachment(MultipartFile file, Long chatRoomId);

    /**
     * Upload a file to Cloudinary for task attachment
     * 
     * @param file The multipart file to upload
     * @param taskId The task ID (used in folder structure)
     * @return Upload result with public ID and secure URL
     */
    UploadResult uploadTaskAttachment(MultipartFile file, Long taskId);

    /**
     * Delete a file from Cloudinary
     * 
     * @param publicId The Cloudinary public ID
     */
    void deleteFile(String publicId);

    /**
     * Check if a file exists in Cloudinary
     * 
     * @param publicId The Cloudinary public ID
     * @return true if file exists, false otherwise
     */
    boolean fileExists(String publicId);
}
