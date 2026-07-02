package com.arjun.crm.repository;

import com.arjun.crm.entity.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, Long> {
    
    List<TaskAttachment> findByTaskIdOrderByUploadedAtDesc(Long taskId);
    
    void deleteByTaskId(Long taskId);

    /**
     * Delete all task attachments in a workspace
     */
    @Modifying
    @Query("DELETE FROM TaskAttachment ta WHERE ta.task.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
