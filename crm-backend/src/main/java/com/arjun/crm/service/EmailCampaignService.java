package com.arjun.crm.service;

import com.arjun.crm.dto.request.*;
import com.arjun.crm.dto.response.EmailCampaignResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * EmailCampaignService - FEATURE #3
 * 
 * Service interface for email campaign management
 * 
 * Permission Model:
 * - OWNER/ADMIN: Full access (create, read, update, delete, schedule, send)
 * - MEMBER: Read-only access (list, get, view analytics)
 * 
 * All operations are workspace-scoped through WorkspaceAuthorizationService
 */
public interface EmailCampaignService {
    
    /**
     * Create a new email campaign
     * 
     * Permission: OWNER/ADMIN only
     * 
     * @param workspaceId the workspace ID
     * @param request creation request
     * @return created campaign response
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if workspace not found
     */
    EmailCampaignResponse createCampaign(Long workspaceId, CreateEmailCampaignRequest request);
    
    /**
     * List all campaigns in a workspace (paginated)
     * 
     * Permission: Any workspace member
     * 
     * @param workspaceId the workspace ID
     * @param pageable pagination settings
     * @return page of campaigns
     * @throws com.arjun.crm.exception.AccessDeniedException if not workspace member
     */
    Page<EmailCampaignResponse> listCampaigns(Long workspaceId, Pageable pageable);
    
    /**
     * Get a specific campaign by ID
     * 
     * Permission: Any workspace member
     * 
     * @param workspaceId the workspace ID
     * @param campaignId the campaign ID
     * @return campaign response
     * @throws com.arjun.crm.exception.AccessDeniedException if not workspace member
     * @throws com.arjun.crm.exception.ResourceNotFoundException if campaign not found
     */
    EmailCampaignResponse getCampaign(Long workspaceId, Long campaignId);
    
    /**
     * List campaigns by status
     * 
     * Permission: Any workspace member
     * 
     * @param workspaceId the workspace ID
     * @param status campaign status
     * @param pageable pagination settings
     * @return page of campaigns
     */
    Page<EmailCampaignResponse> listCampaignsByStatus(Long workspaceId, String status, Pageable pageable);
    
    /**
     * Update campaign (DRAFT only)
     * 
     * Permission: OWNER/ADMIN only
     * 
     * @param workspaceId the workspace ID
     * @param campaignId the campaign ID
     * @param request update request
     * @return updated campaign response
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if campaign not found
     * @throws IllegalStateException if campaign status is not DRAFT
     */
    EmailCampaignResponse updateCampaign(Long workspaceId, Long campaignId, UpdateEmailCampaignRequest request);
    
    /**
     * Schedule campaign for sending
     * 
     * Permission: OWNER/ADMIN only
     * 
     * @param workspaceId the workspace ID
     * @param campaignId the campaign ID
     * @param request schedule request
     * @return updated campaign response
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     * @throws com.arjun.crm.exception.ResourceNotFoundException if campaign not found
     */
    EmailCampaignResponse scheduleCampaign(Long workspaceId, Long campaignId, ScheduleCampaignRequest request);
    
    /**
     * Send campaign immediately
     * 
     * Permission: OWNER/ADMIN only
     * 
     * @param workspaceId the workspace ID
     * @param campaignId the campaign ID
     * @return updated campaign response with status SENDING
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     */
    EmailCampaignResponse sendCampaign(Long workspaceId, Long campaignId);
    
    /**
     * Update campaign status
     * 
     * Permission: OWNER/ADMIN only
     * 
     * @param workspaceId the workspace ID
     * @param campaignId the campaign ID
     * @param request status request
     * @return updated campaign response
     */
    EmailCampaignResponse updateCampaignStatus(Long workspaceId, Long campaignId, EmailCampaignStatusRequest request);
    
    /**
     * Delete campaign (soft delete with deleted_at)
     * 
     * Permission: OWNER/ADMIN only
     * 
     * @param workspaceId the workspace ID
     * @param campaignId the campaign ID
     * @throws com.arjun.crm.exception.AccessDeniedException if insufficient permission
     */
    void deleteCampaign(Long workspaceId, Long campaignId);
}
