package com.arjun.crm.dto.response;

import com.arjun.crm.enums.AutomationTriggerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * AutomationTemplateResponse - PHASE 9: Automation Templates
 *
 * API response DTO for automation templates.
 * Contains all information needed for the template gallery and preview.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationTemplateResponse {

    /**
     * Template ID
     */
    private Long id;

    /**
     * Template name displayed in gallery
     */
    private String name;

    /**
     * Long description for gallery card
     */
    private String description;

    /**
     * Category for filtering
     */
    private String category;

    /**
     * Icon/emoji for visual display
     */
    private String icon;

    /**
     * Trigger type for this template
     */
    private AutomationTriggerType triggerType;

    /**
     * Number of steps in this template's workflow
     */
    private Integer stepsCount;

    /**
     * How many times this template has been used
     */
    private Long usageCount;

    /**
     * Whether template is available
     */
    private Boolean isActive;

    /**
     * Template creation timestamp
     */
    private LocalDateTime createdAt;
}
