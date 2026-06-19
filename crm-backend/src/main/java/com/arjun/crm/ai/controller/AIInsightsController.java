package com.arjun.crm.ai.controller;

import com.arjun.crm.ai.dto.response.ProductivityInsightsResponse;
import com.arjun.crm.ai.service.AIInsightsService;
import com.arjun.crm.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for AI-powered user insights.
 * Handles the /api/ai/insights/* endpoints.
 */
@RestController
@RequestMapping("/api/ai/insights")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class AIInsightsController {

    private final AIInsightsService aiInsightsService;

    /**
     * Get AI productivity insights for the currently authenticated user.
     * GET /api/ai/insights/productivity
     */
    @GetMapping("/productivity")
    public ResponseEntity<ApiResponse<ProductivityInsightsResponse>> getProductivityInsights() {
        try {
            ProductivityInsightsResponse response = aiInsightsService.getProductivityInsights();
            return ResponseEntity.ok(ApiResponse.success(
                    "Productivity insights retrieved successfully", response));
        } catch (Exception e) {
            log.error("Failed to retrieve productivity insights: {}", e.getMessage(), e);
            // Return a safe fallback so the Analytics page never breaks
            ProductivityInsightsResponse fallback = ProductivityInsightsResponse.builder()
                    .productivityScore(0.0)
                    .overallAssessment("AI insights are temporarily unavailable.")
                    .strengths(java.util.List.of())
                    .improvements(java.util.List.of())
                    .recommendations(java.util.List.of())
                    .trend("STABLE")
                    .build();
            return ResponseEntity.status(HttpStatus.OK)
                    .body(ApiResponse.success("Productivity insights (fallback)", fallback));
        }
    }
}
