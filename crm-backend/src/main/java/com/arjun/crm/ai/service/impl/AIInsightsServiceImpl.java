package com.arjun.crm.ai.service.impl;

import com.arjun.crm.ai.dto.response.AIResponse;
import com.arjun.crm.ai.dto.response.ProductivityInsightsResponse;
import com.arjun.crm.ai.parser.AIResponseParser;
import com.arjun.crm.ai.prompt.PromptBuilder;
import com.arjun.crm.ai.provider.XAIProvider;
import com.arjun.crm.ai.service.AIInsightsService;
import com.arjun.crm.entity.Task;
import com.arjun.crm.entity.User;
import com.arjun.crm.enums.TaskStatus;
import com.arjun.crm.repository.TaskRepository;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Implementation of AI productivity insights for the current user.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIInsightsServiceImpl implements AIInsightsService {

    private final XAIProvider xaiProvider;
    private final AIResponseParser responseParser;
    private final PromptBuilder promptBuilder;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ProductivityInsightsResponse getProductivityInsights() {
        // Get current user email from security context
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        log.info("Fetching productivity insights for user: {}", user.getId());

        // Gather user task metrics — use available repository methods
        List<Task> activeTasks = taskRepository.findActiveTasksByAssignee(user.getId());
        long completed = taskRepository.countByCreatedByIdAndStatus(user.getId(), TaskStatus.DONE);
        long overdue = activeTasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now()))
                .count();
        long active = activeTasks.size();

        // Build AI prompt with real metrics
        double completionRate = (completed + active) == 0 ? 0.0 : (completed * 100.0 / (completed + active));
        String prompt = promptBuilder.buildProductivityInsightsPrompt(
                user.getId(),
                (int) completed,
                (int) overdue,
                completionRate,
                completionRate  // use completion rate as activity score proxy
        );

        AIResponse aiResponse = xaiProvider.generateResponse(prompt);

        if (!aiResponse.isSuccess()) {
            log.warn("AI unavailable for productivity insights, using rule-based fallback");
            return buildFallback(completed, active, overdue);
        }

        try {
            return responseParser.parseProductivityInsights(aiResponse.getContent());
        } catch (Exception e) {
            log.warn("Failed to parse AI productivity response, using rule-based fallback: {}", e.getMessage());
            return buildFallback(completed, active, overdue);
        }
    }

    private ProductivityInsightsResponse buildFallback(long completed, long active, long overdue) {
        long total = completed + active;
        double score = total == 0 ? 75.0 :
                Math.max(0, Math.min(100,
                        (completed * 40.0 / Math.max(total, 1))
                        + (active > 0 ? 30.0 : 0)
                        - (overdue * 10.0)));

        String assessment = score >= 75 ? "Good productivity — keep it up!"
                : score >= 50 ? "Moderate productivity — focus on clearing overdue tasks."
                : "Low productivity — prioritise and clear your backlog.";

        return ProductivityInsightsResponse.builder()
                .productivityScore(Math.round(score * 10.0) / 10.0)
                .overallAssessment(assessment)
                .strengths(List.of(
                        completed + " tasks completed",
                        active + " tasks actively in progress"
                ))
                .improvements(overdue > 0
                        ? List.of(overdue + " overdue task(s) need attention")
                        : List.of("All tasks are on schedule"))
                .recommendations(List.of(
                        "Review and prioritise your active task list",
                        overdue > 0 ? "Clear overdue tasks before taking on new work" : "Maintain your current pace"
                ))
                .trend("STABLE")
                .aiUnavailable(true)
                .build();
    }
}
