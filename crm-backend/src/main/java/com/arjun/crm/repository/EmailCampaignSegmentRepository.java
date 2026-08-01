package com.arjun.crm.repository;

import com.arjun.crm.entity.EmailCampaignSegment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * EmailCampaignSegmentRepository - FEATURE #3
 * 
 * Data access layer for email campaign segments (saved audience filters)
 */
@Repository
public interface EmailCampaignSegmentRepository extends JpaRepository<EmailCampaignSegment, Long> {
    
    /**
     * Find segment by workspace and ID
     */
    Optional<EmailCampaignSegment> findByIdAndWorkspaceId(Long id, Long workspaceId);
    
    /**
     * Find segment by workspace and name
     */
    Optional<EmailCampaignSegment> findByWorkspaceIdAndName(Long workspaceId, String name);
    
    /**
     * Check if segment exists by workspace and name
     */
    boolean existsByWorkspaceIdAndName(Long workspaceId, String name);
    
    /**
     * List all segments in workspace (paginated)
     */
    Page<EmailCampaignSegment> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId, Pageable pageable);
    
    /**
     * Count segments in workspace
     */
    long countByWorkspaceId(Long workspaceId);
}
