package com.arjun.crm.service;

import com.arjun.crm.dto.response.NotificationResponse;
import com.arjun.crm.dto.response.NotificationSummaryResponse;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.enums.NotificationType;
import com.arjun.crm.enums.ReferenceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * ENTERPRISE NOTIFICATION CENTER
 * Service for managing notifications across the application.
 * Supports persistence, real-time delivery, and batch operations.
 */
public interface NotificationService {
    
    /**
     * Create a notification
     * 
     * @param recipient User receiving the notification
     * @param title Notification title
     * @param message Notification message
     * @param type Type of notification
     * @param referenceId ID of the referenced entity (task, message, etc.)
     * @param referenceType Type of referenced entity
     * @param workspace Workspace where the notification originates (required - cannot be null)
     */
    NotificationResponse createNotification(
            User recipient,
            String title,
            String message,
            NotificationType type,
            Long referenceId,
            ReferenceType referenceType,
            Workspace workspace
    );
    
    /**
     * Get notifications for current user
     */
    Page<NotificationResponse> getNotifications(Pageable pageable);
    
    /**
     * Get unread notifications for current user
     */
    Page<NotificationResponse> getUnreadNotifications(Pageable pageable);
    
    /**
     * Get notifications filtered by type
     */
    Page<NotificationResponse> getNotificationsByType(NotificationType type, Pageable pageable);
    
    /**
     * Get notification summary (unread count, total count)
     */
    NotificationSummaryResponse getNotificationSummary();
    
    /**
     * Mark notification as read
     */
    NotificationResponse markAsRead(Long notificationId);
    
    /**
     * Mark all notifications as read for current user
     */
    int markAllAsRead();
    
    /**
     * Delete notification
     */
    void deleteNotification(Long notificationId);
    
    /**
     * Cleanup old read notifications (scheduled job)
     * Deletes notifications read more than daysOld days ago
     */
    int cleanupOldNotifications(int daysOld);
    
    /**
     * Send bulk notifications to multiple users
     * Useful for announcements and system notifications
     */
    void sendBulkNotification(List<User> recipients, Workspace workspace, 
                             NotificationBuilder builder);
}
