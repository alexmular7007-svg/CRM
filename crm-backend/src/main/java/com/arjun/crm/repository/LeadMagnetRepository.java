package com.arjun.crm.repository;

import com.arjun.crm.entity.LeadMagnet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * LeadMagnetRepository - FEATURE #2
 * 
 * Minimal repository for lead magnets with only required methods.
 * Supports:
 * - Lookup by public token
 * - List by workspace
 * - Existence checks for safety validation
 * - Draft/published states
 */
@Repository
public interface LeadMagnetRepository extends JpaRepository<LeadMagnet, Long> {
    
    /**
     * Find a lead magnet by its globally unique public token
     * Used by public submission API to identify which magnet to submit to
     * 
     * @param publicToken the public UUID token
     * @return the magnet if found and active, empty otherwise
     */
    Optional<LeadMagnet> findByPublicTokenAndIsActiveTrue(String publicToken);
    
    /**
     * Check if a public token exists in the database
     * Used during creation to verify uniqueness (though DB constraint handles it)
     * 
     * @param publicToken the public token
     * @return true if exists, false otherwise
     */
    boolean existsByPublicToken(String publicToken);
    
    /**
     * Check if a magnet slug is already in use in a workspace
     * Slug uniqueness is per-workspace
     * 
     * @param workspaceId the workspace
     * @param slug the slug to check
     * @return true if exists in workspace, false otherwise
     */
    boolean existsByWorkspaceIdAndSlug(Long workspaceId, String slug);
    
    /**
     * List all magnets in a workspace (active and inactive)
     * Used by admin/owner to manage their magnets
     * 
     * @param workspaceId the workspace ID
     * @param pageable pagination settings
     * @return page of magnets
     */
    Page<LeadMagnet> findByWorkspaceId(Long workspaceId, Pageable pageable);
    
    /**
     * List only active magnets in a workspace
     * Used for public listings
     * 
     * @param workspaceId the workspace ID
     * @param pageable pagination settings
     * @return page of active magnets
     */
    Page<LeadMagnet> findByWorkspaceIdAndIsActiveTrue(Long workspaceId, Pageable pageable);
    
    /**
     * Find a specific magnet by ID within a workspace
     * Used to validate ownership/access control before CRUD operations
     * 
     * @param id the magnet ID
     * @param workspaceId the workspace ID
     * @return the magnet if found in that workspace, empty otherwise
     */
    Optional<LeadMagnet> findByIdAndWorkspaceId(Long id, Long workspaceId);
    
    /**
     * Count total magnets in a workspace
     * Used for dashboard analytics
     * 
     * @param workspaceId the workspace ID
     * @return count of magnets
     */
    long countByWorkspaceId(Long workspaceId);
    
    /**
     * Count active magnets in a workspace
     * Used for dashboard analytics
     * 
     * @param workspaceId the workspace ID
     * @return count of active magnets
     */
    long countByWorkspaceIdAndIsActiveTrue(Long workspaceId);
    
    /**
     * Check if magnet has any submissions (safety check before delete)
     * Business rule: hard delete only if zero submissions
     * 
     * @param magnetId the magnet ID
     * @return true if magnet has any submissions
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
           "FROM LeadMagnetSubmission s WHERE s.leadMagnet.id = :magnetId")
    boolean hasSubmissions(@Param("magnetId") Long magnetId);
    
    /**
     * Check if magnet has any views (safety check before delete)
     * Business rule: hard delete only if zero views
     * 
     * @param magnetId the magnet ID
     * @return true if magnet has any views
     */
    @Query("SELECT CASE WHEN COUNT(v) > 0 THEN true ELSE false END " +
           "FROM LeadMagnetView v WHERE v.leadMagnet.id = :magnetId")
    boolean hasViews(@Param("magnetId") Long magnetId);
}
