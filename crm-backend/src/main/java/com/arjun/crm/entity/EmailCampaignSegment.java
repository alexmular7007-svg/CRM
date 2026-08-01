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
 * EmailCampaignSegment Entity - FEATURE #3
 * 
 * Represents a saved audience filter that can be reused across campaigns.
 */
@Entity
@Table(
    name = "email_campaign_segments",
    indexes = {
        @Index(name = "idx_segment_workspace_id", columnList = "workspace_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignSegment {
    
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
    
    @Column(nullable = false, columnDefinition = "jsonb")
    private String filterCriteria;  // Filter definition
    
    @Column
    private Long leadCount;
    
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
