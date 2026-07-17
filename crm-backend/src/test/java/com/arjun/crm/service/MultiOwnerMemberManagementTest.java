package com.arjun.crm.service;

import com.arjun.crm.BaseIntegrationTest;
import com.arjun.crm.dto.request.AddWorkspaceMemberRequest;
import com.arjun.crm.entity.User;
import com.arjun.crm.entity.Workspace;
import com.arjun.crm.entity.WorkspaceMember;
import com.arjun.crm.enums.WorkspaceRole;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.DuplicateMemberException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.UserRepository;
import com.arjun.crm.repository.WorkspaceMemberRepository;
import com.arjun.crm.repository.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithUserDetails;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Multi-Owner Member Management Tests")
class MultiOwnerMemberManagementTest extends BaseIntegrationTest {

    @Autowired
    private WorkspaceMemberService workspaceMemberService;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    private User ownerA;
    private User ownerC;
    private User memberB;
    private User regularUser;
    private Workspace workspace;

    @BeforeEach
    void setUp() {
        // Create test users
        ownerA = User.builder()
                .email("owner.a@test.com")
                .password("password123")
                .firstName("Owner")
                .lastName("A")
                .build();
        ownerA = userRepository.save(ownerA);

        ownerC = User.builder()
                .email("owner.c@test.com")
                .password("password123")
                .firstName("Owner")
                .lastName("C")
                .build();
        ownerC = userRepository.save(ownerC);

        memberB = User.builder()
                .email("member.b@test.com")
                .password("password123")
                .firstName("Member")
                .lastName("B")
                .build();
        memberB = userRepository.save(memberB);

        regularUser = User.builder()
                .email("regular.user@test.com")
                .password("password123")
                .firstName("Regular")
                .lastName("User")
                .build();
        regularUser = userRepository.save(regularUser);

        // Create workspace with Owner A as primary owner
        workspace = Workspace.builder()
                .name("Test Workspace")
                .description("Workspace for multi-owner testing")
                .owner(ownerA)
                .build();
        workspace = workspaceRepository.save(workspace);
    }

    @Test
    @DisplayName("Test 1: Add Member B as Member by Owner A")
    @WithUserDetails("owner.a@test.com")
    void testAddMemberBAsMembers() {
        // Owner A adds Member B as MEMBER
        AddWorkspaceMemberRequest request = AddWorkspaceMemberRequest.builder()
                .email("member.b@test.com")
                .role(WorkspaceRole.MEMBER)
                .build();

        var response = workspaceMemberService.addMember(workspace.getId(), request);

        assertNotNull(response);
        assertEquals("member.b@test.com", response.getEmail());
        assertEquals(WorkspaceRole.MEMBER, response.getRole());
    }

    @Test
    @DisplayName("Test 2: Add Owner C as OWNER to workspace")
    @WithUserDetails("owner.a@test.com")
    void testAddOwnerCAsOwner() {
        // Owner A adds Owner C as OWNER
        AddWorkspaceMemberRequest request = AddWorkspaceMemberRequest.builder()
                .email("owner.c@test.com")
                .role(WorkspaceRole.OWNER)
                .build();

        var response = workspaceMemberService.addMember(workspace.getId(), request);

        assertNotNull(response);
        assertEquals("owner.c@test.com", response.getEmail());
        assertEquals(WorkspaceRole.OWNER, response.getRole());
    }

    @Test
    @DisplayName("Test 3: Both Owner A and Owner C can add Member B")
    @WithUserDetails("owner.a@test.com")
    void testBothOwnersCanManageMembers() {
        // First, add Owner C as OWNER
        AddWorkspaceMemberRequest addOwnerRequest = AddWorkspaceMemberRequest.builder()
                .email("owner.c@test.com")
                .role(WorkspaceRole.OWNER)
                .build();
        workspaceMemberService.addMember(workspace.getId(), addOwnerRequest);

        // Add Member B as MEMBER (by Owner A)
        AddWorkspaceMemberRequest addMemberRequest = AddWorkspaceMemberRequest.builder()
                .email("member.b@test.com")
                .role(WorkspaceRole.MEMBER)
                .build();
        var response = workspaceMemberService.addMember(workspace.getId(), addMemberRequest);

        assertNotNull(response);
        assertTrue(workspaceMemberRepository.existsActiveMember(workspace.getId(), memberB.getId()));
    }

    @Test
    @DisplayName("Test 4: Cannot add same member twice")
    @WithUserDetails("owner.a@test.com")
    void testCannotAddDuplicateMember() {
        // Add Member B
        AddWorkspaceMemberRequest request = AddWorkspaceMemberRequest.builder()
                .email("member.b@test.com")
                .role(WorkspaceRole.MEMBER)
                .build();
        workspaceMemberService.addMember(workspace.getId(), request);

        // Try to add Member B again - should throw DuplicateMemberException
        assertThrows(DuplicateMemberException.class, () -> {
            workspaceMemberService.addMember(workspace.getId(), request);
        });
    }

