package com.arjun.crm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LeadMagnetCreateRequest - FEATURE #2 PHASE 1B
 * 
 * Request DTO for creating a new lead magnet campaign
 * 
 * Server-controlled fields (NOT accepted from frontend):
 * - id
 * - publicToken (generated UUID)
 * - workspace (from path parameter + auth)
 * - createdBy (from authenticated user)
 * - createdAt (server timestamp)
 * - updatedAt (server timestamp)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadMagnetCreateRequest {
    
    /**
     * Campaign name (required)
     * Used for admin identification and display
     * Example: "Q4 Special Offer", "Webinar Signup Form"
     */
    @NotBlank(message = "Campaign name is required")
    @Size(min = 1, max = 255, message = "Campaign name must be between 1 and 255 characters")
    private String name;
    
    /**
     * Campaign description (optional)
     * Detailed explanation of the campaign purpose
     * Example: "Lead capture form for Q4 2024 special offer"
     */
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
    
    /**
     * URL-friendly slug (optional)
     * If not provided, will be auto-generated from name
     * If provided, must be unique within workspace
     * Example: "q4-special-offer", "webinar-signup"
     * 
     * Rules:
     * - lowercase alphanumeric + hyphens only
     * - max 100 characters
     * - whitespace converted to hyphens
     * - special characters removed
     * - collision resolution: free-website-audit → free-website-audit-2, etc.
     */
    @Size(max = 100, message = "Slug must not exceed 100 characters")
    private String slug;
    
    /**
     * Initial active state (optional, defaults to true)
     * true: campaign is accepting submissions
     * false: campaign is deactivated (archived)
     */
    @Builder.Default
    private Boolean isActive = true;
}
