package com.arjun.crm.controller;

import com.arjun.crm.dto.request.AddWorkspaceMemberRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.WorkspaceMemberResponse;
import com.arjun.crm.service.WorkspaceMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/members")
@RequiredArgsConstructor
@Slf4j
public class WorkspaceMemberController {

    private final WorkspaceMemberService workspaceMemberService;

    /**
     * Add member to workspace
     * POST /api/workspaces/{workspaceId}/members
     */
    @PostMapping
    public ResponseEntity<ApiResponse<WorkspaceMemberResponse>> addMember(
            @PathVariable Long workspaceId,
            @Valid @RequestBody AddWorkspaceMemberRequest request) {
        log.info("Add member request received for workspace ID: {}", workspaceId);
        WorkspaceMemberResponse response = workspaceMemberService.addMember(workspaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Member added successfully", response));
    }

    /**
     * Get current user's role in workspace
     * GET /api/workspaces/{workspaceId}/members/role
     */
    @GetMapping("/role")
    public ResponseEntity<ApiResponse<WorkspaceMemberResponse>> getMyRole(
            @PathVariable Long workspaceId) {
        log.info("Get my role request received for workspace ID: {}", workspaceId);
        WorkspaceMemberResponse response = workspaceMemberService.getMyRole(workspaceId);
        return ResponseEntity.ok(ApiResponse.success("Role fetched successfully", response));
    }

    /**
     * List workspace members
     * GET /api/workspaces/{workspaceId}/members
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<WorkspaceMemberResponse>>> listMembers(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "joinedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        log.info("List members request received for workspace ID: {}", workspaceId);
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? 
                Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<WorkspaceMemberResponse> response = workspaceMemberService.listMembers(workspaceId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Members fetched successfully", response));
    }

    /**
     * Remove member from workspace
     * DELETE /api/workspaces/{workspaceId}/members/{userId}
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long workspaceId,
            @PathVariable Long userId) {
        log.info("Remove member request received for workspace ID: {} and user ID: {}", workspaceId, userId);
        workspaceMemberService.removeMember(workspaceId, userId);
        return ResponseEntity.ok(ApiResponse.success("Member removed successfully", null));
    }
}
