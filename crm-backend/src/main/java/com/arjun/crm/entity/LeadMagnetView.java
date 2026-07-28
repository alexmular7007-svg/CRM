package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * LeadMagnetView Entity - FEATURE #2
 * 
 * Represents a single pageview of a public lead magnet landing page.
 * Permanent analytics storage for historical tracking.
 * 
 * PHASE 1A: MVP implementation.
 * No IP address or user agent (those come in Phase 1C: rate limiting).
 * Redis deduplication happens at application layer (Phase 1C).
 * This table stores deduplicated permanent records only.
 * 
 * Relationships:
 * - leadMagnet: the magnet that was viewed (required, not null)
 * 
 * Session Tracking:
 * - sessionTokenHash: SHA-256 hash for uniqueness per session
 * - referrer: HTTP referrer for attribution
 * 
 * DELETE Cascade:
 * - If magnet deleted: cascade delete all views
 * 
 * Analytics Queries:
 * - Count views by magnet (with date range)
 * - Unique sessions per magnet
 * - Referrer attribution breakdown
 * - Conversion rate: submissions / views
 */
@Entity
@Table(
    name = "lead_magnet_views",
    indexes = {
        @Index(name = "idx_view_magnet_id", columnList = "lead_magnet_id"),
        @Index(name = "idx_view_session_token", columnList = "session_token_hash"),
        @Index(name = "idx_view_viewed_at", columnList = "viewed_at"),
        @Index(name = "idx_view_magnet_viewed", columnList = "lead_magnet_id, viewed_at"),
        @Index(name = "idx_view_session_viewed", columnList = "session_token_hash, viewed_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadMagnetView {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * The lead magnet that was viewed (required, not null)
     * Cascade delete: if magnet deleted, all views are deleted
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_magnet_id", nullable = false)
    private LeadMagnet leadMagnet;
    
    /**
     * Session token hash for unique session tracking
     * Computed as: SHA-256(session_token + workspace_secret)
     * Same format as LeadMagnetSubmission.sessionTokenHash
     * Used to track unique visitors and repeat views
     * 
     * Analytics use case:
     * - COUNT(DISTINCT session_token_hash) = unique sessions
     * - COUNT(*) = total page views
     */
    @Column(name = "session_token_hash", nullable = false, length = 64)
    private String sessionTokenHash;
    
    /**
     * HTTP Referrer header for attribution
     * Shows where the visitor came from
     * Example: "https://google.com", "https://facebook.com/campaign", etc.
     * Can be null if referrer policy blocks it
     * 
     * Analytics use case:
     * - GROUP BY referrer to see traffic attribution breakdown
     */
    @Column(columnDefinition = "TEXT")
    private String referrer;
    
    @CreationTimestamp
    @Column(name = "viewed_at", nullable = false, updatable = false)
    private LocalDateTime viewedAt;
}
