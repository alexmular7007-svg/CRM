package com.arjun.crm.repository;

import com.arjun.crm.entity.AIInsightSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AIInsightSnapshotRepository extends JpaRepository<AIInsightSnapshot, Long> {

    List<AIInsightSnapshot> findByWorkspaceIdAndSnapshotDateAfterOrderBySnapshotDateAsc(Long workspaceId, LocalDate date);

    Optional<AIInsightSnapshot> findByWorkspaceIdAndSnapshotDate(Long workspaceId, LocalDate snapshotDate);
    
    /**
     * Delete all AI insight snapshots for a workspace
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM AIInsightSnapshot ai WHERE ai.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
