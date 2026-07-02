package com.arjun.crm.dto.response;

import com.arjun.crm.entity.TaskComment;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskCommentResponse {
    private Long id;
    private Long taskId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String content;
    private List<MentionResponse> mentions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Also provide user object for frontend compatibility
    private UserSummaryResponse user;

    public static TaskCommentResponse fromEntity(TaskComment comment) {
        return TaskCommentResponse.builder()
                .id(comment.getId())
                .taskId(comment.getTask().getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getFullName())
                .userEmail(comment.getUser().getEmail())
                .content(comment.getMessage())
                .mentions(comment.getMentions().stream()
                        .map(MentionResponse::fromEntity)
                        .collect(Collectors.toList()))
                .user(UserSummaryResponse.builder()
                        .id(comment.getUser().getId())
                        .fullName(comment.getUser().getFullName())
                        .email(comment.getUser().getEmail())
                        .build())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
