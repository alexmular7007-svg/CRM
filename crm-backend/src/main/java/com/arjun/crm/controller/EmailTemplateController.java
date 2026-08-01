package com.arjun.crm.controller;

import com.arjun.crm.dto.request.*;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.EmailTemplateResponse;
import com.arjun.crm.service.EmailTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * EmailTemplateController - FEATURE #3
 * 
 * REST API for email template management
 * Base path: /api/workspaces/{workspaceId}/email-templates
 */
@RestController
@RequestMapping("/api/workspaces/{workspaceId}/email-templates")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class EmailTemplateController {
    
    private final EmailTemplateService emailTemplateService;
    
    /**
     * CREATE: POST /api/workspaces/{workspaceId}/email-templates
     * 
     * Create a new email template
     * Permission: OWNER/ADMIN only
     */
    @PostMapping
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> createTemplate(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateEmailTemplateRequest request) {
        
        log.info("POST /api/workspaces/{}/email-templates - Creating template", workspaceId);
        EmailTemplateResponse response = emailTemplateService.createTemplate(workspaceId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Template created successfully", response));
    }
    
    /**
     * LIST: GET /api/workspaces/{workspaceId}/email-templates
     * 
     * List all templates in workspace
     * Permission: Any workspace member
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<EmailTemplateResponse>>> listTemplates(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        
        log.info("GET /api/workspaces/{}/email-templates - Listing templates", workspaceId);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        Page<EmailTemplateResponse> templates = emailTemplateService.listTemplates(workspaceId, pageable);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Templates retrieved successfully", templates));
    }
    
    /**
     * GET: GET /api/workspaces/{workspaceId}/email-templates/{templateId}
     * 
     * Get template details by ID
     * Permission: Any workspace member
     */
    @GetMapping("/{templateId}")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> getTemplate(
            @PathVariable Long workspaceId,
            @PathVariable Long templateId) {
        
        log.info("GET /api/workspaces/{}/email-templates/{} - Getting template", workspaceId, templateId);
        EmailTemplateResponse template = emailTemplateService.getTemplate(workspaceId, templateId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Template retrieved successfully", template));
    }
    
    /**
     * LIST BY CATEGORY: GET /api/workspaces/{workspaceId}/email-templates/category/{category}
     * 
     * List templates by category
     * Permission: Any workspace member
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<Page<EmailTemplateResponse>>> listTemplatesByCategory(
            @PathVariable Long workspaceId,
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/workspaces/{}/email-templates/category/{} - Listing by category", workspaceId, category);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<EmailTemplateResponse> templates = emailTemplateService.listTemplatesByCategory(workspaceId, category, pageable);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Templates retrieved successfully", templates));
    }
    
    /**
     * UPDATE: PUT /api/workspaces/{workspaceId}/email-templates/{templateId}
     * 
     * Update template
     * Permission: OWNER/ADMIN only
     */
    @PutMapping("/{templateId}")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> updateTemplate(
            @PathVariable Long workspaceId,
            @PathVariable Long templateId,
            @Valid @RequestBody UpdateEmailTemplateRequest request) {
        
        log.info("PUT /api/workspaces/{}/email-templates/{} - Updating template", workspaceId, templateId);
        EmailTemplateResponse response = emailTemplateService.updateTemplate(workspaceId, templateId, request);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Template updated successfully", response));
    }
    
    /**
     * DELETE: DELETE /api/workspaces/{workspaceId}/email-templates/{templateId}
     * 
     * Delete template
     * Permission: OWNER/ADMIN only
     */
    @DeleteMapping("/{templateId}")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(
            @PathVariable Long workspaceId,
            @PathVariable Long templateId) {
        
        log.info("DELETE /api/workspaces/{}/email-templates/{} - Deleting", workspaceId, templateId);
        emailTemplateService.deleteTemplate(workspaceId, templateId);
        
        return ResponseEntity.ok()
                .body(ApiResponse.success("Template deleted successfully", null));
    }
}
