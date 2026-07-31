package com.arjun.crm.service.impl;

import com.arjun.crm.dto.response.DashboardOverviewResponse;
import com.arjun.crm.entity.User;
import com.arjun.crm.enums.ProjectStatus;
import com.arjun.crm.enums.TaskStatus;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.*;
import com.arjun.crm.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final NotificationRepository notificationRepository;
    private final TaskActivityRepository taskActivityRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "dashboard", key = "#workspaceId + '_' + @dashboardServiceImpl.getAuthenticatedUser().id")
    public DashboardOverviewResponse getDashboardOverview(Long workspaceId) {
        User currentUser = getAuthenticatedUser();
        
        if (workspaceId == null) {
            log.error("❌ getDashboardOverview called with NULL workspaceId for user: {}", currentUser.getEmail());
            return DashboardOverviewResponse.builder()
                    .taskStatistics(DashboardOverviewResponse.TaskStatistics.builder()
                            .totalTasks(0L)
                            .completedTasks(0L)
                            .overdueTasks(0L)
                            .inProgressTasks(0L)
                            .completionRate(0.0)
                            .build())
                    .projectStatistics(DashboardOverviewResponse.ProjectStatistics.builder()
                            .totalProjects(0L)
                            .activeProjects(0L)
                            .completedProjects(0L)
                            .averageProgress(0.0)
                            .build())
                    .notificationStatistics(DashboardOverviewResponse.NotificationStatistics.builder()
                            .unreadCount(0L)
                            .totalCount(0L)
                            .build())
                    .activityStatistics(DashboardOverviewResponse.ActivityStatistics.builder()
                            .todayActivities(0L)
                            .weekActivities(0L)
                            .monthActivities(0L)
                            .build())
                    .userProductivity(DashboardOverviewResponse.UserProductivity.builder()
                            .tasksCompleted(0L)
                            .commentsPosted(0L)
                            .messagesSet(0L)
                            .activityScore(0.0)
                            .build())
                    .build();
        }
        
        log.info("Fetching dashboard overview for workspace: {} and user: {}", workspaceId, currentUser.getEmail());

        // OPTIMIZED: Get all task statistics in ONE query
        Map<String, Long> taskStats = taskRepository.getWorkspaceTaskStatistics(workspaceId);
        Long totalTasks = taskStats.getOrDefault("total", 0L);
        Long completedTasks = taskStats.getOrDefault("completed", 0L);
        Long inProgressTasks = taskStats.getOrDefault("inProgress", 0L);
        Long overdueTasks = (long) taskRepository.findOverdueTasksByWorkspace(workspaceId, LocalDate.now()).size();
        Double completionRate = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0.0;

        DashboardOverviewResponse.TaskStatistics taskStatsResponse = DashboardOverviewResponse.TaskStatistics.builder()
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .inProgressTasks(inProgressTasks)
                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                .build();

        // OPTIMIZED: Get all project statistics in ONE query
        Map<String, Long> projectStats = projectRepository.getWorkspaceProjectStatistics(workspaceId);
        Long totalProjects = projectStats.getOrDefault("total", 0L);
        Long activeProjects = projectStats.getOrDefault("active", 0L);
        Long completedProjects = projectStats.getOrDefault("completed", 0L);
        Double averageProgress = 0.0;

        DashboardOverviewResponse.ProjectStatistics projectStatsResponse = DashboardOverviewResponse.ProjectStatistics.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .completedProjects(completedProjects)
                .averageProgress(averageProgress)
                .build();

        // OPTIMIZED: Get all notification statistics in ONE query
        Map<String, Long> notificationStats = notificationRepository.getNotificationStatistics(currentUser.getId());
        Long unreadNotifications = notificationStats.getOrDefault("unread", 0L);
        Long totalNotifications = notificationStats.getOrDefault("total", 0L);

        DashboardOverviewResponse.NotificationStatistics notificationStatsResponse = DashboardOverviewResponse.NotificationStatistics.builder()
                .unreadCount(unreadNotifications)
                .totalCount(totalNotifications)
                .build();

        // OPTIMIZED: Get all activity statistics in ONE query
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime weekAgo = today.minusDays(7);
        LocalDateTime monthAgo = today.minusDays(30);

        Map<String, Long> activityStats = taskActivityRepository.getActivityStatistics(today, weekAgo, monthAgo);
        Long todayActivities = activityStats.getOrDefault("today", 0L);
        Long weekActivities = activityStats.getOrDefault("week", 0L);
        Long monthActivities = activityStats.getOrDefault("month", 0L);

        DashboardOverviewResponse.ActivityStatistics activityStatsResponse = DashboardOverviewResponse.ActivityStatistics.builder()
                .todayActivities(todayActivities)
                .weekActivities(weekActivities)
                .monthActivities(monthActivities)
                .build();

        // OPTIMIZED: Get all user productivity statistics in ONE query
        Map<String, Long> userProductivityStats = taskRepository.getUserProductivityStatistics(currentUser.getId());
        Long userTasksCompleted = userProductivityStats.getOrDefault("tasksCompleted", 0L);
        Long userComments = userProductivityStats.getOrDefault("comments", 0L);
        Long userMessages = userProductivityStats.getOrDefault("messages", 0L);
        Double activityScore = calculateActivityScore(userTasksCompleted, userComments, userMessages);

        DashboardOverviewResponse.UserProductivity userProductivity = DashboardOverviewResponse.UserProductivity.builder()
                .tasksCompleted(userTasksCompleted)
                .commentsPosted(userComments)
                .messagesSet(userMessages)
                .activityScore(activityScore)
                .build();

        return DashboardOverviewResponse.builder()
                .taskStatistics(taskStatsResponse)
                .projectStatistics(projectStatsResponse)
                .notificationStatistics(notificationStatsResponse)
                .activityStatistics(activityStatsResponse)
                .userProductivity(userProductivity)
                .build();
    }

    private Double calculateActivityScore(Long tasks, Long comments, Long messages) {
        // Simple scoring: tasks * 3 + comments * 2 + messages * 1
        return (tasks * 3.0 + comments * 2.0 + messages * 1.0);
    }

    public User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
