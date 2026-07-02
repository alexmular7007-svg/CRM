package com.arjun.crm.repository;

import com.arjun.crm.entity.ProjectMember;
import com.arjun.crm.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);
    
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);
    
    @Query("SELECT pm FROM ProjectMember pm WHERE pm.project.id = :projectId")
    Page<ProjectMember> findByProjectId(@Param("projectId") Long projectId, Pageable pageable);
    
    void deleteByProjectIdAndUserId(Long projectId, Long userId);
    
    @Query("SELECT CASE WHEN COUNT(pm) > 0 THEN true ELSE false END " +
           "FROM ProjectMember pm " +
           "WHERE pm.project.id = :projectId AND pm.user.id = :userId AND pm.role = :role")
    boolean isUserAdminOfProject(@Param("projectId") Long projectId,
                                  @Param("userId") Long userId,
                                  @Param("role") Role role);
    
    default boolean isUserAdminOfProject(Long projectId, Long userId) {
        return isUserAdminOfProject(projectId, userId, Role.ADMIN);
    }

    /**
     * Delete all project members in a workspace
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM ProjectMember pm WHERE pm.project.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
