package com.arjun.crm.service.impl;

import com.arjun.crm.service.CloudinaryService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * Cloudinary Service Implementation
 * 
 * Handles all file upload/download/delete operations using Cloudinary SDK.
 * Automatically manages file organization in Cloudinary folders.
 * Validates file types and sizes before upload.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.storage.max-file-size:104857600}")
    private long maxFileSize;

    @Value("${cloudinary.storage.chat-folder:chat}")
    private String chatFolder;

    @Value("${cloudinary.storage.task-folder:tasks}")
    private String taskFolder;

    // Allowed file extensions for each resource type
    private static final String[] ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "svg"};
    private static final String[] ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "avi", "webm", "mkv", "flv"};
    private static final String[] ALLOWED_RAW_EXTENSIONS = {"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip", "rar"};

    @Override
    public UploadResult uploadChatAttachment(MultipartFile file, Long chatRoomId) {
        log.info("📤 Uploading chat attachment: file={}, size={}, chatRoomId={}", 
                file.getOriginalFilename(), file.getSize(), chatRoomId);

        return uploadFile(file, chatFolder + "/" + chatRoomId);
    }

    @Override
    public UploadResult uploadTaskAttachment(MultipartFile file, Long taskId) {
        log.info("📤 Uploading task attachment: file={}, size={}, taskId={}", 
                file.getOriginalFilename(), file.getSize(), taskId);

        return uploadFile(file, taskFolder + "/" + taskId);
    }

    @Override
    public void deleteFile(String publicId) {
        if (publicId == null || publicId.isEmpty()) {
            log.warn("⚠️ Attempted delete with empty public ID");
            return;
        }

        try {
            log.info("🗑️ Deleting file from Cloudinary: {}", publicId);
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.asMap());
            
            if ("ok".equals(result.get("result"))) {
                log.info("✅ File deleted successfully: {}", publicId);
            } else {
                log.warn("⚠️ Cloudinary delete returned unexpected result: {}", result.get("result"));
            }
        } catch (Exception e) {
            log.error("❌ Failed to delete file from Cloudinary: {}", publicId, e);
            throw new RuntimeException("Failed to delete file: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean fileExists(String publicId) {
        try {
            log.debug("🔍 Checking if file exists: {}", publicId);
            Map<String, Object> result = cloudinary.api().resource(publicId, ObjectUtils.asMap());
            return result != null && result.containsKey("public_id");
        } catch (Exception e) {
            log.debug("ℹ️ File does not exist or error checking: {}", publicId);
            return false;
        }
    }

    // ─── Private Helper Methods ─────────────────────────────────────────

    /**
     * Upload file to Cloudinary with validation
     */
    private UploadResult uploadFile(MultipartFile file, String folder) {
        // Validate file
        validateFile(file);

        try {
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);
            String mimeType = file.getContentType();
            byte[] fileBytes = file.getBytes();
            long fileSizeBytes = file.getSize();

            // ═══════════════════════════════════════════════════════════════
            // DIAGNOSTIC 1: Verify original file integrity
            // ═══════════════════════════════════════════════════════════════
            log.info("📋 ━━━━━ UPLOAD DIAGNOSTICS START ━━━━━");
            log.info("📋 [1] ORIGINAL FILE INFO:");
            log.info("     Filename: {}", originalFilename);
            log.info("     Content-Type: {}", mimeType);
            log.info("     File.getSize(): {} bytes", fileSizeBytes);
            log.info("     Bytes.length: {} bytes", fileBytes.length);
            log.info("     Size match: {}", fileSizeBytes == fileBytes.length ? "✅ YES" : "❌ NO");

            // ═══════════════════════════════════════════════════════════════
            // DIAGNOSTIC 2: Verify PDF signature
            // ═══════════════════════════════════════════════════════════════
            if ("pdf".equalsIgnoreCase(fileExtension)) {
                String pdfSignature = new String(fileBytes, 0, Math.min(8, fileBytes.length));
                log.info("📋 [2] PDF SIGNATURE:");
                log.info("     First 8 bytes: {} (hex)", bytesToHex(fileBytes, 0, Math.min(8, fileBytes.length)));
                log.info("     Starts with %PDF: {}", pdfSignature.startsWith("%PDF") ? "✅ YES" : "❌ NO");
                if (!pdfSignature.startsWith("%PDF")) {
                    log.error("❌ CORRUPTED: File does not start with %PDF signature!");
                }
                
                // Also check last bytes (EOF marker)
                int lastBytes = Math.min(10, fileBytes.length);
                String endBytes = new String(fileBytes, fileBytes.length - lastBytes, lastBytes);
                log.info("     Last 10 bytes: {} (hex)", bytesToHex(fileBytes, fileBytes.length - lastBytes, lastBytes));
                log.info("     Ends with %%EOF: {}", endBytes.contains("%%EOF") ? "✅ YES" : "⚠️ NO");
            }

            // Determine resource type and validate
            String resourceType = determineResourceType(fileExtension, mimeType);
            
            // Generate unique public ID (includes folder path)
            String publicId = generatePublicId(folder, originalFilename);

            log.info("📋 [3] CLOUDINARY CONFIGURATION:");
            log.info("     Extension: {}", fileExtension);
            log.info("     MIME Type: {}", mimeType);
            log.info("     Resource Type: {}", resourceType);
            log.info("     Folder: {}", folder);
            log.info("     Public ID: {}", publicId);

            // ═══════════════════════════════════════════════════════════════
            // CRITICAL FIX: Don't pass "folder" parameter separately
            // Public ID already contains the folder path: "chat/8/uuid-filename"
            // ═══════════════════════════════════════════════════════════════
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "public_id", publicId,                    // Already includes folder
                    "resource_type", resourceType,            // image, video, or raw
                    "overwrite", false,                       // Prevent accidental overwrites
                    "invalidate", true,                       // Invalidate CDN cache
                    "timeout", 60000,                         // 60 second timeout
                    "use_filename", false,                    // Don't use original filename
                    "unique_filename", false,                 // Use our UUID naming
                    "type", "upload"                          // Explicit upload type
            );

            log.info("📋 [4] UPLOADING TO CLOUDINARY:");
            log.info("     Upload params: {}", uploadParams);
            log.info("     File bytes to send: {} bytes", fileBytes.length);
            log.info("     Sending byte array directly (NOT a stream wrapper)");
            
            // ✅ Critical: Pass raw bytes directly, NOT wrapped in any wrapper
            Map<String, Object> uploadResult = cloudinary.uploader().upload(fileBytes, uploadParams);

            // ═══════════════════════════════════════════════════════════════
            // DIAGNOSTIC 3: Verify Cloudinary byte count
            // ═══════════════════════════════════════════════════════════════
            String resultPublicId = (String) uploadResult.get("public_id");
            String secureUrl = (String) uploadResult.get("secure_url");
            String resultResourceType = (String) uploadResult.get("resource_type");
            String format = (String) uploadResult.get("format");
            
            // ✅ CRITICAL FIX: Cloudinary returns "bytes" as Integer, not Long
            Number bytesNumber = (Number) uploadResult.get("bytes");
            Long cloudinaryBytes = bytesNumber != null ? bytesNumber.longValue() : 0L;

            log.info("📋 [5] CLOUDINARY RESPONSE:");
            log.info("     Public ID: {}", resultPublicId);
            log.info("     Resource Type: {}", resultResourceType);
            log.info("     Format: {}", format);
            log.info("     Secure URL: {}", secureUrl);
            log.info("     Cloudinary bytes: {}", cloudinaryBytes);
            log.info("     Original bytes: {}", fileSizeBytes);
            log.info("     Bytes match: {}", cloudinaryBytes != null && cloudinaryBytes.equals(fileSizeBytes) ? "✅ YES" : "❌ NO");
            
            // ═══════════════════════════════════════════════════════════════
            // DIAGNOSTIC 4: Full response for debugging
            // ═══════════════════════════════════════════════════════════════
            log.info("📋 [6] FULL CLOUDINARY RESPONSE:");
            uploadResult.forEach((key, value) -> log.info("     {}: {}", key, value));

            log.info("✅ Upload successful: publicId={}", resultPublicId);
            log.info("📋 ━━━━━ UPLOAD DIAGNOSTICS END ━━━━━");

            return new UploadResult(
                    resultPublicId,
                    secureUrl,
                    resultResourceType,
                    originalFilename,
                    mimeType,
                    fileSizeBytes
            );

        } catch (IOException e) {
            log.error("❌ IO Error during upload: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Error during Cloudinary upload: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * Convert bytes to hex string for debugging
     */
    private String bytesToHex(byte[] bytes, int start, int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = start; i < start + length && i < bytes.length; i++) {
            sb.append(String.format("%02X ", bytes[i]));
        }
        return sb.toString();
    }

    /**
     * Validate file before upload
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            log.warn("⚠️ Upload attempted with empty file");
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > maxFileSize) {
            log.warn("⚠️ File too large: {} bytes (max: {} bytes)", file.getSize(), maxFileSize);
            throw new IllegalArgumentException(
                    String.format("File size (%d bytes) exceeds maximum allowed (%d bytes)",
                            file.getSize(), maxFileSize)
            );
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.isEmpty()) {
            throw new IllegalArgumentException("Filename is required");
        }

        String extension = getFileExtension(filename).toLowerCase();
        if (!isAllowedExtension(extension)) {
            log.warn("⚠️ File type not allowed: {}", extension);
            throw new IllegalArgumentException("File type '" + extension + "' is not allowed");
        }
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Check if extension is allowed
     */
    private boolean isAllowedExtension(String extension) {
        if (extension.isEmpty()) {
            return false;
        }

        for (String allowed : ALLOWED_IMAGE_EXTENSIONS) {
            if (allowed.equals(extension)) return true;
        }
        for (String allowed : ALLOWED_VIDEO_EXTENSIONS) {
            if (allowed.equals(extension)) return true;
        }
        for (String allowed : ALLOWED_RAW_EXTENSIONS) {
            if (allowed.equals(extension)) return true;
        }

        return false;
    }

    /**
     * Determine Cloudinary resource type based on file extension
     */
    private String determineResourceType(String extension, String mimeType) {
        extension = extension.toLowerCase();

        // Check images
        for (String ext : ALLOWED_IMAGE_EXTENSIONS) {
            if (ext.equals(extension)) {
                return "image";
            }
        }

        // Check videos
        for (String ext : ALLOWED_VIDEO_EXTENSIONS) {
            if (ext.equals(extension)) {
                return "video";
            }
        }

        // Default to raw (documents, etc.)
        return "raw";
    }

    /**
     * Generate unique public ID for file in Cloudinary
     * Format: folder/uuid-filename (without extension)
     */
    private String generatePublicId(String folder, String originalFilename) {
        String uuid = UUID.randomUUID().toString();
        String nameWithoutExtension = originalFilename.contains(".")
                ? originalFilename.substring(0, originalFilename.lastIndexOf("."))
                : originalFilename;

        // Sanitize filename
        nameWithoutExtension = nameWithoutExtension.replaceAll("[^a-zA-Z0-9._-]", "_");

        // ✅ CRITICAL FIX: Include folder path in public ID
        return folder + "/" + uuid + "-" + nameWithoutExtension;
    }
}
