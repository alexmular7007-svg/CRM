package com.arjun.crm.ai.service.impl;

import com.arjun.crm.ai.dto.request.ChatSummarizationRequest;
import com.arjun.crm.ai.dto.request.SmartReplyRequest;
import com.arjun.crm.ai.dto.response.AIResponse;
import com.arjun.crm.ai.dto.response.ChatSummarizationResponse;
import com.arjun.crm.ai.dto.response.SmartReplyResponse;
import com.arjun.crm.ai.parser.AIResponseParser;
import com.arjun.crm.ai.prompt.PromptBuilder;
import com.arjun.crm.ai.provider.XAIProvider;
import com.arjun.crm.ai.service.AIChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.concurrent.CompletableFuture;

/**
 * Implementation of AI Chat Service
 * 
 * NOTE: All methods handle AI failures gracefully and return fallback responses.
 * AI unavailability NEVER blocks chat operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIChatServiceImpl implements AIChatService {

    private final XAIProvider xaiProvider;
    private final PromptBuilder promptBuilder;
    private final AIResponseParser responseParser;

    @Override
    public ChatSummarizationResponse summarizeChat(ChatSummarizationRequest request) {
        log.info("AI chat summarization requested for chat room ID: {}", request.getChatRoomId());
        
        try {
            // Build prompt
            String prompt = promptBuilder.buildChatSummarizationPrompt(request);
            
            // Get AI response (no cache for dynamic content)
            AIResponse aiResponse = xaiProvider.generateResponseNoCache(prompt);
            
            if (aiResponse.isSuccess()) {
                // Parse response
                return responseParser.parseChatSummarization(aiResponse.getContent(), request.getChatRoomId());
            } else {
                log.warn("AI response was not successful for chat summarization: {}", aiResponse.getContent());
                return getChatSummarizationFallback(request);
            }
        } catch (Exception e) {
            log.error("Error during AI chat summarization: {}", e.getMessage(), e);
            return getChatSummarizationFallback(request);
        }
    }

    @Override
    public SmartReplyResponse generateSmartReplies(SmartReplyRequest request) {
        log.info("AI smart reply generation requested");
        
        try {
            // Build prompt
            String prompt = promptBuilder.buildSmartReplyPrompt(request);
            
            // Get AI response (no cache for dynamic content)
            AIResponse aiResponse = xaiProvider.generateResponseNoCache(prompt);
            
            if (aiResponse.isSuccess()) {
                // Parse response
                return responseParser.parseSmartReply(aiResponse.getContent());
            } else {
                log.warn("AI response was not successful for smart reply: {}", aiResponse.getContent());
                return getSmartReplyFallback();
            }
        } catch (Exception e) {
            log.error("Error during AI smart reply generation: {}", e.getMessage(), e);
            return getSmartReplyFallback();
        }
    }

    /**
     * Async version of chat summarization - never blocks the caller
     */
    @Async
    public CompletableFuture<ChatSummarizationResponse> summarizeChatAsync(ChatSummarizationRequest request) {
        try {
            ChatSummarizationResponse response = summarizeChat(request);
            return CompletableFuture.completedFuture(response);
        } catch (Exception e) {
            log.error("Error in async chat summarization: {}", e.getMessage(), e);
            return CompletableFuture.completedFuture(getChatSummarizationFallback(request));
        }
    }

    /**
     * Async version of smart reply generation - never blocks the caller
     */
    @Async
    public CompletableFuture<SmartReplyResponse> generateSmartRepliesAsync(SmartReplyRequest request) {
        try {
            SmartReplyResponse response = generateSmartReplies(request);
            return CompletableFuture.completedFuture(response);
        } catch (Exception e) {
            log.error("Error in async smart reply generation: {}", e.getMessage(), e);
            return CompletableFuture.completedFuture(getSmartReplyFallback());
        }
    }

    /**
     * Fallback response when AI service is unavailable for chat summarization
     */
    private ChatSummarizationResponse getChatSummarizationFallback(ChatSummarizationRequest request) {
        return ChatSummarizationResponse.builder()
                .chatRoomId(request.getChatRoomId())
                .summary("AI service temporarily unavailable. Please try again later.")
                .keyPoints(Collections.emptyList())
                .aiUnavailable(true)
                .build();
    }

    /**
     * Fallback response when AI service is unavailable for smart replies
     */
    private SmartReplyResponse getSmartReplyFallback() {
        return SmartReplyResponse.builder()
                .suggestions(Collections.emptyList())
                .aiUnavailable(true)
                .build();
    }
}
