package com.arjun.crm.service.impl;

import com.arjun.crm.dto.response.TaskAttachmentResponse;
import com.arjun.crm.entity.Task;
import com.arjun.crm.entity.TaskAttachment;
import com.arjun.crm.entity.User;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.TaskAttachmentRepository;
import com.arjun.crm.repository.TaskRepository;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.service.CloudinaryService;
import com.arjun.crm.service.TaskAttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskAttachmentServiceImpl implements TaskAttachmentService {

    private final TaskAttachmentRepository taskAttachmentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional
    public TaskAttachmentResponse uploadAttachment(Long taskId, MultipartFile file) {
        User currentUser = getAuthenticatedUser();
        log.info("Uploading attachment to task ID: {} by user: {}", taskId, currentUser.getEmail());

        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        // Upload to Cloudinary
        log.debug("🚀 Starting Cloudinary upload for task attachment");
        CloudinaryService.UploadResult uploadResult = cloudinaryService.uploadTaskAttachment(file, taskId);

        log.debug("✅ Cloudinary upload completed - publicId: {}", uploadResult.publicId());

        // Create attachment entity using Cloudinary metadata
        TaskAttachment attachment = TaskAttachment.builder()
                .task(task)
                .uploadedBy(currentUser)
                .fileName(uploadResult.filename())
                .fileUrl(uploadResult.secureUrl())  // Use Cloudinary secure URL
                .fileType(uploadResult.mimeType())
                .fileSize(uploadResult.fileSize())
                .build();

        TaskAttachment savedAttachment = taskAttachmentRepository.save(attachment);
        log.info("✅ Task attachment saved to database: id={}, fileName={}", 
                savedAttachment.getId(), savedAttachment.getFileName());

        return TaskAttachmentResponse.fromEntity(savedAttachment);
    }

    @Override
    @Transactional
    public void deleteAttachment(Long taskId, Long attachmentId) {
        User currentUser = getAuthenticatedUser();
        log.info("Deleting attachment ID: {} from task ID: {}", attachmentId, taskId);

        TaskAttachment attachment = taskAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + attachmentId));

        // Verify attachment belongs to task
        if (!attachment.getTask().getId().equals(taskId)) {
            throw new IllegalArgumentException("Attachment does not belong to this task");
        }

        // Only uploader can delete
        if (!attachment.getUploadedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only delete your own attachments");
        }

        // Delete from Cloudinary
        try {
            log.debug("🗑️ Deleting from Cloudinary");
            // Extract public_id from fileUrl
            // fileUrl format: https://res.cloudinary.com/xxx/raw/upload/v123/tasks/8/uuid-filename.ext
            String fileUrl = attachment.getFileUrl();
            String publicId = extractPublicIdFromUrl(fileUrl);
            if (publicId != null && !publicId.isEmpty()) {
                cloudinaryService.deleteFile(publicId);
                log.debug("✅ File deleted from Cloudinary");
            }
        } catch (Exception e) {
            log.error("❌ Failed to delete file from Cloudinary", e);
            // Continue with database deletion even if Cloudinary delete fails
        }

        taskAttachmentRepository.delete(attachment);
        log.info("✅ Attachment deleted from database: {}", attachmentId);
    }

    /**
     * Extract public_id from Cloudinary secure URL
     * URL format: https://res.cloudinary.com/xxx/raw/upload/v123/tasks/8/uuid-filename.ext
     * Public ID: tasks/8/uuid-filename.ext
     */
    private String extractPublicIdFromUrl(String secureUrl) {
        try {
            if (secureUrl == null || !secureUrl.contains("/upload/")) {
                return null;
            }
            // Find the part after "/upload/"
            int uploadIndex = secureUrl.indexOf("/upload/");
            if (uploadIndex == -1) {
                return null;
            }
            // Skip "/upload/" and any version info like "v123/"
            String afterUpload = secureUrl.substring(uploadIndex + 8);
            // If there's a version, skip it
            if (afterUpload.startsWith("v")) {
                int slashIndex = afterUpload.indexOf("/");
                if (slashIndex != -1) {
                    afterUpload = afterUpload.substring(slashIndex + 1);
                }
            }
            return afterUpload;
        } catch (Exception e) {
            log.warn("Failed to extract public_id from URL: {}", secureUrl, e);
            return null;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskAttachmentResponse> listAttachments(Long taskId) {
        log.info("Listing attachments for task ID: {}", taskId);

        // Verify task exists
        taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        List<TaskAttachment> attachments = taskAttachmentRepository.findByTaskIdOrderByUploadedAtDesc(taskId);
        return attachments.stream()
                .map(TaskAttachmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TaskAttachmentResponse getAttachment(Long attachmentId) {
        log.info("Fetching attachment ID: {}", attachmentId);

        TaskAttachment attachment = taskAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + attachmentId));

        return TaskAttachmentResponse.fromEntity(attachment);
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
