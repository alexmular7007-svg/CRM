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
 */
@Repository
public interface EmailCampaignRepository extends JpaRepository<EmailCampaign, Long> {
    
    /**
     * Find campaign by workspace and ID
     */
    Optional<EmailCampaign> findByIdAndWorkspaceId(Long id, Long workspaceId);
    
    /**
     * Find campaign by workspace and name
     */
    Optional<EmailCampaign> findByWorkspaceIdAndName(Long workspaceId, String name);
    
    /**
     * Check if campaign exists by workspace and name
     */
    boolean existsByWorkspaceIdAndName(Long workspaceId, String name);
    
    /**
     * List all campaigns in a workspace (paginated)
     */
    Page<EmailCampaign> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId, Pageable pageable);
    
    /**
     * List campaigns by workspace and status
     */
    Page<EmailCampaign> findByWorkspaceIdAndStatusOrderByCreatedAtDesc(
            Long workspaceId, String status, Pageable pageable);
    
    /**
     * List active campaigns
     */
    Page<EmailCampaign> findByWorkspaceIdAndIsActiveTrueOrderByCreatedAtDesc(
            Long workspaceId, Pageable pageable);
    
    /**
     * Find campaigns scheduled for sending (for scheduler)
     */
    @Query("SELECT c FROM EmailCampaign c WHERE c.workspace.id = :workspaceId " +
           "AND c.status = 'SCHEDULED' AND c.scheduledAt <= :now AND c.deletedAt IS NULL")
    List<EmailCampaign> findScheduledCampaignsToSend(@Param("workspaceId") Long workspaceId,
                                                     @Param("now") LocalDateTime now);
    
    /**
     * Count campaigns in workspace
     */
    long countByWorkspaceId(Long workspaceId);
    
    /**
     * Count campaigns by status in workspace
     */
    long countByWorkspaceIdAndStatus(Long workspaceId, String status);
}
