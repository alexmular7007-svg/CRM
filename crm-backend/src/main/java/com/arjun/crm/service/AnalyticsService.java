package com.arjun.crm.service;

import com.arjun.crm.dto.response.ActivityAnalyticsResponse;
import com.arjun.crm.dto.response.TaskAnalyticsResponse;
import com.arjun.crm.dto.response.TeamPerformanceResponse;

import java.time.LocalDate;

public interface AnalyticsService {
    
    /**
     * Get task analytics for a specific workspace
     */
    TaskAnalyticsResponse getTaskAnalytics(Long workspaceId, LocalDate startDate, LocalDate endDate);
    
    /**
     * Get team performance analytics for a specific workspace
     */
    TeamPerformanceResponse getTeamPerformance(Long workspaceId, LocalDate startDate, LocalDate endDate);
    
    /**
     * Get activity analytics for a specific workspace
     */
    ActivityAnalyticsResponse getActivityAnalytics(Long workspaceId, LocalDate startDate, LocalDate endDate);
    
    /**
     * Get recent activities for a specific workspace
     */
    Object getRecentActivities(Long workspaceId, int limit);
}
