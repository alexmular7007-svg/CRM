package com.arjun.crm.repository;

import com.arjun.crm.entity.LeadMagnetSubmission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * LeadMagnetSubmissionRepository - FEATURE #2
 * 
 * Repository for lead magnet submissions with analytics-focused queries.
 * Supports:
 * - Duplicate detection (find latest by email in magnet)
 * - Submission counting and date range filtering
 * - Safety checks before deleting magnets
 */
@Repository
public interface LeadMagnetSubmissionRepository extends JpaRepository<LeadMagnetSubmission, Long> {
    
    /**
     * Find the most recent submission by magnet and normalized email
     * Uses Spring Data derived query to efficiently retrieve only the first (latest) result
     * 
     * @param magnetId the lead magnet ID
     * @param email the normalized email (lowercase + trimmed)
     * @return the most recent submission, empty if none found
     */
    Optional<LeadMagnetSubmission> findFirstByLeadMagnetIdAndEmailOrderBySubmittedAtDesc(Long magnetId, String email);
    
    /**
     * Find all submissions by magnet and email for reference (deprecated in favor of findFirstBy...)
     * Use findFirstByLeadMagnetIdAndEmailOrderBySubmittedAtDesc instead for efficiency
     * 
     * @param magnetId the lead magnet ID
     * @param email the normalized email (lowercase + trimmed)
     * @return list of submissions (prefer findFirst... method)
     */
    @Query("SELECT s FROM LeadMagnetSubmission s " +
           "WHERE s.leadMagnet.id = :magnetId AND LOWER(TRIM(s.email)) = :email " +
           "ORDER BY s.submittedAt DESC")
    List<LeadMagnetSubmission> findByMagnetAndEmailOrderBySubmittedAtDesc(@Param("magnetId") Long magnetId, 
                                                                           @Param("email") String email);
    
    /**
     * Find the first (most recent) submission by magnet and normalized email
     * Convenience method wrapping findFirstByLeadMagnetIdAndEmailOrderBySubmittedAtDesc
     * 
     * @param magnetId the lead magnet ID
     * @param email the normalized email (lowercase + trimmed)
     * @return the most recent submission, empty if none found
     */
    default Optional<LeadMagnetSubmission> findLatestByMagnetAndEmail(Long magnetId, String email) {
        return findFirstByLeadMagnetIdAndEmailOrderBySubmittedAtDesc(magnetId, email);
    }
    
    /**
     * Check if a submission with given session token exists for a magnet
     * Used for duplicate session detection
     * 
     * @param magnetId the lead magnet ID
     * @param sessionTokenHash the hashed session token
     * @return true if exists, false otherwise
     */
    boolean existsByLeadMagnetIdAndSessionTokenHash(Long magnetId, String sessionTokenHash);
    
    /**
     * Count all submissions for a specific magnet
     * Used for analytics dashboard
     * 
     * @param magnetId the lead magnet ID
     * @return total submission count
     */
    long countByLeadMagnetId(Long magnetId);
    
    /**
     * Count submissions for a magnet within a date range
     * Used for analytics and reporting
     * 
     * @param magnetId the lead magnet ID
     * @param startDate start date (inclusive)
     * @param endDate end date (inclusive)
     * @return submission count in date range
     */
    @Query("SELECT COUNT(s) FROM LeadMagnetSubmission s " +
           "WHERE s.leadMagnet.id = :magnetId " +
           "AND s.submittedAt >= :startDate AND s.submittedAt <= :endDate")
    long countByMagnetAndDateRange(@Param("magnetId") Long magnetId, 
                                    @Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate);
    
    /**
     * Count submissions that were converted to leads
     * Used for conversion rate analytics
     * 
     * @param magnetId the lead magnet ID
     * @return count of submissions with non-null lead_id
     */
    @Query("SELECT COUNT(s) FROM LeadMagnetSubmission s " +
           "WHERE s.leadMagnet.id = :magnetId AND s.lead IS NOT NULL")
    long countConvertedByMagnetId(@Param("magnetId") Long magnetId);
    
    /**
     * Get submissions in date range with pagination
     * Used for admin submission review
     * 
     * @param magnetId the lead magnet ID
     * @param startDate start date (inclusive)
     * @param endDate end date (inclusive)
     * @param pageable pagination settings
     * @return page of submissions
     */
    @Query("SELECT s FROM LeadMagnetSubmission s " +
           "WHERE s.leadMagnet.id = :magnetId " +
           "AND s.submittedAt >= :startDate AND s.submittedAt <= :endDate " +
           "ORDER BY s.submittedAt DESC")
    Page<LeadMagnetSubmission> findByMagnetAndDateRange(@Param("magnetId") Long magnetId,
                                                         @Param("startDate") LocalDateTime startDate,
                                                         @Param("endDate") LocalDateTime endDate,
                                                         Pageable pageable);
    
    /**
     * List all submissions for a magnet (latest first)
     * Used for admin dashboard
     * 
     * @param magnetId the lead magnet ID
     * @param pageable pagination settings
     * @return page of submissions
     */
    @Query("SELECT s FROM LeadMagnetSubmission s " +
           "WHERE s.leadMagnet.id = :magnetId " +
           "ORDER BY s.submittedAt DESC")
    Page<LeadMagnetSubmission> findByMagnetId(@Param("magnetId") Long magnetId, Pageable pageable);
    
    /**
     * Count total submissions across all magnets in a workspace
     * Used for workspace-level analytics
     * 
     * @param workspaceId the workspace ID
     * @return total submission count in workspace
     */
    @Query("SELECT COUNT(s) FROM LeadMagnetSubmission s " +
           "WHERE s.leadMagnet.workspace.id = :workspaceId")
    long countByWorkspaceId(@Param("workspaceId") Long workspaceId);
    
    /**
     * Check if any submission exists for a magnet (safety check before delete)
     * Used to prevent deletion of magnets with historical data
     * 
     * @param magnetId the lead magnet ID
     * @return true if any submission exists for this magnet
     */
    boolean existsByLeadMagnetId(Long magnetId);
    
    /**
     * Delete all submissions for a magnet
     * Used only when magnet is hard-deleted (must have zero submissions per business rule)
     * 
     * @param magnetId the lead magnet ID
     * @return number of submissions deleted
     */
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("DELETE FROM LeadMagnetSubmission s WHERE s.leadMagnet.id = :magnetId")
    int deleteByLeadMagnetId(@Param("magnetId") Long magnetId);
}
