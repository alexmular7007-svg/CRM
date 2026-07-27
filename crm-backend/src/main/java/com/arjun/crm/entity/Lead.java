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
    
    @Column(nullable = false, unique = true)
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
     * FEATURE #1: Lead Conversion Tracking
     * Indicates whether this lead has been converted to a project
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean converted = false;
    
    /**
     * Timestamp when lead was converted to project
     */
    @Column(name = "converted_at")
    private LocalDateTime convertedAt;
    
    /**
     * Project created from this lead conversion
     * Nullable for leads that have not been converted
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_project_id")
    private Project convertedProject;
    
    /**
     * Client linked to this conversion
     * Nullable for leads that have not been converted
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_client_id")
    private Client convertedClient;
}
