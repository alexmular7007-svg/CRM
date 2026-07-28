package com.arjun.crm.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LeadMagnetUpdateRequest - FEATURE #2 PHASE 1B
 * 
 * Request DTO for updating an existing lead magnet campaign
 * 
 * Allowed updates:
 * - name
 * - description
 * - slug
 * 
 * Immutable fields (NOT allowed to update):
 * - publicToken (immutable, generated once at creation)
 * - workspace (immutable)
 * - createdBy (immutable)
 * - createdAt (immutable)
 * - isActive (use separate PATCH /{id}/status endpoint)
 * 
 * Campaign status must be updated via separate endpoint:
 * PATCH /api/workspaces/{workspaceId}/lead-magnets/{id}/status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadMagnetUpdateRequest {
    
    /**
     * Campaign name (optional)
     * If provided, updates the campaign name
     */
    @Size(min = 1, max = 255, message = "Campaign name must be between 1 and 255 characters")
    private String name;
    
    /**
     * Campaign description (optional)
     * If provided, updates the campaign description
     */
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
    
    /**
     * URL-friendly slug (optional)
     * If provided, updates the campaign slug
     * Must remain unique within workspace
     * If collision occurs, returns HTTP 409
     * 
     * Rules:
     * - lowercase alphanumeric + hyphens only
     * - max 100 characters
     * - whitespace converted to hyphens
     * - special characters removed
     */
    @Size(max = 100, message = "Slug must not exceed 100 characters")
    private String slug;
}
