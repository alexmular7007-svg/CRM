package com.arjun.crm.repository;

import com.arjun.crm.entity.TaskWatcher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskWatcherRepository extends JpaRepository<TaskWatcher, Long> {
    
    boolean existsByTaskIdAndUserId(Long taskId, Long userId);
    
    Optional<TaskWatcher> findByTaskIdAndUserId(Long taskId, Long userId);
    
    List<TaskWatcher> findByTaskIdOrderByWatchedAtDesc(Long taskId);
    
    void deleteByTaskIdAndUserId(Long taskId, Long userId);

    /**
     * Delete all task watchers in a workspace
     */
    @Modifying
    @Query("DELETE FROM TaskWatcher tw WHERE tw.task.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
