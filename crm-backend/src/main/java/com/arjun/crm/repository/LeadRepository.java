package com.arjun.crm.repository;

import com.arjun.crm.entity.Lead;
import com.arjun.crm.entity.User;
import com.arjun.crm.enums.LeadStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    
    Page<Lead> findByWorkspaceId(Long workspaceId, Pageable pageable);
    
    Page<Lead> findByWorkspaceIdAndStatus(Long workspaceId, LeadStatus status, Pageable pageable);
    
    Page<Lead> findByWorkspaceIdAndAssignedToId(Long workspaceId, Long assignedToId, Pageable pageable);
    
    @Query("SELECT l FROM Lead l WHERE l.workspace.id = :workspaceId " +
           "AND (:status IS NULL OR l.status = :status) " +
           "AND (:assignedToId IS NULL OR l.assignedTo.id = :assignedToId) " +
           "AND (:priority IS NULL OR l.priority = :priority) " +
           "AND (:search IS NULL OR " +
           "     LOWER(CAST(l.name AS string)) LIKE LOWER(CAST(CONCAT('%', :search, '%') AS string)) OR " +
           "     LOWER(CAST(l.company AS string)) LIKE LOWER(CAST(CONCAT('%', :search, '%') AS string)) OR " +
           "     LOWER(CAST(l.email AS string)) LIKE LOWER(CAST(CONCAT('%', :search, '%') AS string)))")
    Page<Lead> findByFilters(@Param("workspaceId") Long workspaceId,
                             @Param("status") LeadStatus status,
                             @Param("assignedToId") Long assignedToId,
                             @Param("priority") String priority,
                             @Param("search") String search,
                             Pageable pageable);
    
    Optional<Lead> findByIdAndWorkspaceId(Long id, Long workspaceId);
    
    boolean existsByEmailAndWorkspaceId(String email, Long workspaceId);
    
    long countByWorkspaceIdAndStatus(Long workspaceId, LeadStatus status);
    
    long countByWorkspaceId(Long workspaceId);
    
    @Query("SELECT SUM(l.dealValue) FROM Lead l WHERE l.workspace.id = :workspaceId AND l.status = :status")
    BigDecimal sumDealValueByWorkspaceIdAndStatus(@Param("workspaceId") Long workspaceId, 
                                                   @Param("status") LeadStatus status);
    
    @Query("SELECT l.status, COUNT(l) FROM Lead l WHERE l.workspace.id = :workspaceId GROUP BY l.status")
    List<Object[]> countByStatusGrouped(@Param("workspaceId") Long workspaceId);
    
    @Query("SELECT l.assignedTo.id, l.assignedTo.fullName, COUNT(l), SUM(l.dealValue) " +
           "FROM Lead l WHERE l.workspace.id = :workspaceId AND l.assignedTo IS NOT NULL " +
           "GROUP BY l.assignedTo.id, l.assignedTo.fullName")
    List<Object[]> getPerformanceByAssignee(@Param("workspaceId") Long workspaceId);
    
    /**
     * Delete all leads for a workspace
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Lead l WHERE l.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 6: CRM Lead Service Workspace Scoping Methods
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Find assignable leads for user in workspace (active members only)
     */
    @Query("SELECT l FROM Lead l WHERE l.workspace.id = :workspaceId AND l.assignedTo.id = :assigneeId ORDER BY l.createdAt DESC")
    Page<Lead> findByWorkspaceIdAndAssigneeId(@Param("workspaceId") Long workspaceId, 
                                               @Param("assigneeId") Long assigneeId, 
                                               Pageable pageable);

    /**
     * Get assignable CRM members (active workspace members only)
     */
    @Query("SELECT DISTINCT wm.user FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.deletedAt IS NULL AND wm.status = 'ACTIVE' ORDER BY wm.user.fullName")
    List<User> findAssignableCRMMembersInWorkspace(@Param("workspaceId") Long workspaceId);
}
