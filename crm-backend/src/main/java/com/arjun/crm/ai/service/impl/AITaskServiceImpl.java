package com.arjun.crm.ai.service.impl;

import com.arjun.crm.ai.dto.request.DeadlinePredictionRequest;
import com.arjun.crm.ai.dto.request.TaskPrioritizationRequest;
import com.arjun.crm.ai.dto.response.AIResponse;
import com.arjun.crm.ai.dto.response.DeadlinePredictionResponse;
import com.arjun.crm.ai.dto.response.TaskPrioritizationResponse;
import com.arjun.crm.ai.parser.AIResponseParser;
import com.arjun.crm.ai.prompt.PromptBuilder;
import com.arjun.crm.ai.provider.XAIProvider;
import com.arjun.crm.ai.service.AITaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Implementation of AI Task Service
 * 
 * NOTE: All methods handle AI failures gracefully and return fallback responses.
 * AI unavailability NEVER blocks task operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AITaskServiceImpl implements AITaskService {

    private final XAIProvider xaiProvider;
    private final PromptBuilder promptBuilder;
    private final AIResponseParser responseParser;

    @Override
    public TaskPrioritizationResponse prioritizeTask(TaskPrioritizationRequest request) {
        log.info("AI task prioritization requested for task ID: {}", request.getTaskId());
        
        try {
            // Build prompt
            String prompt = promptBuilder.buildTaskPrioritizationPrompt(request);
            
            // Get AI response
            AIResponse aiResponse = xaiProvider.generateResponse(prompt);
            
            if (aiResponse.isSuccess()) {
                // Parse response
                return responseParser.parseTaskPrioritization(aiResponse.getContent(), request.getTaskId());
            } else {
                log.warn("AI response was not successful for task prioritization: {}", aiResponse.getContent());
                return getTaskPrioritizationFallback(request);
            }
        } catch (Exception e) {
            log.error("Error during AI task prioritization: {}", e.getMessage(), e);
            return getTaskPrioritizationFallback(request);
        }
    }

    @Override
    public DeadlinePredictionResponse predictDeadline(DeadlinePredictionRequest request) {
        log.info("AI deadline prediction requested for task ID: {}", request.getTaskId());
        
        try {
            // Build prompt
            String prompt = promptBuilder.buildDeadlinePredictionPrompt(request);
            
            // Get AI response
            AIResponse aiResponse = xaiProvider.generateResponse(prompt);
            
            if (aiResponse.isSuccess()) {
                // Parse response
                return responseParser.parseDeadlinePrediction(aiResponse.getContent(), request.getTaskId());
            } else {
                log.warn("AI response was not successful for deadline prediction: {}", aiResponse.getContent());
                return getDeadlinePredictionFallback(request);
            }
        } catch (Exception e) {
            log.error("Error during AI deadline prediction: {}", e.getMessage(), e);
            return getDeadlinePredictionFallback(request);
        }
    }

    /**
     * Async version of task prioritization - never blocks the caller
     */
    @Async
    public CompletableFuture<TaskPrioritizationResponse> prioritizeTaskAsync(TaskPrioritizationRequest request) {
        try {
            TaskPrioritizationResponse response = prioritizeTask(request);
            return CompletableFuture.completedFuture(response);
        } catch (Exception e) {
            log.error("Error in async task prioritization: {}", e.getMessage(), e);
            return CompletableFuture.completedFuture(getTaskPrioritizationFallback(request));
        }
    }

    /**
     * Async version of deadline prediction - never blocks the caller
     */
    @Async
    public CompletableFuture<DeadlinePredictionResponse> predictDeadlineAsync(DeadlinePredictionRequest request) {
        try {
            DeadlinePredictionResponse response = predictDeadline(request);
            return CompletableFuture.completedFuture(response);
        } catch (Exception e) {
            log.error("Error in async deadline prediction: {}", e.getMessage(), e);
            return CompletableFuture.completedFuture(getDeadlinePredictionFallback(request));
        }
    }

    /**
     * Fallback response when AI service is unavailable for prioritization
     */
    private TaskPrioritizationResponse getTaskPrioritizationFallback(TaskPrioritizationRequest request) {
        return TaskPrioritizationResponse.builder()
                .taskId(request.getTaskId())
                .suggestedPriority(request.getCurrentPriority() != null ? request.getCurrentPriority() : "MEDIUM")
                .confidence(0.0)
                .reasoning("AI service temporarily unavailable. Using current priority.")
                .aiUnavailable(true)
                .build();
    }

    /**
     * Fallback response when AI service is unavailable for deadline prediction
     */
    private DeadlinePredictionResponse getDeadlinePredictionFallback(DeadlinePredictionRequest request) {
        return DeadlinePredictionResponse.builder()
                .taskId(request.getTaskId())
                .predictedDeadline(request.getAverageCompletionDays() != null ? 
                        java.time.LocalDate.now().plusDays(request.getAverageCompletionDays().intValue()) : 
                        java.time.LocalDate.now())
                .confidence(0.0)
                .reasoning("AI service temporarily unavailable. Using default estimation.")
                .aiUnavailable(true)
                .build();
    }
}
