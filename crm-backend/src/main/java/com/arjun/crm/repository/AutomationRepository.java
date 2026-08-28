package com.arjun.crm.repository;

import com.arjun.crm.entity.Automation;
import com.arjun.crm.enums.AutomationStatus;
import com.arjun.crm.enums.AutomationTriggerType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * AutomationRepository - PHASE 1: Core Foundation
 * 
 * Data access layer for Automation entities
 * All queries are workspace-scoped to enforce multi-tenancy
 * 
 * Security:
 * - All methods enforce workspace isolation
 * - Never return automations from other workspaces
 * - Callers must verify workspace access before using these queries
 */
@Repository
public interface AutomationRepository extends JpaRepository<Automation, Long> {
    
    /**
     * Find automation by ID and workspace
     * REQUIRED: Never retrieve automation without workspace verification
     * 
     * @param id automation ID
     * @param workspaceId workspace ID
     * @return automation if exists in workspace, Optional.empty() otherwise
     */
    Optional<Automation> findByIdAndWorkspaceId(Long id, Long workspaceId);
    
    /**
     * List all automations in a workspace (paginated)
     * Includes DRAFT, ACTIVE, PAUSED states (excludes ARCHIVED)
     * 
     * @param workspaceId workspace ID
     * @param pageable pagination settings
     * @return page of automations
     */
    @Query("SELECT a FROM Automation a " +
           "WHERE a.workspace.id = :workspaceId AND a.archivedAt IS NULL " +
           "ORDER BY a.createdAt DESC")
    Page<Automation> findByWorkspaceId(@Param("workspaceId") Long workspaceId, Pageable pageable);
    
    /**
     * Find all active automations in a workspace (non-paginated)
     * Used by automation execution engine to find automations to run
     * 
     * @param workspaceId workspace ID
     * @return list of active automations
     */
    @Query("SELECT a FROM Automation a " +
           "WHERE a.workspace.id = :workspaceId " +
           "AND a.status = :status " +
           "AND a.archivedAt IS NULL")
    List<Automation> findActiveByWorkspaceId(
            @Param("workspaceId") Long workspaceId,
            @Param("status") AutomationStatus status
    );
    
    /**
     * Find automations by workspace and status (paginated)
     * 
     * @param workspaceId workspace ID
     * @param status automation status
     * @param pageable pagination settings
     * @return page of automations
     */
    @Query("SELECT a FROM Automation a " +
           "WHERE a.workspace.id = :workspaceId " +
           "AND a.status = :status " +
           "AND a.archivedAt IS NULL")
    Page<Automation> findByWorkspaceIdAndStatus(
            @Param("workspaceId") Long workspaceId,
            @Param("status") AutomationStatus status,
            Pageable pageable
    );
    
    /**
     * Find automations by trigger type in a workspace
     * Used to find automations triggered by specific events
     * 
     * Example: Find all LEAD_CREATED automations that are ACTIVE
     * 
     * @param workspaceId workspace ID
     * @param triggerType trigger type
     * @param status automation status
     * @return list of matching automations
     */
    @Query("SELECT a FROM Automation a " +
           "WHERE a.workspace.id = :workspaceId " +
           "AND a.triggerType = :triggerType " +
           "AND a.status = :status " +
           "AND a.archivedAt IS NULL")
    List<Automation> findByWorkspaceIdAndTriggerTypeAndStatus(
            @Param("workspaceId") Long workspaceId,
            @Param("triggerType") AutomationTriggerType triggerType,
            @Param("status") AutomationStatus status
    );
    
    /**
     * Check if automation name exists in workspace (excluding archived)
     * Used for uniqueness validation on create/update
     * 
     * @param workspaceId workspace ID
     * @param name automation name
     * @return true if name exists, false otherwise
     */
    @Query("SELECT COUNT(a) > 0 FROM Automation a " +
           "WHERE a.workspace.id = :workspaceId " +
           "AND LOWER(a.name) = LOWER(:name) " +
           "AND a.archivedAt IS NULL")
    boolean existsByWorkspaceIdAndName(
            @Param("workspaceId") Long workspaceId,
            @Param("name") String name
    );
    
    /**
     * Check if automation name exists in workspace, excluding a specific automation
     * Used for uniqueness validation on update
     * 
     * @param workspaceId workspace ID
     * @param name automation name
     * @param excludeId automation ID to exclude from check
     * @return true if name exists, false otherwise
     */
    @Query("SELECT COUNT(a) > 0 FROM Automation a " +
           "WHERE a.workspace.id = :workspaceId " +
           "AND LOWER(a.name) = LOWER(:name) " +
           "AND a.id != :excludeId " +
           "AND a.archivedAt IS NULL")
    boolean existsByWorkspaceIdAndNameExcludingId(
            @Param("workspaceId") Long workspaceId,
            @Param("name") String name,
            @Param("excludeId") Long excludeId
    );
}
