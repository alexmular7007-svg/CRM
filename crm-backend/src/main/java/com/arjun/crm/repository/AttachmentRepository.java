package com.arjun.crm.repository;

import com.arjun.crm.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

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
     * Get download statistics
     */
    @Query("SELECT COUNT(a) FROM Attachment a WHERE a.lastDownloadedAt >= :since")
    long countDownloadsAfter(@Param("since") Instant since);

    /**
     * Delete all attachments in a workspace (both chat and task)
     * 
     * FIXED: Changed from complex OR condition to simple direct workspace ID comparison
     * This prevents JPQL DELETE translation issues with nested relationships.
     * 
     * Simple approach: Attachment has workspace_id FK directly
     * No complex JOINs or OR conditions needed
     * 
     * clearAutomatically=true ensures persistence context is cleared after delete,
     * preventing stale entity references from interfering with subsequent deletes.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Attachment a WHERE a.workspace.id = :workspaceId")
    int deleteAllByWorkspaceId(@Param("workspaceId") Long workspaceId);

    /**
     * Delete all chat attachments in a workspace
     * Must be called BEFORE deleting ChatMessages to respect FK constraints
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Attachment a WHERE a.chatMessage IS NOT NULL AND a.chatMessage.chatRoom.workspace.id = :workspaceId")
    int deleteByWorkspaceIdAndChatMessage(@Param("workspaceId") Long workspaceId);

    /**
     * Delete all task attachments in a workspace
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Attachment a WHERE a.task IS NOT NULL AND a.task.workspace.id = :workspaceId")
    int deleteByWorkspaceIdAndTask(@Param("workspaceId") Long workspaceId);
}
