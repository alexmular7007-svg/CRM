package com.arjun.crm.repository;

import com.arjun.crm.entity.LeadActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadActivityRepository extends JpaRepository<LeadActivity, Long> {
    
    Page<LeadActivity> findByLeadIdOrderByCreatedAtDesc(Long leadId, Pageable pageable);
    
    List<LeadActivity> findTop10ByLeadIdOrderByCreatedAtDesc(Long leadId);

    /**
     * Find all lead activities for a workspace ordered by creation date descending
     */
    @Query("SELECT la FROM LeadActivity la WHERE la.lead.workspace.id = :workspaceId ORDER BY la.createdAt DESC")
    List<LeadActivity> findByWorkspaceIdOrderByCreatedAtDesc(@Param("workspaceId") Long workspaceId);

    /**
     * Delete all lead activities in a workspace
     */
    @Modifying
    @Query("DELETE FROM LeadActivity la WHERE la.lead.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
