package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Attachment Entity - Stores metadata for uploaded files
 * 
 * PHASE 3: Stores attachment metadata in PostgreSQL
 * - original filename
 * - stored filename (UUID)
 * - MIME type
 * - file size
 * - storage path (Supabase)
 * - uploader
 * - uploaded date
 * 
 * Files are stored in Supabase Storage, only metadata is in DB
 */
@Entity
@Table(name = "attachments", indexes = {
        @Index(name = "idx_storage_path", columnList = "storage_path", unique = true),
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
     * Supabase Storage path (e.g., "chat/550e8400-e29b-41d4-a716-446655440000.pdf")
     */
    @Column(name = "storage_path", nullable = false, unique = true, length = 1000)
    private String storagePath;

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

    /**
     * Indicates if file still exists in Supabase Storage
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
