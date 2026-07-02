package com.arjun.crm.repository;

import com.arjun.crm.entity.Notification;
import com.arjun.crm.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Find notifications by recipient ID and workspace with eager recipient loading
     */
    @Query("SELECT n FROM Notification n JOIN FETCH n.recipient WHERE n.recipient.id = :recipientId AND n.workspace.id = :workspaceId ORDER BY n.createdAt DESC")
    Page<Notification> findByRecipientIdAndWorkspaceIdOrderByCreatedAtDesc(
            @Param("recipientId") Long recipientId, 
            @Param("workspaceId") Long workspaceId, 
            Pageable pageable);
    
    /**
     * Find notifications by recipient ID with pagination
     */
    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);
    
    /**
     * Find unread notifications by recipient ID with eager recipient loading
     */
    @Query("SELECT n FROM Notification n JOIN FETCH n.recipient WHERE n.recipient.id = :recipientId AND n.isRead = false ORDER BY n.createdAt DESC")
    Page<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(@Param("recipientId") Long recipientId, Pageable pageable);
    
    /**
     * Find notifications by type for current user with eager recipient loading
     */
    @Query("SELECT n FROM Notification n JOIN FETCH n.recipient WHERE n.recipient.id = :recipientId AND n.type = :type ORDER BY n.createdAt DESC")
    Page<Notification> findByRecipientIdAndTypeOrderByCreatedAtDesc(@Param("recipientId") Long recipientId, @Param("type") NotificationType type, Pageable pageable);
    
    /**
     * Count unread notifications for a user
     */
    Long countByRecipientIdAndIsReadFalse(Long recipientId);
    
    /**
     * Count total notifications for a user
     */
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :recipientId")
    Long countByRecipientIdOrderByCreatedAtDesc(@Param("recipientId") Long recipientId);
    
    /**
     * Mark all notifications as read for a user
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.recipient.id = :recipientId AND n.isRead = false")
    int markAllAsReadByRecipientId(@Param("recipientId") Long recipientId);
    
    /**
     * Delete old read notifications (cleanup)
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.isRead = true AND n.createdAt < :cutoffDate")
    int deleteOldReadNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * Delete all notifications for a workspace
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
