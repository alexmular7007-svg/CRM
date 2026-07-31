package com.arjun.crm.repository;

import com.arjun.crm.entity.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    
    @Query("SELECT w FROM Workspace w WHERE w.owner.id = :userId")
    Page<Workspace> findByOwnerId(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT DISTINCT w FROM Workspace w " +
           "LEFT JOIN w.members m " +
           "WHERE w.owner.id = :userId OR (m.user.id = :userId AND m.deletedAt IS NULL)")
    Page<Workspace> findAllByUserIdAsOwnerOrMember(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT DISTINCT w FROM Workspace w " +
           "LEFT JOIN FETCH w.members m " +
           "LEFT JOIN FETCH m.user " +
           "WHERE w.owner.id = :userId OR (m.user.id = :userId AND m.deletedAt IS NULL)")
    Page<Workspace> findAllByUserIdAsOwnerOrMemberWithMembers(@Param("userId") Long userId, Pageable pageable);
}
