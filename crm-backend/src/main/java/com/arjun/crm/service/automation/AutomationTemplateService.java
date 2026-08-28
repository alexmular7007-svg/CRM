package com.arjun.crm.service.automation;

import com.arjun.crm.dto.response.AutomationResponse;
import com.arjun.crm.dto.response.AutomationTemplateResponse;
import com.arjun.crm.enums.AutomationTriggerType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * AutomationTemplateService - PHASE 9: Automation Templates
 *
 * Service layer for automation template operations.
 *
 * Responsibilities:
 * - List available templates with filtering and pagination
 * - Get template details
 * - Create automations from templates (instantiation)
 * - Track template usage statistics
 * - Manage template categories and filtering
 */
public interface AutomationTemplateService {

    /**
     * Get all active templates with pagination
     */
    Page<AutomationTemplateResponse> listTemplates(Pageable pageable);

    /**
     * Get active templates filtered by trigger type
     */
    Page<AutomationTemplateResponse> listTemplatesByTriggerType(
            AutomationTriggerType triggerType,
            Pageable pageable
    );

    /**
     * Get active templates filtered by category
     */
    Page<AutomationTemplateResponse> listTemplatesByCategory(
            String category,
            Pageable pageable
    );

    /**
     * Get template by ID
     */
    Optional<AutomationTemplateResponse> getTemplate(Long templateId);

    /**
     * Get all distinct template categories for filter UI
     */
    List<String> getCategories();

    /**
     * Get most popular templates (sorted by usage count)
     * Useful for featuring templates in gallery
     */
    List<AutomationTemplateResponse> getPopularTemplates(int limit);

    /**
     * Create an automation from a template
     *
     * Flow:
     * 1. Load template definition
     * 2. Create new Automation in DRAFT state with template's trigger type and trigger config
     * 3. For each step in template, create AutomationStep with template's step configuration
     * 4. Increment template's usage count
     * 5. Return created automation
     *
     * @param workspaceId - Workspace where automation will be created
     * @param templateId - Template to use
     * @param automationName - Name for the new automation (user customization)
     * @return Created automation (in DRAFT state, ready for customization)
     */
    AutomationResponse createAutomationFromTemplate(
            Long workspaceId,
            Long templateId,
            String automationName
    );
}
