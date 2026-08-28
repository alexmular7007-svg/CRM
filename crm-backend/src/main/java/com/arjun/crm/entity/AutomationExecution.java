package com.arjun.crm.entity;

import com.arjun.crm.enums.AutomationExecutionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * AutomationExecution Entity - PHASE 3: Execution Engine
 * 
 * Represents a single execution of an automation workflow
 * 
 * Lifecycle:
 * 1. Created with status=PENDING when trigger occurs
 * 2. Transitions to RUNNING when execution starts
 * 3. For each step:
 *    - WAIT_DURATION: transitions to WAITING, resumes later via scheduler
 *    - ACTION: executes and continues
 *    - CONDITION: evaluates and branches
 * 4. Transitions to COMPLETED on success or FAILED on error
 * 
 * Example Flow:
 * Trigger: LEAD_MAGNET_SUBMITTED (Lead ID: 123)
 * ├─ Status: PENDING → RUNNING
 * ├─ Execute Step 1 (SEND_EMAIL): SUCCESS
 * ├─ Execute Step 2 (WAIT_DURATION 24h): Transition to WAITING
 * │  (Scheduler will resume after 24h)
 * ├─ Resume: WAITING → RUNNING
 * ├─ Execute Step 3 (CONDITION EMAIL_OPENED): TRUE
 * ├─ Execute Step 4 (UPDATE_LEAD_SCORE): SUCCESS
 * └─ Complete: RUNNING → COMPLETED
 * 
 * Error Handling:
 * If any step fails:
 * ├─ Status: RUNNING → FAILED
 * ├─ currentStep: points to failed step
 * ├─ error: error message
 * └─ completedAt: set to now
 * 
 * Execution can retry via API (Phase 4+)
 */
@Entity
@Table(
    name = "automation_executions",
    indexes = {
        @Index(name = "idx_execution_automation_id", columnList = "automation_id"),
        @Index(name = "idx_execution_lead_id", columnList = "lead_id"),
        @Index(name = "idx_execution_status", columnList = "status"),
        @Index(name = "idx_execution_created_at", columnList = "created_at"),
        @Index(name = "idx_execution_automation_status", columnList = "automation_id, status")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationExecution {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Automation being executed
     * FK constraint: ON DELETE CASCADE
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "automation_id", nullable = false)
    private Automation automation;
    
    /**
     * Lead that triggered/is affected by this execution
     * FK constraint: ON DELETE CASCADE (if lead deleted, execution deleted)
     * Nullable for future trigger types that don't require a lead
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = true)
    private Lead lead;
    
    /**
     * Current execution status
     * PENDING → RUNNING → [COMPLETED | FAILED | WAITING → RUNNING → COMPLETED]
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private AutomationExecutionStatus status = AutomationExecutionStatus.PENDING;
    
    /**
     * Current step being executed (step order, 1-based)
     * Nullable: execution not yet started
     * Used for resuming after WAIT_DURATION
     */
    @Column
    private Integer currentStep;
    
    /**
     * Error message if execution failed
     * Null if execution succeeded
     */
    @Column(columnDefinition = "TEXT")
    private String error;
    
    /**
     * Step ID that failed (if status=FAILED)
     * Useful for debugging
     */
    @Column
    private Long failedStepId;
    
    /**
     * When execution started
     */
    @Column
    private LocalDateTime startedAt;
    
    /**
     * When execution completed (success or failure)
     */
    @Column
    private LocalDateTime completedAt;
    
    /**
     * When execution paused due to WAIT_DURATION
     * Null if not waiting
     */
    @Column
    private LocalDateTime pausedAt;
    
    /**
     * When execution should resume (after WAIT_DURATION)
     * Null if not waiting
     * Scheduler checks this periodically
     */
    @Column
    private LocalDateTime resumeAt;
    
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
