package com.arjun.crm.service.impl;

import com.arjun.crm.dto.response.NotificationResponse;
import com.arjun.crm.dto.response.NotificationSummaryResponse;
import com.arjun.crm.entity.Notification;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.enums.NotificationType;
import com.arjun.crm.enums.ReferenceType;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.NotificationRepository;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.service.NotificationBuilder;
import com.arjun.crm.service.NotificationService;
import com.arjun.crm.service.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WebSocketNotificationService webSocketNotificationService;

    @Override
    @Transactional
    public NotificationResponse createNotification(
            User recipient,
            String title,
            String message,
            NotificationType type,
            Long referenceId,
            ReferenceType referenceType,
            Workspace workspace) {
        
        log.info("Creating notification for user: {} of type: {} in workspace: {}", 
                 recipient.getEmail(), type, workspace.getId());

        if (workspace == null) {
            log.error("CRITICAL: workspace is NULL when creating notification");
            throw new IllegalArgumentException("Workspace is required for notification");
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .workspace(workspace)
                .isRead(false)
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        NotificationResponse response = NotificationResponse.fromEntity(savedNotification);

        // Send real-time notification via WebSocket
        webSocketNotificationService.sendNotificationToUser(recipient.getId(), response);

        log.info("Notification created with ID: {} in workspace: {}", savedNotification.getId(), workspace.getId());
        return response;
    }

    /**
     * Get all notifications for current user in a specific workspace
     */
    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(Pageable pageable) {
        User currentUser = getAuthenticatedUser();
        log.info("Fetching notifications for user: {}", currentUser.getEmail());

        Page<Notification> notifications = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(currentUser.getId(), pageable);

        return notifications.map(NotificationResponse::fromEntity);
    }

    /**
     * Get all notifications for current user filtered by workspace
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotificationsByWorkspace(Long workspaceId, Pageable pageable) {
        try {
            log.info("=== getNotificationsByWorkspace CALLED ===");
            log.info("WorkspaceId: {}", workspaceId);
            log.info("Pageable: {}", pageable);
            
            User currentUser = getAuthenticatedUser();
            log.info("Current user: ID={}, Email={}", currentUser.getId(), currentUser.getEmail());

            log.info("Executing repository query...");
            Page<Notification> notifications = notificationRepository
                    .findByRecipientIdAndWorkspaceIdOrderByCreatedAtDesc(currentUser.getId(), workspaceId, pageable);
            
            log.info("Query executed successfully");
            log.info("Notifications returned: {} total elements", notifications.getTotalElements());
            
            if (notifications.getTotalElements() > 0) {
                log.info("Mapping {} notifications to DTO...", notifications.getContent().size());
                for (int i = 0; i < notifications.getContent().size(); i++) {
                    Notification n = notifications.getContent().get(i);
                    log.info("  Notification[{}]: ID={}, Type={}, Recipient={}", 
                        i, n.getId(), n.getType(), n.getRecipient().getId());
                }
            }

            Page<NotificationResponse> response = notifications.map(notification -> {
                try {
                    log.debug("Mapping notification ID: {}", notification.getId());
                    NotificationResponse resp = NotificationResponse.fromEntity(notification);
                    log.debug("Successfully mapped notification ID: {}", notification.getId());
                    return resp;
                } catch (Exception mapEx) {
                    log.error("ERROR MAPPING NOTIFICATION ID: {}", notification.getId(), mapEx);
                    throw mapEx;
                }
            });
            
            log.info("DTO mapping complete");
            return response;
        } catch (Exception ex) {
            log.error("=== getNotificationsByWorkspace ERROR ===", ex);
            log.error("Exception: {} - {}", ex.getClass().getSimpleName(), ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUnreadNotifications(Pageable pageable) {
        User currentUser = getAuthenticatedUser();
        log.info("Fetching unread notifications for user: {}", currentUser.getEmail());

        Page<Notification> notifications = notificationRepository
                .findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(currentUser.getId(), pageable);

        return notifications.map(NotificationResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationSummaryResponse getNotificationSummary() {
        User currentUser = getAuthenticatedUser();
        
        Long unreadCount = notificationRepository.countByRecipientIdAndIsReadFalse(currentUser.getId());
        Long totalCount = notificationRepository.countByRecipientIdOrderByCreatedAtDesc(currentUser.getId());

        return NotificationSummaryResponse.builder()
                .unreadCount(unreadCount)
                .totalCount(totalCount)
                .build();
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        User currentUser = getAuthenticatedUser();
        log.info("Marking notification {} as read by user: {}", notificationId, currentUser.getEmail());

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + notificationId));

        // Verify notification belongs to current user
        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only mark your own notifications as read");
        }

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Override
    @Transactional
    public int markAllAsRead() {
        User currentUser = getAuthenticatedUser();
        log.info("Marking all notifications as read for user: {}", currentUser.getEmail());

        int updatedCount = notificationRepository.markAllAsReadByRecipientId(currentUser.getId());
        log.info("Marked {} notifications as read", updatedCount);

        return updatedCount;
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId) {
        User currentUser = getAuthenticatedUser();
        log.info("Deleting notification {} by user: {}", notificationId, currentUser.getEmail());

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + notificationId));

        // Verify notification belongs to current user
        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only delete your own notifications");
        }

        notificationRepository.delete(notification);
        log.info("Notification deleted: {}", notificationId);
    }

    @Override
    @Transactional
    public int cleanupOldNotifications(int daysOld) {
        log.info("Cleaning up notifications older than {} days", daysOld);
        
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        int deletedCount = notificationRepository.deleteOldReadNotifications(cutoffDate);
        
        log.info("Deleted {} old notifications", deletedCount);
        return deletedCount;
    }

    @Override
    @Transactional
    public void sendBulkNotification(List<User> recipients, Workspace workspace, 
                                    NotificationBuilder builder) {
        log.info("Sending bulk notification to {} recipients in workspace: {}", 
                 recipients.size(), workspace.getId());
        
        for (User recipient : recipients) {
            try {
                createNotification(
                        recipient,
                        builder.getTitle(),
                        builder.getMessage(),
                        builder.getType(),
                        builder.getReferenceId(),
                        builder.getReferenceType(),
                        workspace
                );
            } catch (Exception e) {
                log.error("Failed to send notification to user: {}", recipient.getId(), e);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotificationsByType(NotificationType type, Pageable pageable) {
        User currentUser = getAuthenticatedUser();
        log.info("Fetching notifications of type: {} for user: {}", type, currentUser.getEmail());

        Page<Notification> notifications = notificationRepository
                .findByRecipientIdAndTypeOrderByCreatedAtDesc(currentUser.getId(), type, pageable);

        return notifications.map(NotificationResponse::fromEntity);
    }

    /**
     * Get authenticated user from security context
     */
    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
