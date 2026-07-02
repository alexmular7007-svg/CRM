package com.arjun.crm.repository;

import com.arjun.crm.entity.WorkspaceInvitation;
import com.arjun.crm.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceInvitationRepository extends JpaRepository<WorkspaceInvitation, Long> {

    /**
     * Find invitation by unique token
     */
    Optional<WorkspaceInvitation> findByToken(String token);

    /**
     * Find invitation by workspace and email
     */
    Optional<WorkspaceInvitation> findByWorkspaceIdAndEmail(Long workspaceId, String email);

    /**
     * Find all invitations for a workspace with specific status
     */
    List<WorkspaceInvitation> findByWorkspaceIdAndStatus(Long workspaceId, InvitationStatus status);

    /**
     * Find all expired invitations (before given date)
     * Used for cleanup jobs
     */
    @Query("SELECT wi FROM WorkspaceInvitation wi WHERE wi.expiresAt < :now AND wi.status = 'PENDING'")
    List<WorkspaceInvitation> findExpiredInvitations(@Param("now") LocalDateTime now);

    /**
     * Check if email is already invited to workspace
     */
    boolean existsByWorkspaceIdAndEmail(Long workspaceId, String email);

    /**
     * Check if email is already invited to workspace with pending status
     */
    @Query("SELECT COUNT(wi) > 0 FROM WorkspaceInvitation wi WHERE wi.workspace.id = :workspaceId AND wi.email = :email AND wi.status = 'PENDING'")
    boolean existsPendingInvitation(@Param("workspaceId") Long workspaceId, @Param("email") String email);

    /**
     * Count pending invitations for a workspace
     */
    long countByWorkspaceIdAndStatus(Long workspaceId, InvitationStatus status);

    /**
     * Check if user has ANY pending invitation by email
     * Used during registration/OAuth to check if user should join invited workspace
     */
    @Query("SELECT COUNT(wi) > 0 FROM WorkspaceInvitation wi WHERE wi.email = :email AND wi.status = :status")
    boolean existsByEmailAndStatus(@Param("email") String email, @Param("status") InvitationStatus status);

    /**
     * Find all pending invitations by email
     * Used to get invitation tokens for auto-acceptance after OAuth login
     */
    @Query("SELECT wi FROM WorkspaceInvitation wi WHERE wi.email = :email AND wi.status = :status ORDER BY wi.invitedAt DESC")
    List<WorkspaceInvitation> findByEmailAndStatus(@Param("email") String email, @Param("status") InvitationStatus status);

    /**
     * Delete all invitations for a workspace
     * Used during workspace deletion cascade
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM WorkspaceInvitation wi WHERE wi.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}