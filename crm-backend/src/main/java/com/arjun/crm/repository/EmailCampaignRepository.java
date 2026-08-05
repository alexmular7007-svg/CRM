package com.arjun.crm.repository;

import com.arjun.crm.entity.EmailCampaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * EmailCampaignRepository - FEATURE #3
 * 
 * Data access layer for email campaigns
 * 
 * NOTE: All list/query methods filter out soft-deleted campaigns (deletedAt IS NULL)
 * Only hard-delete operations use the underlying JPA methods.
 */
@Repository
public interface EmailCampaignRepository extends JpaRepository<EmailCampaign, Long> {
    
    /**
     * Find campaign by workspace and ID (no soft-delete filter)
     * Used for direct lookups where soft-delete status is already known
     */
    Optional<EmailCampaign> findByIdAndWorkspaceId(Long id, Long workspaceId);
    
    /**
     * Find campaign by workspace and name (no soft-delete filter)
     */
    Optional<EmailCampaign> findByWorkspaceIdAndName(Long workspaceId, String name);
    
    /**
     * Check if campaign exists by workspace and name
     */
    boolean existsByWorkspaceIdAndName(Long workspaceId, String name);
    
    /**
     * List all ACTIVE campaigns in a workspace (excludes soft-deleted)
     * Paginated with newest first
     */
    @Query("""
        SELECT c FROM EmailCampaign c 
        WHERE c.workspace.id = :workspaceId 
        AND c.deletedAt IS NULL 
        ORDER BY c.createdAt DESC
    """)
    Page<EmailCampaign> findActiveCampaigns(
            @Param("workspaceId") Long workspaceId,
            Pageable pageable);
    
    /**
     * List ACTIVE campaigns by status (excludes soft-deleted)
     * Paginated with newest first
     */
    @Query("""
        SELECT c FROM EmailCampaign c 
        WHERE c.workspace.id = :workspaceId 
        AND c.status = :status 
        AND c.deletedAt IS NULL 
        ORDER BY c.createdAt DESC
    """)
    Page<EmailCampaign> findActiveCampaignsByStatus(
            @Param("workspaceId") Long workspaceId,
            @Param("status") String status,
            Pageable pageable);
    
    /**
     * List active campaigns (no pagination)
     */
    @Query("""
        SELECT c FROM EmailCampaign c 
        WHERE c.workspace.id = :workspaceId 
        AND c.isActive = true 
        AND c.deletedAt IS NULL 
        ORDER BY c.createdAt DESC
    """)
    Page<EmailCampaign> findActiveCampaignsActive(
            @Param("workspaceId") Long workspaceId,
            Pageable pageable);
    
    /**
     * Find campaigns scheduled for sending (for scheduler)
     * Automatically excludes soft-deleted campaigns
     */
    @Query("""
        SELECT c FROM EmailCampaign c 
        WHERE c.workspace.id = :workspaceId 
        AND c.status = 'SCHEDULED' 
        AND c.scheduledAt <= :now 
        AND c.deletedAt IS NULL
    """)
    List<EmailCampaign> findScheduledCampaignsToSend(
            @Param("workspaceId") Long workspaceId,
            @Param("now") LocalDateTime now);
    
    /**
     * Count active campaigns in workspace
     */
    @Query("SELECT COUNT(c) FROM EmailCampaign c WHERE c.workspace.id = :workspaceId AND c.deletedAt IS NULL")
    long countActiveByWorkspaceId(@Param("workspaceId") Long workspaceId);
    
    /**
     * Count active campaigns by status in workspace
     */
    @Query("""
        SELECT COUNT(c) FROM EmailCampaign c 
        WHERE c.workspace.id = :workspaceId 
        AND c.status = :status 
        AND c.deletedAt IS NULL
    """)
    long countActiveByWorkspaceIdAndStatus(
            @Param("workspaceId") Long workspaceId,
            @Param("status") String status);
}

