package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Attachment Entity - Stores metadata for uploaded files
 * 
 * PHASE 4: Stores attachment metadata in PostgreSQL
 * - original filename
 * - MIME type
 * - file size
 * - Cloudinary public ID (immutable, unique)
 * - Cloudinary secure URL (delivery URL)
 * - Cloudinary resource type (image, video, raw)
 * - uploader
 * - uploaded date
 * 
 * Files are stored in Cloudinary, only metadata is in PostgreSQL
 * All URLs are served directly from Cloudinary CDN
 */
@Entity
@Table(name = "attachments", indexes = {
        @Index(name = "idx_cloudinary_public_id", columnList = "cloudinary_public_id", unique = true),
        @Index(name = "idx_uploaded_by", columnList = "uploaded_by"),
        @Index(name = "idx_chat_message_id", columnList = "chat_message_id"),
        @Index(name = "idx_task_id", columnList = "task_id"),
        @Index(name = "idx_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Storage path (legacy field for database compatibility)
     * DEPRECATED: kept for backward compatibility with old schema
     * New uploads use cloudinaryPublicId instead
     */
    @Column(name = "storage_path", length = 500)
    private String storagePath;

    /**
     * Cloudinary Public ID (unique, immutable)
     * E.g., "chat/550e8400-e29b-41d4-a716-446655440000-Resume.pdf"
     * Used for Cloudinary API operations and URL generation via SDK
     */
    @Column(name = "cloudinary_public_id", length = 500, unique = true)
    private String cloudinaryPublicId;

    /**
     * Cloudinary Version ID
     * E.g., "1721234567"
     * Returned by Cloudinary API after upload
     * Used for URL generation via SDK
     */
    @Column(name = "cloudinary_version", length = 50)
    private String cloudinaryVersion;

    /**
     * Cloudinary Secure URL (HTTPS delivery URL)
     * E.g., "https://res.cloudinary.com/lb7tu53k/image/upload/v1234567890/chat/550e8400..."
     * Stored for reference but URLs generated via SDK for downloads
     */
    @Column(name = "secure_url", nullable = false, length = 1000)
    private String secureUrl;

    /**
     * Cloudinary Resource Type (image, video, raw)
     * Determines URL structure and how Cloudinary serves the file
     */
    @Column(name = "resource_type", nullable = false, length = 50)
    private String resourceType;

    /**
     * Original filename as uploaded by user (e.g., "document.pdf")
     */
    @Column(name = "original_filename", nullable = false, length = 500)
    private String originalFilename;

    /**
     * MIME type (e.g., "application/pdf", "image/png", "video/mp4")
     */
    @Column(name = "mime_type", nullable = false, length = 200)
    private String mimeType;

    /**
     * File size in bytes
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * SHA-256 hash for integrity verification
     */
    @Column(name = "content_hash", length = 64)
    private String contentHash;

    /**
     * User who uploaded this attachment
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    /**
     * Chat message this attachment belongs to (if any)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_message_id")
    private ChatMessage chatMessage;

    /**
     * Task this attachment belongs to (if any)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    /**
     * Whether this attachment is public (visible to all) or private
     */
    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = false;

    /**
     * Whether this attachment is soft-deleted
     * KEPT for backward compatibility with existing database schema
     * New uploads will have this as false (hard delete only)
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * Download count for analytics
     */
    @Column(name = "download_count")
    @Builder.Default
    private Integer downloadCount = 0;

    /**
     * Last download timestamp
     */
    @Column(name = "last_downloaded_at")
    private Instant lastDownloadedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