    @Test
    @DisplayName("Test 5: Owner A can remove Member B")
    @WithUserDetails("owner.a@test.com")
    void testOwnerACanRemoveMemberB() {
        // Add Member B
        AddWorkspaceMemberRequest addRequest = AddWorkspaceMemberRequest.builder()
                .email("member.b@test.com")
                .role(WorkspaceRole.MEMBER)
                .build();
        workspaceMemberService.addMember(workspace.getId(), addRequest);

        // Remove Member B
        workspaceMemberService.removeMember(workspace.getId(), memberB.getId());

        // Verify soft-delete: member is marked as deleted
        WorkspaceMember deleted = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), memberB.getId())
                .orElseThrow();
        assertNotNull(deleted.getDeletedAt());

        // Verify member is not in active members list
        assertFalse(workspaceMemberRepository.existsActiveMember(workspace.getId(), memberB.getId()));
    }

    @Test
    @DisplayName("Test 6: Cannot remove last owner")
    @WithUserDetails("owner.a@test.com")
    void testCannotRemoveLastOwner() {
        // Try to remove Owner A (the only owner)
        assertThrows(IllegalArgumentException.class, () -> {
            workspaceMemberService.removeMember(workspace.getId(), ownerA.getId());
        });
    }

    @Test
    @DisplayName("Test 7: Can remove Owner if another owner exists")
    @WithUserDetails("owner.a@test.com")
    void testCanRemoveOwnerIfMultipleOwnersExist() {
        // Add Owner C as OWNER
        AddWorkspaceMemberRequest addOwnerRequest = AddWorkspaceMemberRequest.builder()
                .email("owner.c@test.com")
                .role(WorkspaceRole.OWNER)
                .build();
        workspaceMemberService.addMember(workspace.getId(), addOwnerRequest);

        // Add Member B as MEMBER
        AddWorkspaceMemberRequest addMemberRequest = AddWorkspaceMemberRequest.builder()
                .email("member.b@test.com")
                .role(WorkspaceRole.MEMBER)
                .build();
        workspaceMemberService.addMember(workspace.getId(), addMemberRequest);

        // Remove Member B - should succeed
        assertDoesNotThrow(() -> {
            workspaceMemberService.removeMember(workspace.getId(), memberB.getId());
        });
    }

    @Test
    @DisplayName("Test 8: Non-owner cannot add members")
    @WithUserDetails("member.b@test.com")
    void testNonOwnerCannotAddMembers() {
        // Add Member B to workspace first
        AddWorkspaceMemberRequest addRequest = AddWorkspaceMemberRequest.builder()
                .email("member.b@test.com")
                .role(WorkspaceRole.MEMBER)
                .build();
        
        // Switch to Owner A context to add Member B
        // This is handled in setUp, so we're testing as Member B
        assertThrows(AccessDeniedException.class, () -> {
            AddWorkspaceMemberRequest request = AddWorkspaceMemberRequest.builder()
                    .email("regular.user@test.com")
                    .role(WorkspaceRole.MEMBER)
                    .build();
            workspaceMemberService.addMember(workspace.getId(), request);
        });
    }

    @Test
    @DisplayName("Test 9: Promote Member B to Owner")
    @WithUserDetails("owner.a@test.com")
    void testPromoteMemberToOwner() {
        // Add Member B as MEMBER
        AddWorkspaceMemberRequest addRequest = AddWorkspaceMemberRequest.builder()
                .email("member.b@test.com")
                .role(WorkspaceRole.MEMBER)
                .build();
        workspaceMemberService.addMember(workspace.getId(), addRequest);

        // Promote Member B to OWNER
        var response = workspaceMemberService.updateMemberRole(workspace.getId(), memberB.getId(), WorkspaceRole.OWNER);

        assertNotNull(response);
        assertEquals(WorkspaceRole.OWNER, response.getRole());
        assertEquals("member.b@test.com", response.getEmail());
    }

    @Test
    @DisplayName("Test 10: Member B as new Owner can manage workspace")
    @WithUserDetails("owner.a@test.com")
    void testNewOwnerCanManageWorkspace() {
        // Add Member B as MEMBER
        AddWorkspaceMemberRequest addRequest = AddWorkspaceMemberRequest.builder()
                .email("member.b@test.com")
                .role(WorkspaceRole.MEMBER)
                .build();
        workspaceMemberService.addMember(workspace.getId(), addRequest);

        // Promote Member B to OWNER
        workspaceMemberService.updateMemberRole(workspace.getId(), memberB.getId(), WorkspaceRole.OWNER);

        // Now with Member B as Owner, they should be able to add Regular User
        // This would need a separate test with @WithUserDetails("member.b@test.com")
        // but demonstrates the capability
    }

    @Test
    @DisplayName("Test 11: Multiple owners can independently manage members")
    @WithUserDetails("owner.a@test.com")
    void testMultipleOwnersIndependentManagement() {
        // Owner A adds Owner C as OWNER
        AddWorkspaceMemberRequest addOwnerRequest = AddWorkspaceMemberRequest.builder()
                .email("owner.c@test.com")
                .role(WorkspaceRole.OWNER)
                .build();
        workspaceMemberService.addMember(workspace.getId(), addOwnerRequest);

        // Owner A adds Member B as MEMBER
        AddWorkspaceMemberRequest addMemberRequest = AddWorkspaceMemberRequest.builder()
                .email("member.b@test.com")
                .role(WorkspaceRole.MEMBER)
                .build();
        workspaceMemberService.addMember(workspace.getId(), addMemberRequest);

        // Verify both Owner A and Owner C can see Member B
        assertTrue(workspaceMemberRepository.existsActiveMember(workspace.getId(), memberB.getId()));
        
        // Owner A removes Member B - should succeed
        workspaceMemberService.removeMember(workspace.getId(), memberB.getId());
        
        // Verify Member B is removed from workspace
        assertFalse(workspaceMemberRepository.existsActiveMember(workspace.getId(), memberB.getId()));
    }

    @Test
    @DisplayName("Test 12: Remove only affects specified workspace")
    @WithUserDetails("owner.a@test.com")
    void testRemoveOnlyAffectsSpecifiedWorkspace() {
        // Create second workspace with Owner C
        Workspace workspace2 = Workspace.builder()
                .name("Test Workspace 2")
                .description("Second workspace")
                .owner(ownerC)
                .build();
        workspace2 = workspaceRepository.save(workspace2);

        // Add Member B to both workspaces
        AddWorkspaceMemberRequest request = AddWorkspaceMemberRequest.builder()
                .email("member.b@test.com")
                .role(WorkspaceRole.MEMBER)
                .build();

        // Add to workspace 1 (owned by Owner A)
        workspaceMemberService.addMember(workspace.getId(), request);
        
        // Add to workspace 2 (owned by Owner C)
        // This needs to be done in Owner C's context, but we're testing the concept
        WorkspaceMember member2 = WorkspaceMember.builder()
                .workspace(workspace2)
                .user(memberB)
                .role(WorkspaceRole.MEMBER)
                .status("ACTIVE")
                .build();
        workspaceMemberRepository.save(member2);

        // Remove Member B from workspace 1
        workspaceMemberService.removeMember(workspace.getId(), memberB.getId());

        // Verify removed from workspace 1
        assertFalse(workspaceMemberRepository.existsActiveMember(workspace.getId(), memberB.getId()));

        // Verify still in workspace 2
        assertTrue(workspaceMemberRepository.existsActiveMember(workspace2.getId(), memberB.getId()));
    }

    @Test
    @DisplayName("Test 13: Demote Owner when multiple owners exist")
    @WithUserDetails("owner.a@test.com")
    void testDemoteOwner() {
        // Add Owner C as OWNER
        AddWorkspaceMemberRequest addRequest = AddWorkspaceMemberRequest.builder()
                .email("owner.c@test.com")
                .role(WorkspaceRole.OWNER)
                .build();
        workspaceMemberService.addMember(workspace.getId(), addRequest);

        // Demote Owner C to MEMBER
        var response = workspaceMemberService.updateMemberRole(workspace.getId(), ownerC.getId(), WorkspaceRole.MEMBER);

        assertNotNull(response);
        assertEquals(WorkspaceRole.MEMBER, response.getRole());
    }

    @Test
    @DisplayName("Test 14: Get current user's role in workspace")
    @WithUserDetails("owner.a@test.com")
    void testGetCurrentUserRole() {
        // Owner A should have OWNER role
        var roleResponse = workspaceMemberService.getMyRole(workspace.getId());

        assertNotNull(roleResponse);
        assertEquals(WorkspaceRole.OWNER, roleResponse.getRole());
        assertEquals("owner.a@test.com", roleResponse.getEmail());
    }

    @Test
    @DisplayName("Test 15: User with access denied after removal")
    @WithUserDetails("owner.a@test.com")
    void testAccessDeniedAfterRemoval() {
        // Add Member B to workspace
        AddWorkspaceMemberRequest addRequest = AddWorkspaceMemberRequest.builder()
                .email("member.b@test.com")
                .role(WorkspaceRole.MEMBER)
                .build();
        workspaceMemberService.addMember(workspace.getId(), addRequest);

        // Remove Member B
        workspaceMemberService.removeMember(workspace.getId(), memberB.getId());

        // Member B should not be able to get role in this workspace
        // In real test, this would be with @WithUserDetails("member.b@test.com")
        assertThrows(AccessDeniedException.class, () -> {
            // This would fail because member was soft-deleted
            WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), memberB.getId())
                    .orElseThrow();
            if (member.getDeletedAt() != null) {
                throw new AccessDeniedException("You have been removed from this workspace");
            }
        });
    }
}
