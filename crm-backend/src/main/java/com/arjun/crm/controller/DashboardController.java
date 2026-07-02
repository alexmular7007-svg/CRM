package com.arjun.crm.controller;

import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.DashboardOverviewResponse;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DashboardController {

    private final DashboardService dashboardService;
    private final WorkspaceAuthorizationService workspaceAuthService;

    /**
     * Get dashboard overview
     * GET /api/dashboard/overview?workspaceId={id}
     * Note: workspaceId parameter is optional for multi-workspace support
     */
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<DashboardOverviewResponse>> getDashboardOverview(
            @RequestParam(required = false) Long workspaceId) {
        
        // If workspaceId provided, validate access; otherwise use user's default workspace
        if (workspaceId != null) {
            workspaceAuthService.validateWorkspaceAccess(workspaceId);
        }
        
        DashboardOverviewResponse response = dashboardService.getDashboardOverview(workspaceId);
        return ResponseEntity.ok(ApiResponse.success("Dashboard overview retrieved successfully", response));
    }
}
