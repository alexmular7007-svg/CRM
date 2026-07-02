package com.arjun.crm.dto.response;

import com.arjun.crm.entity.Notification;
import com.arjun.crm.entity.User;
import com.arjun.crm.enums.NotificationType;
import com.arjun.crm.enums.ReferenceType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationResponse {
    
    private Long id;
    private Long recipientId;
    private String recipientName;
    private String recipientEmail;
    private String title;
    private String message;
    private NotificationType type;
    private Boolean isRead;
    private Long referenceId;
    private ReferenceType referenceType;
    
    /**
     * Deep link URL for navigating to related entity
     */
    private String actionUrl;
    
    private LocalDateTime createdAt;
    private LocalDateTime readAt;

    public static NotificationResponse fromEntity(Notification notification) {
        try {
            if (notification == null) {
                throw new IllegalArgumentException("Notification entity is NULL");
            }
            
            User recipient = notification.getRecipient();
            if (recipient == null) {
                throw new IllegalArgumentException("Notification.recipient is NULL for notification ID: " + notification.getId());
            }
            
            return NotificationResponse.builder()
                    .id(notification.getId())
                    .recipientId(recipient.getId())
                    .recipientName(recipient.getFullName())
                    .recipientEmail(recipient.getEmail())
                    .title(notification.getTitle())
                    .message(notification.getMessage())
                    .type(notification.getType())
                    .isRead(notification.getIsRead())
                    .referenceId(notification.getReferenceId())
                    .referenceType(notification.getReferenceType())
                    .actionUrl(notification.getActionUrl())
                    .createdAt(notification.getCreatedAt())
                    .readAt(notification.getReadAt())
                    .build();
        } catch (Exception ex) {
            throw new RuntimeException("Error mapping Notification to NotificationResponse: " + ex.getMessage(), ex);
        }
    }
}
