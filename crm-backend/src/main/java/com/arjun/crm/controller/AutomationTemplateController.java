package com.arjun.crm.controller;

import com.arjun.crm.dto.request.UseTemplateRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.AutomationResponse;
import com.arjun.crm.dto.response.AutomationTemplateResponse;
import com.arjun.crm.enums.AutomationTriggerType;
import com.arjun.crm.service.automation.AutomationTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * AutomationTemplateController - PHASE 9: Automation Templates
 *
 * REST API endpoints for automation template gallery and template-based automation creation.
 *
 * Endpoints:
 * - GET /api/templates - List all templates with pagination
 * - GET /api/templates/categories - Get distinct categories for filtering
 * - GET /api/templates/popular - Get most popular templates
 * - GET /api/templates/{templateId} - Get template details
 * - GET /api/templates/by-trigger/{triggerType} - Filter by trigger type
 * - GET /api/templates/by-category/{category} - Filter by category
 * - POST /api/templates/{templateId}/use - Create automation from template
 *
 * All endpoints are public (no authentication required for read, auth required for write).
 */
@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
@Slf4j
public class AutomationTemplateController {

    private final AutomationTemplateService templateService;

    /**
     * GET /api/templates
     *
     * List all active automation templates with pagination.
     * Perfect for the template gallery.
     *
     * Query Parameters:
     * - page: 0-indexed page number (default: 0)
     * - size: page size (default: 12)
     * - sort: field to sort by (default: usageCount,desc - most popular first)
     *
     * Response:
     * {
     *   "content": [
     *     {
     *       "id": 1,
     *       "name": "New Lead Welcome",
     *       "description": "Send welcome email when lead created",
     *       "category": "welcome",
     *       "icon": "👋",
     *       "triggerType": "LEAD_CREATED",
     *       "stepsCount": 3,
     *       "usageCount": 245,
     *       "isActive": true,
     *       "createdAt": "2026-01-15T10:00:00"
     *     },
     *     ...
     *   ],
     *   "totalElements": 5,
     *   "totalPages": 1,
     *   "currentPage": 0,
     *   "size": 12
     * }
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AutomationTemplateResponse>>> listTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "usageCount") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        try {
            log.info("Fetching templates: page={}, size={}, sortBy={}", page, size, sortBy);

            Sort.Direction direction = Sort.Direction.fromString(sortDirection.toUpperCase());
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            Page<AutomationTemplateResponse> templates = templateService.listTemplates(pageable);

            return ResponseEntity.ok(ApiResponse.success("Templates fetched successfully", templates));
        } catch (Exception e) {
            log.error("Error fetching templates: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch templates"));
        }
    }

    /**
     * GET /api/templates/categories
     *
     * Get all distinct template categories for filter UI.
     *
     * Response:
     * {
     *   "data": ["welcome", "engagement", "onboarding", "re-engagement"],
     *   "success": true,
     *   "message": "Categories fetched successfully"
     * }
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        try {
            log.info("Fetching template categories");

            List<String> categories = templateService.getCategories();

            return ResponseEntity.ok(ApiResponse.success("Categories fetched successfully", categories));
        } catch (Exception e) {
            log.error("Error fetching categories: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch categories"));
        }
    }

    /**
     * GET /api/templates/popular
     *
     * Get most popular templates (most used).
     * Great for featuring templates in the gallery UI.
     *
     * Query Parameters:
     * - limit: number of templates to return (default: 6)
     *
     * Response:
     * {
     *   "data": [top 6 most popular templates],
     *   "success": true,
     *   "message": "Popular templates fetched successfully"
     * }
     */
    @GetMapping("/popular")
    public ResponseEntity<ApiResponse<List<AutomationTemplateResponse>>> getPopularTemplates(
            @RequestParam(defaultValue = "6") int limit
    ) {
        try {
            log.info("Fetching {} most popular templates", limit);

            List<AutomationTemplateResponse> templates = templateService.getPopularTemplates(limit);

            return ResponseEntity.ok(ApiResponse.success("Popular templates fetched successfully", templates));
        } catch (Exception e) {
            log.error("Error fetching popular templates: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch popular templates"));
        }
    }

    /**
     * GET /api/templates/{templateId}
     *
     * Get details for a specific template.
     * Used for preview modal.
     *
     * Path Parameters:
     * - templateId: template identifier
     *
     * Response:
     * {
     *   "data": {
     *     "id": 1,
     *     "name": "New Lead Welcome",
     *     "description": "...",
     *     ...
     *   },
     *   "success": true,
     *   "message": "Template fetched successfully"
     * }
     */
    @GetMapping("/{templateId}")
    public ResponseEntity<ApiResponse<AutomationTemplateResponse>> getTemplate(
            @PathVariable Long templateId
    ) {
        try {
            log.info("Fetching template: {}", templateId);

            return templateService.getTemplate(templateId)
                    .map(template -> ResponseEntity.ok(ApiResponse.success("Template fetched successfully", template)))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error("Template not found")));
        } catch (Exception e) {
            log.error("Error fetching template {}: {}", templateId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch template"));
        }
    }

    /**
     * GET /api/templates/by-trigger/{triggerType}
     *
     * Get templates filtered by automation trigger type.
     * Useful for showing templates that match selected trigger in workflow builder.
     *
     * Path Parameters:
     * - triggerType: trigger type (LEAD_CREATED, EMAIL_OPENED, etc.)
     *
     * Query Parameters:
     * - page: 0-indexed page number (default: 0)
     * - size: page size (default: 12)
     *
     * Response:
     * Page of templates filtered by trigger type
     */
    @GetMapping("/by-trigger/{triggerType}")
    public ResponseEntity<ApiResponse<Page<AutomationTemplateResponse>>> getTemplatesByTriggerType(
            @PathVariable AutomationTriggerType triggerType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        try {
            log.info("Fetching templates by trigger type: {}", triggerType);

            Pageable pageable = PageRequest.of(page, size);
            Page<AutomationTemplateResponse> templates = templateService.listTemplatesByTriggerType(triggerType, pageable);

            return ResponseEntity.ok(ApiResponse.success("Templates fetched successfully", templates));
        } catch (Exception e) {
            log.error("Error fetching templates by trigger type {}: {}", triggerType, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch templates"));
        }
    }

    /**
     * GET /api/templates/by-category/{category}
     *
     * Get templates filtered by category.
     * Used for category-based filtering in gallery.
     *
     * Path Parameters:
     * - category: category name (welcome, engagement, onboarding, etc.)
     *
     * Query Parameters:
     * - page: 0-indexed page number (default: 0)
     * - size: page size (default: 12)
     *
     * Response:
     * Page of templates filtered by category
     */
    @GetMapping("/by-category/{category}")
    public ResponseEntity<ApiResponse<Page<AutomationTemplateResponse>>> getTemplatesByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        try {
            log.info("Fetching templates by category: {}", category);

            Pageable pageable = PageRequest.of(page, size);
            Page<AutomationTemplateResponse> templates = templateService.listTemplatesByCategory(category, pageable);

            return ResponseEntity.ok(ApiResponse.success("Templates fetched successfully", templates));
        } catch (Exception e) {
            log.error("Error fetching templates by category {}: {}", category, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch templates"));
        }
    }

    /**
     * POST /api/templates/{templateId}/use
     *
     * Create a new automation from a template.
     * This is the main action that converts a template into an actual automation.
     *
     * Path Parameters:
     * - templateId: template identifier
     *
     * Request Body:
     * {
     *   "workspaceId": 1,
     *   "automationName": "My Welcome Flow"  // User customization
     * }
     *
     * Response:
     * {
     *   "data": {
     *     "id": 123,
     *     "name": "My Welcome Flow",
     *     "status": "DRAFT",
     *     "triggerType": "LEAD_CREATED",
     *     "steps": [
     *       {
     *         "id": 1,
     *         "stepOrder": 1,
     *         "type": "SEND_EMAIL",
     *         "configuration": {...}
     *       },
     *       ...
     *     ],
     *     "createdAt": "2026-08-24T10:00:00"
     *   },
     *   "success": true,
     *   "message": "Automation created from template successfully"
     * }
     *
     * Status Codes:
     * - 201 CREATED: Automation successfully created
     * - 400 BAD REQUEST: Invalid template or request data
     * - 404 NOT FOUND: Template not found
     * - 500 INTERNAL_SERVER_ERROR: Server error
     */
    @PostMapping("/{templateId}/use")
    public ResponseEntity<ApiResponse<AutomationResponse>> useTemplate(
            @PathVariable Long templateId,
            @Valid @RequestBody UseTemplateRequest request
    ) {
        try {
            log.info("Creating automation from template: {} in workspace: {}", templateId, request.getWorkspaceId());

            AutomationResponse automation = templateService.createAutomationFromTemplate(
                    request.getWorkspaceId(),
                    templateId,
                    request.getAutomationName()
            );

            log.info("Automation created successfully from template: {} (automation ID: {})",
                    templateId, automation.getId());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Automation created from template successfully", automation));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for template {}: {}", templateId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid request: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating automation from template {}: {}", templateId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create automation from template"));
        }
    }
}
