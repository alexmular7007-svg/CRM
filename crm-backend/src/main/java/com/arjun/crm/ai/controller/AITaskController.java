package com.arjun.crm.ai.controller;

import com.arjun.crm.ai.dto.request.DeadlinePredictionRequest;
import com.arjun.crm.ai.dto.request.TaskPrioritizationRequest;
import com.arjun.crm.ai.dto.response.DeadlinePredictionResponse;
import com.arjun.crm.ai.dto.response.TaskPrioritizationResponse;
import com.arjun.crm.ai.service.AITaskService;
import com.arjun.crm.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for AI-powered task features
 * 
 * All endpoints gracefully handle AI service unavailability.
 * AI failures never cause HTTP 500 errors - fallback responses are returned instead.
 */
@RestController
@RequestMapping("/api/ai/tasks")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class AITaskController {

    private final AITaskService aiTaskService;

    /**
     * Get AI-powered task prioritization suggestion
     * POST /api/ai/tasks/prioritize
     * 
     * Returns HTTP 200 even if AI service is unavailable (with fallback response)
     */
    @PostMapping("/prioritize")
    public ResponseEntity<ApiResponse<TaskPrioritizationResponse>> prioritizeTask(
            @Valid @RequestBody TaskPrioritizationRequest request) {
        try {
            log.info("Task prioritization request for task ID: {}", request.getTaskId());
            TaskPrioritizationResponse response = aiTaskService.prioritizeTask(request);
            
            String message = Boolean.TRUE.equals(response.getAiUnavailable()) 
                    ? "AI service temporarily unavailable. Using current priority."
                    : "AI task prioritization completed successfully";
            
            return ResponseEntity.ok(ApiResponse.success(message, response));
        } catch (Exception e) {
            log.error("Unexpected error in task prioritization: {}", e.getMessage(), e);
            // Should not reach here due to service-level error handling, but just in case
            TaskPrioritizationResponse fallback = TaskPrioritizationResponse.builder()
                    .taskId(request.getTaskId())
                    .suggestedPriority("MEDIUM")
                    .confidence(0.0)
                    .reasoning("AI service temporarily unavailable")
                    .aiUnavailable(true)
                    .build();
            return ResponseEntity.ok(ApiResponse.success("AI service temporarily unavailable", fallback));
        }
    }

    /**
     * Get AI-powered deadline prediction
     * POST /api/ai/tasks/deadline-predict
     * 
     * Returns HTTP 200 even if AI service is unavailable (with fallback response)
     */
    @PostMapping("/deadline-predict")
    public ResponseEntity<ApiResponse<DeadlinePredictionResponse>> predictDeadline(
            @Valid @RequestBody DeadlinePredictionRequest request) {
        try {
            log.info("Deadline prediction request for task ID: {}", request.getTaskId());
            DeadlinePredictionResponse response = aiTaskService.predictDeadline(request);
            
            String message = Boolean.TRUE.equals(response.getAiUnavailable())
                    ? "AI service temporarily unavailable. Using current deadline."
                    : "AI deadline prediction completed successfully";
            
            return ResponseEntity.ok(ApiResponse.success(message, response));
        } catch (Exception e) {
            log.error("Unexpected error in deadline prediction: {}", e.getMessage(), e);
            // Should not reach here due to service-level error handling, but just in case
            DeadlinePredictionResponse fallback = DeadlinePredictionResponse.builder()
                    .taskId(request.getTaskId())
                    .predictedDeadline(java.time.LocalDate.now())
                    .confidence(0.0)
                    .reasoning("AI service temporarily unavailable")
                    .aiUnavailable(true)
                    .build();
            return ResponseEntity.ok(ApiResponse.success("AI service temporarily unavailable", fallback));
        }
    }
}
