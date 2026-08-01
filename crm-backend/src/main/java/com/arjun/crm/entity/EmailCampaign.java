package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * EmailCampaign Entity - FEATURE #3
 * 
 * Represents an email campaign that can be created, scheduled, and sent to recipients.
 * 
 * Status Transitions:
 * DRAFT → SCHEDULED → SENDING → COMPLETED
 * DRAFT → SCHEDULED → DRAFT
 * SENDING → PAUSED → SENDING
 * SENDING → COMPLETED
 * 
 * Relationships:
 * - workspace: owner workspace
 * - template: optional email template
 * - createdBy: user who created the campaign
 * - recipients: email recipients for this campaign
 * - history: delivery events
 * - analyticsSnapshot: pre-computed metrics
 */
@Entity
@Table(
    name = "email_campaigns",
    indexes = {
        @Index(name = "idx_campaign_workspace_id", columnList = "workspace_id"),
        @Index(name = "idx_campaign_status", columnList = "status"),
        @Index(name = "idx_campaign_created_at", columnList = "created_at"),
        @Index(name = "idx_campaign_workspace_status", columnList = "workspace_id, status"),
        @Index(name = "idx_campaign_scheduled_at", columnList = "scheduled_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaign {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;
    
    @Column(nullable = false, length = 255)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, length = 255)
    private String subject;
    
    @Column(columnDefinition = "varchar(255)[]")
    private String[] subjectVariables;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private EmailTemplate template;
    
    @Column(length = 50)
    private String contentType;  // TEMPLATE, CUSTOM_HTML, MARKDOWN
    
    @Column(nullable = false, length = 50)
    private String status;  // DRAFT, SCHEDULED, SENDING, SENT, PAUSED, FAILED, ARCHIVED
    
    @Column
    private Boolean isActive;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;
    
    @Column
    private LocalDateTime scheduledAt;
    
    @Column
    private LocalDateTime sendStartedAt;
    
    @Column
    private LocalDateTime sendCompletedAt;
    
    @Column
    private Long totalRecipients;
    
    @Column(columnDefinition = "jsonb")
    private String segmentFilter;  // JSON filter criteria
    
    @Column
    private Integer retryCount;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Column
    private LocalDateTime deletedAt;
    
    // Relationships
    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EmailCampaignRecipient> recipients = new ArrayList<>();
    
    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EmailCampaignHistory> history = new ArrayList<>();
    
    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EmailCampaignAnalyticsSnapshot> analyticsSnapshots = new ArrayList<>();
}
