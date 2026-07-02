package com.arjun.crm.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for AI task prioritization
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskPrioritizationResponse {
    private Long taskId;
    private String suggestedPriority;
    private Double confidence;  // Confidence score (0.0-1.0)
    private String reasoning;
    private Double riskScore;
    private String recommendation;
    @Builder.Default
    private Boolean aiUnavailable = false;  // Flag indicating if AI service was unavailable
}
