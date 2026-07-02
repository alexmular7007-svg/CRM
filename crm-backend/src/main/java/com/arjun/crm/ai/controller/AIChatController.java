package com.arjun.crm.ai.controller;

import com.arjun.crm.ai.dto.request.ChatSummarizationRequest;
import com.arjun.crm.ai.dto.request.SmartReplyRequest;
import com.arjun.crm.ai.dto.response.ChatSummarizationResponse;
import com.arjun.crm.ai.dto.response.SmartReplyResponse;
import com.arjun.crm.ai.service.AIChatService;
import com.arjun.crm.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

/**
 * Controller for AI-powered chat features
 * 
 * All endpoints gracefully handle AI service unavailability.
 * AI failures never cause HTTP 500 errors - fallback responses are returned instead.
 */
@RestController
@RequestMapping("/api/ai/chat")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class AIChatController {

    private final AIChatService aiChatService;

    /**
     * Summarize chat conversation
     * POST /api/ai/chat/summarize
     * 
     * Returns HTTP 200 even if AI service is unavailable (with fallback response)
     */
    @PostMapping("/summarize")
    public ResponseEntity<ApiResponse<ChatSummarizationResponse>> summarizeChat(
            @Valid @RequestBody ChatSummarizationRequest request) {
        try {
            log.info("Chat summarization request for chat room ID: {}", request.getChatRoomId());
            ChatSummarizationResponse response = aiChatService.summarizeChat(request);
            
            String message = Boolean.TRUE.equals(response.getAiUnavailable())
                    ? "AI service temporarily unavailable. Using fallback summary."
                    : "Chat summarization completed successfully";
            
            return ResponseEntity.ok(ApiResponse.success(message, response));
        } catch (Exception e) {
            log.error("Unexpected error in chat summarization: {}", e.getMessage(), e);
            // Should not reach here due to service-level error handling, but just in case
            ChatSummarizationResponse fallback = ChatSummarizationResponse.builder()
                    .chatRoomId(request.getChatRoomId())
                    .summary("AI service temporarily unavailable. Please try again later.")
                    .keyPoints(Collections.emptyList())
                    .aiUnavailable(true)
                    .build();
            return ResponseEntity.ok(ApiResponse.success("AI service temporarily unavailable", fallback));
        }
    }

    /**
     * Generate smart reply suggestions
     * POST /api/ai/chat/reply-suggestions
     * 
     * Returns HTTP 200 even if AI service is unavailable (with fallback response)
     */
    @PostMapping("/reply-suggestions")
    public ResponseEntity<ApiResponse<SmartReplyResponse>> generateSmartReplies(
            @Valid @RequestBody SmartReplyRequest request) {
        try {
            log.info("Smart reply generation request");
            SmartReplyResponse response = aiChatService.generateSmartReplies(request);
            
            String message = Boolean.TRUE.equals(response.getAiUnavailable())
                    ? "AI service temporarily unavailable. No suggestions generated."
                    : "Smart reply suggestions generated successfully";
            
            return ResponseEntity.ok(ApiResponse.success(message, response));
        } catch (Exception e) {
            log.error("Unexpected error in smart reply generation: {}", e.getMessage(), e);
            // Should not reach here due to service-level error handling, but just in case
            SmartReplyResponse fallback = SmartReplyResponse.builder()
                    .suggestions(Collections.emptyList())
                    .aiUnavailable(true)
                    .build();
            return ResponseEntity.ok(ApiResponse.success("AI service temporarily unavailable", fallback));
        }
    }
}
