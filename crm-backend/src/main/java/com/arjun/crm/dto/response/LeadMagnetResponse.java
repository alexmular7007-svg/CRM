package com.arjun.crm.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * LeadMagnetResponse - FEATURE #2 PHASE 1B
 * 
 * Response DTO for lead magnet campaigns
 * Returned for all campaign management endpoints
 * 
 * Purpose:
 * - Campaign CRUD operations (list, get, create, update)
 * - Admin/owner management of campaigns
 * - Campaign details and metadata
 * 
 * Computed fields (not persisted in database):
 * - publicPath: /m/{publicToken}/{slug} (frontend route constructor)
 * 
 * What's NOT included:
 * - Internal submission/view counts (Phase 1C analytics)
 * - Conversion rates (Phase 1C analytics)
 * - formFields schema (Phase 1C)
 * - submission data (separate endpoints)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadMagnetResponse {
    
    /**
     * Internal magnet ID (server-generated)
     */
    private Long id;
    
    /**
     * Workspace this magnet belongs to
     */
    private Long workspaceId;
    
    /**
     * Campaign name
     * Example: "Q4 Special Offer Form"
     */
    private String name;
    
    /**
     * Campaign description (optional)
     * Example: "Lead capture form for Q4 2024 special offer campaign"
     */
    private String description;
    
    /**
     * URL-friendly slug (unique per workspace)
     * Example: "q4-special-offer"
     */
    private String slug;
    
    /**
     * Globally unique public token (UUID)
     * Immutable after creation
     * Used to construct public URL
     * Example: "550e8400-e29b-41d4-a716-446655440000"
     */
    private String publicToken;
    
    /**
     * Computed public path (not persisted)
     * Frontend uses this to construct the public URL
     * Value: /m/{publicToken}/{slug}
     * Example: "/m/550e8400-e29b-41d4-a716-446655440000/q4-special-offer"
     * 
     * Frontend constructs full URL:
     * https://taskflow.example.com/m/550e8400-e29b-41d4-a716-446655440000/q4-special-offer
     */
    @JsonProperty("publicPath")
    private String publicPath;
    
    /**
     * Active/inactive flag
     * true: accepting submissions
     * false: archived (no new submissions, but historical data preserved)
     */
    private Boolean isActive;
    
    /**
     * User ID who created this campaign
     */
    private Long createdById;
    
    /**
     * Timestamp when campaign was created
     */
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when campaign was last updated
     */
    private LocalDateTime updatedAt;
}
