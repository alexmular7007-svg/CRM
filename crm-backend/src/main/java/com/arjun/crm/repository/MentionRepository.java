package com.arjun.crm.repository;

import com.arjun.crm.entity.Mention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentionRepository extends JpaRepository<Mention, Long> {
    
    List<Mention> findByCommentId(Long commentId);
    
    List<Mention> findByMentionedUserId(Long userId);

    /**
     * Delete all mentions in a workspace
     * Must be called BEFORE deleting TaskComments to respect FK constraint:
     * mentions.comment_id -> task_comments.id
     * 
     * Without this, when TaskComments are deleted, Mention records become orphaned
     * and violate the FK constraint if CASCADE is not configured.
     * clearAutomatically=true ensures persistence context is cleared after delete
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Mention m WHERE m.comment.task.workspace.id = :workspaceId")
    int deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
