package com.arjun.crm.repository;

import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.WorkspaceRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {
    
    boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long userId);
    
    boolean existsByUserId(Long userId);
    
    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(Long workspaceId, Long userId);
    
    @Query("SELECT wm FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId")
    Page<WorkspaceMember> findByWorkspaceId(@Param("workspaceId") Long workspaceId, Pageable pageable);
    
    void deleteByWorkspaceIdAndUserId(Long workspaceId, Long userId);
    
    @Query("SELECT CASE WHEN COUNT(wm) > 0 THEN true ELSE false END " +
           "FROM WorkspaceMember wm " +
           "WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId AND wm.role = :role")
    boolean isUserAdminOfWorkspace(@Param("workspaceId") Long workspaceId,
                                    @Param("userId") Long userId,
                                    @Param("role") WorkspaceRole role);
    
    default boolean isUserAdminOfWorkspace(Long workspaceId, Long userId) {
        return isUserAdminOfWorkspace(workspaceId, userId, WorkspaceRole.ADMIN);
    }

    /**
     * Check if user has OWNER role in workspace
     * Used to support multiple owners per workspace
     */
    @Query("SELECT CASE WHEN COUNT(wm) > 0 THEN true ELSE false END " +
           "FROM WorkspaceMember wm " +
           "WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId AND wm.role = :role AND wm.status = 'ACTIVE' AND wm.deletedAt IS NULL")
    boolean isUserOwnerOfWorkspace(@Param("workspaceId") Long workspaceId,
                                    @Param("userId") Long userId,
                                    @Param("role") WorkspaceRole role);

    default boolean isUserOwnerOfWorkspace(Long workspaceId, Long userId) {
        return isUserOwnerOfWorkspace(workspaceId, userId, WorkspaceRole.OWNER);
    }
    
    /**
     * Delete all workspace members for a workspace
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);

    /**
     * Find members by status (ACTIVE or PENDING_INVITATION)
     */
    @Query("SELECT wm FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.status = :status")
    Page<WorkspaceMember> findByWorkspaceIdAndStatus(@Param("workspaceId") Long workspaceId,
                                                      @Param("status") String status,
                                                      Pageable pageable);

    /**
     * Find member by workspace, user, and status
     */
    @Query("SELECT wm FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId AND wm.status = :status")
    Optional<WorkspaceMember> findByWorkspaceIdAndUserIdAndStatus(@Param("workspaceId") Long workspaceId,
                                                                   @Param("userId") Long userId,
                                                                   @Param("status") String status);

    /**
     * Check if user is member with specific status
     */
    @Query("SELECT CASE WHEN COUNT(wm) > 0 THEN true ELSE false END FROM WorkspaceMember wm " +
           "WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId AND wm.status = :status")
    boolean existsByWorkspaceIdAndUserIdAndStatus(@Param("workspaceId") Long workspaceId,
                                                   @Param("userId") Long userId,
                                                   @Param("status") String status);

    /**
     * Count active members in workspace
     */
    @Query("SELECT COUNT(wm) FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.status = 'ACTIVE'")
    long countActiveMembers(@Param("workspaceId") Long workspaceId);

    /**
     * Check if two users share at least one common workspace.
     * Users share a workspace if they are both members (or one is owner).
     * Used for direct messaging to enforce workspace isolation.
     */
    @Query("SELECT COUNT(DISTINCT w.id) > 0 " +
           "FROM WorkspaceMember wm1, WorkspaceMember wm2, Workspace w " +
           "WHERE wm1.workspace = w AND wm2.workspace = w " +
           "AND wm1.user.id = :userId1 AND wm2.user.id = :userId2")
    boolean existsCommonWorkspace(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * Find only ACTIVE (non-deleted) members in a workspace
     * Excludes soft-deleted members where deletedAt is not null
     */
    @Query("SELECT wm FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.status = 'ACTIVE' AND wm.deletedAt IS NULL")
    Page<WorkspaceMember> findActiveByWorkspaceId(@Param("workspaceId") Long workspaceId, Pageable pageable);

    /**
     * Check if a user is an active member (not deleted) of a workspace
     * Returns true only if status=ACTIVE and deletedAt IS NULL
     */
    @Query("SELECT CASE WHEN COUNT(wm) > 0 THEN true ELSE false END " +
           "FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId " +
           "AND wm.status = 'ACTIVE' AND wm.deletedAt IS NULL")
    boolean existsActiveMember(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

    /**
     * Find active members by workspace and status (excludes soft-deleted)
     */
    @Query("SELECT wm FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.status = :status AND wm.deletedAt IS NULL")
    Page<WorkspaceMember> findByWorkspaceIdAndStatusActive(@Param("workspaceId") Long workspaceId,
                                                            @Param("status") String status,
                                                            Pageable pageable);

    /**
     * Count only active (non-deleted) members in workspace
     */
    @Query("SELECT COUNT(wm) FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.status = 'ACTIVE' AND wm.deletedAt IS NULL")
    long countActiveMembersExcludingDeleted(@Param("workspaceId") Long workspaceId);

    /**
     * Count active OWNER role members in a workspace (excludes soft-deleted)
     * Used to ensure at least one owner always exists
     */
    @Query("SELECT COUNT(wm) FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.role = :role AND wm.status = 'ACTIVE' AND wm.deletedAt IS NULL")
    long countActiveMembersWithRole(@Param("workspaceId") Long workspaceId, @Param("role") WorkspaceRole role);

    /**
     * Convenience method: Count active OWNER members in workspace
     * Includes original workspace.owner as implicit owner
     */
    default long countActiveOwnersInWorkspace(Long workspaceId) {
        // Count explicit OWNER members in workspace_member table
        long explicitOwners = countActiveMembersWithRole(workspaceId, WorkspaceRole.OWNER);
        // Original owner is always counted as 1 (even if not in members table for backward compatibility)
        return explicitOwners + 1;  // +1 for workspace.owner field
    }
}
