package com.arjun.crm.repository;

import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.enums.AutomationStepType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * AutomationStepRepository - PHASE 2: Workflow Model
 * 
 * Data access layer for AutomationStep entities
 * All queries are workspace-scoped through automation
 * 
 * Security:
 * - All methods enforce workspace isolation via automation FK
 * - Callers must verify workspace access before using these queries
 */
@Repository
public interface AutomationStepRepository extends JpaRepository<AutomationStep, Long> {
    
    /**
     * Find step by ID and automation (workspace isolation)
     * 
     * @param id step ID
     * @param automationId automation ID (verifies workspace indirectly)
     * @return step if exists in automation, Optional.empty() otherwise
     */
    Optional<AutomationStep> findByIdAndAutomationId(Long id, Long automationId);

    @Query("SELECT s FROM AutomationStep s " +
           "WHERE s.id = :stepId AND s.automation.id = :automationId " +
           "AND s.automation.workspace.id = :workspaceId")
    Optional<AutomationStep> findByIdAndAutomationIdAndWorkspaceId(
            @Param("stepId") Long stepId,
            @Param("automationId") Long automationId,
            @Param("workspaceId") Long workspaceId);
    
    /**
     * Find all steps in an automation (sorted by step_order)
     * 
     * @param automationId automation ID
     * @return list of steps in order
     */
    @Query("SELECT s FROM AutomationStep s " +
           "WHERE s.automation.id = :automationId " +
           "ORDER BY s.stepOrder ASC")
    List<AutomationStep> findByAutomationIdOrderByStepOrder(
            @Param("automationId") Long automationId
    );

    @Query("SELECT s FROM AutomationStep s " +
           "WHERE s.automation.id = :automationId " +
           "AND s.automation.workspace.id = :workspaceId " +
           "ORDER BY s.stepOrder ASC")
    List<AutomationStep> findByAutomationIdAndWorkspaceIdOrderByStepOrder(
            @Param("automationId") Long automationId,
            @Param("workspaceId") Long workspaceId);

    @Query("SELECT s FROM AutomationStep s " +
           "WHERE s.automation.id = :automationId " +
           "AND s.automation.workspace.id = :workspaceId " +
           "AND s.enabled = true ORDER BY s.stepOrder ASC")
    List<AutomationStep> findEnabledByAutomationIdAndWorkspaceId(
            @Param("automationId") Long automationId,
            @Param("workspaceId") Long workspaceId);
    
    /**
     * Find all enabled steps in an automation (sorted by step_order)
     * Used during automation execution
     * 
     * @param automationId automation ID
     * @return list of enabled steps in order
     */
    @Query("SELECT s FROM AutomationStep s " +
           "WHERE s.automation.id = :automationId " +
           "AND s.enabled = true " +
           "ORDER BY s.stepOrder ASC")
    List<AutomationStep> findEnabledByAutomationId(
            @Param("automationId") Long automationId
    );
    
    /**
     * Find the trigger step for an automation
     * There should be exactly 1 trigger step (always at stepOrder = 1)
     * 
     * @param automationId automation ID
     * @param stepOrder should be 1 for trigger
     * @return trigger step if found
     */
    @Query("SELECT s FROM AutomationStep s " +
           "WHERE s.automation.id = :automationId " +
           "AND s.stepOrder = :stepOrder")
    Optional<AutomationStep> findByAutomationIdAndStepOrder(
            @Param("automationId") Long automationId,
            @Param("stepOrder") Integer stepOrder
    );
    
    /**
     * Find all steps of a specific type in an automation
     * 
     * @param automationId automation ID
     * @param type step type
     * @return list of matching steps
     */
    @Query("SELECT s FROM AutomationStep s " +
           "WHERE s.automation.id = :automationId " +
           "AND s.type = :type " +
           "ORDER BY s.stepOrder ASC")
    List<AutomationStep> findByAutomationIdAndType(
            @Param("automationId") Long automationId,
            @Param("type") AutomationStepType type
    );
    
    /**
     * Find the next step after a given step_order
     * Used for conditional branching
     * 
     * @param automationId automation ID
     * @param currentStepOrder current step order
     * @return next step if exists
     */
    @Query("SELECT s FROM AutomationStep s " +
           "WHERE s.automation.id = :automationId " +
           "AND s.stepOrder > :currentStepOrder " +
           "ORDER BY s.stepOrder ASC " +
           "LIMIT 1")
    Optional<AutomationStep> findNextStep(
            @Param("automationId") Long automationId,
            @Param("currentStepOrder") Integer currentStepOrder
    );
    
    /**
     * Find the maximum step_order in an automation
     * Used when adding new steps
     * 
     * @param automationId automation ID
     * @return max step order, or 0 if no steps exist
     */
    @Query("SELECT COALESCE(MAX(s.stepOrder), 0) FROM AutomationStep s " +
           "WHERE s.automation.id = :automationId")
    Integer findMaxStepOrder(
            @Param("automationId") Long automationId
    );
    
    /**
     * Check if a step order exists in an automation
     * Used for validation before reordering
     * 
     * @param automationId automation ID
     * @param stepOrder step order to check
     * @return true if exists, false otherwise
     */
    @Query("SELECT COUNT(s) > 0 FROM AutomationStep s " +
           "WHERE s.automation.id = :automationId " +
           "AND s.stepOrder = :stepOrder")
    boolean existsByAutomationIdAndStepOrder(
            @Param("automationId") Long automationId,
            @Param("stepOrder") Integer stepOrder
    );
    
    /**
     * Count steps in an automation
     * 
     * @param automationId automation ID
     * @return number of steps
     */
    @Query("SELECT COUNT(s) FROM AutomationStep s " +
           "WHERE s.automation.id = :automationId")
    long countByAutomationId(
            @Param("automationId") Long automationId
    );
    
    /**
     * Delete all steps in an automation
     * Used when automation is archived
     * 
     * @param automationId automation ID
     */
    @Modifying

    @Query("DELETE FROM AutomationStep s WHERE s.automation.id = :automationId")
    void deleteAllByAutomationId(
            @Param("automationId") Long automationId
    );
}

