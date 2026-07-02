package com.arjun.crm.controller;

import com.arjun.crm.dto.request.ChatRoomCreateRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.ChatRoomResponse;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.ChatRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class ChatRoomController {

    private final ChatRoomService chatRoomService;
    private final WorkspaceAuthorizationService workspaceAuthService;

    /**
     * Create a new chat room
     * POST /api/chat/rooms
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ChatRoomResponse>> createChatRoom(
            @Valid @RequestBody ChatRoomCreateRequest request) {
        
        // Validate user has access to workspace
        workspaceAuthService.validateWorkspaceAccess(request.getWorkspaceId());
        
        ChatRoomResponse response = chatRoomService.createChatRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chat room created successfully", response));
    }

    /**
     * Get user's chat rooms
     * GET /api/chat/rooms
     * Note: workspaceId parameter is optional for multi-workspace support
     * If provided, filter by workspace; otherwise return all user's chat rooms
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ChatRoomResponse>>> getUserChatRooms(
            @RequestParam(required = false) Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        // If workspaceId provided, validate access; otherwise get all chat rooms
        if (workspaceId != null) {
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
        }
        
        Pageable pageable = PageRequest.of(page, size);
        Page<ChatRoomResponse> chatRooms = chatRoomService.getUserChatRooms(pageable);
        return ResponseEntity.ok(ApiResponse.success("Chat rooms retrieved successfully", chatRooms));
    }

    /**
     * Get chat room by ID
     * GET /api/chat/rooms/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> getChatRoom(
            @PathVariable Long id,
            @RequestParam(required = false) Long workspaceId) {
        
        // If workspaceId provided, validate access; otherwise just check room exists
        if (workspaceId != null) {
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
        }
        
        ChatRoomResponse response = chatRoomService.getChatRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Chat room retrieved successfully", response));
    }

    /**
     * Get or create private chat with a workspace member
     * POST /api/chat/rooms/private/{userId}?workspaceId={id}
     * 
     * SECURITY: Both users must be in the provided workspace.
     * Required parameters:
     * - userId: ID of the user to message (path parameter)
     * - workspaceId: ID of the workspace where both users are members (required query parameter)
     * 
     * Returns:
     * - Existing room if private chat already exists
     * - New room if this is the first direct message
     * 
     * Errors:
     * - 400: workspaceId not provided
     * - 403: Current user not member of workspace, or target user not member of workspace
     * - 404: User not found, or workspace not found
     */
    @PostMapping("/private/{userId}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> getOrCreatePrivateChat(
            @PathVariable Long userId,
            @RequestParam(required = false) Long workspaceId) {
        
        log.info("=== PRIVATE CHAT REQUEST ===");
        log.info("Received request to create private chat");
        log.info("PathVariable userId: {} (type: {})", userId, userId != null ? userId.getClass().getSimpleName() : "null");
        log.info("RequestParam workspaceId: {} (type: {})", workspaceId, workspaceId != null ? workspaceId.getClass().getSimpleName() : "null");
        
        try {
            if (workspaceId == null) {
                log.error("VALIDATION ERROR: workspaceId is REQUIRED but was not provided");
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("workspaceId parameter is required"));
            }
            
            log.info("Step 1: Validating workspace access for user");
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
            log.info("Step 1: PASSED - User has access to workspace");
            
            log.info("Step 2: Calling service to get or create private chat");
            ChatRoomResponse response = chatRoomService.getOrCreatePrivateChat(userId, workspaceId);
            log.info("Step 2: PASSED - Private chat room created/retrieved successfully");
            log.info("Returning room with ID: {}", response.getId());
            
            return ResponseEntity.ok(ApiResponse.success("Private chat retrieved successfully", response));
        } catch (ResourceNotFoundException ex) {
            log.error("Resource not found during private chat creation: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(ex.getMessage()));
        } catch (AccessDeniedException ex) {
            log.error("Access denied during private chat creation: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            log.error("Invalid argument during private chat creation: {}", ex.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(ex.getMessage()));
        } catch (Exception ex) {
            log.error("=== EXCEPTION IN PRIVATE CHAT ENDPOINT ===");
            log.error("Exception Type: {}", ex.getClass().getCanonicalName());
            log.error("Exception Message: {}", ex.getMessage());
            log.error("Exception Cause: {}", ex.getCause());
            log.error("Stack trace: ", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create private chat: " + ex.getMessage()));
        }
    }

    /**
     * Add participant to chat room
     * POST /api/chat/rooms/{id}/participants/{userId}
     * Note: workspaceId parameter is optional for multi-workspace support
     */
    @PostMapping("/{id}/participants/{userId}")
    public ResponseEntity<ApiResponse<Void>> addParticipant(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestParam(required = false) Long workspaceId) {
        
        // If workspaceId provided, validate access
        if (workspaceId != null) {
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
            // Validate participant is in same workspace
            workspaceAuthService.validateAssigneeInWorkspace(workspaceId, userId);
        }
        
        chatRoomService.addParticipant(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Participant added successfully", null));
    }

    /**
     * Remove participant from chat room
     * DELETE /api/chat/rooms/{id}/participants/{userId}
     * Note: workspaceId parameter is optional for multi-workspace support
     */
    @DeleteMapping("/{id}/participants/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeParticipant(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestParam(required = false) Long workspaceId) {
        
        // If workspaceId provided, validate access
        if (workspaceId != null) {
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
        }
        
        chatRoomService.removeParticipant(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Participant removed successfully", null));
    }

    /**
     * Mark messages as read
     * PUT /api/chat/rooms/{id}/read
     * Note: workspaceId parameter is optional for multi-workspace support
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @RequestParam(required = false) Long workspaceId) {
        
        // If workspaceId provided, validate access
        if (workspaceId != null) {
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
        }
        
        chatRoomService.updateLastRead(id);
        return ResponseEntity.ok(ApiResponse.success("Messages marked as read", null));
    }

    /**
     * Get unread message count
     * GET /api/chat/rooms/{id}/unread-count
     * Note: workspaceId parameter is optional for multi-workspace support
     */
    @GetMapping("/{id}/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @PathVariable Long id,
            @RequestParam(required = false) Long workspaceId) {
        
        // If workspaceId provided, validate access
        if (workspaceId != null) {
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
        }
        
        Long count = chatRoomService.getUnreadCount(id);
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved successfully", count));
    }

    /**
     * Delete a chat room (creator only — deletes all messages)
     * DELETE /api/chat/rooms/{id}
     * Note: workspaceId parameter is optional for multi-workspace support
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(
            @PathVariable Long id,
            @RequestParam(required = false) Long workspaceId) {
        
        // If workspaceId provided, validate access
        if (workspaceId != null) {
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
        }
        
        chatRoomService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Chat room deleted successfully", null));
    }

    /**
     * Block a user
     * POST /api/chat/block/{userId}
     */
    @PostMapping("/block/{userId}")
    public ResponseEntity<ApiResponse<Void>> blockUser(@PathVariable Long userId) {
        chatRoomService.blockUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User blocked successfully", null));
    }

    /**
     * Unblock a user
     * DELETE /api/chat/block/{userId}
     */
    @DeleteMapping("/block/{userId}")
    public ResponseEntity<ApiResponse<Void>> unblockUser(@PathVariable Long userId) {
        chatRoomService.unblockUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User unblocked successfully", null));
    }

    /**
     * Get list of blocked user IDs for current user
     * GET /api/chat/blocked
     */
    @GetMapping("/blocked")
    public ResponseEntity<ApiResponse<java.util.Set<Long>>> getBlockedUsers() {
        return ResponseEntity.ok(ApiResponse.success("Blocked users retrieved", chatRoomService.getBlockedUsers()));
    }
}
