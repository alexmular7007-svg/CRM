package com.arjun.crm.dto.response;

import com.arjun.crm.entity.ChatMessage;
import com.arjun.crm.enums.MessageType;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {

    private Long id;
    private Long chatRoomId;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private String content;
    private MessageType messageType;
    private Boolean isEdited;
    private Boolean isDeleted;

    // File attachment fields (null for TEXT messages)
    private String attachmentUrl;        // Full signed URL (for direct image display)
    private String attachmentName;
    private String attachmentType;
    private Long attachmentSize;

    /**
     * UTC Instant — Jackson serializes as "2026-06-04T13:00:00Z".
     */
    private Instant createdAt;
    private Instant updatedAt;

    public static ChatMessageResponse fromEntity(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .chatRoomId(message.getChatRoom().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .senderEmail(message.getSender().getEmail())
                .content(message.getIsDeleted() ? "[Message deleted]" : message.getContent())
                .messageType(message.getMessageType())
                .isEdited(message.getIsEdited())
                .isDeleted(message.getIsDeleted())
                .attachmentUrl(message.getAttachmentUrl())  // Storage path only - will be replaced with signed URL
                .attachmentName(message.getAttachmentName())
                .attachmentType(message.getAttachmentType())
                .attachmentSize(message.getAttachmentSize())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .build();
    }
}
