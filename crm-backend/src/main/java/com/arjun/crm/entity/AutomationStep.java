package com.arjun.crm.entity;

import com.arjun.crm.enums.AutomationStepType;
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
 * AutomationStep Entity - PHASE 2: Workflow Model
 * 
 * Represents a single step in an automation workflow.
 * 
 * Automation Workflow:
 * An automation contains an ordered list of steps that are executed sequentially:
 * 
 * Step 1: Trigger (e.g., LEAD_MAGNET_SUBMITTED)
 * Step 2: Action (e.g., SEND_EMAIL)
 * Step 3: Wait (e.g., WAIT_DURATION for 24 hours)
 * Step 4: Condition (e.g., EMAIL_OPENED)
 * Step 5: Action (e.g., UPDATE_LEAD_SCORE or SEND_EMAIL reminder)
 * 
 * Step Types:
 * - TRIGGERS: When does automation fire? (1 per automation)
 * - ACTIONS: What happens? Send email, update lead, etc.
 * - CONDITIONS: Check something and potentially branch
 * - WAITS: Pause before next step
 * 
 * Ordering:
 * Steps are executed in order of step_order (1, 2, 3, ...)
 * step_order is immutable after creation (enforced by service layer)
 * 
 * Configuration:
 * Each step type has a different configuration structure (stored as JSONB):
 * 
 * SEND_EMAIL:
 * {
 *   "emailTemplateId": 123,      // OR
 *   "emailCampaignId": 456,      // OR
 *   "customHtml": "...",         // One of these three
 *   "subject": "Welcome!",
 *   "recipientField": "email"    // Which lead field to send to
 * }
 * 
 * UPDATE_LEAD:
 * {
 *   "leadId": 789,               // Target lead (set during execution)
 *   "fields": {
 *     "status": "QUALIFIED",
 *     "priority": "HIGH",
 *     "notes": "Added via automation"
 *   }
 * }
 * 
 * UPDATE_LEAD_SCORE:
 * {
 *   "leadId": 789,               // Target lead
 *   "scoreChange": 10,           // +10 or -5
 *   "reason": "Email opened"     // For audit trail
 * }
 * 
 * WAIT_DURATION:
 * {
 *   "duration": 24,
 *   "unit": "HOURS"              // SECONDS, MINUTES, HOURS, DAYS
 * }
 * 
 * EMAIL_OPENED_CONDITION:
 * {
 *   "operator": "ANY"            // ANY or ALL
 * }
 * 
 * Workspace Isolation:
 * - Automation is FK to workspace
 * - Steps inherit workspace through automation
 * - All queries must include workspace verification
 */
@Entity
@Table(
    name = "automation_steps",
    indexes = {
        @Index(name = "idx_step_automation_id", columnList = "automation_id"),
        @Index(name = "idx_step_automation_order", columnList = "automation_id, step_order"),
        @Index(name = "idx_step_type", columnList = "step_type"),
        @Index(name = "idx_step_enabled", columnList = "enabled"),
        @Index(name = "idx_step_created_at", columnList = "created_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationStep {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Parent automation (required, non-null)
     * FK constraint: ON DELETE CASCADE
     * If automation is deleted, all its steps are deleted
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "automation_id", nullable = false)
    private Automation automation;
    
    /**
     * Step order within the automation workflow
     * Starts at 1 for the trigger step
     * Increments for each subsequent step (2, 3, 4, ...)
     * 
     * Immutable after creation (service layer enforces this)
     * Updated only during reorder operation
     */
    @Column(nullable = false)
    private Integer stepOrder;
    
    /**
     * Type of this step
     * Determines how configuration is interpreted
     * Determines what runtime behavior is executed
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AutomationStepType type;
    
    /**
     * Step-specific configuration (JSONB)
     * Structure depends on step type
     * Examples:
     * - SEND_EMAIL: {emailTemplateId: 123, subject: "..."}
     * - UPDATE_LEAD: {fields: {status: "QUALIFIED"}}
     * - WAIT_DURATION: {duration: 24, unit: "HOURS"}
     * - CONDITION: {operator: "ANY"}
     * 
     * NULL values are valid for simple steps
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> configuration;
    
    /**
     * Whether this step is active
     * Disabled steps are skipped during execution
     * Useful for temporarily disabling actions without deleting
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;
    
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
