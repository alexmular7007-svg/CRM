package com.arjun.crm.repository;

import com.arjun.crm.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * PHASE 4: Fetch chat messages with eager loading of attachments
     * Prevents N+1 queries and ensures attachmentId is populated in responses
     * Using DISTINCT to handle pagination with LEFT JOIN FETCH
     */
    @Query("SELECT DISTINCT m FROM ChatMessage m " +
           "LEFT JOIN FETCH m.attachment a " +
           "WHERE m.chatRoom.id = :roomId " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    Page<ChatMessage> findByChatRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(@Param("roomId") Long roomId, Pageable pageable);

    @Query("SELECT m FROM ChatMessage m " +
           "WHERE m.chatRoom.id = :roomId " +
           "AND m.isDeleted = false " +
           "AND m.createdAt > :after " +
           "ORDER BY m.createdAt ASC")
    Page<ChatMessage> findMessagesAfter(@Param("roomId") Long roomId,
                                        @Param("after") Instant after,
                                        Pageable pageable);

    @Query("SELECT COUNT(m) FROM ChatMessage m " +
           "JOIN ChatParticipant p ON p.chatRoom = m.chatRoom " +
           "WHERE m.chatRoom.id = :roomId " +
           "AND p.user.id = :userId " +
           "AND m.isDeleted = false " +
           "AND (p.lastReadAt IS NULL OR m.createdAt > p.lastReadAt)")
    Long countUnreadMessages(@Param("roomId") Long roomId, @Param("userId") Long userId);

    @Query("SELECT m FROM ChatMessage m " +
           "WHERE m.chatRoom.id = :roomId " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    Page<ChatMessage> findLastMessage(@Param("roomId") Long roomId, Pageable pageable);

    Long countBySenderId(Long senderId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.createdAt BETWEEN :startDate AND :endDate")
    Long countMessagesInDateRange(@Param("startDate") Instant startDate,
                                  @Param("endDate") Instant endDate);

    /**
     * Delete all chat messages in a workspace via chat rooms
     * clearAutomatically=true ensures persistence context is cleared after delete
     */
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("DELETE FROM ChatMessage m WHERE m.chatRoom.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
