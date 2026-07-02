package com.arjun.crm.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for AI productivity insights
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductivityInsightsResponse {
    private Double productivityScore;
    private String overallAssessment;
    private List<String> strengths;
    private List<String> improvements;
    private List<String> recommendations;
    private String trend;
    @Builder.Default
    private Boolean aiUnavailable = false;  // Flag indicating if AI service was unavailable
}
