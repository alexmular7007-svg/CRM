package com.arjun.crm.entity;

import com.arjun.crm.enums.AutomationTriggerType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * AutomationTemplate - PHASE 9: Automation Templates
 *
 * Predefined workflow templates that users can use to create automations quickly.
 *
 * Template Lifecycle:
 * 1. System-defined templates are loaded at startup (via data loader)
 * 2. Users browse templates in the template gallery
 * 3. User selects a template and clicks "Use Template"
 * 4. System creates a NEW Automation (DRAFT state) with template data
 * 5. User customizes and activates the automation
 *
 * Important: This entity stores template DEFINITIONS, not instances.
 * Templates are read-only. User selections create new Automations.
 *
 * Template Structure:
 * - name: Display name in gallery ("New Lead Welcome", "Lead Re-engagement", etc.)
 * - description: Long description for gallery card
 * - category: Category for filtering (e.g., "engagement", "onboarding", "re-engagement")
 * - icon: Emoji or icon identifier for visual display
 * - triggerType: The event that triggers this automation
 * - steps: List of predefined workflow steps (as StepTemplate objects stored in JSON)
 * - isActive: Whether template is available for use (allows deprecating old templates)
 * - usageCount: Track how many times this template has been used (for analytics)
 */
@Entity
@Table(name = "automation_templates", indexes = {
        @Index(name = "idx_template_is_active", columnList = "is_active"),
        @Index(name = "idx_template_trigger_type", columnList = "trigger_type"),
        @Index(name = "idx_template_category", columnList = "category"),
        @Index(name = "idx_template_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Template name displayed in gallery
     * Examples: "New Lead Welcome", "Lead Magnet Follow-up", "Email Engagement Follow-up"
     */
    @Column(nullable = false, length = 255, unique = true)
    private String name;

    /**
     * Long description for the template gallery card
     * Examples: "Send welcome email when a new lead is created"
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Category for template grouping and filtering
     * Examples: "welcome", "engagement", "onboarding", "re-engagement"
     */
    @Column(length = 100)
    private String category;

    /**
     * Icon/emoji for visual display in gallery
     * Examples: "👋", "📧", "🔄", "🎯", "🚀"
     */
    @Column(length = 10)
    private String icon;

    /**
     * The event that triggers this automation workflow
     * Examples: LEAD_CREATED, LEAD_MAGNET_SUBMITTED, EMAIL_OPENED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AutomationTriggerType triggerType;

    /**
     * Trigger configuration template (JSONB)
     * This is used as a base when creating automations from this template
     * Example: {"leadMagnetIds": [], "delay": 0} - user customizes leadMagnetIds
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> triggerConfig;

    /**
     * Template steps as JSON array of StepTemplate objects
     * Each step contains: type, configuration, enabled
     * 
     * Example structure (3-step template):
     * [
     *   {
     *     "stepOrder": 1,
     *     "type": "SEND_EMAIL",
     *     "configuration": {
     *       "subject": "Welcome!",
     *       "emailTemplateId": null,  // User will customize
     *       "recipientField": "email"
     *     },
     *     "enabled": true
     *   },
     *   {
     *     "stepOrder": 2,
     *     "type": "WAIT_DURATION",
     *     "configuration": {
     *       "duration": 24,
     *       "unit": "HOURS"
     *     },
     *     "enabled": true
     *   },
     *   {
     *     "stepOrder": 3,
     *     "type": "UPDATE_LEAD_SCORE",
     *     "configuration": {
     *       "scoreChange": 5,
     *       "reason": "Welcome email sent"
     *     },
     *     "enabled": true
     *   }
     * ]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> steps;

    /**
     * Whether this template is available for use
     * Allows deprecating templates without deleting them (for historical tracking)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Number of times this template has been used
     * Incremented when a user creates an automation from this template
     * Used for analytics: popular templates can be featured
     */
    @Column(nullable = false)
    @Builder.Default
    private Long usageCount = 0L;

    /**
     * Audit fields
     */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
