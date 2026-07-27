package com.arjun.crm.dto.response;

import lombok.*;
import java.time.LocalDateTime;

/**
 * Response DTO for lead conversion to project
 * Contains all details of the successful conversion
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadConversionResponse {
    
    /**
     * Original lead ID that was converted
     */
    private Long leadId;
    
    /**
     * Created client ID
     */
    private Long clientId;
    
    /**
     * Created project ID
     */
    private Long projectId;
    
    /**
     * Project name as created
     */
    private String projectName;
    
    /**
     * Workspace ID where conversion occurred
     */
    private Long workspaceId;
    
    /**
     * Created project chat room ID (if createProjectChat was true)
     * Null if chat creation was not requested or failed
     */
    private Long chatRoomId;
    
    /**
     * Number of team members added to project
     */
    private Integer membersAdded;
    
    /**
     * Number of tasks created (from AI generation)
     * 0 if AI generation was disabled
     */
    private Integer tasksCreated;
    
    /**
     * Number of attachments linked
     * 0 for Phase 1 (no lead attachment support yet)
     */
    private Integer attachmentsLinked;
    
    /**
     * Timestamp when conversion was completed
     */
    private LocalDateTime convertedAt;
    
    /**
     * Whether conversion was successful
     */
    @Builder.Default
    private Boolean success = true;
    
    /**
     * Optional message describing conversion result
     */
    private String message;
}
