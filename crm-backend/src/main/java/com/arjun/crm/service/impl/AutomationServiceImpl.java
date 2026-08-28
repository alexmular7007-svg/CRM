package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.CreateAutomationRequest;
import com.arjun.crm.dto.request.UpdateAutomationRequest;
import com.arjun.crm.dto.response.AutomationResponse;
import com.arjun.crm.entity.Automation;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.AutomationStatus;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.AutomationRepository;
import com.arjun.crm.repository.AutomationStepRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.AutomationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * AutomationServiceImpl - PHASE 1/PHASE 2: Foundation + Workflow Model
 * 
 * Implementation of automation management
 * 
 * Security:
 * - OWNER/ADMIN: Full CRUD + activate/pause/archive
 * - MEMBER: Read-only (list, get)
 * - Workspace isolation enforced on all queries
 * 
 * Status Transitions:
 * DRAFT → ACTIVE (via activateAutomation)
 * DRAFT → PAUSED (via pauseAutomation - no-op)
 * ACTIVE → PAUSED (via pauseAutomation)
 * PAUSED → ACTIVE (via activateAutomation)
 * Any → ARCHIVED (via archiveAutomation)
 * 
 * PHASE 2: Steps Integration
 * - When automation is created (Phase 2), caller should use AutomationStepService to add steps
 * - When automation is archived, cascade deletes all associated steps
 * - Phase 1 legacy: triggerConfig/actionConfig are deprecated but still supported
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AutomationServiceImpl implements AutomationService {
    
    private final AutomationRepository automationRepository;
    private final AutomationStepRepository automationStepRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;
    
    @Override
    public AutomationResponse createAutomation(Long workspaceId, CreateAutomationRequest request) {
        log.info("Creating automation in workspace: {}", workspaceId);
        
        // Get authenticated user
        User authenticatedUser = workspaceAuthService.getAuthenticatedUser();
        
        // Validate workspace exists
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Validate permission (OWNER/ADMIN only)
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Check for duplicate name in workspace
        if (automationRepository.existsByWorkspaceIdAndName(workspaceId, request.getName())) {
            throw new ConflictException("Automation name already exists in this workspace");
        }
        
        // Validate trigger config is not null
        if (request.getTriggerConfig() == null) {
            throw new IllegalArgumentException("Trigger config is required");
        }
        
        // Create automation
        Automation automation = Automation.builder()
                .workspace(workspace)
                .name(request.getName())
                .description(request.getDescription())
                .status(AutomationStatus.DRAFT)
                .triggerType(request.getTriggerType())
                .triggerConfig(request.getTriggerConfig())
                .createdBy(authenticatedUser)
                .build();
        
        automation = automationRepository.save(automation);
        
        log.info("Automation created successfully with ID: {}", automation.getId());
        return mapToResponse(automation);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<AutomationResponse> listAutomations(Long workspaceId, Pageable pageable) {
        return listAutomations(workspaceId, pageable, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AutomationResponse> listAutomations(Long workspaceId, Pageable pageable, AutomationStatus status) {
        log.info("Listing automations in workspace: {}", workspaceId);
        
        // Validate workspace access (any member)
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        // Fetch automations (excludes archived)
        Page<Automation> automations = status == null
            ? automationRepository.findByWorkspaceId(workspaceId, pageable)
            : automationRepository.findByWorkspaceIdAndStatus(workspaceId, status, pageable);
        
        return automations.map(this::mapToResponse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public AutomationResponse getAutomation(Long workspaceId, Long automationId) {
        log.info("Fetching automation: {} in workspace: {}", automationId, workspaceId);
        
        // Validate workspace access (any member)
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        // Fetch automation with workspace verification
        Automation automation = automationRepository.findByIdAndWorkspaceId(automationId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Automation not found"));
        
        return mapToResponse(automation);
    }
    
    @Override
    public AutomationResponse updateAutomation(Long workspaceId, Long automationId, UpdateAutomationRequest request) {
        log.info("Updating automation: {} in workspace: {}", automationId, workspaceId);
        
        // Validate permission (OWNER/ADMIN only)
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Fetch automation with workspace verification
        Automation automation = automationRepository.findByIdAndWorkspaceId(automationId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Automation not found"));
        
        // Only allow updates to DRAFT automations
        if (!automation.getStatus().equals(AutomationStatus.DRAFT)) {
            throw new IllegalStateException("Automation can only be updated when in DRAFT status");
        }
        
        // Check for duplicate name (excluding current automation)
        if (automationRepository.existsByWorkspaceIdAndNameExcludingId(workspaceId, request.getName(), automationId)) {
            throw new ConflictException("Automation name already exists in this workspace");
        }
        
        // Update fields
        automation.setName(request.getName());
        automation.setDescription(request.getDescription());
        
        if (request.getTriggerConfig() != null) {
            automation.setTriggerConfig(request.getTriggerConfig());
        }
        
        automation = automationRepository.save(automation);
        
        log.info("Automation updated successfully");
        return mapToResponse(automation);
    }
    
    @Override
    public AutomationResponse activateAutomation(Long workspaceId, Long automationId) {
        log.info("Activating automation: {} in workspace: {}", automationId, workspaceId);
        
        // Validate permission (OWNER/ADMIN only)
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Fetch automation with workspace verification
        Automation automation = automationRepository.findByIdAndWorkspaceId(automationId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Automation not found"));
        
        // Validate current status
        if (automation.getStatus().equals(AutomationStatus.ARCHIVED)) {
            throw new IllegalStateException("Cannot activate an archived automation");
        }
        
        // If already active, no-op (idempotent)
        if (!automation.getStatus().equals(AutomationStatus.ACTIVE)) {
            automation.setStatus(AutomationStatus.ACTIVE);
            automation = automationRepository.save(automation);
            log.info("Automation activated successfully");
        }
        
        return mapToResponse(automation);
    }
    
    @Override
    public AutomationResponse pauseAutomation(Long workspaceId, Long automationId) {
        log.info("Pausing automation: {} in workspace: {}", automationId, workspaceId);
        
        // Validate permission (OWNER/ADMIN only)
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Fetch automation with workspace verification
        Automation automation = automationRepository.findByIdAndWorkspaceId(automationId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Automation not found"));
        
        // Only allow pause on ACTIVE automations
        if (!automation.getStatus().equals(AutomationStatus.ACTIVE)) {
            throw new IllegalStateException("Only active automations can be paused");
        }
        
        automation.setStatus(AutomationStatus.PAUSED);
        automation = automationRepository.save(automation);
        
        log.info("Automation paused successfully");
        return mapToResponse(automation);
    }
    
    @Override
    public void archiveAutomation(Long workspaceId, Long automationId) {
        log.info("Archiving automation: {} in workspace: {}", automationId, workspaceId);
        
        // Validate permission (OWNER/ADMIN only)
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Fetch automation with workspace verification
        Automation automation = automationRepository.findByIdAndWorkspaceId(automationId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Automation not found"));
        
        // Soft delete automation
        automation.setStatus(AutomationStatus.ARCHIVED);
        automation.setArchivedAt(LocalDateTime.now());
        automationRepository.save(automation);
        
        // CASCADE: Delete all steps (Phase 2 workflow model)
        // Database has CASCADE DELETE, but we also delete in code for consistency
        automationStepRepository.deleteAllByAutomationId(automationId);
        
        log.info("Automation archived successfully. Deleted all associated steps");
    }
    
    /**
     * Map Automation entity to AutomationResponse DTO
     */
    private AutomationResponse mapToResponse(Automation automation) {
        return AutomationResponse.builder()
                .id(automation.getId())
                .workspaceId(automation.getWorkspace().getId())
                .name(automation.getName())
                .description(automation.getDescription())
                .status(automation.getStatus())
                .triggerType(automation.getTriggerType())
                .triggerConfig(automation.getTriggerConfig())
                .actionConfig(automation.getActionConfig())
                .createdById(automation.getCreatedBy().getId())
                .createdByName(automation.getCreatedBy().getEmail())
                .createdAt(automation.getCreatedAt())
                .updatedAt(automation.getUpdatedAt())
                .archivedAt(automation.getArchivedAt())
                .build();
    }
}
