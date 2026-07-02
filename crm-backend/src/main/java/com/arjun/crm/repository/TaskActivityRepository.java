package com.arjun.crm.repository;

import com.arjun.crm.entity.TaskActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskActivityRepository extends JpaRepository<TaskActivity, Long> {
    
    /**
     * Find activities by task ID
     */
    Page<TaskActivity> findByTaskIdOrderByCreatedAtDesc(Long taskId, Pageable pageable);
    
    /**
     * Count activities after timestamp
     */
    @Query("SELECT COUNT(a) FROM TaskActivity a WHERE a.createdAt > :timestamp")
    Long countByCreatedAtAfter(@Param("timestamp") LocalDateTime timestamp);
    
    /**
     * Get activities grouped by type with count
     */
    @Query("SELECT a.action, COUNT(a) " +
           "FROM TaskActivity a " +
           "WHERE a.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY a.action " +
           "ORDER BY COUNT(a) DESC")
    List<Object[]> countActivitiesByType(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Get activities grouped by date
     */
    @Query("SELECT CAST(a.createdAt AS date), COUNT(a) " +
           "FROM TaskActivity a " +
           "WHERE a.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY CAST(a.createdAt AS date) " +
           "ORDER BY CAST(a.createdAt AS date)")
    List<Object[]> countActivitiesByDate(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Get most active users by activity count
     */
    @Query("SELECT a.user.id, a.user.fullName, COUNT(a) " +
           "FROM TaskActivity a " +
           "WHERE a.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY a.user.id, a.user.fullName " +
           "ORDER BY COUNT(a) DESC")
    List<Object[]> findMostActiveUsers(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);
    
    /**
     * Get most active projects by activity count
     */
    @Query("SELECT a.task.project.id, a.task.project.name, COUNT(a) " +
           "FROM TaskActivity a " +
           "WHERE a.createdAt BETWEEN :startDate AND :endDate " +
           "AND a.task.project IS NOT NULL " +
           "GROUP BY a.task.project.id, a.task.project.name " +
           "ORDER BY COUNT(a) DESC")
    List<Object[]> findMostActiveProjects(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);

    /**
     * Find activities by workspace and created date between timestamps
     */
    @Query("SELECT a FROM TaskActivity a WHERE a.task.workspace.id = :workspaceId AND a.createdAt BETWEEN :startDate AND :endDate")
    List<TaskActivity> findByWorkspaceIdAndCreatedAtBetween(@Param("workspaceId") Long workspaceId, 
            @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Find all task activities by workspace ordered by creation date descending
     */
    @Query("SELECT a FROM TaskActivity a WHERE a.task.workspace.id = :workspaceId ORDER BY a.createdAt DESC")
    List<TaskActivity> findByWorkspaceIdOrderByCreatedAtDesc(@Param("workspaceId") Long workspaceId);

    /**
     * Delete all task activities in a workspace
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM TaskActivity ta WHERE ta.task.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
