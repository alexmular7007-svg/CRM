package com.arjun.crm.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for AI chat summarization
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSummarizationResponse {
    private Long chatRoomId;
    private String summary;
    private List<String> keyPoints;
    private List<String> actionItems;
    private List<String> decisions;
    @Builder.Default
    private Boolean aiUnavailable = false;  // Flag indicating if AI service was unavailable
}
