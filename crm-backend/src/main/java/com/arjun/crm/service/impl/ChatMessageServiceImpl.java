package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.ChatMessageRequest;
import com.arjun.crm.dto.request.ChatMessageUpdateRequest;
import com.arjun.crm.dto.response.ChatMessageResponse;
import com.arjun.crm.entity.ChatMessage;
import com.arjun.crm.entity.ChatRoom;
import com.arjun.crm.entity.User;
import com.arjun.crm.enums.MessageType;
import com.arjun.crm.enums.NotificationType;
import com.arjun.crm.enums.ReferenceType;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.ChatMessageRepository;
import com.arjun.crm.repository.ChatParticipantRepository;
import com.arjun.crm.repository.ChatRoomRepository;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.repository.BlockedUserRepository;
import com.arjun.crm.service.ChatMessageService;
import com.arjun.crm.service.NotificationService;
import com.arjun.crm.service.CacheEvictionService;
import com.arjun.crm.service.AttachmentService;
import com.arjun.crm.service.SupabaseStorageService;
import com.arjun.crm.entity.Attachment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatMessageServiceImpl implements ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final BlockedUserRepository blockedUserRepository;
    private final CacheEvictionService cacheEvictionService;
    private final AttachmentService attachmentService;
    private final SupabaseStorageService storageService;

    @Value("${file.upload.dir:uploads/task-attachments}")
    private String uploadDir;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            // Images
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            // Video
            "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
            // Audio
            "audio/mpeg", "audio/wav", "audio/ogg"
    );

    @Override
    @Transactional
    @CacheEvict(value = "dashboard", allEntries = true)
    public ChatMessageResponse sendMessage(ChatMessageRequest request) {
        User currentUser = getAuthenticatedUser();
        log.info("Sending message to room {} by user {}", request.getChatRoomId(), currentUser.getEmail());

        ChatRoom chatRoom = chatRoomRepository.findById(request.getChatRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));

        if (!chatRoomRepository.isUserParticipant(request.getChatRoomId(), currentUser.getId())) {
            throw new AccessDeniedException("You are not a participant of this chat room");
        }

        // Block check: for PRIVATE rooms, if the other participant has blocked the sender → reject
        if (chatRoom.getType() != null && "PRIVATE".equals(chatRoom.getType().name())) {
            chatRoom.getParticipants().stream()
                    .map(p -> p.getUser().getId())
                    .filter(uid -> !uid.equals(currentUser.getId()))
                    .findFirst()
                    .ifPresent(otherUserId -> {
                        if (blockedUserRepository.existsByBlockerIdAndBlockedId(otherUserId, currentUser.getId())) {
                            throw new AccessDeniedException("You have been blocked by this user");
                        }
                    });
        }

        ChatMessage message = ChatMessage.builder()
                .chatRoom(chatRoom)
                .sender(currentUser)
                .content(request.getContent())
                .messageType(request.getMessageType())
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);
        ChatMessageResponse response = ChatMessageResponse.fromEntity(savedMessage);

        messagingTemplate.convertAndSend("/topic/chat/" + request.getChatRoomId(), response);
        notifyParticipants(chatRoom, currentUser, request.getContent());

        log.info("Message sent with ID: {}", savedMessage.getId());
        return response;
    }

    @Override
    @Transactional
    public ChatMessageResponse sendFileMessage(Long chatRoomId, MultipartFile file) {
        User currentUser = getAuthenticatedUser();
        log.info("📤 Uploading file to chat room {} by user {}", chatRoomId, currentUser.getEmail());

        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        if (file.getSize() > 20L * 1024 * 1024) throw new IllegalArgumentException("File exceeds 20 MB limit");

        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("File type not supported: " + contentType);
        }

        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));

        if (!chatRoomRepository.isUserParticipant(chatRoomId, currentUser.getId())) {
            throw new AccessDeniedException("You are not a participant of this chat room");
        }

        // PHASE 3-4: Upload to Supabase Storage
        SupabaseStorageService.UploadResult uploadResult = storageService.uploadChatAttachment(file, chatRoom.getId());
        
        // PHASE 3: Store metadata in PostgreSQL
        MessageType msgType = contentType.startsWith("image/") ? MessageType.IMAGE : MessageType.FILE;

        ChatMessage message = ChatMessage.builder()
                .chatRoom(chatRoom)
                .sender(currentUser)
                .content(uploadResult.fileName)
                .messageType(msgType)
                .attachmentUrl(uploadResult.storagePath)  // Store path, not direct URL
                .attachmentName(uploadResult.fileName)
                .attachmentType(uploadResult.mimeType)
                .attachmentSize(uploadResult.fileSize)
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        ChatMessageResponse response = ChatMessageResponse.fromEntity(saved);

        // PHASE 4: Generate signed URL for the response (to be displayed in frontend)
        try {
            String signedUrl = storageService.generateSignedDownloadUrl(uploadResult.storagePath, 604800);  // 7 days
            response.setAttachmentUrl(signedUrl);
            log.info("✅ Signed URL generated: {}", signedUrl);
        } catch (Exception e) {
            log.warn("⚠️ Failed to generate signed URL for immediate response: {}", e.getMessage());
            // Keep storage path - frontend will fetch it later
        }

        // PHASE 7: Broadcast via WebSocket
        log.info("📢 Broadcasting file message to /topic/chat/{}", chatRoomId);
        messagingTemplate.convertAndSend("/topic/chat/" + chatRoomId, response);
        notifyParticipants(chatRoom, currentUser, "📎 " + uploadResult.fileName);

        // Also create attachment metadata record
        try {
            attachmentService.uploadChatAttachment(file, saved.getId(), currentUser.getId());
        } catch (Exception e) {
            log.warn("⚠️ Failed to create attachment metadata, but file is uploaded: {}", e.getMessage());
        }

        log.info("✅ File message saved with ID: {} → Storage: {}", saved.getId(), uploadResult.storagePath);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getMessages(Long roomId, Pageable pageable) {
        User currentUser = getAuthenticatedUser();
        if (!chatRoomRepository.isUserParticipant(roomId, currentUser.getId())) {
            throw new AccessDeniedException("You are not a participant of this chat room");
        }
        return chatMessageRepository
                .findByChatRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(roomId, pageable)
                .map(msg -> {
                    ChatMessageResponse response = ChatMessageResponse.fromEntity(msg);
                    // Generate signed URL for attachments
                    if (response.getAttachmentUrl() != null && !response.getAttachmentUrl().isEmpty()) {
                        try {
                            String signedUrl = storageService.generateSignedDownloadUrl(response.getAttachmentUrl(), 604800);
                            response.setAttachmentUrl(signedUrl);
                        } catch (Exception e) {
                            log.warn("⚠️ Failed to generate signed URL for attachment: {}", e.getMessage());
                            // Keep original path if URL generation fails
                        }
                    }
                    return response;
                });
    }

    @Override
    @Transactional
    public ChatMessageResponse updateMessage(Long messageId, ChatMessageUpdateRequest request) {
        User currentUser = getAuthenticatedUser();
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only update your own messages");
        }

        message.setContent(request.getContent());
        message.setIsEdited(true);

        ChatMessage updated = chatMessageRepository.save(message);
        ChatMessageResponse response = ChatMessageResponse.fromEntity(updated);
        messagingTemplate.convertAndSend("/topic/chat/" + message.getChatRoom().getId(), response);
        return response;
    }

    @Override
    @Transactional
    public void deleteMessage(Long messageId) {
        User currentUser = getAuthenticatedUser();
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only delete your own messages");
        }

        message.setIsDeleted(true);
        message.setContent("[Message deleted]");
        chatMessageRepository.save(message);

        ChatMessageResponse response = ChatMessageResponse.fromEntity(message);
        messagingTemplate.convertAndSend("/topic/chat/" + message.getChatRoom().getId(), response);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private void notifyParticipants(ChatRoom chatRoom, User sender, String preview) {
        chatParticipantRepository.findByChatRoomId(chatRoom.getId()).stream()
                .filter(p -> !p.getUser().getId().equals(sender.getId()))
                .forEach(p -> {
                    // Create notification without reference_type constraint issues
                    // Chat messages are identified by type, so we pass null for reference type
                    try {
                        notificationService.createNotification(
                                p.getUser(),
                                "New message in " + chatRoom.getName(),
                                sender.getFullName() + ": " + truncate(preview),
                                NotificationType.CHAT_MESSAGE,
                                chatRoom.getId(),
                                null,  // No reference type for chat messages
                                chatRoom.getWorkspace()
                        );
                    } catch (Exception e) {
                        log.error("Failed to create chat notification for user {}: {}", p.getUser().getId(), e.getMessage());
                    }
                });
    }

    private String truncate(String s) {
        return s.length() > 50 ? s.substring(0, 50) + "..." : s;
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = ((UserDetails) auth.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
