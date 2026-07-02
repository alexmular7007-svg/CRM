package com.arjun.crm.ai.controller;

import com.arjun.crm.ai.dto.response.ProductivityInsightsResponse;
import com.arjun.crm.dto.response.WorkspaceInsightsResponse;
import com.arjun.crm.ai.service.AIInsightsService;
import com.arjun.crm.service.AIInsightService;
import com.arjun.crm.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for AI-powered user insights.
 * Handles the /api/ai/insights/* endpoints.
 * 
 * All endpoints gracefully handle AI service unavailability.
 * AI failures never cause HTTP 500 errors - fallback responses are returned instead.
 */
@RestController
@RequestMapping("/api/ai/insights")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class AIInsightsController {

    private final AIInsightsService aiInsightsService;
    private final AIInsightService aiInsightService;

    /**
     * Get AI productivity insights for the currently authenticated user.
     * GET /api/ai/insights/productivity
     * 
     * Returns HTTP 200 even if AI service is unavailable (with fallback response)
     */
    @GetMapping("/productivity")
    public ResponseEntity<ApiResponse<ProductivityInsightsResponse>> getProductivityInsights() {
        try {
            log.info("Productivity insights request");
            ProductivityInsightsResponse response = aiInsightsService.getProductivityInsights();
            
            String message = Boolean.TRUE.equals(response.getAiUnavailable())
                    ? "AI service temporarily unavailable. Using fallback insights."
                    : "Productivity insights retrieved successfully";
            
            return ResponseEntity.ok(ApiResponse.success(message, response));
        } catch (Exception e) {
            log.error("Unexpected error in productivity insights: {}", e.getMessage(), e);
            // Should not reach here due to service-level error handling, but just in case
            ProductivityInsightsResponse fallback = ProductivityInsightsResponse.builder()
                    .productivityScore(0.0)
                    .overallAssessment("AI insights are temporarily unavailable.")
                    .strengths(java.util.List.of())
                    .improvements(java.util.List.of())
                    .recommendations(java.util.List.of())
                    .trend("STABLE")
                    .aiUnavailable(true)
                    .build();
            return ResponseEntity.ok(ApiResponse.success("AI service temporarily unavailable", fallback));
        }
    }

    /**
     * Get comprehensive workspace insights dashboard.
     * GET /api/ai/insights/dashboard/{workspaceId}
     * 
     * Returns unified AI insights including:
     * - Workspace health score
     * - Project risks & predictions
     * - Team workload analysis
     * - CRM opportunity insights
     * - AI-generated recommendations
     * - Weekly summary & trends
     * 
     * @param workspaceId workspace ID to fetch insights for
     * @param refresh force refresh ignoring cache (optional query param)
     */
    @GetMapping("/dashboard/{workspaceId}")
    public ResponseEntity<ApiResponse<WorkspaceInsightsResponse>> getWorkspaceInsights(
            @PathVariable Long workspaceId,
            @RequestParam(name = "refresh", defaultValue = "false") boolean forceRefresh) {
        try {
            log.info("Workspace insights dashboard request for workspace: {}, forceRefresh: {}", workspaceId, forceRefresh);
            WorkspaceInsightsResponse response = aiInsightService.getWorkspaceInsights(workspaceId, forceRefresh);
            return ResponseEntity.ok(ApiResponse.success("Workspace insights retrieved successfully", response));
        } catch (Exception e) {
            log.error("Error fetching workspace insights for workspace {}: {}", workspaceId, e.getMessage(), e);
            throw e;
        }
    }
}
