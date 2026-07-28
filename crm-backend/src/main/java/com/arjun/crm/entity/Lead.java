package com.arjun.crm.entity;

import com.arjun.crm.enums.LeadPriority;
import com.arjun.crm.enums.LeadStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "leads")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lead {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    /**
     * Email address (normalized: lowercase + trim)
     * PHASE #2 FEATURE: Changed from globally unique to unique per workspace
     * Uniqueness constraint: UNIQUE(workspace_id, email) at database level
     * This allows same email across different workspaces
     * 
     * Migration: V12 will drop global unique constraint and add composite constraint
     */
    @Column(nullable = false)
    private String email;
    
    private String phone;
    
    private String company;
    
    private String position;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal dealValue;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeadStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeadPriority priority;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;
    
    @ElementCollection
    @CollectionTable(name = "lead_tags", joinColumns = @JoinColumn(name = "lead_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    private LocalDate expectedCloseDate;
    
    private LocalDateTime lastActivityAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    /**
     * FEATURE #2: Lead Source Magnet
     * The lead magnet from which this lead originated (if any)
     * Nullable: lead may be created manually in CRM without a magnet
     * 
     * Cascade semantics: SET NULL
     * If magnet is deleted, lead remains but loses magnet reference
     * Lead can be independently tracked/managed after magnet deletion
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_magnet_id", nullable = true)
    private LeadMagnet sourceMagnet;
    
    /**
     * FEATURE #1: Lead Conversion Tracking
     * Indicates whether this lead has been converted to a project
     * Nullable for backward compatibility with existing database
     */
    @Column(nullable = true)
    @Builder.Default
    private Boolean converted = false;
    
    /**
     * Timestamp when lead was converted to project
     * Nullable for non-converted leads
     */
    @Column(name = "converted_at", nullable = true)
    private LocalDateTime convertedAt;
    
    /**
     * Project created from this lead conversion
     * Nullable for leads that have not been converted
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_project_id", nullable = true)
    private Project convertedProject;
    
    /**
     * Client linked to this conversion
     * Nullable for leads that have not been converted
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_client_id", nullable = true)
    private Client convertedClient;
}
