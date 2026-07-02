package com.arjun.crm.repository;

import com.arjun.crm.entity.User;
import com.arjun.crm.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(?1)")
    Optional<User> findByEmail(String email);

    // Case-insensitive email check
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE LOWER(u.email) = LOWER(?1)")
    boolean existsByEmailCaseInsensitive(String email);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    @Query("""
            select u from User u
            where u.status = :status
              and u.id <> :currentUserId
              and (
                lower(u.fullName) like lower(concat('%', :query, '%'))
                or lower(u.email) like lower(concat('%', :query, '%'))
              )
            order by u.fullName asc
            """)
    Page<User> searchActiveUsers(String query, UserStatus status, Long currentUserId, Pageable pageable);

    /**
     * Search users who are members of a specific workspace.
     * Used for "Start Conversation" - multi-tenant isolation.
     * CRITICAL: Only returns workspace members, never all application users.
     */
    @Query("""
            select u from User u
            where u.id in (
              select wm.user.id from WorkspaceMember wm where wm.workspace.id = :workspaceId
              union
              select w.owner.id from Workspace w where w.id = :workspaceId
            )
              and u.status = :status
              and u.id <> :currentUserId
              and (
                lower(u.fullName) like lower(concat('%', :query, '%'))
                or lower(u.email) like lower(concat('%', :query, '%'))
              )
            order by u.fullName asc
            """)
    Page<User> searchWorkspaceActiveUsers(Long workspaceId, String query, UserStatus status, Long currentUserId, Pageable pageable);
}
