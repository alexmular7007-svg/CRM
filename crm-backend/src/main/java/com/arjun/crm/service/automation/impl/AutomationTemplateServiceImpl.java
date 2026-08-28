package com.arjun.crm.service.automation.impl;

import com.arjun.crm.dto.request.CreateAutomationRequest;
import com.arjun.crm.dto.request.CreateAutomationStepRequest;
import com.arjun.crm.dto.response.AutomationResponse;
import com.arjun.crm.dto.response.AutomationTemplateResponse;
import com.arjun.crm.entity.AutomationTemplate;
import com.arjun.crm.enums.AutomationStepType;
import com.arjun.crm.enums.AutomationTriggerType;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.AutomationTemplateRepository;
import com.arjun.crm.service.AutomationService;
import com.arjun.crm.service.AutomationStepService;
import com.arjun.crm.service.automation.AutomationTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * AutomationTemplateServiceImpl - PHASE 9: Automation Templates
 *
 * Implementation of AutomationTemplateService
 * Handles template queries, filtering, and automation instantiation from templates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AutomationTemplateServiceImpl implements AutomationTemplateService {

    private final AutomationTemplateRepository templateRepository;
    private final AutomationService automationService;
    private final AutomationStepService automationStepService;

    @Override
    @Transactional(readOnly = true)
    public Page<AutomationTemplateResponse> listTemplates(Pageable pageable) {
        log.info("Listing all active templates with pagination");
        Page<AutomationTemplate> templates = templateRepository.findByIsActiveTrue(pageable);
        return templates.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AutomationTemplateResponse> listTemplatesByTriggerType(
            AutomationTriggerType triggerType,
            Pageable pageable
    ) {
        log.info("Listing templates filtered by trigger type: {}", triggerType);
        Page<AutomationTemplate> templates = templateRepository.findByIsActiveTrueAndTriggerType(triggerType, pageable);
        return templates.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AutomationTemplateResponse> listTemplatesByCategory(
            String category,
            Pageable pageable
    ) {
        log.info("Listing templates filtered by category: {}", category);
        Page<AutomationTemplate> templates = templateRepository.findByIsActiveTrueAndCategory(category, pageable);
        return templates.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AutomationTemplateResponse> getTemplate(Long templateId) {
        log.info("Fetching template: {}", templateId);
        return templateRepository.findById(templateId)
                .filter(AutomationTemplate::getIsActive)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getCategories() {
        log.info("Fetching distinct template categories");
        return templateRepository.findDistinctCategories();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AutomationTemplateResponse> getPopularTemplates(int limit) {
        log.info("Fetching {} most popular templates", limit);
        List<AutomationTemplate> templates = templateRepository.findByIsActiveTrueOrderByUsageCountDesc();
        return templates.stream()
                .limit(limit)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AutomationResponse createAutomationFromTemplate(
            Long workspaceId,
            Long templateId,
            String automationName
    ) {
        log.info("Creating automation from template: {} in workspace: {}", templateId, workspaceId);

        // Step 1: Load template
        AutomationTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));

        if (!template.getIsActive()) {
            throw new IllegalArgumentException("This template is no longer available");
        }

        log.info("Loaded template: {} (trigger type: {})", template.getName(), template.getTriggerType());

        // Step 2: Create new Automation from template
        CreateAutomationRequest automationRequest = CreateAutomationRequest.builder()
                .name(automationName)
                .description(template.getDescription())
                .triggerType(template.getTriggerType())
                .triggerConfig(template.getTriggerConfig() != null ? template.getTriggerConfig() : Map.of())
                .build();

        AutomationResponse automation = automationService.createAutomation(workspaceId, automationRequest);
        log.info("Created automation from template: {} (automation ID: {})", template.getName(), automation.getId());

        // Step 3: Create steps from template
        if (template.getSteps() != null && !template.getSteps().isEmpty()) {
            for (Map<String, Object> stepTemplate : template.getSteps()) {
                try {
                    // Extract step configuration
                    String stepTypeStr = (String) stepTemplate.get("type");
                    AutomationStepType stepType = AutomationStepType.valueOf(stepTypeStr);

                    @SuppressWarnings("unchecked")
                    Map<String, Object> stepConfig = (Map<String, Object>) stepTemplate.get("configuration");
                    Boolean enabled = (Boolean) stepTemplate.getOrDefault("enabled", true);

                    // Create step request
                    CreateAutomationStepRequest stepRequest = CreateAutomationStepRequest.builder()
                            .type(stepType)
                            .configuration(stepConfig)
                            .enabled(enabled != null ? enabled : true)
                            .build();

                    // Create step in automation
                    automationStepService.createStep(workspaceId, automation.getId(), stepRequest);
                    log.debug("Created step from template: {} (type: {})", stepTypeStr, stepType);

                } catch (Exception e) {
                    log.error("Error creating step from template: {}", e.getMessage(), e);
                    throw new IllegalArgumentException("Failed to create step from template: " + e.getMessage());
                }
            }
        }

        // Step 4: Increment template usage count
        templateRepository.incrementUsageCount(templateId);
        log.info("Incremented usage count for template: {}", templateId);

        // Step 5: Return created automation (fetch fresh to include steps)
        return automationService.getAutomation(workspaceId, automation.getId());
    }

    /**
     * Convert AutomationTemplate entity to response DTO
     */
    private AutomationTemplateResponse mapToResponse(AutomationTemplate template) {
        return AutomationTemplateResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .description(template.getDescription())
                .category(template.getCategory())
                .icon(template.getIcon())
                .triggerType(template.getTriggerType())
                .stepsCount(template.getSteps() != null ? template.getSteps().size() : 0)
                .usageCount(template.getUsageCount())
                .isActive(template.getIsActive())
                .createdAt(template.getCreatedAt())
                .build();
    }
}
