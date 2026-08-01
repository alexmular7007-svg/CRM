package com.arjun.crm.service;

import com.arjun.crm.dto.request.*;
import com.arjun.crm.dto.response.EmailTemplateResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * EmailTemplateService - FEATURE #3
 * 
 * Service interface for email template management
 * 
 * Permission Model:
 * - OWNER/ADMIN: Full access (create, read, update, delete)
 * - MEMBER: Read-only access for public templates
 */
public interface EmailTemplateService {
    
    /**
     * Create a new email template
     * 
     * Permission: OWNER/ADMIN only
     */
    EmailTemplateResponse createTemplate(Long workspaceId, CreateEmailTemplateRequest request);
    
    /**
     * List all templates in workspace
     * 
     * Permission: Any workspace member (see only public or own)
     */
    Page<EmailTemplateResponse> listTemplates(Long workspaceId, Pageable pageable);
    
    /**
     * Get template by ID
     * 
     * Permission: Any workspace member (if public) or OWNER/ADMIN
     */
    EmailTemplateResponse getTemplate(Long workspaceId, Long templateId);
    
    /**
     * List templates by category
     */
    Page<EmailTemplateResponse> listTemplatesByCategory(Long workspaceId, String category, Pageable pageable);
    
    /**
     * Update template
     * 
     * Permission: OWNER/ADMIN only
     */
    EmailTemplateResponse updateTemplate(Long workspaceId, Long templateId, UpdateEmailTemplateRequest request);
    
    /**
     * Delete template
     * 
     * Permission: OWNER/ADMIN only
     */
    void deleteTemplate(Long workspaceId, Long templateId);
}
