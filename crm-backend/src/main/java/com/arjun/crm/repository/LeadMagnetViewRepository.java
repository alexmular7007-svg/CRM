package com.arjun.crm.repository;

import com.arjun.crm.entity.LeadMagnetView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * LeadMagnetViewRepository - FEATURE #2
 * 
 * Repository for permanent view analytics storage.
 * Supports:
 * - View counting and unique session tracking
 * - Date range filtering for analytics
 * - Safety checks before deleting magnets
 */
@Repository
public interface LeadMagnetViewRepository extends JpaRepository<LeadMagnetView, Long> {
    
    /**
     * Count total views for a magnet (all time)
     * Used for analytics dashboard
     * 
     * @param magnetId the lead magnet ID
     * @return total view count
     */
    long countByLeadMagnetId(Long magnetId);
    
    /**
     * Count views for a magnet within a date range
     * Used for time-period analytics
     * 
     * @param magnetId the lead magnet ID
     * @param startDate start date (inclusive)
     * @param endDate end date (inclusive)
     * @return view count in date range
     */
    @Query("SELECT COUNT(v) FROM LeadMagnetView v " +
           "WHERE v.leadMagnet.id = :magnetId " +
           "AND v.viewedAt >= :startDate AND v.viewedAt <= :endDate")
    long countByMagnetAndDateRange(@Param("magnetId") Long magnetId,
                                    @Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate);
    
    /**
     * Count unique sessions (views) for a magnet (all time)
     * Used for unique visitor tracking
     * 
     * @param magnetId the lead magnet ID
     * @return distinct session count
     */
    @Query("SELECT COUNT(DISTINCT v.sessionTokenHash) FROM LeadMagnetView v " +
           "WHERE v.leadMagnet.id = :magnetId")
    long countUniqueSessionsByMagnetId(@Param("magnetId") Long magnetId);
    
    /**
     * Count unique sessions (views) for a magnet within a date range
     * Used for time-period unique visitor analytics
     * 
     * @param magnetId the lead magnet ID
     * @param startDate start date (inclusive)
     * @param endDate end date (inclusive)
     * @return distinct session count in date range
     */
    @Query("SELECT COUNT(DISTINCT v.sessionTokenHash) FROM LeadMagnetView v " +
           "WHERE v.leadMagnet.id = :magnetId " +
           "AND v.viewedAt >= :startDate AND v.viewedAt <= :endDate")
    long countUniqueSessionsByMagnetAndDateRange(@Param("magnetId") Long magnetId,
                                                  @Param("startDate") LocalDateTime startDate,
                                                  @Param("endDate") LocalDateTime endDate);
    
    /**
     * Check if view exists for a specific session on a magnet
     * Used to detect if view was already recorded (deduplication check)
     * 
     * @param magnetId the lead magnet ID
     * @param sessionTokenHash the hashed session token
     * @return true if view exists, false otherwise
     */
    boolean existsByLeadMagnetIdAndSessionTokenHash(Long magnetId, String sessionTokenHash);
    
    /**
     * Check if any view exists for a magnet (safety check before delete)
     * Used to prevent deletion of magnets with historical data
     * 
     * @param magnetId the lead magnet ID
     * @return true if any view exists for this magnet
     */
    boolean existsByLeadMagnetId(Long magnetId);
    
    /**
     * Count total views across all magnets in a workspace
     * Used for workspace-level analytics
     * 
     * @param workspaceId the workspace ID
     * @return total view count in workspace
     */
    @Query("SELECT COUNT(v) FROM LeadMagnetView v " +
           "WHERE v.leadMagnet.workspace.id = :workspaceId")
    long countByWorkspaceId(@Param("workspaceId") Long workspaceId);
    
    /**
     * Delete all views for a magnet
     * Used only when magnet is hard-deleted (must have zero views per business rule)
     * 
     * @param magnetId the lead magnet ID
     * @return number of views deleted
     */
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("DELETE FROM LeadMagnetView v WHERE v.leadMagnet.id = :magnetId")
    int deleteByLeadMagnetId(@Param("magnetId") Long magnetId);
}
