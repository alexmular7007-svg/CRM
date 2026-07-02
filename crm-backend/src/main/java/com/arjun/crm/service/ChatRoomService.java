package com.arjun.crm.service;

import com.arjun.crm.dto.request.ChatRoomCreateRequest;
import com.arjun.crm.dto.response.ChatRoomResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Set;

public interface ChatRoomService {
    ChatRoomResponse createChatRoom(ChatRoomCreateRequest request);
    ChatRoomResponse getChatRoom(Long roomId);
    Page<ChatRoomResponse> getUserChatRooms(Pageable pageable);
    /**
     * Get or create private chat between two users in a workspace.
     * 
     * SECURITY: Both users MUST be members of the provided workspace.
     * 
     * @param otherUserId ID of the other user
     * @param workspaceId ID of the workspace (required for validation)
     * @return ChatRoomResponse for the direct message room
     * @throws AccessDeniedException if users don't share the workspace
     * @throws ResourceNotFoundException if user not found
     */
    ChatRoomResponse getOrCreatePrivateChat(Long otherUserId, Long workspaceId);
    void addParticipant(Long roomId, Long userId);
    void removeParticipant(Long roomId, Long userId);
    void updateLastRead(Long roomId);
    Long getUnreadCount(Long roomId);

    /** Delete a chat room and all its messages (owner only) */
    void deleteRoom(Long roomId);

    /** Block a user — they can no longer message the current user */
    void blockUser(Long blockedUserId);

    /** Unblock a user */
    void unblockUser(Long blockedUserId);

    /** Get IDs of users the current user has blocked */
    Set<Long> getBlockedUsers();
}
