package com.arjun.crm.controller;

import com.arjun.crm.dto.response.ActivityAnalyticsResponse;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.TaskAnalyticsResponse;
import com.arjun.crm.dto.response.TeamPerformanceResponse;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final WorkspaceAuthorizationService workspaceAuthService;

    /**
     * Get task analytics
     * GET /api/analytics/tasks?workspaceId={id}&startDate={date}&endDate={date}
     */
    @GetMapping("/tasks")
    public ResponseEntity<ApiResponse<TaskAnalyticsResponse>> getTaskAnalytics(
            @RequestParam Long workspaceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        try {
            TaskAnalyticsResponse response = analyticsService.getTaskAnalytics(workspaceId, startDate, endDate);
            return ResponseEntity.ok(ApiResponse.success("Task analytics retrieved successfully", response));
        } catch (Exception e) {
            log.error("Failed to retrieve task analytics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve task analytics: " + e.getMessage()));
        }
    }

    /**
     * Get team performance analytics
     * GET /api/analytics/team?workspaceId={id}&startDate={date}&endDate={date}
     */
    @GetMapping("/team")
    public ResponseEntity<ApiResponse<TeamPerformanceResponse>> getTeamPerformance(
            @RequestParam Long workspaceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        try {
            TeamPerformanceResponse response = analyticsService.getTeamPerformance(workspaceId, startDate, endDate);
            return ResponseEntity.ok(ApiResponse.success("Team performance retrieved successfully", response));
        } catch (Exception e) {
            log.error("Failed to retrieve team performance: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve team performance: " + e.getMessage()));
        }
    }

    /**
     * Get activity analytics
     * GET /api/analytics/activity?workspaceId={id}&startDate={date}&endDate={date}
     */
    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<ActivityAnalyticsResponse>> getActivityAnalytics(
            @RequestParam Long workspaceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        try {
            ActivityAnalyticsResponse response = analyticsService.getActivityAnalytics(workspaceId, startDate, endDate);
            return ResponseEntity.ok(ApiResponse.success("Activity analytics retrieved successfully", response));
        } catch (Exception e) {
            log.error("Failed to retrieve activity analytics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve activity analytics: " + e.getMessage()));
        }
    }

    /**
     * Get recent activities for dashboard
     * GET /api/analytics/recent?workspaceId={id}&limit={limit}
     */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<Object>> getRecentActivities(
            @RequestParam Long workspaceId,
            @RequestParam(defaultValue = "10") int limit) {
        
        // Validate workspace access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        try {
            Object response = analyticsService.getRecentActivities(workspaceId, limit);
            return ResponseEntity.ok(ApiResponse.success("Recent activities retrieved successfully", response));
        } catch (Exception e) {
            log.error("Failed to retrieve recent activities: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve recent activities: " + e.getMessage()));
        }
    }
}
