package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.*;
import com.arjun.crm.dto.response.EmailCampaignResponse;
import com.arjun.crm.entity.EmailCampaign;
import com.arjun.crm.entity.EmailTemplate;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.repository.EmailCampaignRepository;
import com.arjun.crm.repository.EmailTemplateRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.EmailCampaignService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * EmailCampaignServiceImpl - FEATURE #3
 * 
 * Implementation of email campaign management
 * 
 * Security:
 * - OWNER/ADMIN: Full CRUD + send/schedule
 * - MEMBER: Read-only (list, get)
 * - Workspace isolation enforced on all queries
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmailCampaignServiceImpl implements EmailCampaignService {
    
    private final EmailCampaignRepository campaignRepository;
    private final EmailTemplateRepository templateRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;
    private final ObjectMapper objectMapper;
    
    @Autowired
    private EmailCampaignSendingService emailCampaignSendingService;
    
    @Override
    public EmailCampaignResponse createCampaign(Long workspaceId, CreateEmailCampaignRequest request) {
        log.info("Creating email campaign in workspace: {}", workspaceId);
        
        // Get authenticated user
        User authenticatedUser = workspaceAuthService.getAuthenticatedUser();
        
        // Validate workspace exists
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Validate permission (OWNER/ADMIN only)
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Check for duplicate name in workspace
        if (campaignRepository.existsByWorkspaceIdAndName(workspaceId, request.getName())) {
            throw new ConflictException("Campaign name already exists in this workspace");
        }
        
        // Validate template if provided
        EmailTemplate template = null;
        if (request.getTemplateId() != null) {
            template = templateRepository.findByIdAndWorkspaceId(request.getTemplateId(), workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        } else if ("TEMPLATE".equalsIgnoreCase(request.getContentType())) {
            throw new IllegalArgumentException("Template ID is required when content type is TEMPLATE");
        }
        
        // Parse recipientData from String to Map<String, Object>
        Map<String, Object> recipientDataMap = parseRecipientData(request.getRecipientData());
        
        // Create campaign
        EmailCampaign campaign = EmailCampaign.builder()
                .workspace(workspace)
                .name(request.getName())
                .description(request.getDescription())
                .subject(request.getSubject())
                .subjectVariables(request.getVariables())
                .template(template)
                .contentType(request.getContentType() != null ? request.getContentType() : "TEMPLATE")
                .customHtmlContent(request.getHtmlContent())
                .ctaButtonText(request.getCtaButtonText())
                .ctaButtonUrl(request.getCtaButtonUrl())
                .status(request.getStatus() != null ? request.getStatus() : "DRAFT")
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .createdBy(authenticatedUser)
                .recipientMode(request.getRecipientMode() != null ? request.getRecipientMode() : "MANUAL")
                .recipientData(recipientDataMap)
                .totalRecipients(0L)
                .retryCount(0)
                .build();
        
        campaign = campaignRepository.save(campaign);
        log.info("Campaign created: {} (ID: {}) with CTA: {} ({})", 
                campaign.getName(), campaign.getId(), campaign.getCtaButtonText(), campaign.getCtaButtonUrl());
        
        return mapToResponse(campaign);
    }
    
    @Override
    public Page<EmailCampaignResponse> listCampaigns(Long workspaceId, Pageable pageable) {
        log.info("[TRACE-EmailCampaign-Service-START] workspaceId={}, page={}, size={}", 
                workspaceId, pageable.getPageNumber(), pageable.getPageSize());
        
        // Validate access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        log.info("[TRACE-EmailCampaign-Repository-CALLING] workspace_id={}", workspaceId);
        Page<EmailCampaign> campaigns = campaignRepository.findActiveCampaigns(workspaceId, pageable);
        log.info("[TRACE-EmailCampaign-Repository-RESULT] total_elements={}, page_size={}, pages={}", 
                campaigns.getTotalElements(), campaigns.getSize(), campaigns.getTotalPages());
        
        Page<EmailCampaignResponse> response = campaigns.map(this::mapToResponse);
        log.info("[TRACE-EmailCampaign-Service-RESPONSE] mapped_elements={}", response.getTotalElements());
        
        return response;
    }
    
    @Override
    public EmailCampaignResponse getCampaign(Long workspaceId, Long campaignId) {
        log.info("Getting campaign {} in workspace: {}", campaignId, workspaceId);
        
        // Validate access
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        EmailCampaign campaign = campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        
        return mapToResponse(campaign);
    }
    
    @Override
    public Page<EmailCampaignResponse> listCampaignsByStatus(Long workspaceId, String status, Pageable pageable) {
        log.info("Listing campaigns with status {} in workspace: {}", status, workspaceId);
        
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        return campaignRepository.findActiveCampaignsByStatus(workspaceId, status, pageable)
                .map(this::mapToResponse);
    }
    
    @Override
    public EmailCampaignResponse updateCampaign(Long workspaceId, Long campaignId, UpdateEmailCampaignRequest request) {
        log.info("Updating campaign {} in workspace: {}", campaignId, workspaceId);
        
        // Validate permission
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Get campaign
        EmailCampaign campaign = campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        
        // Only allow updates to DRAFT campaigns
        if (!"DRAFT".equals(campaign.getStatus())) {
            throw new IllegalStateException("Can only update campaigns in DRAFT status");
        }
        
        // Check for duplicate name (if changing name)
        if (request.getName() != null && !request.getName().equals(campaign.getName())) {
            if (campaignRepository.existsByWorkspaceIdAndName(workspaceId, request.getName())) {
                throw new ConflictException("Campaign name already exists in this workspace");
            }
            campaign.setName(request.getName());
        }
        
        // Update fields
        if (request.getDescription() != null) {
            campaign.setDescription(request.getDescription());
        }
        if (request.getSubject() != null) {
            campaign.setSubject(request.getSubject());
        }
        if (request.getTemplateId() != null) {
            EmailTemplate template = templateRepository.findByIdAndWorkspaceId(request.getTemplateId(), workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
            campaign.setTemplate(template);
        }
        if (request.getHtmlContent() != null) {
            campaign.setTemplate(null);  // Clear template when custom HTML provided
        }
        if (request.getVariables() != null) {
            campaign.setSubjectVariables(request.getVariables());
        }
        if (request.getIsActive() != null) {
            campaign.setIsActive(request.getIsActive());
        }
        
        campaign = campaignRepository.save(campaign);
        log.info("Campaign updated: {} (ID: {})", campaign.getName(), campaign.getId());
        
        return mapToResponse(campaign);
    }
    
    @Override
    public EmailCampaignResponse scheduleCampaign(Long workspaceId, Long campaignId, ScheduleCampaignRequest request) {
        log.info("Scheduling campaign {} in workspace: {}", campaignId, workspaceId);
        
        // Validate permission
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        EmailCampaign campaign = campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        
        // Validate status transition
        if (!"DRAFT".equals(campaign.getStatus())) {
            throw new IllegalStateException("Can only schedule DRAFT campaigns");
        }
        
        // Validate scheduled time is in future
        if (request.getScheduledAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Scheduled time must be in the future");
        }
        
        campaign.setScheduledAt(request.getScheduledAt());
        campaign.setStatus("SCHEDULED");
        campaign.setRetryCount(request.getRetryCount() != null ? request.getRetryCount() : 3);
        
        campaign = campaignRepository.save(campaign);
        log.info("Campaign scheduled: {} (scheduled for {})", campaign.getName(), request.getScheduledAt());
        
        return mapToResponse(campaign);
    }
    
    @Override
    public EmailCampaignResponse sendCampaign(Long workspaceId, Long campaignId) {
        log.info("Sending campaign {} in workspace: {}", campaignId, workspaceId);
        
        // Validate permission
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        EmailCampaign campaign = campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        
        // Validate status
        if (!("DRAFT".equals(campaign.getStatus()) || "SCHEDULED".equals(campaign.getStatus()))) {
            throw new IllegalStateException("Can only send DRAFT or SCHEDULED campaigns");
        }
        
        campaign.setStatus("SENDING");
        campaign.setSendStartedAt(LocalDateTime.now());
        
        campaign = campaignRepository.save(campaign);
        log.info("Campaign send initiated: {} (ID: {})", campaign.getName(), campaign.getId());
        
        // Start async email sending in background (non-blocking)
        log.info("Triggering async email sending for campaign: {}", campaignId);
        emailCampaignSendingService.sendCampaignAsync(campaignId);
        
        return mapToResponse(campaign);
    }
    
    @Override
    public EmailCampaignResponse updateCampaignStatus(Long workspaceId, Long campaignId, EmailCampaignStatusRequest request) {
        log.info("Updating campaign {} status to: {}", campaignId, request.getStatus());
        
        // Validate permission
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        EmailCampaign campaign = campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        
        String newStatus = request.getStatus();
        
        // Validate status transitions
        validateStatusTransition(campaign.getStatus(), newStatus);
        
        campaign.setStatus(newStatus);
        
        // Set completion time if transitioning to COMPLETED
        if ("COMPLETED".equals(newStatus)) {
            campaign.setSendCompletedAt(LocalDateTime.now());
        }
        
        campaign = campaignRepository.save(campaign);
        return mapToResponse(campaign);
    }
    
    @Override
    public void deleteCampaign(Long workspaceId, Long campaignId) {
        log.info("Deleting campaign {} in workspace: {}", campaignId, workspaceId);
        
        // Validate permission
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        EmailCampaign campaign = campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        
        // Soft delete
        campaign.setDeletedAt(LocalDateTime.now());
        campaignRepository.save(campaign);
        
        log.info("Campaign soft-deleted: {} (ID: {})", campaign.getName(), campaign.getId());
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // Helper methods
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * Parse recipientData from String JSON to Map<String, Object>.
     * If input is null or invalid, returns empty map.
     * This ensures proper JSONB type mapping to PostgreSQL.
     */
    private Map<String, Object> parseRecipientData(String recipientDataJson) {
        if (recipientDataJson == null || recipientDataJson.isBlank()) {
            return Map.of();
        }
        
        try {
            return objectMapper.readValue(recipientDataJson, Map.class);
        } catch (Exception e) {
            log.warn("Failed to parse recipientData JSON, using empty map: {}", e.getMessage());
            return Map.of();
        }
    }
    
    private EmailCampaignResponse mapToResponse(EmailCampaign campaign) {
        return EmailCampaignResponse.builder()
                .id(campaign.getId())
                .name(campaign.getName())
                .description(campaign.getDescription())
                .subject(campaign.getSubject())
                .subjectVariables(campaign.getSubjectVariables())
                .templateId(campaign.getTemplate() != null ? campaign.getTemplate().getId() : null)
                .templateName(campaign.getTemplate() != null ? campaign.getTemplate().getName() : null)
                .contentType(campaign.getContentType())
                .status(campaign.getStatus())
                .isActive(campaign.getIsActive())
                .createdById(campaign.getCreatedBy().getId())
                .createdByName(campaign.getCreatedBy().getFullName())
                .scheduledAt(campaign.getScheduledAt())
                .sendStartedAt(campaign.getSendStartedAt())
                .sendCompletedAt(campaign.getSendCompletedAt())
                .totalRecipients(campaign.getTotalRecipients())
                .sentCount(campaign.getSentCount())
                .failedCount(campaign.getFailedCount())
                .deliveredCount(campaign.getDeliveredCount())
                .openedCount(campaign.getOpenedCount())
                .clickedCount(campaign.getClickedCount())
                .bouncedCount(campaign.getBouncedCount())
                .recipientMode(campaign.getRecipientMode())
                .recipientData(serializeRecipientData(campaign.getRecipientData()))
                .createdAt(campaign.getCreatedAt())
                .updatedAt(campaign.getUpdatedAt())
                .deletedAt(campaign.getDeletedAt())
                .build();
    }
    
    /**
     * Serialize recipientData from Map<String, Object> to JSON String.
     * Used for API responses to maintain backward compatibility.
     */
    private String serializeRecipientData(Map<String, Object> recipientDataMap) {
        if (recipientDataMap == null || recipientDataMap.isEmpty()) {
            return "{}";
        }
        
        try {
            return objectMapper.writeValueAsString(recipientDataMap);
        } catch (Exception e) {
            log.warn("Failed to serialize recipientData map: {}", e.getMessage());
            return "{}";
        }
    }
    
    private void validateStatusTransition(String currentStatus, String newStatus) {
        // Valid transitions:
        // DRAFT -> SCHEDULED, DRAFT -> SENDING
        // SCHEDULED -> SENDING, SCHEDULED -> DRAFT
        // SENDING -> PAUSED, SENDING -> COMPLETED
        // PAUSED -> SENDING, PAUSED -> COMPLETED
        
        boolean validTransition = switch (currentStatus) {
            case "DRAFT" -> "SCHEDULED".equals(newStatus) || "SENDING".equals(newStatus);
            case "SCHEDULED" -> "DRAFT".equals(newStatus) || "SENDING".equals(newStatus);
            case "SENDING" -> "PAUSED".equals(newStatus) || "COMPLETED".equals(newStatus);
            case "PAUSED" -> "SENDING".equals(newStatus) || "COMPLETED".equals(newStatus);
            default -> false;
        };
        
        if (!validTransition) {
            throw new IllegalStateException("Invalid status transition from " + currentStatus + " to " + newStatus);
        }
    }
}
