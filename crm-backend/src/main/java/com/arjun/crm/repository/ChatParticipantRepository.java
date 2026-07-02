package com.arjun.crm.repository;

import com.arjun.crm.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, Long> {
    
    /**
     * Find participants by chat room
     */
    List<ChatParticipant> findByChatRoomId(Long chatRoomId);
    
    /**
     * Find participant by chat room and user
     */
    Optional<ChatParticipant> findByChatRoomIdAndUserId(Long chatRoomId, Long userId);
    
    /**
     * Check if participant exists
     */
    boolean existsByChatRoomIdAndUserId(Long chatRoomId, Long userId);
    
    /**
     * Delete participant
     */
    void deleteByChatRoomIdAndUserId(Long chatRoomId, Long userId);
    
    /**
     * Update last read timestamp
     */
    @Modifying
    @Query("UPDATE ChatParticipant p SET p.lastReadAt = :timestamp " +
           "WHERE p.chatRoom.id = :roomId AND p.user.id = :userId")
    int updateLastReadAt(@Param("roomId") Long roomId, 
                         @Param("userId") Long userId, 
                         @Param("timestamp") Instant timestamp);
    
    /**
     * Count participants in chat room
     */
    Long countByChatRoomId(Long chatRoomId);

    /**
     * Delete all participants in a workspace via chat rooms
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM ChatParticipant p WHERE p.chatRoom.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
