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
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.MessageDigest;
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
            
            // ✅ DEFENSIVE CHECK: Ensure filename has extension
            if (originalFilename == null || originalFilename.isEmpty()) {
                throw new IllegalArgumentException("Filename is empty");
            }
            if (!originalFilename.contains(".")) {
                log.warn("⚠️ WARNING: Filename has no extension - adding default: {}", originalFilename);
                originalFilename = originalFilename + ".bin";
            }
            
            String fileExtension = getFileExtension(originalFilename);
            String mimeType = file.getContentType();
            byte[] fileBytes = file.getBytes();
            long fileSizeBytes = file.getSize();

            // ═══════════════════════════════════════════════════════════════
            // BINARY INTEGRITY VERIFICATION - STEP 1: UPLOAD INPUT
            // ═══════════════════════════════════════════════════════════════
            log.info("═════════════════════════════════════════════════════════════");
            log.info("🔐 BINARY INTEGRITY VERIFICATION - START");
            log.info("═════════════════════════════════════════════════════════════");
            
            log.info("📋 [UPLOAD INPUT] MultipartFile Details:");
            log.info("     file.getOriginalFilename()    = {}", originalFilename);
            log.info("     file.getContentType()         = {}", mimeType);
            log.info("     file.getSize()                = {} bytes", fileSizeBytes);
            log.info("     fileBytes.length              = {} bytes", fileBytes.length);
            log.info("     Size Match                    = {}", fileSizeBytes == fileBytes.length ? "✅ YES" : "❌ NO");
            
            // ═══════════════════════════════════════════════════════════════
            // COMPUTE SHA-256 HASH BEFORE UPLOAD
            // ═══════════════════════════════════════════════════════════════
            String sha256Before = computeSHA256(fileBytes);
            log.info("📋 [HASH BEFORE]  SHA-256 = {}", sha256Before);
            log.info("     First 20 bytes (hex) = {}", bytesToHex(fileBytes, 0, Math.min(20, fileBytes.length)));
            log.info("     Last 20 bytes (hex)  = {}", bytesToHex(fileBytes, Math.max(0, fileBytes.length - 20), Math.min(20, fileBytes.length)));
            
            // ═══════════════════════════════════════════════════════════════
            // PDF SIGNATURE VERIFICATION
            // ═══════════════════════════════════════════════════════════════
            if ("pdf".equalsIgnoreCase(fileExtension)) {
                String pdfSignature = new String(fileBytes, 0, Math.min(8, fileBytes.length));
                log.info("📋 [PDF VERIFICATION]:");
                log.info("     First 8 bytes: {} (hex)", bytesToHex(fileBytes, 0, Math.min(8, fileBytes.length)));
                log.info("     Starts with %PDF: {}", pdfSignature.startsWith("%PDF") ? "✅ YES" : "❌ NO");
                
                int lastBytes = Math.min(10, fileBytes.length);
                String endBytes = new String(fileBytes, fileBytes.length - lastBytes, lastBytes);
                log.info("     Last 10 bytes: {} (hex)", bytesToHex(fileBytes, fileBytes.length - lastBytes, lastBytes));
                log.info("     Ends with %%EOF: {}", endBytes.contains("%%EOF") ? "✅ YES" : "⚠️ NO");
            }

            // Determine resource type and validate
            String resourceType = determineResourceType(fileExtension, mimeType);
            
            // Generate unique public ID (includes folder path)
            String publicId = generatePublicId(folder, originalFilename);

            log.info("📋 [CLOUDINARY CONFIG]:");
            log.info("     Extension: {}", fileExtension);
            log.info("     MIME Type: {}", mimeType);
            log.info("     Resource Type: {}", resourceType);
            log.info("     Folder: {}", folder);
            log.info("     Public ID: {}", publicId);

            // ═══════════════════════════════════════════════════════════════
            // UPLOAD TO CLOUDINARY
            // ═══════════════════════════════════════════════════════════════
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "public_id", publicId,
                    "resource_type", resourceType,
                    "overwrite", false
            );

            log.info("📋 [UPLOADING TO CLOUDINARY]:");
            log.info("     Sending {} bytes to Cloudinary", fileBytes.length);
            
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getInputStream(), uploadParams);

            // ═══════════════════════════════════════════════════════════════
            // CLOUDINARY RESPONSE ANALYSIS
            // ═══════════════════════════════════════════════════════════════
            String resultPublicId = (String) uploadResult.get("public_id");
            String resultVersion = uploadResult.get("version") != null 
                    ? uploadResult.get("version").toString() 
                    : null;
            String secureUrl = (String) uploadResult.get("secure_url");
            String resultResourceType = (String) uploadResult.get("resource_type");
            String format = (String) uploadResult.get("format");
            
            Number bytesNumber = (Number) uploadResult.get("bytes");
            Long cloudinaryBytes = bytesNumber != null ? bytesNumber.longValue() : 0L;

            log.info("📋 [CLOUDINARY RESPONSE]:");
            log.info("     Bytes: {}", cloudinaryBytes);
            log.info("     Format: {}", format);
            log.info("     Resource Type: {}", resultResourceType);
            log.info("     Secure URL: {}", secureUrl);
            log.info("     Original Filename: {}", originalFilename);
            
            // Critical size comparison
            log.info("📊 [SIZE VERIFICATION]:");
            log.info("     Original MultipartFile: {} bytes", fileSizeBytes);
            log.info("     Cloudinary bytes: {} bytes", cloudinaryBytes);
            log.info("     Match: {}", cloudinaryBytes != null && cloudinaryBytes.equals(fileSizeBytes) ? "✅ YES - IDENTICAL" : "❌ NO - SIZE MISMATCH");
            
            log.info("📋 [UPLOAD METADATA]:");
            log.info("     Public ID: {}", resultPublicId);
            log.info("     Version: {}", resultVersion);

            // ═══════════════════════════════════════════════════════════════
            // CRITICAL: Log exact secure URL for manual testing
            // ═══════════════════════════════════════════════════════════════
            log.info("🔗 [SECURE URL FOR MANUAL TESTING]:");
            log.info("     {}", secureUrl);
            
            // ═══════════════════════════════════════════════════════════════
            // DEFINITIVE TEST: Download from Cloudinary and verify SHA-256
            // ═══════════════════════════════════════════════════════════════
            log.info("═════════════════════════════════════════════════════════════");
            log.info("🔐 DEFINITIVE SHA-256 VERIFICATION TEST - DOWNLOADING FROM CLOUDINARY");
            log.info("═════════════════════════════════════════════════════════════");
            
            try {
                log.info("📥 Downloading file from Cloudinary: {}", secureUrl);
                
                // Download bytes from Cloudinary using try-with-resources for proper stream closure
                try (InputStream in = new URL(secureUrl).openStream()) {
                    byte[] downloadedBytes = in.readAllBytes();
                    
                    log.info("📋 [DOWNLOADED FROM CLOUDINARY]:");
                    log.info("     Downloaded bytes: {} bytes", downloadedBytes.length);
                    log.info("     First 20 bytes (hex) = {}", bytesToHex(downloadedBytes, 0, Math.min(20, downloadedBytes.length)));
                    log.info("     Last 20 bytes (hex)  = {}", bytesToHex(downloadedBytes, Math.max(0, downloadedBytes.length - 20), Math.min(20, downloadedBytes.length)));
                    
                    // Compute SHA-256 of downloaded bytes
                    String sha256Downloaded = computeSHA256(downloadedBytes);
                    log.info("📋 [HASH AFTER DOWNLOAD] SHA-256 = {}", sha256Downloaded);
                    
                    // ═══════════════════════════════════════════════════════════════
                    // CRITICAL: Compare hashes
                    // ═══════════════════════════════════════════════════════════════
                    log.info("📊 [HASH COMPARISON]:");
                    log.info("     Original SHA-256   : {}", sha256Before);
                    log.info("     Downloaded SHA-256 : {}", sha256Downloaded);
                    log.info("     Hashes match       : {}", sha256Before.equals(sha256Downloaded) ? "✅ YES - IDENTICAL" : "❌ NO - MISMATCH");
                    
                    if (sha256Before.equals(sha256Downloaded)) {
                        log.info("✅ Hash verification PASSED - Cloudinary stored exact same file");
                        
                        // ═══════════════════════════════════════════════════════════════
                        // SAVE TO DISK FOR MANUAL TESTING
                        // ═══════════════════════════════════════════════════════════════
                        try {
                            String filename = "cloudinary-test." + fileExtension;
                            Files.write(Paths.get(filename), downloadedBytes);
                            log.info("💾 [FILE SAVED TO DISK]:");
                            log.info("     Filename: {}", filename);
                            log.info("     Path: {}", Paths.get(filename).toAbsolutePath());
                            log.info("     Size: {} bytes", downloadedBytes.length);
                            log.info("     ➡️  Open this file manually to verify it displays correctly");
                        } catch (IOException e) {
                            log.error("❌ Failed to save file to disk: {}", e.getMessage(), e);
                        }
                    } else {
                        log.error("❌ Hash verification FAILED - Cloudinary returned different bytes!");
                        log.error("     This indicates corruption during upload or delivery");
                    }
                }
                
            } catch (Exception e) {
                log.error("❌ Failed to download file from Cloudinary for verification: {}", e.getMessage(), e);
            }
            
            log.info("═════════════════════════════════════════════════════════════");
            log.info("🔐 DEFINITIVE TEST COMPLETE");
            log.info("═════════════════════════════════════════════════════════════");
            
            // ═══════════════════════════════════════════════════════════════
            // PDF SIGNATURE CHECK - First 8 bytes should be %PDF
            // ═══════════════════════════════════════════════════════════════
            if ("pdf".equalsIgnoreCase(fileExtension)) {
                String firstBytes = bytesToHex(fileBytes, 0, Math.min(8, fileBytes.length));
                log.info("📋 [FIRST 8 BYTES AFTER UPLOAD]:");
                log.info("     Hex: {}", firstBytes);
                log.info("     Should be: 25 50 44 46 (which is %PDF)");
                log.info("     Match: {}", firstBytes.contains("25 50 44 46") ? "✅ YES" : "❌ NO");
            }

            log.info("═════════════════════════════════════════════════════════════");
            log.info("🔐 BINARY INTEGRITY VERIFICATION - UPLOADED");
            log.info("═════════════════════════════════════════════════════════════");

            return new UploadResult(
                    resultPublicId,
                    resultVersion,
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
     * Compute SHA-256 hash of bytes for integrity verification
     */
    private String computeSHA256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("❌ Error computing SHA-256: {}", e.getMessage());
            return "ERROR";
        }
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
     * Format: folder/uuid-filename WITH extension
     * 
     * CRITICAL: File extension MUST be included in public_id
     * Reason: Cloudinary needs the extension to determine file format on download
     * Without extension, downloads lose file type and become unreadable
     */
    private String generatePublicId(String folder, String originalFilename) {
        String uuid = UUID.randomUUID().toString();
        
        // Sanitize entire filename (including extension)
        String sanitizedFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        
        // Format: "chat/8/uuid-Resume.pdf" (WITH extension preserved)
        return folder + "/" + uuid + "-" + sanitizedFilename;
    }
}
