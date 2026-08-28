package com.arjun.crm.service.automation;

import com.arjun.crm.dto.response.AutomationExecutionResponse;
import com.arjun.crm.entity.AutomationExecution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

/**
 * AutomationExecutionQueryService - PHASE 8: Monitoring Dashboard
 *
 * Service interface for querying automation execution data.
 * Provides methods for:
 * - Fetching execution details
 * - Querying execution lists with filters
 * - Getting execution metrics
 * - Building DTOs for API responses
 *
 * Usage:
 * - Called by AutomationExecutionController
 * - Used to build monitoring dashboard data
 * - Handles DTO conversion and formatting
 */
public interface AutomationExecutionQueryService {

    /**
     * Get execution by ID with full details including steps.
     *
     * @param executionId Execution ID
     * @param workspaceId Workspace ID (for security)
     * @return Execution details DTO
     */
    Optional<AutomationExecutionResponse> getExecutionById(Long executionId, Long workspaceId);

    /**
     * Get all executions for an automation (paginated).
     *
     * @param automationId Automation ID
     * @param workspaceId Workspace ID (for security)
     * @param pageable Pagination settings
     * @return Page of execution responses
     */
    Page<AutomationExecutionResponse> getExecutionsByAutomation(
            Long automationId,
            Long workspaceId,
            Pageable pageable
    );

    /**
     * Get all executions for a lead (paginated).
     *
     * @param leadId Lead ID
     * @param workspaceId Workspace ID (for security)
     * @param pageable Pagination settings
     * @return Page of execution responses
     */
    Page<AutomationExecutionResponse> getExecutionsByLead(
            Long leadId,
            Long workspaceId,
            Pageable pageable
    );

    /**
     * Get execution metrics for an automation.
     *
     * Metrics include:
     * - Total executions
     * - Completed executions
     * - Failed executions
     * - Waiting executions
     * - Average duration
     * - Success rate
     *
     * @param automationId Automation ID
     * @param workspaceId Workspace ID (for security)
     * @return Metrics DTO
     */
    AutomationExecutionMetrics getExecutionMetrics(Long automationId, Long workspaceId);

    /**
     * Convert AutomationExecution entity to response DTO.
     *
     * @param execution Entity
     * @return Response DTO with all details
     */
    AutomationExecutionResponse convertToResponse(AutomationExecution execution);

    /**
     * Execution Metrics DTO
     */
    class AutomationExecutionMetrics {
        public Long totalExecutions;
        public Long completedExecutions;
        public Long failedExecutions;
        public Long waitingExecutions;
        public Long runningExecutions;
        public Long pendingExecutions;

        public Double successRate;  // 0.0 to 100.0
        public Long averageDurationSeconds;
        public Long minDurationSeconds;
        public Long maxDurationSeconds;

        public AutomationExecutionMetrics(
                Long totalExecutions,
                Long completedExecutions,
                Long failedExecutions,
                Long waitingExecutions,
                Long runningExecutions,
                Long pendingExecutions,
                Double successRate,
                Long averageDurationSeconds,
                Long minDurationSeconds,
                Long maxDurationSeconds
        ) {
            this.totalExecutions = totalExecutions;
            this.completedExecutions = completedExecutions;
            this.failedExecutions = failedExecutions;
            this.waitingExecutions = waitingExecutions;
            this.runningExecutions = runningExecutions;
            this.pendingExecutions = pendingExecutions;
            this.successRate = successRate;
            this.averageDurationSeconds = averageDurationSeconds;
            this.minDurationSeconds = minDurationSeconds;
            this.maxDurationSeconds = maxDurationSeconds;
        }
    }
}
