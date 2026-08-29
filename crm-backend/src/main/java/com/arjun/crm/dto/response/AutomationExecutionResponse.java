package com.arjun.crm.dto.response;

import com.arjun.crm.enums.AutomationExecutionStatus;
import com.arjun.crm.enums.AutomationStepType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * AutomationExecutionResponse - PHASE 8: Monitoring Dashboard
 *
 * DTO for returning automation execution details to frontend.
 * Used by monitoring dashboard to display execution status, timeline, and step details.
 *
 * Response Structure:
 * {
 *   "id": 123,
 *   "automationId": 456,
 *   "automationName": "Welcome Email Sequence",
 *   "leadId": 789,
 *   "leadEmail": "john@example.com",
 *   "leadName": "John Doe",
 *   "status": "COMPLETED",
 *   "currentStep": 4,
 *   "totalSteps": 5,
 *   "progress": 80,
 *   "startedAt": "2026-08-24T10:30:00",
 *   "completedAt": "2026-08-24T10:35:00",
 *   "duration": "5 minutes",
 *   "error": null,
 *   "failedStepId": null,
 *   "steps": [
 *     {
 *       "stepOrder": 1,
 *       "stepType": "SEND_EMAIL",
 *       "status": "COMPLETED",
 *       "executedAt": "2026-08-24T10:30:30"
 *     },
 *     ...
 *   ]
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AutomationExecutionResponse {

    // Execution Identity
    private Long id;
    private Long automationId;
    private String automationName;
    private Long leadId;
    private String leadEmail;
    private String leadName;

    // Status
    private AutomationExecutionStatus status;
    private String statusLabel;  // Human-readable: "Completed", "Running", etc.

    // Progress
    private Integer currentStep;
    private Integer totalSteps;
    private Integer progress;  // Percentage: 0-100

    // Timeline
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime pausedAt;
    private LocalDateTime resumeAt;

    // Duration
    private String duration;  // Human-readable: "5 minutes", "2 hours", etc.
    private Long durationSeconds;  // Machine-readable: seconds

    // Error Details
    private String error;
    private Long failedStepId;

    // Steps Breakdown
    private List<ExecutionStepResponse> steps;

    /**
     * Nested DTO for step details
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ExecutionStepResponse {

        private Long stepId;
        private Integer stepOrder;
        private AutomationStepType stepType;
        private String stepTypeLabel;  // Human-readable: "Send Email", "Update Lead", etc.
        private Boolean enabled;

        // Step Execution Status
        private String status;  // PENDING, COMPLETED, FAILED, SKIPPED, WAITING
        private String statusLabel;

        // Step Timing
        private LocalDateTime executedAt;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        private String duration;  // Human-readable duration
        private Long durationMs;  // Milliseconds

        // Step Error (if failed)
        private String error;

        // Step Configuration (for display)
        private Map<String, Object> configuration;

        // Step Result (for certain types)
        private Map<String, Object> result;  // e.g., email sent count, lead fields updated
    }
}
