package com.arjun.crm.entity;

import com.arjun.crm.enums.AutomationStatus;
import com.arjun.crm.enums.AutomationTriggerType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Automation Entity - PHASE 1: Core Foundation
 * 
 * Represents a marketing automation that connects CRM modules
 * (Lead Magnets → Leads → Email Campaigns → Analytics)
 * 
 * Lifecycle:
 * DRAFT → ACTIVE → PAUSED → ACTIVE (re-activate)
 * Any state → ARCHIVED (soft delete)
 * 
 * Trigger Types Supported:
 * - LEAD_CREATED: When a new lead is created
 * - LEAD_MAGNET_SUBMITTED: When lead magnet form submitted
 * - EMAIL_OPENED: When recipient opens email
 * - EMAIL_CLICKED: When recipient clicks email link
 * 
 * Configuration Structure (JSONB):
 * {
 *   "triggerConfig": {
 *     "leadMagnetIds": [123, 456],  // Optional: specific lead magnets
 *     "emailCampaignIds": [789],    // Optional: specific email campaigns
 *     "delay": 0,                    // Optional: seconds to wait before action
 *     "conditions": [...]            // Optional: conditional logic (Phase 2)
 *   }
 * }
 * 
 * Actions (stored as JSON array in future):
 * Phase 1: Reserved for Phase 2+ implementation
 * Examples: SEND_EMAIL, UPDATE_LEAD_STATUS, CREATE_TASK, etc.
 * 
 * Workspace Isolation:
 * - All automations belong to a workspace
 * - Foreign key constraint ensures data isolation
 * - WorkspaceAuthorizationService validates access
 */
@Entity
@Table(
    name = "automations",
    indexes = {
        @Index(name = "idx_automation_workspace_id", columnList = "workspace_id"),
        @Index(name = "idx_automation_status", columnList = "status"),
        @Index(name = "idx_automation_trigger_type", columnList = "trigger_type"),
        @Index(name = "idx_automation_workspace_status", columnList = "workspace_id, status"),
        @Index(name = "idx_automation_created_at", columnList = "created_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Automation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Workspace this automation belongs to
     * Enforces multi-tenancy and data isolation
     * FK constraint: ON DELETE CASCADE
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;
    
    /**
     * Automation name (unique within workspace)
     */
    @Column(nullable = false, length = 255)
    private String name;
    
    /**
     * Automation description
     */
    @Column(columnDefinition = "TEXT")
    private String description;
    
    /**
     * Current lifecycle state
     * DRAFT, ACTIVE, PAUSED, ARCHIVED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private AutomationStatus status = AutomationStatus.DRAFT;
    
    /**
     * Event that triggers this automation
     * LEAD_CREATED, LEAD_MAGNET_SUBMITTED, EMAIL_OPENED, EMAIL_CLICKED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AutomationTriggerType triggerType;
    
    /**
     * DEPRECATED (Phase 1 only) - Use AutomationStep instead
     * 
     * Trigger configuration as JSONB
     * Kept for backward compatibility during Phase 1→Phase 2 migration
     * Phase 2 uses AutomationStep workflow model instead
     * 
     * Example for LEAD_MAGNET_SUBMITTED:
     * {
     *   "leadMagnetIds": [1, 2, 3],
     *   "delay": 3600
     * }
     * 
     * Example for EMAIL_OPENED:
     * {
     *   "emailCampaignIds": [5, 6],
     *   "conditions": {"type": "specific_campaign"}
     * }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = true)  // Changed to nullable for future removal
    @Deprecated(since = "Phase 2", forRemoval = true)
    private Map<String, Object> triggerConfig;
    
    /**
     * DEPRECATED (Phase 1 only) - Use AutomationStep instead
     * 
     * Action configuration as JSONB
     * Kept for backward compatibility during Phase 1→Phase 2 migration
     * Phase 2 uses AutomationStep workflow model instead
     * 
     * Phase 1: Empty (reserved for Phase 2)
     * 
     * Phase 2+ Example:
     * {
     *   "actions": [
     *     {
     *       "type": "SEND_EMAIL",
     *       "campaignId": 789,
     *       "delay": 3600
     *     },
     *     {
     *       "type": "UPDATE_LEAD_STATUS",
     *       "newStatus": "QUALIFIED"
     *     }
     *   ]
     * }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = true)  // Changed to nullable for future removal
    @Deprecated(since = "Phase 2", forRemoval = true)
    private Map<String, Object> actionConfig;
    
    /**
     * User who created this automation
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;
    
    /**
     * Timestamp when automation was created
     */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when automation was last updated
     */
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    /**
     * Timestamp when automation was archived (soft delete)
     * NULL if not archived
     */
    @Column
    private LocalDateTime archivedAt;
}
