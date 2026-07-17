package com.arjun.crm.repository;

import com.arjun.crm.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    /**
     * Find attachment by storage path
     */
    Optional<Attachment> findByStoragePath(String storagePath);

    /**
     * Find all attachments for a chat message
     */
    List<Attachment> findByChatMessageId(Long chatMessageId);

    /**
     * Find all attachments for a task
     */
    List<Attachment> findByTaskId(Long taskId);

    /**
     * Find all attachments uploaded by a user
     */
    List<Attachment> findByUploadedById(Long userId);

    /**
     * Check if user is owner of attachment
     */
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
            "FROM Attachment a " +
            "WHERE a.id = :attachmentId AND a.uploadedBy.id = :userId")
    boolean isAttachmentOwnedByUser(@Param("attachmentId") Long attachmentId, @Param("userId") Long userId);

    /**
     * Find attachments that need cleanup (marked as deleted, older than retention period)
     */
    @Query("SELECT a FROM Attachment a WHERE a.isDeleted = true AND a.updatedAt < :cutoffDate")
    List<Attachment> findDeletedAttachmentsOlderThan(@Param("cutoffDate") Instant cutoffDate);

    /**
     * Get download statistics
     */
    @Query("SELECT COUNT(a) FROM Attachment a WHERE a.lastDownloadedAt >= :since")
    long countDownloadsAfter(@Param("since") Instant since);
}
