package com.arjun.crm.controller;

import com.arjun.crm.dto.response.AutomationExecutionResponse;
import com.arjun.crm.service.automation.AutomationExecutionQueryService;
import com.arjun.crm.service.automation.AutomationExecutionQueryService.AutomationExecutionMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * AutomationExecutionController - PHASE 8: Monitoring Dashboard
 *
 * REST API endpoints for automation execution monitoring.
 *
 * Endpoints:
 * - GET /api/automations/{automationId}/executions - List executions for automation
 * - GET /api/automations/{automationId}/executions/{executionId} - Get execution details
 * - GET /api/automations/{automationId}/executions/metrics - Get execution metrics
 * - GET /api/leads/{leadId}/executions - List executions for lead
 *
 * All endpoints enforce workspace isolation and pagination.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class AutomationExecutionController {

    private final AutomationExecutionQueryService executionQueryService;

    /**
     * GET /api/automations/{automationId}/executions
     *
     * Get all executions for an automation with pagination.
     *
     * Query Parameters:
     * - page: 0-indexed page number (default: 0)
     * - size: page size (default: 20)
     * - sort: field to sort by (default: createdAt,desc)
     *
     * Response:
     * {
     *   "content": [...],
     *   "totalElements": 245,
     *   "totalPages": 13,
     *   "currentPage": 0,
     *   "size": 20
     * }
     */
    @GetMapping("/automations/{automationId}/executions")
    public ResponseEntity<Page<AutomationExecutionResponse>> getExecutionsByAutomation(
            @PathVariable Long automationId,
            @RequestParam Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        try {
            log.info("Fetching executions for automation: {}, workspace: {}, page: {}, size: {}", automationId, workspaceId, page, size);

            // Create pageable with sorting
            Sort.Direction direction = Sort.Direction.fromString(sortDirection.toUpperCase());
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            // Fetch executions
            Page<AutomationExecutionResponse> executions = executionQueryService
                    .getExecutionsByAutomation(automationId, workspaceId, pageable);

            log.info("Retrieved {} executions for automation {}", executions.getContent().size(), automationId);
            return ResponseEntity.ok(executions);

        } catch (Exception e) {
            log.error("Error fetching executions for automation {}: {}", automationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/automations/{automationId}/executions/{executionId}
     *
     * Get detailed information about a specific execution.
     *
     * Includes:
     * - Execution status and timeline
     * - Lead information
     * - All steps with their status
     * - Error details (if failed)
     * - Progress percentage
     *
     * Response:
     * {
     *   "id": 123,
     *   "automationName": "Welcome Email",
     *   "leadEmail": "john@example.com",
     *   "status": "COMPLETED",
     *   "progress": 100,
     *   "steps": [...],
     *   ...
     * }
     */
    @GetMapping("/automations/{automationId}/executions/{executionId}")
    public ResponseEntity<AutomationExecutionResponse> getExecution(
            @PathVariable Long automationId,
            @PathVariable Long executionId,
            @RequestParam Long workspaceId
    ) {
        try {
            log.info("Fetching execution: {} for automation: {}, workspace: {}", executionId, automationId, workspaceId);

            // Fetch execution
            Optional<AutomationExecutionResponse> execution = executionQueryService
                    .getExecutionById(executionId, workspaceId);

            if (execution.isEmpty()) {
                log.warn("Execution not found: {}", executionId);
                return ResponseEntity.notFound().build();
            }

            log.info("Retrieved execution: {} with status: {}", executionId, execution.get().getStatus());
            return ResponseEntity.ok(execution.get());

        } catch (Exception e) {
            log.error("Error fetching execution {}: {}", executionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/automations/{automationId}/executions/metrics
     *
     * Get execution metrics for an automation.
     *
     * Metrics Include:
     * - Total executions
     * - Completed/Failed/Waiting/Running counts
     * - Success rate percentage
     * - Average/Min/Max duration
     *
     * Response:
     * {
     *   "totalExecutions": 1245,
     *   "completedExecutions": 1200,
     *   "failedExecutions": 25,
     *   "waitingExecutions": 15,
     *   "successRate": 96.39,
     *   "averageDurationSeconds": 300,
     *   "minDurationSeconds": 5,
     *   "maxDurationSeconds": 3600
     * }
     */
    @GetMapping("/automations/{automationId}/executions/metrics")
    public ResponseEntity<AutomationExecutionMetrics> getExecutionMetrics(
            @PathVariable Long automationId,
            @RequestParam Long workspaceId
    ) {
        try {
            log.info("Fetching metrics for automation: {}, workspace: {}", automationId, workspaceId);

            // Fetch metrics
            AutomationExecutionMetrics metrics = executionQueryService
                    .getExecutionMetrics(automationId, workspaceId);

            log.info("Retrieved metrics for automation {}: total={}, completed={}, failed={}",
                    automationId, metrics.totalExecutions, metrics.completedExecutions, metrics.failedExecutions);

            return ResponseEntity.ok(metrics);

        } catch (Exception e) {
            log.error("Error fetching metrics for automation {}: {}", automationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/leads/{leadId}/executions
     *
     * Get all executions for a lead with pagination.
     *
     * Used for lead detail view to show all automations that have run for this lead.
     *
     * Query Parameters:
     * - page: 0-indexed page number (default: 0)
     * - size: page size (default: 20)
     * - sort: field to sort by (default: createdAt,desc)
     *
     * Response:
     * {
     *   "content": [...],
     *   "totalElements": 15,
     *   "totalPages": 1,
     *   "currentPage": 0,
     *   "size": 20
     * }
     */
    @GetMapping("/leads/{leadId}/executions")
    public ResponseEntity<Page<AutomationExecutionResponse>> getExecutionsByLead(
            @PathVariable Long leadId,
            @RequestParam Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        try {
            log.info("Fetching executions for lead: {}, workspace: {}, page: {}, size: {}", leadId, workspaceId, page, size);

            // Create pageable with sorting
            Sort.Direction direction = Sort.Direction.fromString(sortDirection.toUpperCase());
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            // Fetch executions
            Page<AutomationExecutionResponse> executions = executionQueryService
                    .getExecutionsByLead(leadId, workspaceId, pageable);

            log.info("Retrieved {} executions for lead {}", executions.getContent().size(), leadId);
            return ResponseEntity.ok(executions);

        } catch (Exception e) {
            log.error("Error fetching executions for lead {}: {}", leadId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Health check endpoint for monitoring
     */
    @GetMapping("/automations/executions/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Automation execution monitoring is operational");
    }
}
