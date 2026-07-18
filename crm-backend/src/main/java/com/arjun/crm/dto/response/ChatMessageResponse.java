package com.arjun.crm.dto.response;

import com.arjun.crm.entity.ChatMessage;
import com.arjun.crm.entity.Attachment;
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

    // Attachment data (from Attachment entity)
    private Long attachmentId;        // The actual attachment entity ID
    private String attachmentUrl;     // Will be populated with signed URL by frontend
    private String attachmentName;
    private String attachmentType;
    private Long attachmentSize;

    /**
     * UTC Instant — Jackson serializes as "2026-06-04T13:00:00Z".
     */
    private Instant createdAt;
    private Instant updatedAt;

    public static ChatMessageResponse fromEntity(ChatMessage message) {
        // Build response with attachment data if present
        ChatMessageResponseBuilder builder = ChatMessageResponse.builder()
                .id(message.getId())
                .chatRoomId(message.getChatRoom().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .senderEmail(message.getSender().getEmail())
                .content(message.getIsDeleted() ? "[Message deleted]" : message.getContent())
                .messageType(message.getMessageType())
                .isEdited(message.getIsEdited())
                .isDeleted(message.getIsDeleted())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt());

        // If has attachment, populate from Attachment entity
        if (message.getAttachment() != null) {
            Attachment att = message.getAttachment();
            builder.attachmentId(att.getId())
                    .attachmentName(att.getOriginalFilename())
                    .attachmentType(att.getMimeType())
                    .attachmentSize(att.getFileSize());
            // attachmentUrl will be populated by frontend via /api/attachments/{id}/url
        }
        // Fallback to legacy fields if no attachment entity
        else if (message.getAttachmentUrl() != null) {
            builder.attachmentUrl(message.getAttachmentUrl())
                    .attachmentName(message.getAttachmentName())
                    .attachmentType(message.getAttachmentType())
                    .attachmentSize(message.getAttachmentSize());
        }

        return builder.build();
    }
}
