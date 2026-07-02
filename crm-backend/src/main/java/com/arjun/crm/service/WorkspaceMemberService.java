package com.arjun.crm.service;

import com.arjun.crm.dto.request.AddWorkspaceMemberRequest;
import com.arjun.crm.dto.response.WorkspaceMemberResponse;
import com.arjun.crm.enums.WorkspaceRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface WorkspaceMemberService {

    /**
     * Add member to workspace
     * @param workspaceId workspace ID
     * @param request member details
     * @return added member response
     */
    WorkspaceMemberResponse addMember(Long workspaceId, AddWorkspaceMemberRequest request);
    
    /**
     * Remove member from workspace
     * @param workspaceId workspace ID
     * @param userId user ID to remove
     */
    void removeMember(Long workspaceId, Long userId);
    
    /**
     * List workspace members
     * @param workspaceId workspace ID
     * @param pageable pagination details
     * @return page of members
     */
    Page<WorkspaceMemberResponse> listMembers(Long workspaceId, Pageable pageable);

    /**
     * Get current user's role in a workspace
     * @param workspaceId workspace ID
     * @return current user's member response with role
     */
    WorkspaceMemberResponse getMyRole(Long workspaceId);

    /**
     * Update a member's role in the workspace
     * @param workspaceId workspace ID
     * @param userId user ID to update
     * @param newRole new role for the member
     * @return updated member response
     */
    WorkspaceMemberResponse updateMemberRole(Long workspaceId, Long userId, WorkspaceRole newRole);
}
