package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UseTemplateRequest - PHASE 9: Automation Templates
 *
 * Request DTO for creating an automation from a template.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UseTemplateRequest {

    /**
     * Workspace where automation will be created
     */
    @NotNull(message = "Workspace ID is required")
    private Long workspaceId;

    /**
     * Name for the new automation
     * User customizes this when creating from template
     */
    @NotBlank(message = "Automation name is required")
    private String automationName;
}
