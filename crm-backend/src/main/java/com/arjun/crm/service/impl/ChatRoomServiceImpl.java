package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.ChatRoomCreateRequest;
import com.arjun.crm.dto.response.ChatParticipantResponse;
import com.arjun.crm.dto.response.ChatRoomResponse;
import com.arjun.crm.entity.*;
import com.arjun.crm.enums.ChatRoomType;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.*;
import com.arjun.crm.service.ChatRoomService;
import com.arjun.crm.service.OnlinePresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRoomServiceImpl implements ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ProjectRepository projectRepository;
    private final OnlinePresenceService onlinePresenceService;
    private final BlockedUserRepository blockedUserRepository;

    @Override
    @Transactional
    public ChatRoomResponse createChatRoom(ChatRoomCreateRequest request) {
        User currentUser = getAuthenticatedUser();
        log.info("Creating chat room: {} by user: {}", request.getName(), currentUser.getEmail());

        // Fetch workspace if provided
        Workspace workspace = null;
        if (request.getWorkspaceId() != null) {
            workspace = workspaceRepository.findById(request.getWorkspaceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        }

        // Fetch project if provided
        Project project = null;
        if (request.getProjectId() != null) {
            project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        }

        // Create chat room
        ChatRoom chatRoom = ChatRoom.builder()
                .name(request.getName())
                .type(request.getType())
                .workspace(workspace)
                .project(project)
                .createdBy(currentUser)
                .build();

        ChatRoom savedRoom = chatRoomRepository.save(chatRoom);

        // Add creator as participant
        addParticipantInternal(savedRoom, currentUser);

        // Add other participants
        for (Long userId : request.getParticipantIds()) {
            if (!userId.equals(currentUser.getId())) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
                addParticipantInternal(savedRoom, user);
            }
        }

        log.info("Chat room created with ID: {}", savedRoom.getId());
        return mapToResponse(savedRoom);
    }

    @Override
    @Transactional(readOnly = true)
    public ChatRoomResponse getChatRoom(Long roomId) {
        User currentUser = getAuthenticatedUser();
        log.info("Fetching chat room: {} for user: {}", roomId, currentUser.getEmail());

        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));

        // Verify user is participant
        if (!chatRoomRepository.isUserParticipant(roomId, currentUser.getId())) {
            throw new AccessDeniedException("You are not a participant of this chat room");
        }

        return mapToResponse(chatRoom);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatRoomResponse> getUserChatRooms(Pageable pageable) {
        User currentUser = getAuthenticatedUser();
        log.info("Fetching chat rooms for user: {}", currentUser.getEmail());

        Page<ChatRoom> chatRooms = chatRoomRepository.findByParticipantUserId(currentUser.getId(), pageable);
        return chatRooms.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public ChatRoomResponse getOrCreatePrivateChat(Long otherUserId, Long workspaceId) {
        User currentUser = getAuthenticatedUser();
        log.info("Getting or creating private chat between {} and {} in workspace {}", 
                 currentUser.getId(), otherUserId, workspaceId);

        // Verify user has access to the workspace
        workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        // Verify both users are members of this workspace
        boolean currentUserInWorkspace = workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId());
        boolean otherUserInWorkspace = workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, otherUserId);

        // Also check if either is the workspace owner
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        if (!currentUserInWorkspace && !workspace.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You are not a member of this workspace");
        }

        if (!otherUserInWorkspace && !workspace.getOwner().getId().equals(otherUserId)) {
            throw new AccessDeniedException("Target user is not a member of this workspace");
        }

        // Check if private chat already exists between these users
        Optional<ChatRoom> existingRoom = chatRoomRepository.findPrivateChatRoom(currentUser.getId(), otherUserId);
        
        if (existingRoom.isPresent()) {
            log.info("Private chat already exists: {}", existingRoom.get().getId());
            return mapToResponse(existingRoom.get());
        }

        // Create new private chat
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String chatName = currentUser.getFullName() + " & " + otherUser.getFullName();

        ChatRoom chatRoom = ChatRoom.builder()
                .name(chatName)
                .type(ChatRoomType.PRIVATE)
                .workspace(workspace)  // Associate with workspace
                .createdBy(currentUser)
                .build();

        ChatRoom savedRoom = chatRoomRepository.save(chatRoom);

        // Add both users as participants
        addParticipantInternal(savedRoom, currentUser);
        addParticipantInternal(savedRoom, otherUser);

        log.info("Private chat created with ID: {} in workspace {}", savedRoom.getId(), workspaceId);
        return mapToResponse(savedRoom);
    }

    @Override
    @Transactional
    public void addParticipant(Long roomId, Long userId) {
        User currentUser = getAuthenticatedUser();
        log.info("Adding participant {} to room {} by user {}", userId, roomId, currentUser.getEmail());

        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));

        // Verify current user is participant
        if (!chatRoomRepository.isUserParticipant(roomId, currentUser.getId())) {
            throw new AccessDeniedException("You are not a participant of this chat room");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        addParticipantInternal(chatRoom, user);
    }

    @Override
    @Transactional
    public void removeParticipant(Long roomId, Long userId) {
        User currentUser = getAuthenticatedUser();
        log.info("Removing participant {} from room {} by user {}", userId, roomId, currentUser.getEmail());

        // Verify chat room exists
        chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));

        // Verify current user is participant
        if (!chatRoomRepository.isUserParticipant(roomId, currentUser.getId())) {
            throw new AccessDeniedException("You are not a participant of this chat room");
        }

        chatParticipantRepository.deleteByChatRoomIdAndUserId(roomId, userId);
        log.info("Participant removed from room");
    }

    @Override
    @Transactional
    public void updateLastRead(Long roomId) {
        User currentUser = getAuthenticatedUser();
        log.debug("Updating last read for user {} in room {}", currentUser.getId(), roomId);

        chatParticipantRepository.updateLastReadAt(roomId, currentUser.getId(), Instant.now());
    }

    @Override
    @Transactional(readOnly = true)
    public Long getUnreadCount(Long roomId) {
        User currentUser = getAuthenticatedUser();
        return chatMessageRepository.countUnreadMessages(roomId, currentUser.getId());
    }

    // ─── Delete room ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteRoom(Long roomId) {
        User currentUser = getAuthenticatedUser();
        log.info("Deleting chat room {} by user {}", roomId, currentUser.getEmail());

        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));

        // Only the creator can delete the room
        if (!chatRoom.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the room creator can delete this chat");
        }

        // Cascade deletes all messages and participants (CascadeType.ALL on entity)
        chatRoomRepository.delete(chatRoom);
        log.info("Chat room {} deleted", roomId);
    }

    // ─── Block / Unblock user ─────────────────────────────────────────────────

    @Override
    @Transactional
    public void blockUser(Long blockedUserId) {
        User currentUser = getAuthenticatedUser();
        log.info("User {} blocking user {}", currentUser.getId(), blockedUserId);

        if (currentUser.getId().equals(blockedUserId)) {
            throw new IllegalArgumentException("You cannot block yourself");
        }

        User blocked = userRepository.findById(blockedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!blockedUserRepository.existsByBlockerIdAndBlockedId(currentUser.getId(), blockedUserId)) {
            BlockedUser block = BlockedUser.builder()
                    .blocker(currentUser)
                    .blocked(blocked)
                    .build();
            blockedUserRepository.save(block);
            log.info("User {} blocked user {}", currentUser.getId(), blockedUserId);
        }
    }

    @Override
    @Transactional
    public void unblockUser(Long blockedUserId) {
        User currentUser = getAuthenticatedUser();
        log.info("User {} unblocking user {}", currentUser.getId(), blockedUserId);
        blockedUserRepository.deleteByBlockerIdAndBlockedId(currentUser.getId(), blockedUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<Long> getBlockedUsers() {
        User currentUser = getAuthenticatedUser();
        return blockedUserRepository.findBlockedUserIdsByBlockerId(currentUser.getId());
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void addParticipantInternal(ChatRoom chatRoom, User user) {
        if (chatParticipantRepository.existsByChatRoomIdAndUserId(chatRoom.getId(), user.getId())) {
            log.debug("User {} is already a participant of room {}", user.getId(), chatRoom.getId());
            return;
        }

        ChatParticipant participant = ChatParticipant.builder()
                .chatRoom(chatRoom)
                .user(user)
                .build();

        chatParticipantRepository.save(participant);
        log.debug("Added participant {} to room {}", user.getId(), chatRoom.getId());
    }

    private ChatRoomResponse mapToResponse(ChatRoom chatRoom) {
        User currentUser = getAuthenticatedUser();
        
        // Get online status for participants
        Set<Long> onlineUsers = onlinePresenceService.getOnlineUsers();
        
        List<ChatParticipantResponse> participants = chatRoom.getParticipants().stream()
                .map(p -> {
                    ChatParticipantResponse response = ChatParticipantResponse.fromEntity(p);
                    response.setIsOnline(onlineUsers.contains(p.getUser().getId()));
                    return response;
                })
                .collect(Collectors.toList());

        // Get last message
        Page<ChatMessage> lastMessagePage = chatMessageRepository.findLastMessage(
                chatRoom.getId(), 
                PageRequest.of(0, 1)
        );

        ChatRoomResponse response = ChatRoomResponse.fromEntity(chatRoom);
        response.setParticipants(participants);
        
        if (!lastMessagePage.isEmpty()) {
            response.setLastMessage(com.arjun.crm.dto.response.ChatMessageResponse.fromEntity(lastMessagePage.getContent().get(0)));
        }

        // Get unread count
        Long unreadCount = chatMessageRepository.countUnreadMessages(chatRoom.getId(), currentUser.getId());
        response.setUnreadCount(unreadCount);

        return response;
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
