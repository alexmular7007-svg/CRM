package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

/**
 * Request DTO for converting a WON lead to a project with client
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadConversionRequest {
    
    /**
     * Project name (required)
     * Will be validated: 2-100 characters
     */
    @NotBlank(message = "Project name is required")
    @Size(min = 2, max = 100, message = "Project name must be between 2 and 100 characters")
    private String projectName;
    
    /**
     * Project description (optional)
     */
    @Size(max = 500, message = "Project description must not exceed 500 characters")
    private String projectDescription;
    
    /**
     * Project manager user ID (required)
     * Must be an active member of the workspace
     */
    private Long projectManagerId;
    
    /**
     * Additional team members to add to project (optional)
     * Each member must be an active member of the workspace
     * Project manager will be added automatically if not in this set
     */
    @Builder.Default
    private Set<Long> memberIds = new HashSet<>();
    
    /**
     * Project color in hex format (optional)
     * Defaults to #3b82f6 (blue)
     */
    @Size(max = 7, message = "Color must be a valid hex code (e.g., #3b82f6)")
    private String color;
    
    /**
     * Copy lead activities and notes to project context (default: true)
     * Activities remain on Lead, but are linked via sourceLeadId
     */
    @Builder.Default
    private Boolean copyLeadActivities = true;
    
    /**
     * Link/reference lead attachments to project (default: true)
     * Does NOT create duplicate Cloudinary files
     */
    @Builder.Default
    private Boolean linkAttachments = true;
    
    /**
     * Create a project-specific chat room (default: true)
     * Chat room will include converter and selected members
     */
    @Builder.Default
    private Boolean createProjectChat = true;
    
    /**
     * Generate initial tasks using AI (default: false)
     * Disabled for Phase 1; can be enhanced later
     */
    @Builder.Default
    private Boolean generateInitialTasks = false;
    
    /**
     * Notify selected team members of conversion (default: true)
     */
    @Builder.Default
    private Boolean notifyMembers = true;
}
