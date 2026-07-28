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

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

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
    
    /**
     * PHASE #2: Check if email exists in workspace (normalized lookup)
     * Email is normalized (lowercase + trimmed) before storage
     * This method performs case-insensitive lookup within a workspace
     */
    boolean existsByEmailAndWorkspaceId(String email, Long workspaceId);
    
    /**
     * PHASE #2: Find a lead by normalized email and workspace
     * Returns the lead if found (for duplicate/merge detection)
     * Email is normalized (lowercase + trimmed) before comparison
     * 
     * @param email the normalized email
     * @param workspaceId the workspace ID
     * @return the lead if found, empty if not found
     */
    @Query("SELECT l FROM Lead l WHERE LOWER(TRIM(l.email)) = :email AND l.workspace.id = :workspaceId")
    Optional<Lead> findByNormalizedEmailAndWorkspaceId(@Param("email") String email, @Param("workspaceId") Long workspaceId);
    
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
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("DELETE FROM Lead l WHERE l.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);

    /**
     * FEATURE #1: Load lead with pessimistic write lock for conversion
     * Prevents concurrent conversion attempts on the same lead
     * Lock is held until transaction commits
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM Lead l WHERE l.id = :id")
    Optional<Lead> findByIdForConversion(@Param("id") Long id);
}
