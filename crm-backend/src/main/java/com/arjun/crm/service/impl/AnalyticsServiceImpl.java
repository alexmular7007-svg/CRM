package com.arjun.crm.service.impl;

import com.arjun.crm.dto.response.ActivityAnalyticsResponse;
import com.arjun.crm.dto.response.TaskAnalyticsResponse;
import com.arjun.crm.dto.response.TeamPerformanceResponse;
import com.arjun.crm.enums.TaskPriority;
import com.arjun.crm.enums.TaskStatus;
import com.arjun.crm.repository.*;
import com.arjun.crm.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.arjun.crm.entity.Task;
import com.arjun.crm.entity.LeadActivity;
import com.arjun.crm.entity.TaskActivity;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final TaskRepository taskRepository;
    private final TaskActivityRepository taskActivityRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final LeadActivityRepository leadActivityRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "taskAnalytics", key = "#workspaceId + '_' + #startDate + '_' + #endDate")
    public TaskAnalyticsResponse getTaskAnalytics(Long workspaceId, LocalDate startDate, LocalDate endDate) {
        log.info("Fetching task analytics for workspace {} from {} to {}", workspaceId, startDate, endDate);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        // Basic statistics - WORKSPACE SCOPED
        Long totalTasks = taskRepository.countTasksCreatedBetweenByWorkspace(workspaceId, startDateTime, endDateTime);
        Long completedTasks = taskRepository.countTasksCompletedBetweenByWorkspace(workspaceId, startDateTime, endDateTime);
        Long overdueTasks = (long) taskRepository.findOverdueTasksByWorkspace(workspaceId, LocalDate.now()).size();
        Long inProgressTasks = taskRepository.countByWorkspaceIdAndStatus(workspaceId, TaskStatus.IN_PROGRESS);
        
        Double completionRate = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0.0;
        double averageCompletionDays = 0.0; // Simplified

        // Tasks by status (workspace-scoped)
        Map<TaskStatus, Long> tasksByStatus = new HashMap<>();
        for (TaskStatus status : TaskStatus.values()) {
            Long count = taskRepository.countByWorkspaceIdAndStatus(workspaceId, status);
            tasksByStatus.put(status, count);
        }

        // Tasks by priority (simplified - return 0 for now)
        Map<TaskPriority, Long> tasksByPriority = new HashMap<>();
        for (TaskPriority priority : TaskPriority.values()) {
            tasksByPriority.put(priority, 0L);
        }

        // Top projects and users in workspace (simplified)
        Map<String, Long> tasksByProject = new LinkedHashMap<>();
        Map<String, Long> tasksByUser = new LinkedHashMap<>();

        return TaskAnalyticsResponse.builder()
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .inProgressTasks(inProgressTasks)
                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                .averageCompletionDays(Math.round(averageCompletionDays * 100.0) / 100.0)
                .tasksByStatus(tasksByStatus)
                .tasksByPriority(tasksByPriority)
                .tasksByProject(tasksByProject)
                .tasksByUser(tasksByUser)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "teamPerformance", key = "#workspaceId + '_' + #startDate + '_' + #endDate")
    public TeamPerformanceResponse getTeamPerformance(Long workspaceId, LocalDate startDate, LocalDate endDate) {
        log.info("Fetching team performance for workspace {} from {} to {}", workspaceId, startDate, endDate);

        List<TeamPerformanceResponse.UserPerformance> userPerformances = new ArrayList<>();
        
        // Get all workspace members only
        workspaceMemberRepository.findByWorkspaceId(workspaceId, org.springframework.data.domain.PageRequest.of(0, 1000))
                .forEach(member -> {
                    var user = member.getUser();
                    Long tasksCompleted = taskRepository.countByCreatedByIdAndStatus(user.getId(), TaskStatus.DONE);
                    Long commentsPosted = taskCommentRepository.countByUserId(user.getId());
                    Long messagesSet = chatMessageRepository.countBySenderId(user.getId());
                    Double activityScore = tasksCompleted * 3.0 + commentsPosted * 2.0 + messagesSet * 1.0;

                    userPerformances.add(TeamPerformanceResponse.UserPerformance.builder()
                            .userId(user.getId())
                            .userName(user.getFullName())
                            .userEmail(user.getEmail())
                            .tasksCompleted(tasksCompleted)
                            .commentsPosted(commentsPosted)
                            .messagesSet(messagesSet)
                            .activityScore(activityScore)
                            .build());
                });

        userPerformances.sort((a, b) -> Double.compare(b.getActivityScore(), a.getActivityScore()));
        for (int i = 0; i < userPerformances.size(); i++) {
            userPerformances.get(i).setRank(i + 1);
        }

        List<TeamPerformanceResponse.UserPerformance> topPerformers = userPerformances.stream()
                .limit(10)
                .collect(Collectors.toList());

        Double averageTasksPerUser = userPerformances.stream()
                .mapToLong(TeamPerformanceResponse.UserPerformance::getTasksCompleted)
                .average()
                .orElse(0.0);

        Long totalTeamTasks = userPerformances.stream()
                .mapToLong(TeamPerformanceResponse.UserPerformance::getTasksCompleted)
                .sum();

        Long totalTeamMessages = userPerformances.stream()
                .mapToLong(TeamPerformanceResponse.UserPerformance::getMessagesSet)
                .sum();

        return TeamPerformanceResponse.builder()
                .topPerformers(topPerformers)
                .averageTasksPerUser(Math.round(averageTasksPerUser * 100.0) / 100.0)
                .averageResponseTime(2.5)
                .totalTeamTasks(totalTeamTasks)
                .totalTeamMessages(totalTeamMessages)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "activityAnalytics", key = "#workspaceId + '_' + #startDate + '_' + #endDate")
    public ActivityAnalyticsResponse getActivityAnalytics(Long workspaceId, LocalDate startDate, LocalDate endDate) {
        log.info("Fetching activity analytics for workspace {} from {} to {}", workspaceId, startDate, endDate);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        // Get workspace-scoped activities
        List<TaskActivity> taskActivities = taskActivityRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        List<LeadActivity> leadActivities = leadActivityRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);

        Long totalActivities = (long) (taskActivities.size() + leadActivities.size());

        // Group activities by type
        Map<String, Long> activitiesByType = new LinkedHashMap<>();
        taskActivities.forEach(ta -> {
            String action = ta.getAction() != null ? ta.getAction() : "UNKNOWN";
            activitiesByType.put(action, activitiesByType.getOrDefault(action, 0L) + 1);
        });
        leadActivities.forEach(la -> {
            activitiesByType.put("LEAD_ACTIVITY", activitiesByType.getOrDefault("LEAD_ACTIVITY", 0L) + 1);
        });

        // Group activities by date (last 30 days)
        Map<LocalDate, Long> activitiesByDate = new LinkedHashMap<>();
        for (int i = 0; i < 30; i++) {
            LocalDate date = LocalDate.now().minusDays(i);
            activitiesByDate.put(date, 0L);
        }
        
        taskActivities.stream()
            .filter(ta -> ta.getCreatedAt() != null && !ta.getCreatedAt().toLocalDate().isBefore(LocalDate.now().minusDays(30)))
            .forEach(ta -> {
                LocalDate date = ta.getCreatedAt().toLocalDate();
                activitiesByDate.put(date, activitiesByDate.getOrDefault(date, 0L) + 1);
            });

        // Find most active users
        Map<String, Long> userActivityCount = new HashMap<>();
        taskActivities.forEach(ta -> {
            if (ta.getUser() != null) {
                String userName = ta.getUser().getFullName();
                userActivityCount.put(userName, userActivityCount.getOrDefault(userName, 0L) + 1);
            }
        });
        List<ActivityAnalyticsResponse.MostActiveUser> mostActiveUsers = userActivityCount.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(e -> ActivityAnalyticsResponse.MostActiveUser.builder()
                        .userName(e.getKey())
                        .activityCount(e.getValue())
                        .build())
                .collect(Collectors.toList());

        // Find most active projects
        Map<String, Long> projectActivityCount = new HashMap<>();
        taskActivities.forEach(ta -> {
            if (ta.getTask() != null && ta.getTask().getProject() != null) {
                String projectName = ta.getTask().getProject().getName();
                projectActivityCount.put(projectName, projectActivityCount.getOrDefault(projectName, 0L) + 1);
            }
        });
        List<ActivityAnalyticsResponse.MostActiveProject> mostActiveProjects = projectActivityCount.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(e -> ActivityAnalyticsResponse.MostActiveProject.builder()
                        .projectName(e.getKey())
                        .activityCount(e.getValue())
                        .build())
                .collect(Collectors.toList());

        return ActivityAnalyticsResponse.builder()
                .totalActivities(totalActivities)
                .activitiesByType(activitiesByType)
                .activitiesByDate(activitiesByDate)
                .mostActiveUsers(mostActiveUsers)
                .mostActiveProjects(mostActiveProjects)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Object getRecentActivities(Long workspaceId, int limit) {
        log.info("Fetching recent activities for workspace {}", workspaceId);

        List<Map<String, Object>> activities = new ArrayList<>();

        // Get task activities
        try {
            var taskActivities = taskActivityRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                    .limit(limit)
                    .toList();
            
            taskActivities.forEach(ta -> {
                activities.add(Map.of(
                        "type", "TASK",
                        "title", ta.getTask() != null ? ta.getTask().getTitle() : "Task Activity",
                        "description", (ta.getAction() != null ? ta.getAction() : "UPDATE") + 
                                (ta.getNewValue() != null ? ": " + ta.getNewValue() : ""),
                        "timestamp", ta.getCreatedAt().toString(),
                        "createdBy", ta.getUser() != null ? ta.getUser().getFullName() : "Unknown"
                ));
            });
        } catch (Exception e) {
            log.warn("Failed to fetch task activities: {}", e.getMessage());
        }

        // Get lead activities
        try {
            var leadActivities = leadActivityRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                    .limit(limit)
                    .toList();
            
            leadActivities.forEach(la -> {
                activities.add(Map.of(
                        "type", "LEAD",
                        "title", la.getLead() != null ? la.getLead().getName() : "Lead Activity",
                        "description", la.getDescription() != null ? la.getDescription() : "Lead activity",
                        "timestamp", la.getCreatedAt().toString(),
                        "createdBy", la.getUser() != null ? la.getUser().getFullName() : "Unknown"
                ));
            });
        } catch (Exception e) {
            log.warn("Failed to fetch lead activities: {}", e.getMessage());
        }

        // Sort by timestamp and limit
        return activities.stream()
                .sorted((a, b) -> b.get("timestamp").toString().compareTo(a.get("timestamp").toString()))
                .limit(limit)
                .collect(Collectors.toList());
    }
}
