package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Client Entity - Represents a business entity (company/contact) after a lead is won.
 * 
 * Created when a WON lead is converted to a project.
 * Maintains traceability back to the originating lead.
 * Supports future Client 360 feature development.
 */
@Entity
@Table(name = "clients", indexes = {
        @Index(name = "idx_workspace_id", columnList = "workspace_id"),
        @Index(name = "idx_source_lead_id", columnList = "source_lead_id"),
        @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;
    
    /**
     * Client/company name
     * Maps from Lead.company if available, otherwise Lead.name
     */
    @Column(nullable = false, length = 255)
    private String name;
    
    /**
     * Primary contact name
     * Maps from Lead.name
     */
    @Column(length = 255)
    private String contactName;
    
    /**
     * Primary contact email
     * Maps from Lead.email
     */
    @Column(length = 255)
    private String email;
    
    /**
     * Primary contact phone
     * Maps from Lead.phone
     */
    @Column(length = 20)
    private String phone;
    
    /**
     * Source lead that was converted to create this client
     * One-to-one relationship ensures one lead creates one client
     * Nullable for manual client creation in future
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_lead_id", unique = true)
    private Lead sourceLead;
    
    /**
     * User who created this client
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
