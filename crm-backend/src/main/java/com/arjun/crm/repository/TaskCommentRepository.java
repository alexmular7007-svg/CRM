package com.arjun.crm.repository;

import com.arjun.crm.entity.TaskComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {
    
    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(Long taskId);
    
    Page<TaskComment> findByTaskIdOrderByCreatedAtDesc(Long taskId, Pageable pageable);
    
    void deleteByTaskId(Long taskId);
    
    /**
     * Count comments by user ID
     */
    Long countByUserId(Long userId);
    
    /**
     * Count comments in date range
     */
    @Query("SELECT COUNT(c) FROM TaskComment c WHERE c.createdAt BETWEEN :startDate AND :endDate")
    Long countCommentsInDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Delete all task comments in a workspace
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM TaskComment tc WHERE tc.task.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
