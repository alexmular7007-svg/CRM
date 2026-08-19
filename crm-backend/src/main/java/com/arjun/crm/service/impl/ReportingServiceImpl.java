package com.arjun.crm.service.impl;

import com.arjun.crm.dto.response.ReportResponse;
import com.arjun.crm.enums.ProjectStatus;
import com.arjun.crm.enums.TaskStatus;
import com.arjun.crm.repository.*;
import com.arjun.crm.service.ReportingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportingServiceImpl implements ReportingService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final UserRepository userRepository;
    private final TaskActivityRepository taskActivityRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "dailyReport", key = "#date")
    public ReportResponse generateDailyReport(LocalDate date) {
        log.info("Generating daily report for {}", date);

        LocalDate startDate = date;
        LocalDate endDate = date;

        return generateReport("DAILY", startDate, endDate);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "weeklyReport", key = "#startDate")
    public ReportResponse generateWeeklyReport(LocalDate startDate) {
        log.info("Generating weekly report starting from {}", startDate);

        LocalDate endDate = startDate.plusDays(6);

        return generateReport("WEEKLY", startDate, endDate);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "monthlyReport", key = "#year + '_' + #month")
    public ReportResponse generateMonthlyReport(int year, int month) {
        log.info("Generating monthly report for {}-{}", year, month);

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        return generateReport("MONTHLY", startDate, endDate);
    }

    private ReportResponse generateReport(String reportType, LocalDate startDate, LocalDate endDate) {
        // Use LocalDateTime for all repositories that expect it
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        // chatMessageRepository.countMessagesInDateRange now expects Instant (UTC)
        java.time.Instant startInstant = startDate.atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
        java.time.Instant endInstant   = endDate.atTime(23, 59, 59).toInstant(java.time.ZoneOffset.UTC);

        // Task Summary
        Long tasksCreated = taskRepository.countTasksCreatedBetween(startDateTime, endDateTime);
        Long tasksCompleted = taskRepository.countTasksCompletedBetween(startDateTime, endDateTime);
        Long tasksOverdue = (long) taskRepository.findOverdueTasks(LocalDate.now()).size();
        Double completionRate = tasksCreated > 0 ? (tasksCompleted * 100.0 / tasksCreated) : 0.0;

        ReportResponse.TaskSummary taskSummary = ReportResponse.TaskSummary.builder()
                .tasksCreated(tasksCreated)
                .tasksCompleted(tasksCompleted)
                .tasksOverdue(tasksOverdue)
                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                .build();

        // Project Summary - convert to LocalDateTime for repository consistency
        Long projectsCreated = projectRepository.countProjectsCreatedBetween(startDateTime, endDateTime);
        Long projectsCompleted = projectRepository.countProjectsCompletedBetween(startDateTime, endDateTime);
        Long activeProjects = projectRepository.countByStatus(ProjectStatus.ACTIVE);
        Double averageProgress = activeProjects > 0 ? 75.0 : 0.0;

        ReportResponse.ProjectSummary projectSummary = ReportResponse.ProjectSummary.builder()
                .projectsCreated(projectsCreated)
                .projectsCompleted(projectsCompleted)
                .averageProgress(averageProgress)
                .build();

        // Team Summary — chat uses Instant, comments use LocalDateTime
        Long activeUsers = userRepository.count();
        Long totalMessages = chatMessageRepository.countMessagesInDateRange(startInstant, endInstant);
        Long totalComments = taskCommentRepository.countCommentsInDateRange(startDateTime, endDateTime);

        ReportResponse.TeamSummary teamSummary = ReportResponse.TeamSummary.builder()
                .activeUsers(activeUsers)
                .totalMessages(totalMessages)
                .totalComments(totalComments)
                .build();

        // Activity Summary
        List<Object[]> userStats = taskActivityRepository.findMostActiveUsers(
                startDateTime, endDateTime,
                org.springframework.data.domain.PageRequest.of(0, 1));
        String mostActiveUser = userStats.isEmpty() ? "N/A" : (String) userStats.get(0)[1];

        List<Object[]> projectStats = taskActivityRepository.findMostActiveProjects(
                startDateTime, endDateTime,
                org.springframework.data.domain.PageRequest.of(0, 1));
        String mostActiveProject = projectStats.isEmpty() ? "N/A" : (String) projectStats.get(0)[1];

        Long totalActivities = taskActivityRepository.countByCreatedAtAfter(startDateTime);

        ReportResponse.ActivitySummary activitySummary = ReportResponse.ActivitySummary.builder()
                .totalActivities(totalActivities)
                .mostActiveUser(mostActiveUser)
                .mostActiveProject(mostActiveProject)
                .build();

        return ReportResponse.builder()
                .reportType(reportType)
                .startDate(startDate)
                .endDate(endDate)
                .taskSummary(taskSummary)
                .projectSummary(projectSummary)
                .teamSummary(teamSummary)
                .activitySummary(activitySummary)
                .build();
    }
}
