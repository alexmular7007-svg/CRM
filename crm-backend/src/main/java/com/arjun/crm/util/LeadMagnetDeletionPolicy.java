package com.arjun.crm.util;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;

/**
 * LeadMagnetDeletionPolicy - FEATURE #2 DELETE BUSINESS RULES
 * 
 * PHASE 1A.5: Documents deletion rules for lead magnets
 * 
 * HARD DELETE is only permitted if:
 * 1. Magnet has ZERO submissions (never collected leads)
 * 2. Magnet has ZERO views (never had visitors)
 * 
 * Otherwise: DEACTIVATE only using isActive=false (soft delete)
 * 
 * Rationale:
 * - Historical submissions/views are analytics data
 * - Cannot be lost without destroying historical accuracy
 * - isActive=false allows reactivation if needed
 * - Workspace deletion cascades (separate lifecycle)
 */
@UtilityClass
@Slf4j
public class LeadMagnetDeletionPolicy {
    
    /**
     * LEAD MAGNET DELETION POLICY
     * 
     * Call sequence before deletion:
     * 1. Check LeadMagnetRepository.hasSubmissions(magnetId)
     * 2. Check LeadMagnetRepository.hasViews(magnetId)
     * 3. If either true: DEACTIVATE only (set isActive = false)
     * 4. If both false: HARD DELETE permitted
     * 
     * API Layer Enforcement (Phase 1B):
     * - DELETE /api/admin/lead-magnets/{id}
     *   - Checks safety constraints
     *   - Deactivates if submissions/views exist
     *   - Hard deletes only if clean
     *   - Never hard deletes with historical data
     * 
     * NOTE: Phase 1A does NOT implement delete API
     * This policy guides Phase 1B implementation
     */
    public static final String DELETION_RULE = 
        "HARD_DELETE only if submissions=0 AND views=0. " +
        "Otherwise DEACTIVATE via isActive=false for data preservation.";
    
    /**
     * WORKSPACE DELETION CASCADE (separate lifecycle)
     * 
     * When workspace is deleted (admin action):
     * - All magnets CASCADE deleted
     * - All submissions CASCADE deleted
     * - All views CASCADE deleted
     * 
     * This is permitted because:
     * - Workspace deletion is destructive operation
     * - Entire workspace data is discarded
     * - Cascading is explicit and intentional
     * 
     * Database:
     * - lead_magnets: FOREIGN KEY (workspace_id) REFERENCES workspaces ON DELETE CASCADE
     * - lead_magnet_submissions: FOREIGN KEY (lead_magnet_id) REFERENCES lead_magnets ON DELETE CASCADE
     * - lead_magnet_views: FOREIGN KEY (lead_magnet_id) REFERENCES lead_magnets ON DELETE CASCADE
     */
    public static final String WORKSPACE_CASCADE = 
        "Workspace deletion cascades to all magnets, submissions, views (intentional destruction).";
    
    /**
     * DEACTIVATION vs DELETION
     * 
     * DEACTIVATE (isActive = false):
     * - Preserves all historical data
     * - Stops accepting new submissions
     * - Allows reactivation later
     * - Analytics remain visible
     * - Safe for business continuity
     * - Example: Campaign ends, archive it
     * 
     * HARD DELETE:
     * - Only for testing/demo data
     * - Only if zero submissions ever made
     * - Only if zero views ever made
     * - Removes all relationships
     * - Cannot be undone
     * - Example: Test form created by accident, no data
     */
    public static final String DEACTIVATION_BENEFITS = 
        "Preserves historical accuracy. Allows reactivation. Recommended for production.";
}
