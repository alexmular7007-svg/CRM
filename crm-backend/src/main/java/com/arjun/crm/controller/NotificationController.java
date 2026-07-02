package com.arjun.crm.controller;

import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.NotificationResponse;
import com.arjun.crm.dto.response.NotificationSummaryResponse;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.NotificationService;
import com.arjun.crm.service.impl.NotificationServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final WorkspaceAuthorizationService workspaceAuthService;

    /**
     * Get all notifications for current user in workspace
     * GET /api/notifications
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getNotifications(
            @RequestParam Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {

        try {
            log.info("=== NOTIFICATION ENDPOINT CALLED ===");
            log.info("WorkspaceId: {}", workspaceId);
            log.info("Page: {}, Size: {}, UnreadOnly: {}", page, size, unreadOnly);
            
            // Validate workspace access
            log.info("Validating workspace access...");
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
            log.info("Workspace access validated ✓");

            Pageable pageable = PageRequest.of(page, size);
            log.info("Pageable created: {}", pageable);
            
            // Cast to implementation to access workspace-filtered method
            Page<NotificationResponse> notifications;
            if (unreadOnly) {
                log.info("Fetching unread notifications...");
                notifications = notificationService.getUnreadNotifications(pageable);
            } else {
                log.info("Fetching workspace notifications from service...");
                notifications = ((NotificationServiceImpl) notificationService).getNotificationsByWorkspace(workspaceId, pageable);
            }
            
            log.info("Notifications fetched successfully");
            log.info("Total elements: {}", notifications.getTotalElements());
            log.info("Total pages: {}", notifications.getTotalPages());
            log.info("Current page size: {}", notifications.getContent().size());
            
            if (!notifications.getContent().isEmpty()) {
                log.info("First notification ID: {}", notifications.getContent().get(0).getId());
            }

            return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", notifications));
        } catch (Exception ex) {
            log.error("=== NOTIFICATION ENDPOINT ERROR ===", ex);
            log.error("Exception Type: {}", ex.getClass().getSimpleName());
            log.error("Exception Message: {}", ex.getMessage());
            log.error("Stack Trace:", ex);
            throw ex;
        }
    }

    /**
     * Get notification summary (unread count) for workspace
     * GET /api/notifications/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<NotificationSummaryResponse>> getNotificationSummary(
            @RequestParam Long workspaceId) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        NotificationSummaryResponse summary = notificationService.getNotificationSummary();
        return ResponseEntity.ok(ApiResponse.success("Notification summary retrieved successfully", summary));
    }

    /**
     * Mark notification as read
     * POST /api/notifications/{id}/read
     */
    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        NotificationResponse notification = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", notification));
    }

    /**
     * Mark all notifications as read for workspace
     * PUT /api/notifications/read-all
     */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead(
            @RequestParam Long workspaceId) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        int updatedCount = notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.success(
                updatedCount + " notifications marked as read",
                updatedCount
        ));
    }

    /**
     * Delete notification
     * DELETE /api/notifications/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted successfully", null));
    }
}
