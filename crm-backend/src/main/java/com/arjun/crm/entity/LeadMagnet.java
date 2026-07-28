package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * LeadMagnet Entity - FEATURE #2
 * 
 * Represents a lead generation magnet (landing page, form, widget, etc.)
 * that collects leads across workspaces publicly.
 * 
 * PHASE 1A: MVP implementation with core fields only.
 * No form fields JSON or stored publicUrl (computed dynamically).
 * No analytics counters (stored in separate view tables).
 * 
 * Relationships:
 * - workspace: owner workspace (not null)
 * - createdBy: user who created the magnet (not null)
 * - submissions: collected submissions (one-to-many)
 * - views: public page views (one-to-many)
 * 
 * Access Control:
 * - Admin: full CRUD + analytics
 * - Owner: full CRUD + analytics
 * - Other members: read-only view
 * - Public: view-only via publicToken (no write)
 */
@Entity
@Table(
    name = "lead_magnets",
    indexes = {
        @Index(name = "idx_magnet_workspace_id", columnList = "workspace_id"),
        @Index(name = "idx_magnet_public_token", columnList = "public_token", unique = true),
        @Index(name = "idx_magnet_is_active", columnList = "is_active"),
        @Index(name = "idx_magnet_created_at", columnList = "created_at"),
        @Index(name = "idx_magnet_workspace_slug", columnList = "workspace_id, slug")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadMagnet {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Workspace owner (required, not null)
     * Magnet is scoped to a workspace
     * Cascade delete: if workspace deleted, all magnets deleted
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;
    
    /**
     * Display name for the magnet
     * Example: "Q4 Special Offer Form", "Webinar Signup"
     */
    @Column(nullable = false, length = 255)
    private String name;
    
    /**
     * Detailed description of the magnet
     * Example: "Lead capture form for Q4 2024 special offer campaign"
     */
    @Column(columnDefinition = "TEXT")
    private String description;
    
    /**
     * URL-friendly slug for the magnet
     * Must be unique per workspace (e.g., "q4-special-offer", "webinar-signup")
     * Used as part of public URL: /magnet/{workspace_slug}/{magnet_slug}
     */
    @Column(nullable = false, length = 100)
    private String slug;
    
    /**
     * Public UUID token for accessing the magnet without authentication
     * Globally unique (unique constraint at database level)
     * Used to generate public URL: /public/magnet/{publicToken}
     * Examples: "550e8400-e29b-41d4-a716-446655440000"
     */
    @Column(name = "public_token", nullable = false, length = 36, unique = true)
    private String publicToken;
    
    /**
     * Active/inactive flag
     * - true: accepting submissions
     * - false: archived (no new submissions, but historical data preserved)
     * Business rule: delete only if zero submissions ever made
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * User who created this magnet
     * Used for audit trail and attribution
     * On lead conversion from this magnet: Lead.createdBy = LeadMagnet.createdBy
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
