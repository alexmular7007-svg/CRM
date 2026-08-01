package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.*;
import com.arjun.crm.dto.response.EmailTemplateResponse;
import com.arjun.crm.entity.EmailTemplate;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.repository.EmailTemplateRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * EmailTemplateServiceImpl - FEATURE #3
 * 
 * Implementation of email template management
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmailTemplateServiceImpl implements EmailTemplateService {
    
    private final EmailTemplateRepository templateRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;
    
    @Override
    public EmailTemplateResponse createTemplate(Long workspaceId, CreateEmailTemplateRequest request) {
        log.info("Creating email template in workspace: {}", workspaceId);
        
        User authenticatedUser = workspaceAuthService.getAuthenticatedUser();
        
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        if (templateRepository.existsByWorkspaceIdAndName(workspaceId, request.getName())) {
            throw new ConflictException("Template name already exists in this workspace");
        }
        
        EmailTemplate template = EmailTemplate.builder()
                .workspace(workspace)
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .subjectTemplate(request.getSubjectTemplate())
                .htmlContent(request.getHtmlContent())
                .plainTextContent(request.getPlainTextContent())
                .variables(request.getVariables())
                .thumbnailUrl(request.getThumbnailUrl())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .createdBy(authenticatedUser)
                .build();
        
        template = templateRepository.save(template);
        log.info("Template created: {} (ID: {})", template.getName(), template.getId());
        
        return mapToResponse(template);
    }
    
    @Override
    public Page<EmailTemplateResponse> listTemplates(Long workspaceId, Pageable pageable) {
        log.info("Listing templates in workspace: {}", workspaceId);
        
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        return templateRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId, pageable)
                .map(this::mapToResponse);
    }
    
    @Override
    public EmailTemplateResponse getTemplate(Long workspaceId, Long templateId) {
        log.info("Getting template {} in workspace: {}", templateId, workspaceId);
        
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        EmailTemplate template = templateRepository.findByIdAndWorkspaceId(templateId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        
        return mapToResponse(template);
    }
    
    @Override
    public Page<EmailTemplateResponse> listTemplatesByCategory(Long workspaceId, String category, Pageable pageable) {
        log.info("Listing templates by category {} in workspace: {}", category, workspaceId);
        
        workspaceAuthService.validateWorkspaceAccess(workspaceId);
        
        return templateRepository.findByWorkspaceIdAndCategoryOrderByCreatedAtDesc(workspaceId, category, pageable)
                .map(this::mapToResponse);
    }
    
    @Override
    public EmailTemplateResponse updateTemplate(Long workspaceId, Long templateId, UpdateEmailTemplateRequest request) {
        log.info("Updating template {} in workspace: {}", templateId, workspaceId);
        
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        EmailTemplate template = templateRepository.findByIdAndWorkspaceId(templateId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        
        if (request.getName() != null && !request.getName().equals(template.getName())) {
            if (templateRepository.existsByWorkspaceIdAndName(workspaceId, request.getName())) {
                throw new ConflictException("Template name already exists in this workspace");
            }
            template.setName(request.getName());
        }
        
        if (request.getDescription() != null) {
            template.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            template.setCategory(request.getCategory());
        }
        if (request.getSubjectTemplate() != null) {
            template.setSubjectTemplate(request.getSubjectTemplate());
        }
        if (request.getHtmlContent() != null) {
            template.setHtmlContent(request.getHtmlContent());
        }
        if (request.getPlainTextContent() != null) {
            template.setPlainTextContent(request.getPlainTextContent());
        }
        if (request.getVariables() != null) {
            template.setVariables(request.getVariables());
        }
        if (request.getThumbnailUrl() != null) {
            template.setThumbnailUrl(request.getThumbnailUrl());
        }
        if (request.getIsPublic() != null) {
            template.setIsPublic(request.getIsPublic());
        }
        
        template = templateRepository.save(template);
        log.info("Template updated: {} (ID: {})", template.getName(), template.getId());
        
        return mapToResponse(template);
    }
    
    @Override
    public void deleteTemplate(Long workspaceId, Long templateId) {
        log.info("Deleting template {} in workspace: {}", templateId, workspaceId);
        
        WorkspaceMember member = workspaceAuthService.validateWorkspaceAccess(workspaceId);
        workspaceAuthService.validateOwnerOrAdmin(member);
        
        EmailTemplate template = templateRepository.findByIdAndWorkspaceId(templateId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        
        templateRepository.delete(template);
        log.info("Template deleted: {} (ID: {})", template.getName(), template.getId());
    }
    
    private EmailTemplateResponse mapToResponse(EmailTemplate template) {
        return EmailTemplateResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .description(template.getDescription())
                .category(template.getCategory())
                .subjectTemplate(template.getSubjectTemplate())
                .htmlContent(template.getHtmlContent())
                .plainTextContent(template.getPlainTextContent())
                .variables(template.getVariables())
                .thumbnailUrl(template.getThumbnailUrl())
                .isPublic(template.getIsPublic())
                .createdById(template.getCreatedBy().getId())
                .createdByName(template.getCreatedBy().getFullName())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
}
