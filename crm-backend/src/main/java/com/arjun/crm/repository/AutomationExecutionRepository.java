package com.arjun.crm.repository;

import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.enums.AutomationExecutionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * AutomationExecutionRepository - PHASE 3: Execution Engine
 * 
 * Data access layer for AutomationExecution entities
 * All queries are workspace-scoped through automation
 */
@Repository
public interface AutomationExecutionRepository extends JpaRepository<AutomationExecution, Long> {
    
    /**
     * Find execution by ID and automation (workspace isolation)
     * 
     * @param id execution ID
     * @param automationId automation ID
     * @return execution if found
     */
    Optional<AutomationExecution> findByIdAndAutomationId(Long id, Long automationId);

    @Query("SELECT e FROM AutomationExecution e " +
           "WHERE e.id = :executionId AND e.automation.workspace.id = :workspaceId")
    Optional<AutomationExecution> findByIdAndWorkspaceId(
            @Param("executionId") Long executionId,
            @Param("workspaceId") Long workspaceId);
    
    /**
     * Find all executions for an automation (paginated)
     * 
     * @param automationId automation ID
     * @param pageable pagination
     * @return page of executions
     */
    @Query("SELECT e FROM AutomationExecution e " +
           "WHERE e.automation.id = :automationId " +
           "AND e.automation.workspace.id = :workspaceId " +
           "ORDER BY e.createdAt DESC")
        Page<AutomationExecution> findByAutomationIdAndWorkspaceId(
            @Param("automationId") Long automationId,
            @Param("workspaceId") Long workspaceId,
            Pageable pageable
    );
    
    /**
     * Find all executions for a lead (paginated)
     * 
     * @param leadId lead ID
     * @param pageable pagination
     * @return page of executions
     */
    @Query("SELECT e FROM AutomationExecution e " +
           "WHERE e.lead.id = :leadId " +
           "AND e.automation.workspace.id = :workspaceId " +
           "ORDER BY e.createdAt DESC")
    Page<AutomationExecution> findByLeadIdAndWorkspaceId(
            @Param("leadId") Long leadId,
            @Param("workspaceId") Long workspaceId,
            Pageable pageable
    );

    Page<AutomationExecution> findByLeadId(Long leadId, Pageable pageable);
    
    /**
     * Find waiting executions that should resume (scheduler query)
     * Used by scheduler to find executions that completed WAIT_DURATION
     * 
     * @param now current time
     * @return list of executions ready to resume
     */
    @Query("SELECT e FROM AutomationExecution e " +
           "WHERE e.status = :waitingStatus " +
           "AND e.resumeAt IS NOT NULL " +
           "AND e.resumeAt <= :now " +
           "ORDER BY e.resumeAt ASC")
    List<AutomationExecution> findReadyToResume(
            @Param("waitingStatus") AutomationExecutionStatus waitingStatus,
            @Param("now") LocalDateTime now
    );
    
    /**
     * Find the most recent execution of an automation for a lead
     * Used to avoid duplicate triggers for same lead/automation
     * 
     * @param automationId automation ID
     * @param leadId lead ID
     * @return most recent execution if exists
     */
    @Query("SELECT e FROM AutomationExecution e " +
           "WHERE e.automation.id = :automationId " +
           "AND e.lead.id = :leadId " +
           "ORDER BY e.createdAt DESC " +
           "LIMIT 1")
    Optional<AutomationExecution> findMostRecentByAutomationAndLead(
            @Param("automationId") Long automationId,
            @Param("leadId") Long leadId
    );
    
    /**
     * Count recent executions for a lead/automation (duplicate detection)
     * 
     * @param automationId automation ID
     * @param leadId lead ID
     * @param withinMinutes check executions within last N minutes
     * @return count of recent executions
     */
    @Query("SELECT COUNT(e) FROM AutomationExecution e " +
           "WHERE e.automation.id = :automationId " +
           "AND e.lead.id = :leadId " +
           "AND e.createdAt > :cutoff")
    long countRecentExecutions(
            @Param("automationId") Long automationId,
            @Param("leadId") Long leadId,
            @Param("cutoff") LocalDateTime cutoff
    );
    
    /**
     * Find executions by status (e.g., failed executions for monitoring)
     * 
     * @param status execution status
     * @param pageable pagination
     * @return page of executions
     */
    @Query("SELECT e FROM AutomationExecution e " +
           "WHERE e.status = :status " +
           "ORDER BY e.createdAt DESC")
    Page<AutomationExecution> findByStatus(
            @Param("status") AutomationExecutionStatus status,
            Pageable pageable
    );
}
