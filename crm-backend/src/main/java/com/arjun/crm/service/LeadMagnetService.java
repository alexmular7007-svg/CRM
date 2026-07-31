package com.arjun.crm.service;

import com.arjun.crm.dto.request.LeadMagnetCreateRequest;
import com.arjun.crm.dto.request.LeadMagnetSubmissionRequest;
import com.arjun.crm.dto.request.LeadMagnetUpdateRequest;
import com.arjun.crm.dto.response.LeadMagnetResponse;
import com.arjun.crm.dto.response.SubmissionResponse;
import com.arjun.crm.entity.LeadMagnet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * LeadMagnetService - FEATURE #2 PHASE 1B
 * 
 * Service interface for authenticated lead magnet campaign management
 * 
 * Responsibilities:
 * - Campaign CRUD operations (create, read, update)
 * - Slug generation and collision resolution
 * - Workspace isolation (cannot access campaigns from other workspaces)
 * - Permission validation (owner/admin only)
 * - Public token generation
 * 
 * Not included in Phase 1B:
 * - Public submission handling
 * - View tracking
 * - Analytics
 * - Rate limiting
 * - Feature #1 lead conversion
 */
public interface LeadMagnetService {
    
    /**
     * Create a new lead magnet campaign
     * 
     * Permission: OWNER or ADMIN only
     * Authenticated user determined via WorkspaceAuthorizationService
     * 
     * @param workspaceId the workspace ID
     * @param request creation request
     * @return created campaign response
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if workspace not found
     */
    LeadMagnetResponse createMagnet(Long workspaceId, LeadMagnetCreateRequest request);
    
    /**
     * List all campaigns in a workspace (paginated)
     * 
     * Permission: Any workspace member
     * Authenticated user determined via WorkspaceAuthorizationService
     * 
     * @param workspaceId the workspace ID
     * @param pageable pagination settings
     * @return page of campaigns
     * @throws com.arjun.crm.exception.AccessDeniedException if not workspace member
     */
    Page<LeadMagnetResponse> listMagnets(Long workspaceId, Pageable pageable);
    
    /**
     * Get a specific campaign by ID
     * 
     * Permission: Any workspace member
     * Authenticated user determined via WorkspaceAuthorizationService
     * 
     * @param workspaceId the workspace ID
     * @param magnetId the magnet ID
     * @return campaign response
     * @throws com.arjun.crm.exception.AccessDeniedException if not workspace member
     * @throws com.arjun.crm.exception.ResourceNotFoundException if campaign not found
     */
    LeadMagnetResponse getMagnet(Long workspaceId, Long magnetId);
    
    /**
     * Update a campaign (name, description, slug)
     * 
     * Permission: OWNER or ADMIN only
     * Authenticated user determined via WorkspaceAuthorizationService
     * 
     * @param workspaceId the workspace ID
     * @param magnetId the magnet ID
     * @param request update request
     * @return updated campaign response
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if campaign not found
     * @throws com.arjun.crm.exception.DuplicateResourceException if slug collision (409)
     */
    LeadMagnetResponse updateMagnet(Long workspaceId, Long magnetId, LeadMagnetUpdateRequest request);
    
    /**
     * Toggle campaign status (activate/deactivate)
     * 
     * Permission: OWNER or ADMIN only
     * Authenticated user determined via WorkspaceAuthorizationService
     * 
     * @param workspaceId the workspace ID
     * @param magnetId the magnet ID
     * @param isActive new status
     * @return updated campaign response
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if campaign not found
     */
    LeadMagnetResponse updateStatus(Long workspaceId, Long magnetId, boolean isActive);
    
    /**
     * Check if a slug is available in a workspace
     * 
     * Permission: OWNER or ADMIN only
     * Authenticated user determined via WorkspaceAuthorizationService
     * 
     * @param workspaceId the workspace ID
     * @param slug the slug to check
     * @param magnetId optional campaign ID to exclude from check
     *                 (used when updating existing campaign to allow keeping same slug)
     * @return true if slug is available, false if already in use
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     */
    boolean isSlugAvailable(Long workspaceId, String slug, Long magnetId);
    
    /**
     * Submit a public lead magnet form (create lead from visitor submission)
     * 
     * Permission: PUBLIC - NO AUTHENTICATION REQUIRED
     * 
     * Creates a new Lead entity from visitor submission:
     * - Sets status to LEAD (entry status)
     * - Sets priority to MEDIUM (default)
     * - Associates lead with the magnet's workspace
     * - Links lead to the source magnet
     * - Uses magnet creator as lead's createdBy
     * - Increments submission counter on magnet
     * 
     * @param magnet the magnet (must be active)
     * @param request submission data (name, email, phone, company, notes)
     * @return SubmissionResponse with created lead details
     */
    com.arjun.crm.dto.response.SubmissionResponse submitPublicForm(
            com.arjun.crm.entity.LeadMagnet magnet, 
            com.arjun.crm.dto.request.LeadMagnetSubmissionRequest request);
}
