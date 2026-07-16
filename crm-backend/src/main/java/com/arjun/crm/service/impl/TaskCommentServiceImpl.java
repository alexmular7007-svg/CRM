package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.TaskCommentCreateRequest;
import com.arjun.crm.dto.request.TaskCommentUpdateRequest;
import com.arjun.crm.dto.response.TaskCommentResponse;
import com.arjun.crm.entity.Mention;
import com.arjun.crm.entity.Task;
import com.arjun.crm.entity.TaskComment;
import com.arjun.crm.entity.User;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.MentionRepository;
import com.arjun.crm.repository.TaskCommentRepository;
import com.arjun.crm.repository.TaskRepository;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.service.TaskActivityService;
import com.arjun.crm.service.TaskCommentService;
import com.arjun.crm.event.CommentAddedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskCommentServiceImpl implements TaskCommentService {

    private final TaskCommentRepository taskCommentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final MentionRepository mentionRepository;
    private final TaskActivityService taskActivityService;
    private final ApplicationEventPublisher eventPublisher;

    private static final Pattern MENTION_PATTERN = Pattern.compile("@([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})");

    @Override
    @Transactional
    public TaskCommentResponse addComment(Long taskId, TaskCommentCreateRequest request) {
        User currentUser = getAuthenticatedUser();
        log.info("Adding comment to task ID: {} by user: {}", taskId, currentUser.getEmail());

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        TaskComment comment = TaskComment.builder()
                .task(task)
                .user(currentUser)
                .message(request.getMessage())
                .build();

        TaskComment savedComment = taskCommentRepository.save(comment);

        // Extract and save mentions
        List<String> mentionedEmails = extractMentions(request.getMessage());
        for (String email : mentionedEmails) {
            userRepository.findByEmail(email).ifPresent(mentionedUser -> {
                Mention mention = Mention.builder()
                        .comment(savedComment)
                        .mentionedUser(mentionedUser)
                        .build();
                mentionRepository.save(mention);
                log.info("User {} mentioned in comment", email);
            });
        }

        // Log activity
        taskActivityService.logCommentCreation(task, currentUser);

        // Publish event to trigger cache eviction and notifications
        eventPublisher.publishEvent(new CommentAddedEvent(this, savedComment, task, currentUser));

        log.info("Comment added successfully to task: {}", taskId);
        return TaskCommentResponse.fromEntity(savedComment);
    }

    @Override
    @Transactional
    public TaskCommentResponse updateComment(Long taskId, Long commentId, TaskCommentUpdateRequest request) {
        User currentUser = getAuthenticatedUser();
        log.info("Updating comment ID: {} for task ID: {}", commentId, taskId);

        TaskComment comment = taskCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with ID: " + commentId));

        // Verify comment belongs to task
        if (!comment.getTask().getId().equals(taskId)) {
            throw new IllegalArgumentException("Comment does not belong to this task");
        }

        // Only comment author can update
        if (!comment.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only update your own comments");
        }

        comment.setMessage(request.getMessage());
        
        // Clear old mentions and add new ones
        mentionRepository.deleteAll(comment.getMentions());
        comment.getMentions().clear();

        TaskComment updatedComment = taskCommentRepository.save(comment);

        // Extract and save new mentions
        List<String> mentionedEmails = extractMentions(request.getMessage());
        for (String email : mentionedEmails) {
            userRepository.findByEmail(email).ifPresent(mentionedUser -> {
                Mention mention = Mention.builder()
                        .comment(updatedComment)
                        .mentionedUser(mentionedUser)
                        .build();
                mentionRepository.save(mention);
            });
        }

        log.info("Comment updated successfully: {}", commentId);
        return TaskCommentResponse.fromEntity(updatedComment);
    }

    @Override
    @Transactional
    public void deleteComment(Long taskId, Long commentId) {
        User currentUser = getAuthenticatedUser();
        log.info("Deleting comment ID: {} from task ID: {}", commentId, taskId);

        TaskComment comment = taskCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with ID: " + commentId));

        // Verify comment belongs to task
        if (!comment.getTask().getId().equals(taskId)) {
            throw new IllegalArgumentException("Comment does not belong to this task");
        }

        // Only comment author can delete
        if (!comment.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only delete your own comments");
        }

        taskCommentRepository.delete(comment);
        log.info("Comment deleted successfully: {}", commentId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskCommentResponse> getCommentsByTask(Long taskId, Pageable pageable) {
        log.info("Fetching comments for task ID: {}", taskId);

        // Verify task exists
        taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        Page<TaskComment> comments = taskCommentRepository.findByTaskIdOrderByCreatedAtDesc(taskId, pageable);
        return comments.map(TaskCommentResponse::fromEntity);
    }

    /**
     * Extract mentioned email addresses from message
     */
    private List<String> extractMentions(String message) {
        List<String> mentions = new ArrayList<>();
        Matcher matcher = MENTION_PATTERN.matcher(message);
        
        while (matcher.find()) {
            String email = matcher.group(1);
            mentions.add(email);
        }
        
        return mentions;
    }

    /**
     * Get authenticated user from security context
     */
    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
