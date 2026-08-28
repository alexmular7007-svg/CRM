package com.arjun.crm.service.automation.impl;

import com.arjun.crm.dto.response.AutomationExecutionResponse;
import com.arjun.crm.dto.response.AutomationExecutionResponse.ExecutionStepResponse;
import com.arjun.crm.entity.AutomationExecution;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.enums.AutomationExecutionStatus;
import com.arjun.crm.repository.AutomationExecutionRepository;
import com.arjun.crm.repository.AutomationRepository;
import com.arjun.crm.repository.AutomationStepRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.automation.AutomationExecutionQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * AutomationExecutionQueryServiceImpl - PHASE 8: Monitoring Dashboard
 *
 * Implementation of query service for automation execution monitoring.
 *
 * Responsibilities:
 * 1. Query execution data from database
 * 2. Convert entities to DTOs for API responses
 * 3. Calculate metrics (success rate, duration, counts)
 * 4. Format data for frontend display
 * 5. Enforce workspace isolation
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AutomationExecutionQueryServiceImpl implements AutomationExecutionQueryService {

    private final AutomationExecutionRepository executionRepository;
    private final AutomationRepository automationRepository;
    private final AutomationStepRepository stepRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;

    @Override
    public Optional<AutomationExecutionResponse> getExecutionById(Long executionId, Long workspaceId) {
        try {
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
            Optional<AutomationExecution> execution = executionRepository.findByIdAndWorkspaceId(executionId, workspaceId);

            if (execution.isEmpty()) {
                return Optional.empty();
            }

            // Verify workspace isolation
            AutomationExecution exec = execution.get();
            if (!exec.getAutomation().getWorkspace().getId().equals(workspaceId)) {
                log.warn("Unauthorized access to execution {} from workspace {}", executionId, workspaceId);
                return Optional.empty();
            }

            return Optional.of(convertToResponse(exec));

        } catch (Exception e) {
            log.error("Error fetching execution {}", executionId, e);
            return Optional.empty();
        }
    }

    @Override
    public Page<AutomationExecutionResponse> getExecutionsByAutomation(
            Long automationId,
            Long workspaceId,
            Pageable pageable
    ) {
        try {
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
            if (automationRepository.findByIdAndWorkspaceId(automationId, workspaceId).isEmpty()) {
                return Page.empty(pageable);
            }
            Page<AutomationExecution> executions = executionRepository
                    .findByAutomationIdAndWorkspaceId(automationId, workspaceId, pageable);

            return executions.map(this::convertToResponse);

        } catch (Exception e) {
            log.error("Error fetching executions for automation {}", automationId, e);
            return Page.empty(pageable);
        }
    }

    @Override
    public Page<AutomationExecutionResponse> getExecutionsByLead(
            Long leadId,
            Long workspaceId,
            Pageable pageable
    ) {
        try {
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
            Page<AutomationExecution> executions = executionRepository
                    .findByLeadIdAndWorkspaceId(leadId, workspaceId, pageable);

            return executions.map(this::convertToResponse);

        } catch (Exception e) {
            log.error("Error fetching executions for lead {}", leadId, e);
            return Page.empty(pageable);
        }
    }

    @Override
    public AutomationExecutionMetrics getExecutionMetrics(Long automationId, Long workspaceId) {
        try {
            // These queries would need to be added to AutomationExecutionRepository
            // For now, returning placeholder implementation

            long totalExecutions = 0;
            long completedExecutions = 0;
            long failedExecutions = 0;
            long waitingExecutions = 0;
            long runningExecutions = 0;
            long pendingExecutions = 0;
            Double successRate = 0.0;
            Long averageDurationSeconds = 0L;
            Long minDurationSeconds = 0L;
            Long maxDurationSeconds = 0L;

            return new AutomationExecutionMetrics(
                    totalExecutions,
                    completedExecutions,
                    failedExecutions,
                    waitingExecutions,
                    runningExecutions,
                    pendingExecutions,
                    successRate,
                    averageDurationSeconds,
                    minDurationSeconds,
                    maxDurationSeconds
            );

        } catch (Exception e) {
            log.error("Error calculating metrics for automation {}", automationId, e);
            return new AutomationExecutionMetrics(0L, 0L, 0L, 0L, 0L, 0L, 0.0, 0L, 0L, 0L);
        }
    }

    @Override
    public AutomationExecutionResponse convertToResponse(AutomationExecution execution) {
        try {
            // Get automation info
            String automationName = execution.getAutomation() != null ? execution.getAutomation().getName() : "Unknown";

            // Get lead info
            String leadEmail = execution.getLead() != null ? execution.getLead().getEmail() : null;
            String leadName = execution.getLead() != null ? execution.getLead().getName() : null;

            // Calculate progress
            Integer progress = calculateProgress(execution);

            // Calculate duration
            String duration = calculateDuration(execution);
            Long durationSeconds = calculateDurationSeconds(execution);

            // Get steps
                List<AutomationStep> steps = stepRepository.findByAutomationIdAndWorkspaceIdOrderByStepOrder(
                    execution.getAutomation().getId(), execution.getAutomation().getWorkspace().getId());

            List<ExecutionStepResponse> stepResponses = steps.stream()
                    .map(step -> convertStepToResponse(step, execution))
                    .collect(Collectors.toList());

            return AutomationExecutionResponse.builder()
                    .id(execution.getId())
                    .automationId(execution.getAutomation().getId())
                    .automationName(automationName)
                    .leadId(execution.getLead() != null ? execution.getLead().getId() : null)
                    .leadEmail(leadEmail)
                    .leadName(leadName)
                    .status(execution.getStatus())
                    .statusLabel(getStatusLabel(execution.getStatus()))
                    .currentStep(execution.getCurrentStep())
                    .totalSteps(steps.size())
                    .progress(progress)
                    .createdAt(execution.getCreatedAt())
                    .startedAt(execution.getStartedAt())
                    .completedAt(execution.getCompletedAt())
                    .pausedAt(execution.getPausedAt())
                    .resumeAt(execution.getResumeAt())
                    .duration(duration)
                    .durationSeconds(durationSeconds)
                    .error(execution.getError())
                    .failedStepId(execution.getFailedStepId())
                    .steps(stepResponses)
                    .build();

        } catch (Exception e) {
            log.error("Error converting execution {} to response", execution.getId(), e);
            throw new RuntimeException("Error converting execution", e);
        }
    }

    /**
     * Convert AutomationStep to ExecutionStepResponse.
     * Determines step status based on execution currentStep and status.
     */
    private ExecutionStepResponse convertStepToResponse(AutomationStep step, AutomationExecution execution) {
        String stepStatus = determineStepStatus(step, execution);

        return ExecutionStepResponse.builder()
                .stepId(step.getId())
                .stepOrder(step.getStepOrder())
                .stepType(step.getType())
                .stepTypeLabel(getStepTypeLabel(step.getType()))
                .enabled(step.getEnabled())
                .status(stepStatus)
                .statusLabel(getStepStatusLabel(stepStatus))
                .configuration(step.getConfiguration())
                .build();
    }

    /**
     * Determine step status based on execution state.
     *
     * Logic:
     * - If currentStep < stepOrder: PENDING
     * - If currentStep == stepOrder && status == RUNNING: RUNNING
     * - If currentStep == stepOrder && status == WAITING: WAITING
     * - If currentStep > stepOrder: COMPLETED
     * - If failedStepId == step.id: FAILED
     */
    private String determineStepStatus(AutomationStep step, AutomationExecution execution) {
        if (execution.getFailedStepId() != null && execution.getFailedStepId().equals(step.getId())) {
            return "FAILED";
        }

        if (execution.getCurrentStep() == null) {
            return "PENDING";
        }

        if (execution.getCurrentStep() < step.getStepOrder()) {
            return "PENDING";
        } else if (execution.getCurrentStep().equals(step.getStepOrder())) {
            if (execution.getStatus() == AutomationExecutionStatus.WAITING) {
                return "WAITING";
            } else if (execution.getStatus() == AutomationExecutionStatus.RUNNING) {
                return "RUNNING";
            } else {
                return "COMPLETED";
            }
        } else {
            return "COMPLETED";
        }
    }

    /**
     * Calculate execution progress as percentage (0-100).
     */
    private Integer calculateProgress(AutomationExecution execution) {
        if (execution.getCurrentStep() == null) {
            return 0;
        }

        // Query total steps
        long totalSteps = stepRepository.countByAutomationId(execution.getAutomation().getId());

        if (totalSteps == 0) {
            return 0;
        }

        int progress = (int) ((execution.getCurrentStep().doubleValue() / totalSteps) * 100);
        return Math.min(progress, 100);  // Cap at 100%
    }

    /**
     * Calculate human-readable duration string.
     */
    private String calculateDuration(AutomationExecution execution) {
        if (execution.getCompletedAt() == null || execution.getStartedAt() == null) {
            return null;
        }

        long minutes = ChronoUnit.MINUTES.between(execution.getStartedAt(), execution.getCompletedAt());

        if (minutes == 0) {
            long seconds = ChronoUnit.SECONDS.between(execution.getStartedAt(), execution.getCompletedAt());
            return seconds + " seconds";
        } else if (minutes < 60) {
            return minutes + " minutes";
        } else {
            long hours = minutes / 60;
            long remainingMinutes = minutes % 60;
            if (remainingMinutes == 0) {
                return hours + " hours";
            } else {
                return hours + "h " + remainingMinutes + "m";
            }
        }
    }

    /**
     * Calculate duration in seconds.
     */
    private Long calculateDurationSeconds(AutomationExecution execution) {
        if (execution.getCompletedAt() == null || execution.getStartedAt() == null) {
            return null;
        }

        return ChronoUnit.SECONDS.between(execution.getStartedAt(), execution.getCompletedAt());
    }

    /**
     * Get human-readable status label.
     */
    private String getStatusLabel(AutomationExecutionStatus status) {
        return switch (status) {
            case PENDING -> "Pending";
            case RUNNING -> "Running";
            case COMPLETED -> "Completed";
            case FAILED -> "Failed";
            case WAITING -> "Waiting";
        };
    }

    /**
     * Get human-readable step type label.
     */
    private String getStepTypeLabel(Object stepType) {
        return switch (stepType.toString()) {
            case "SEND_EMAIL" -> "Send Email";
            case "UPDATE_LEAD" -> "Update Lead";
            case "UPDATE_LEAD_SCORE" -> "Update Score";
            case "WAIT_DURATION" -> "Wait";
            case "LEAD_STATUS_CONDITION" -> "Check Status";
            case "LEAD_SCORE_CONDITION" -> "Check Score";
            case "EMAIL_OPENED_CONDITION" -> "Check Opened";
            case "EMAIL_CLICKED_CONDITION" -> "Check Clicked";
            default -> stepType.toString();
        };
    }

    /**
     * Get human-readable step status label.
     */
    private String getStepStatusLabel(String status) {
        return switch (status) {
            case "PENDING" -> "Pending";
            case "RUNNING" -> "Running";
            case "COMPLETED" -> "Completed";
            case "FAILED" -> "Failed";
            case "WAITING" -> "Waiting";
            default -> status;
        };
    }
}
