package com.arjun.crm.repository;

import com.arjun.crm.entity.Task;
import com.arjun.crm.entity.User;
import com.arjun.crm.enums.TaskPriority;
import com.arjun.crm.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    Page<Task> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Task> findByStatusOrderByCreatedAtDesc(TaskStatus status, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :assignedToId ORDER BY t.createdAt DESC")
    Page<Task> findByAssignedToIdOrderByCreatedAtDesc(@Param("assignedToId") Long assignedToId, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.createdBy.id = :createdById ORDER BY t.createdAt DESC")
    Page<Task> findByCreatedByIdOrderByCreatedAtDesc(@Param("createdById") Long createdById, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId ORDER BY t.createdAt DESC")
    Page<Task> findByProjectIdOrderByCreatedAtDesc(@Param("projectId") Long projectId, Pageable pageable);

    Page<Task> findByPriorityOrderByCreatedAtDesc(TaskPriority priority, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.dueDate < :today AND t.status NOT IN ('DONE', 'CANCELLED')")
    List<Task> findOverdueTasks(@Param("today") LocalDate today);

    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId AND t.status NOT IN ('DONE', 'CANCELLED')")
    List<Task> findActiveTasksByAssignee(@Param("userId") Long userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.status = :status")
    Long countByStatus(@Param("status") TaskStatus status);

    @Query("SELECT t FROM Task t WHERE " +
           "LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Task> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.status = :status")
    List<Task> findByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") TaskStatus status);

    List<Task> findByDueDateBetween(LocalDate startDate, LocalDate endDate);
    
    /**
     * Find tasks by due date and status not equal
     */
    List<Task> findByDueDateAndStatusNot(LocalDate dueDate, TaskStatus status);
    
    /**
     * Count tasks by priority
     */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.priority = :priority")
    Long countByPriority(@Param("priority") TaskPriority priority);
    
    /**
     * Count tasks by created by and status
     */
    Long countByCreatedByIdAndStatus(Long createdById, TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.status = :status AND t.createdAt BETWEEN :startDate AND :endDate")
    List<Task> findByStatusAndCreatedAtBetween(@Param("status") TaskStatus status,
                                               @Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);
    
    /**
     * Get tasks grouped by project with count
     */
    @Query("SELECT t.project.id, t.project.name, COUNT(t) " +
           "FROM Task t " +
           "WHERE t.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY t.project.id, t.project.name " +
           "ORDER BY COUNT(t) DESC")
    List<Object[]> countTasksByProject(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Get tasks grouped by user with count
     */
    @Query("SELECT t.createdBy.id, t.createdBy.fullName, COUNT(t) " +
           "FROM Task t " +
           "WHERE t.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY t.createdBy.id, t.createdBy.fullName " +
           "ORDER BY COUNT(t) DESC")
    List<Object[]> countTasksByUser(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Calculate average completion time in days
     * Using TIMESTAMPDIFF with DAY unit to calculate days between dates
     */
    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 86400) " +
           "FROM tasks t " +
           "WHERE t.status = 'DONE' " +
           "AND t.created_at BETWEEN :startDate AND :endDate", nativeQuery = true)
    Double calculateAverageCompletionDays(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Count tasks created in date range
     */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.createdAt BETWEEN :startDate AND :endDate")
    Long countTasksCreatedBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Count tasks completed in date range
     */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.status = 'DONE' AND t.updatedAt BETWEEN :startDate AND :endDate")
    Long countTasksCompletedBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    List<Task> findByWorkspaceId(Long workspaceId);
    
    List<Task> findByWorkspaceIdAndStatus(Long workspaceId, TaskStatus status);
    
    long countByWorkspaceIdAndStatus(Long workspaceId, TaskStatus status);
    
    long countByWorkspaceId(Long workspaceId);

    @Query("SELECT t FROM Task t WHERE t.workspace.id = :workspaceId AND t.dueDate < :today AND t.status NOT IN ('DONE', 'CANCELLED')")
    List<Task> findOverdueTasksInWorkspace(@Param("workspaceId") Long workspaceId, @Param("today") LocalDate today);
    
    /**
     * Workspace-scoped analytics queries
     */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.workspace.id = :workspaceId AND t.createdAt BETWEEN :startDate AND :endDate")
    Long countTasksCreatedBetweenByWorkspace(@Param("workspaceId") Long workspaceId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.workspace.id = :workspaceId AND t.status = 'DONE' AND t.updatedAt BETWEEN :startDate AND :endDate")
    Long countTasksCompletedBetweenByWorkspace(@Param("workspaceId") Long workspaceId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT t FROM Task t WHERE t.workspace.id = :workspaceId AND t.dueDate < :today AND t.status NOT IN ('DONE', 'CANCELLED')")
    List<Task> findOverdueTasksByWorkspace(@Param("workspaceId") Long workspaceId, @Param("today") LocalDate today);
    
    /**
     * Delete all tasks for a workspace
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Task t WHERE t.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 3: Workspace-Scoped Assignee Methods (Active Member Validation)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Find tasks assigned to a user ONLY in a specific workspace
     * Prevents global task queries across all workspaces
     * Used by: TaskService.getTasksByAssigneeInWorkspace()
     */
    @Query("SELECT t FROM Task t WHERE t.workspace.id = :workspaceId AND t.assignedTo.id = :assigneeId ORDER BY t.createdAt DESC")
    Page<Task> findByWorkspaceIdAndAssignedToId(@Param("workspaceId") Long workspaceId,
                                                  @Param("assigneeId") Long assigneeId,
                                                  Pageable pageable);

    /**
     * Find unassigned tasks in a workspace
     * Used for: Task assignment dropdown to show available tasks
     */
    @Query("SELECT t FROM Task t WHERE t.workspace.id = :workspaceId AND t.assignedTo IS NULL ORDER BY t.createdAt DESC")
    Page<Task> findUnassignedByWorkspaceId(@Param("workspaceId") Long workspaceId, Pageable pageable);

    /**
     * Get active assignees in a workspace (excluding deleted members)
     * Only returns users who are active members of the workspace
     */
    @Query("SELECT DISTINCT t.assignedTo FROM Task t WHERE t.workspace.id = :workspaceId AND t.assignedTo IS NOT NULL")
    List<User> findDistinctAssigneesInWorkspace(@Param("workspaceId") Long workspaceId);

    /**
     * Count tasks assigned to a user in a workspace
     */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.workspace.id = :workspaceId AND t.assignedTo.id = :assigneeId")
    long countByWorkspaceIdAndAssigneeId(@Param("workspaceId") Long workspaceId, @Param("assigneeId") Long assigneeId);

    /**
     * Find active tasks (not DONE or CANCELLED) assigned to user in workspace
     */
    @Query("SELECT t FROM Task t WHERE t.workspace.id = :workspaceId AND t.assignedTo.id = :assigneeId AND t.status NOT IN ('DONE', 'CANCELLED')")
    List<Task> findActiveTasksByAssigneeInWorkspace(@Param("workspaceId") Long workspaceId, @Param("assigneeId") Long assigneeId);

    /**
     * Get assignee dropdown options for a workspace (active members only)
     * Returns distinct users who are assigned or could be assigned tasks in this workspace
     * Integrates with WorkspaceMember to ensure only active members shown
     */
    @Query("SELECT DISTINCT wm.user FROM WorkspaceMember wm " +
           "WHERE wm.workspace.id = :workspaceId AND wm.deletedAt IS NULL AND wm.status = 'ACTIVE' " +
           "ORDER BY wm.user.fullName")
    List<User> findAssignableUsersInWorkspace(@Param("workspaceId") Long workspaceId);
}
