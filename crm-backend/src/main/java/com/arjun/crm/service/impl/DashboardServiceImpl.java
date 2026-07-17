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
            // Return empty response instead of processing with null
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

        // Task Statistics - WORKSPACE SCOPED
        Long totalTasks = taskRepository.countByWorkspaceId(workspaceId);
        Long completedTasks = taskRepository.countByWorkspaceIdAndStatus(workspaceId, TaskStatus.DONE);
        Long overdueTasks = (long) taskRepository.findOverdueTasksByWorkspace(workspaceId, LocalDate.now()).size();
        Long inProgressTasks = taskRepository.countByWorkspaceIdAndStatus(workspaceId, TaskStatus.IN_PROGRESS);
        Double completionRate = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0.0;

        DashboardOverviewResponse.TaskStatistics taskStats = DashboardOverviewResponse.TaskStatistics.builder()
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .inProgressTasks(inProgressTasks)
                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                .build();

        // Project Statistics - WORKSPACE SCOPED
        Long totalProjects = projectRepository.countByWorkspaceId(workspaceId);
        Long activeProjects = projectRepository.countByWorkspaceIdAndStatus(workspaceId, ProjectStatus.ACTIVE);
        Long completedProjects = projectRepository.countByWorkspaceIdAndStatus(workspaceId, ProjectStatus.COMPLETED);
        Double averageProgress = 0.0;

        DashboardOverviewResponse.ProjectStatistics projectStats = DashboardOverviewResponse.ProjectStatistics.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .completedProjects(completedProjects)
                .averageProgress(averageProgress)
                .build();

        // Notification Statistics
        Long unreadNotifications = notificationRepository.countByRecipientIdAndIsReadFalse(currentUser.getId());
        Long totalNotifications = notificationRepository.countByRecipientIdOrderByCreatedAtDesc(currentUser.getId());

        DashboardOverviewResponse.NotificationStatistics notificationStats = DashboardOverviewResponse.NotificationStatistics.builder()
                .unreadCount(unreadNotifications)
                .totalCount(totalNotifications)
                .build();

        // Activity Statistics
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime weekAgo = today.minusDays(7);
        LocalDateTime monthAgo = today.minusDays(30);

        Long todayActivities = taskActivityRepository.countByCreatedAtAfter(today);
        Long weekActivities = taskActivityRepository.countByCreatedAtAfter(weekAgo);
        Long monthActivities = taskActivityRepository.countByCreatedAtAfter(monthAgo);

        DashboardOverviewResponse.ActivityStatistics activityStats = DashboardOverviewResponse.ActivityStatistics.builder()
                .todayActivities(todayActivities)
                .weekActivities(weekActivities)
                .monthActivities(monthActivities)
                .build();

        // User Productivity - Count tasks ASSIGNED to user and completed (not created by)
        Long userTasksCompleted = taskRepository.countByAssignedToIdAndStatus(currentUser.getId(), TaskStatus.DONE);
        Long userComments = taskCommentRepository.countByUserId(currentUser.getId());
        Long userMessages = chatMessageRepository.countBySenderId(currentUser.getId());
        Double activityScore = calculateActivityScore(userTasksCompleted, userComments, userMessages);

        DashboardOverviewResponse.UserProductivity userProductivity = DashboardOverviewResponse.UserProductivity.builder()
                .tasksCompleted(userTasksCompleted)
                .commentsPosted(userComments)
                .messagesSet(userMessages)
                .activityScore(activityScore)
                .build();

        return DashboardOverviewResponse.builder()
                .taskStatistics(taskStats)
                .projectStatistics(projectStats)
                .notificationStatistics(notificationStats)
                .activityStatistics(activityStats)
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
