package com.arjun.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.type.SqlTypes;
import org.hibernate.annotations.JdbcTypeCode;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * LeadMagnetSubmission Entity - FEATURE #2
 * 
 * Represents a single form submission to a lead magnet.
 * Collects basic lead info + custom fields via JSONB.
 * 
 * PHASE 1A: MVP implementation.
 * No IP address or user agent (Phase 1C: rate limiting will add IP hashing).
 * No circular reference to source submission.
 * 
 * Relationships:
 * - leadMagnet: the magnet this submission belongs to (required, not null)
 * - lead: converted to a CRM lead or null if pending (nullable)
 * - customFields: JSONB for dynamic form data
 * 
 * Session Tracking:
 * - sessionTokenHash: SHA-256 hash of session token for duplicate detection
 * - referrer: HTTP referrer header for attribution
 * 
 * DELETE Cascade:
 * - If magnet deleted: cascade delete submissions
 * - If lead deleted: set submission.lead = null (preserve submission record)
 * 
 * Security:
 * - No internal leadId exposed in public responses (Phase 1B constraint)
 * - submissionId used for public references only
 */
@Entity
@Table(
    name = "lead_magnet_submissions",
    indexes = {
        @Index(name = "idx_submission_magnet_id", columnList = "lead_magnet_id"),
        @Index(name = "idx_submission_lead_id", columnList = "lead_id"),
        @Index(name = "idx_submission_session_token", columnList = "session_token_hash"),
        @Index(name = "idx_submission_magnet_email", columnList = "lead_magnet_id, email"),
        @Index(name = "idx_submission_submitted_at", columnList = "submitted_at"),
        @Index(name = "idx_submission_magnet_submitted", columnList = "lead_magnet_id, submitted_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadMagnetSubmission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * The lead magnet this submission belongs to (required, not null)
     * Cascade delete: if magnet deleted, submission is deleted
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_magnet_id", nullable = false)
    private LeadMagnet leadMagnet;
    
    /**
     * The CRM lead created from this submission (optional, nullable)
     * If null: submission pending conversion to lead (Phase 1B workflow)
     * If not null: this submission was converted to a CRM lead
     * If lead deleted: set to null (preserve historical submission)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = true)
    private Lead lead;
    
    /**
     * Submitter's first/last name (from form field)
     * Example: "John Doe"
     */
    @Column(nullable = false, length = 255)
    private String name;
    
    /**
     * Submitter's email address (normalized: lowercase + trim)
     * Not unique at database level (multiple submissions can have same email)
     * Used for duplicate detection and lead linking
     */
    @Column(nullable = false, length = 255)
    private String email;
    
    /**
     * Submitter's phone number (from form field, optional)
     * Example: "+1-555-0123" (format varies by submission)
     */
    @Column(length = 50)
    private String phone;
    
    /**
     * Submitter's company name (from form field, optional)
     * Example: "Acme Corp"
     */
    @Column(length = 255)
    private String company;
    
    /**
     * Session token hash for duplicate detection
     * Computed as: SHA-256(session_token + workspace_secret)
     * Different from IP hashing (Phase 1C uses HMAC-SHA256 for IP)
     * Used to prevent duplicate submissions in same session
     */
    @Column(name = "session_token_hash", nullable = false, length = 64)
    private String sessionTokenHash;
    
    /**
     * HTTP Referrer header for attribution
     * Shows where the visitor came from
     * Example: "https://google.com", "https://facebook.com/campaign", etc.
     * Can be null if referrer policy blocks it
     */
    @Column(columnDefinition = "TEXT")
    private String referrer;
    
    /**
     * Custom form fields as JSONB
     * Stores any additional data from the form submission
     * Example:
     * {
     *   "company_size": "100-500",
     *   "industry": "Technology",
     *   "budget": "50k-100k",
     *   "timeline": "Q1 2024",
     *   "custom_field_1": "value"
     * }
     * 
     * JSONB Implementation (Hibernate 6.x / Spring Boot 3.3.4):
     * - @JdbcTypeCode(SqlTypes.JSON): Explicit Hibernate 6 type hint for JSON mapping
     * - columnDefinition="jsonb": Instructs PostgreSQL to use JSONB type (not JSON)
     * - Map<String, Object>: Automatically mapped by Jackson during serialization
     * - Runtime behavior: Hibernate serializes to JSON string, PostgreSQL stores as JSONB
     * - Query support: Full JSONB operators available in native SQL queries
     * 
     * Explicit type hint (@JdbcTypeCode) ensures:
     * - Proper type resolution at Hibernate startup
     * - Correct column type creation in schema generation
     * - Reliable serialization/deserialization with Jackson
     * - No reliance on columnDefinition alone (more explicit)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_fields", columnDefinition = "jsonb", nullable = true)
    @Builder.Default
    private Map<String, Object> customFields = new HashMap<>();
    
    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;
}

