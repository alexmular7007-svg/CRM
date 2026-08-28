package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.CreateAutomationStepRequest;
import com.arjun.crm.dto.request.UpdateAutomationStepRequest;
import com.arjun.crm.dto.response.AutomationStepResponse;
import com.arjun.crm.entity.Automation;
import com.arjun.crm.entity.AutomationStep;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.repository.AutomationRepository;
import com.arjun.crm.repository.AutomationStepRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.AutomationStepService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * AutomationStepServiceImpl - PHASE 2: Workflow Model
 * 
 * Implementation of automation step management
 * 
 * Security:
 * - OWNER/ADMIN: Full CRUD + reorder
 * - MEMBER: Read-only (list, get)
 * - Workspace isolation enforced on all queries
 * 
 * Key Behaviors:
 * - New steps are appended to end (next available stepOrder)
 * - Reordering automatically shifts other steps
 * - Deleting a step automatically renumbers remaining steps
 * - All steps within an automation must have unique, sequential orders (1, 2, 3, ...)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AutomationStepServiceImpl implements AutomationStepService {
    
    private final AutomationStepRepository stepRepository;
    private final AutomationRepository automationRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;
    
    @Override
    public AutomationStepResponse createStep(Long workspaceId, Long automationId, CreateAutomationStepRequest request) {
        log.info("Creating step in automation: {} (workspace: {})", automationId, workspaceId);
        
        // Validate permission (OWNER/ADMIN only)
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Fetch automation with workspace verification
        Automation automation = automationRepository.findByIdAndWorkspaceId(automationId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Automation not found"));
        
        // Find next step order
        Integer nextOrder = stepRepository.findMaxStepOrder(automationId) + 1;
        
        // Create step
        AutomationStep step = AutomationStep.builder()
                .automation(automation)
                .stepOrder(nextOrder)
                .type(request.getType())
                .configuration(request.getConfiguration())
                .enabled(request.getEnabled() != null ? request.getEnabled() : true)
                .build();
        
        step = stepRepository.save(step);
        
        log.info("Step created successfully with ID: {} (order: {})", step.getId(), step.getStepOrder());
        return mapToResponse(step);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AutomationStepResponse> listSteps(Long workspaceId, Long automationId) {
        log.info("Listing steps in automation: {} (workspace: {})", automationId, workspaceId);
        
        // Validate workspace access (any member)
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        // Verify automation exists in workspace
        automationRepository.findByIdAndWorkspaceId(automationId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Automation not found"));
        
        // Fetch steps in order
        List<AutomationStep> steps = stepRepository.findByAutomationIdOrderByStepOrder(automationId);
        
        return steps.stream().map(this::mapToResponse).toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public AutomationStepResponse getStep(Long workspaceId, Long automationId, Long stepId) {
        log.info("Fetching step: {} in automation: {} (workspace: {})", stepId, automationId, workspaceId);
        
        // Validate workspace access (any member)
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        // Verify automation exists in workspace
        automationRepository.findByIdAndWorkspaceId(automationId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Automation not found"));
        
        // Fetch step with automation verification
        AutomationStep step = stepRepository.findByIdAndAutomationId(stepId, automationId)
                .orElseThrow(() -> new ResourceNotFoundException("Step not found"));
        
        return mapToResponse(step);
    }
    
    @Override
    public AutomationStepResponse updateStep(Long workspaceId, Long automationId, Long stepId, UpdateAutomationStepRequest request) {
        log.info("Updating step: {} in automation: {} (workspace: {})", stepId, automationId, workspaceId);
        
        // Validate permission (OWNER/ADMIN only)
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Verify automation exists in workspace
        automationRepository.findByIdAndWorkspaceId(automationId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Automation not found"));
        
        // Fetch step with automation verification
        AutomationStep step = stepRepository.findByIdAndAutomationId(stepId, automationId)
                .orElseThrow(() -> new ResourceNotFoundException("Step not found"));
        
        // Update fields
        if (request.getConfiguration() != null) {
            step.setConfiguration(request.getConfiguration());
        }
        
        if (request.getEnabled() != null) {
            step.setEnabled(request.getEnabled());
        }
        
        step = stepRepository.save(step);
        
        log.info("Step updated successfully");
        return mapToResponse(step);
    }
    
    @Override
    public void deleteStep(Long workspaceId, Long automationId, Long stepId) {
        log.info("Deleting step: {} in automation: {} (workspace: {})", stepId, automationId, workspaceId);
        
        // Validate permission (OWNER/ADMIN only)
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Verify automation exists in workspace
        automationRepository.findByIdAndWorkspaceId(automationId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Automation not found"));
        
        // Fetch step with automation verification
        AutomationStep step = stepRepository.findByIdAndAutomationId(stepId, automationId)
                .orElseThrow(() -> new ResourceNotFoundException("Step not found"));
        
        Integer deletedOrder = step.getStepOrder();
        
        // Delete step
        stepRepository.delete(step);
        
        // Renumber subsequent steps
        List<AutomationStep> subsequentSteps = stepRepository.findByAutomationIdOrderByStepOrder(automationId)
                .stream()
                .filter(s -> s.getStepOrder() > deletedOrder)
                .toList();
        
        for (AutomationStep subsequentStep : subsequentSteps) {
            subsequentStep.setStepOrder(subsequentStep.getStepOrder() - 1);
            stepRepository.save(subsequentStep);
        }
        
        log.info("Step deleted successfully. Renumbered {} subsequent steps", subsequentSteps.size());
    }
    
    @Override
    public AutomationStepResponse reorderStep(Long workspaceId, Long automationId, Long stepId, Integer newOrder) {
        log.info("Reordering step: {} to order: {} in automation: {} (workspace: {})", stepId, newOrder, automationId, workspaceId);
        
        // Validate permission (OWNER/ADMIN only)
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        // Verify automation exists in workspace
        Automation automation = automationRepository.findByIdAndWorkspaceId(automationId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Automation not found"));
        
        // Fetch step with automation verification
        AutomationStep step = stepRepository.findByIdAndAutomationId(stepId, automationId)
                .orElseThrow(() -> new ResourceNotFoundException("Step not found"));
        
        // Validate new order
        long totalSteps = stepRepository.countByAutomationId(automationId);
        if (newOrder < 1 || newOrder > totalSteps) {
            throw new IllegalArgumentException("Invalid step order. Must be between 1 and " + totalSteps);
        }
        
        Integer currentOrder = step.getStepOrder();
        
        // No-op if same order
        if (currentOrder.equals(newOrder)) {
            log.info("Step already at order {}, no-op", newOrder);
            return mapToResponse(step);
        }
        
        // Get all steps in order
        List<AutomationStep> allSteps = stepRepository.findByAutomationIdOrderByStepOrder(automationId);
        
        if (currentOrder < newOrder) {
            // Moving step down (right): shift steps between currentOrder and newOrder up (left)
            // Example: Move step at position 2 to position 4
            // Before:  [1, 2, 3, 4, 5]
            // After:   [1, 3, 4, 2, 5]
            for (AutomationStep s : allSteps) {
                if (s.getStepOrder() > currentOrder && s.getStepOrder() <= newOrder) {
                    s.setStepOrder(s.getStepOrder() - 1);
                    stepRepository.save(s);
                }
            }
        } else {
            // Moving step up (left): shift steps between newOrder and currentOrder down (right)
            // Example: Move step at position 4 to position 2
            // Before:  [1, 2, 3, 4, 5]
            // After:   [1, 4, 2, 3, 5]
            for (AutomationStep s : allSteps) {
                if (s.getStepOrder() >= newOrder && s.getStepOrder() < currentOrder) {
                    s.setStepOrder(s.getStepOrder() + 1);
                    stepRepository.save(s);
                }
            }
        }
        
        // Update the moving step
        step.setStepOrder(newOrder);
        step = stepRepository.save(step);
        
        log.info("Step reordered successfully from {} to {}", currentOrder, newOrder);
        return mapToResponse(step);
    }
    
    /**
     * Map AutomationStep entity to AutomationStepResponse DTO
     */
    private AutomationStepResponse mapToResponse(AutomationStep step) {
        return AutomationStepResponse.builder()
                .id(step.getId())
                .automationId(step.getAutomation().getId())
                .stepOrder(step.getStepOrder())
                .type(step.getType())
                .configuration(step.getConfiguration())
                .enabled(step.getEnabled())
                .createdAt(step.getCreatedAt())
                .updatedAt(step.getUpdatedAt())
                .build();
    }
}
