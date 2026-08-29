package com.arjun.crm.dto.response;

import com.arjun.crm.enums.AutomationStatus;
import com.arjun.crm.enums.AutomationTriggerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * AutomationResponse - PHASE 1: Core Foundation
 * 
 * Response DTO for automation data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationResponse {
    
    /**
     * Automation ID
     */
    private Long id;
    
    /**
     * Workspace ID
     */
    private Long workspaceId;
    
    /**
     * Automation name
     */
    private String name;
    
    /**
     * Automation description
     */
    private String description;
    
    /**
     * Current lifecycle status
     */
    private AutomationStatus status;
    
    /**
     * Trigger type
     */
    private AutomationTriggerType triggerType;
    
    /**
     * Trigger configuration (JSON)
     */
    private Map<String, Object> triggerConfig;
    
    /**
     * Action configuration (JSON, Phase 2+)
     */
    private Map<String, Object> actionConfig;
    
    /**
     * Created by user ID
     */
    private Long createdById;
    
    /**
     * Created by user name (for display)
     */
    private String createdByName;
    
    /**
     * Timestamp when automation was created
     */
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when automation was last updated
     */
    private LocalDateTime updatedAt;
    
    /**
     * Timestamp when automation was archived (null if not archived)
     */
    private LocalDateTime archivedAt;
}
