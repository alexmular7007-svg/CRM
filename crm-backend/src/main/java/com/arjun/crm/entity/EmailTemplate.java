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
 * EmailTemplate Entity - FEATURE #3
 * 
 * Represents a reusable email template that can be used across multiple campaigns.
 * 
 * Relationships:
 * - workspace: owner workspace
 * - createdBy: user who created the template
 * - campaigns: campaigns using this template (1:N)
 * 
 * Access Control:
 * - OWNER/ADMIN: create, read, update, delete templates
 * - MEMBER: read-only access
 * - Public templates: viewable by other members
 */
@Entity
@Table(
    name = "email_templates",
    indexes = {
        @Index(name = "idx_template_workspace_id", columnList = "workspace_id"),
        @Index(name = "idx_template_category", columnList = "category"),
        @Index(name = "idx_template_is_public", columnList = "is_public")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailTemplate {
    
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
    
    @Column(nullable = false, length = 50)
    private String category;  // WELCOME, PROMOTIONAL, TRANSACTIONAL, NEWSLETTER, NURTURE, CUSTOM
    
    @Column(nullable = false, length = 255)
    private String subjectTemplate;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String htmlContent;
    
    @Column(columnDefinition = "TEXT")
    private String plainTextContent;
    
    @Column(columnDefinition = "varchar(255)[]")
    private String[] variables;  // {firstName, company, etc.}
    
    @Column
    private String thumbnailUrl;
    
    @Column
    private Boolean isPublic;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    // Relationships
    @OneToMany(mappedBy = "template", cascade = CascadeType.DETACH, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EmailCampaign> campaigns = new ArrayList<>();
}
