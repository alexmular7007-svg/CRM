package com.arjun.crm.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for AI deadline prediction
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeadlinePredictionResponse {
    private Long taskId;
    private LocalDate predictedDeadline;
    private LocalDate suggestedDeadline;
    private Integer estimatedDays;
    private Double confidence;  // Confidence score (0.0-1.0)
    private Double confidenceLevel;
    private String reasoning;
    private String riskAssessment;
    private String recommendation;
    @Builder.Default
    private Boolean aiUnavailable = false;  // Flag indicating if AI service was unavailable
}
