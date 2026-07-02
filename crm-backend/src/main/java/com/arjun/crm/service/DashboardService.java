package com.arjun.crm.service;

import com.arjun.crm.dto.response.DashboardOverviewResponse;

public interface DashboardService {
    
    /**
     * Get dashboard overview with all statistics for a specific workspace
     */
    DashboardOverviewResponse getDashboardOverview(Long workspaceId);
}
