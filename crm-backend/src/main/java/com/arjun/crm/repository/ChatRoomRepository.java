package com.arjun.crm.repository;

import com.arjun.crm.entity.ChatRoom;
import com.arjun.crm.enums.ChatRoomType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    
    /**
     * Find chat rooms where user is a participant
     */
    @Query("SELECT DISTINCT cr FROM ChatRoom cr " +
           "JOIN cr.participants p " +
           "WHERE p.user.id = :userId " +
           "ORDER BY cr.createdAt DESC")
    Page<ChatRoom> findByParticipantUserId(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * Find chat rooms by workspace
     */
    Page<ChatRoom> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId, Pageable pageable);
    
    /**
     * Find chat rooms by project
     */
    Page<ChatRoom> findByProjectIdOrderByCreatedAtDesc(Long projectId, Pageable pageable);
    
    /**
     * Find chat rooms by type
     */
    Page<ChatRoom> findByTypeOrderByCreatedAtDesc(ChatRoomType type, Pageable pageable);
    
    /**
     * Find private chat room between two users
     */
    @Query("SELECT cr FROM ChatRoom cr " +
           "WHERE cr.type = 'PRIVATE' " +
           "AND EXISTS (SELECT p1 FROM ChatParticipant p1 WHERE p1.chatRoom = cr AND p1.user.id = :userId1) " +
           "AND EXISTS (SELECT p2 FROM ChatParticipant p2 WHERE p2.chatRoom = cr AND p2.user.id = :userId2)")
    Optional<ChatRoom> findPrivateChatRoom(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    
    /**
     * Check if user is participant of chat room
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
           "FROM ChatParticipant p " +
           "WHERE p.chatRoom.id = :roomId AND p.user.id = :userId")
    boolean isUserParticipant(@Param("roomId") Long roomId, @Param("userId") Long userId);
    
    /**
     * Delete all chat rooms for a workspace
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM ChatRoom cr WHERE cr.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
