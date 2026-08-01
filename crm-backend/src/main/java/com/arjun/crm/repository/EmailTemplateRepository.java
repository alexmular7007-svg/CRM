package com.arjun.crm.repository;

import com.arjun.crm.entity.EmailTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * EmailTemplateRepository - FEATURE #3
 * 
 * Data access layer for email templates
 */
@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {
    
    /**
     * Find template by workspace and ID
     */
    Optional<EmailTemplate> findByIdAndWorkspaceId(Long id, Long workspaceId);
    
    /**
     * Find template by workspace and name
     */
    Optional<EmailTemplate> findByWorkspaceIdAndName(Long workspaceId, String name);
    
    /**
     * Check if template exists by workspace and name
     */
    boolean existsByWorkspaceIdAndName(Long workspaceId, String name);
    
    /**
     * List all templates in workspace (paginated)
     */
    Page<EmailTemplate> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId, Pageable pageable);
    
    /**
     * List templates by category
     */
    Page<EmailTemplate> findByWorkspaceIdAndCategoryOrderByCreatedAtDesc(
            Long workspaceId, String category, Pageable pageable);
    
    /**
     * List public templates
     */
    Page<EmailTemplate> findByWorkspaceIdAndIsPublicTrueOrderByCreatedAtDesc(
            Long workspaceId, Pageable pageable);
    
    /**
     * Count templates in workspace
     */
    long countByWorkspaceId(Long workspaceId);
}
