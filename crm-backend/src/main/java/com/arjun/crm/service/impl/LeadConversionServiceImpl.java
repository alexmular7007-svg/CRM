package com.arjun.crm.service.impl;

import com.arjun.crm.dto.request.LeadConversionRequest;
import com.arjun.crm.dto.request.ProjectCreateRequest;
import com.arjun.crm.dto.response.LeadConversionResponse;
import com.arjun.crm.entity.*;
import com.arjun.crm.enums.ChatRoomType;
import com.arjun.crm.enums.LeadStatus;
import com.arjun.crm.enums.Role;
import com.arjun.crm.exception.AccessDeniedException;
import com.arjun.crm.exception.ConflictException;
import com.arjun.crm.exception.ResourceNotFoundException;
import com.arjun.crm.repository.*;
import com.arjun.crm.security.WorkspaceAuthorizationService;
import com.arjun.crm.service.LeadConversionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Service for converting WON leads to projects
 * 
 * CORE WORKFLOW:
 * 1. Authenticate user
 * 2. Load and validate lead (WON, not yet converted, workspace accessible)
 * 3. Resolve/create client
 * 4. Create project
 * 5. Add project manager and team members
 * 6. Create project chat room (if enabled)
 * 7. Mark lead as converted
 * 8. Create lead activity record
 * 9. Publish notifications (after commit)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LeadConversionServiceImpl implements LeadConversionService {
    
    private final LeadRepository leadRepository;
    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final LeadActivityRepository leadActivityRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAuthorizationService authService;

    @Override
    @Transactional
    public LeadConversionResponse convertLeadToProject(Long leadId, LeadConversionRequest request) {
        log.info("[LEAD-CONVERSION] Starting lead={} by user={}", leadId, getCurrentUserEmail());
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 1: Authenticate and authorize user
        // ═════════════════════════════════════════════════════════════════════
        User currentUser = authService.getAuthenticatedUser();
        log.debug("[LEAD-CONVERSION] User authenticated: {}", currentUser.getEmail());
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 2: Load lead with pessimistic write lock for conversion
        // ═════════════════════════════════════════════════════════════════════
        // CRITICAL: Use pessimistic locking to prevent concurrent conversions
        // Database lock is held until transaction commits
        Lead lead = leadRepository.findByIdForConversion(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + leadId));
        log.debug("[LEAD-CONVERSION] Lead loaded with PESSIMISTIC_WRITE lock: {}", lead.getName());
        
        Workspace workspace = lead.getWorkspace();
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 3: Validate workspace access and permission
        // ═════════════════════════════════════════════════════════════════════
        WorkspaceMember member = authService.validateWorkspaceAccess(workspace.getId());
        log.debug("[LEAD-CONVERSION] Permission validated for workspace={}", workspace.getId());
        
        // Conversion requires same permission as normal project creation
        // Current implementation allows any active member to create projects
        // No additional role validation needed
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 4: Validate lead status
        // ═════════════════════════════════════════════════════════════════════
        if (lead.getStatus() != LeadStatus.WON) {
            throw new IllegalStateException(
                    "Only leads with status WON can be converted. Current status: " + lead.getStatus());
        }
        log.debug("[LEAD-CONVERSION] Lead status validated: WON");
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 5: Check for duplicate conversion (pessimistic protection)
        // ═════════════════════════════════════════════════════════════════════
        if (lead.getConverted() != null && lead.getConverted()) {
            throw new ConflictException(
                    "This lead has already been converted to project ID: " + lead.getConvertedProject().getId());
        }
        log.debug("[LEAD-CONVERSION] Conversion status checked: not yet converted");
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 6: Validate project manager is ACTIVE workspace member
        // ═════════════════════════════════════════════════════════════════════
        User projectManager = userRepository.findById(request.getProjectManagerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Project manager user not found with ID: " + request.getProjectManagerId()));
        
        // Use active member check (excludes soft-deleted members)
        if (!workspaceMemberRepository.existsActiveMember(workspace.getId(), projectManager.getId())) {
            Workspace workspace2 = workspaceRepository.findById(workspace.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
            if (!workspace2.getOwner().getId().equals(projectManager.getId())) {
                throw new AccessDeniedException(
                        "Project manager must be an active member of the workspace");
            }
        }
        log.debug("[LEAD-CONVERSION] Project manager validated: {}", projectManager.getEmail());
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 7: Validate selected team members are ACTIVE workspace members
        // ═════════════════════════════════════════════════════════════════════
        Set<User> selectedMembers = new HashSet<>();
        for (Long memberId : request.getMemberIds()) {
            User teamMember = userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Team member not found with ID: " + memberId));
            
            // Use active member check (excludes soft-deleted members)
            if (!workspaceMemberRepository.existsActiveMember(workspace.getId(), teamMember.getId())) {
                Workspace workspace3 = workspaceRepository.findById(workspace.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
                if (!workspace3.getOwner().getId().equals(teamMember.getId())) {
                    throw new AccessDeniedException(
                            "Team member " + memberId + " must be an active member of the workspace");
                }
            }
            selectedMembers.add(teamMember);
        }
        log.debug("[LEAD-CONVERSION] Team members validated: count={}", selectedMembers.size());
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 8: Resolve or create Client
        // ═════════════════════════════════════════════════════════════════════
        Client client;
        if (clientRepository.existsBySourceLeadId(leadId)) {
            // Reuse existing client for this lead
            client = clientRepository.findBySourceLeadId(leadId).get();
            log.debug("[LEAD-CONVERSION] Existing client reused: {}", client.getId());
        } else {
            // Create new client from lead
            client = Client.builder()
                    .workspace(workspace)
                    .name(lead.getCompany() != null && !lead.getCompany().isBlank() 
                            ? lead.getCompany() 
                            : lead.getName())
                    .contactName(lead.getName())
                    .email(lead.getEmail())
                    .phone(lead.getPhone())
                    .sourceLead(lead)
                    .createdBy(currentUser)
                    .build();
            
            client = clientRepository.save(client);
            log.debug("[LEAD-CONVERSION] Client created: {}", client.getId());
        }
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 9: Create Project
        // ═════════════════════════════════════════════════════════════════════
        Project project = Project.builder()
                .name(request.getProjectName())
                .description(request.getProjectDescription())
                .workspace(workspace)
                .createdBy(currentUser)
                .color(request.getColor() != null ? request.getColor() : "#3b82f6")
                .status(com.arjun.crm.enums.ProjectStatus.ACTIVE)
                .sourceLead(lead)
                .client(client)
                .build();
        
        project = projectRepository.save(project);
        log.debug("[LEAD-CONVERSION] Project created: {}", project.getId());
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 10: Add Project Manager
        // ═════════════════════════════════════════════════════════════════════
        ProjectMember managerMember = ProjectMember.builder()
                .project(project)
                .user(projectManager)
                .role(Role.MANAGER)
                .build();
        
        projectMemberRepository.save(managerMember);
        log.debug("[LEAD-CONVERSION] Project manager added: {}", projectManager.getId());
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 11: Add Selected Team Members
        // ═════════════════════════════════════════════════════════════════════
        int membersAdded = 1; // Project manager is already added
        
        for (User teamMember : selectedMembers) {
            // Skip duplicate (project manager may be in selected list)
            if (teamMember.getId().equals(projectManager.getId())) {
                continue;
            }
            
            // Skip if already added (shouldn't happen, but be safe)
            if (projectMemberRepository.existsByProjectIdAndUserId(project.getId(), teamMember.getId())) {
                continue;
            }
            
            ProjectMember teamProjectMember = ProjectMember.builder()
                    .project(project)
                    .user(teamMember)
                    .role(Role.USER)
                    .build();
            
            projectMemberRepository.save(teamProjectMember);
            membersAdded++;
        }
        log.debug("[LEAD-CONVERSION] Team members added: count={}", membersAdded);
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 12: Create Project Chat Room (if enabled)
        // ═════════════════════════════════════════════════════════════════════
        ChatRoom chatRoom = null;
        if (request.getCreateProjectChat()) {
            chatRoom = ChatRoom.builder()
                    .name(request.getProjectName() + " - Team Chat")
                    .type(ChatRoomType.PROJECT)
                    .workspace(workspace)
                    .project(project)
                    .createdBy(currentUser)
                    .build();
            
            chatRoom = chatRoomRepository.save(chatRoom);
            log.debug("[LEAD-CONVERSION] Chat room created: {}", chatRoom.getId());
            
            // Add participants: converter, project manager, team members
            Set<Long> participantIds = new HashSet<>();
            participantIds.add(currentUser.getId());
            participantIds.add(projectManager.getId());
            participantIds.addAll(request.getMemberIds());
            
            for (Long userId : participantIds) {
                User participantUser = userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
                
                ChatParticipant participant = ChatParticipant.builder()
                        .chatRoom(chatRoom)
                        .user(participantUser)
                        .build();
                
                chatParticipantRepository.save(participant);
            }
            log.debug("[LEAD-CONVERSION] Chat participants added: count={}", participantIds.size());
        }
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 13: Mark Lead as Converted
        // ═════════════════════════════════════════════════════════════════════
        lead.setConverted(true);
        lead.setConvertedAt(LocalDateTime.now());
        lead.setConvertedProject(project);
        lead.setConvertedClient(client);
        
        lead = leadRepository.save(lead);
        log.debug("[LEAD-CONVERSION] Lead marked as converted");
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 14: Create Lead Activity Record
        // ═════════════════════════════════════════════════════════════════════
        LeadActivity activity = LeadActivity.builder()
                .lead(lead)
                .user(currentUser)
                .activityType("CONVERTED_TO_PROJECT")
                .description("Lead converted to project: " + project.getName())
                .newValue("PROJECT_ID:" + project.getId())
                .build();
        
        leadActivityRepository.save(activity);
        log.debug("[LEAD-CONVERSION] Lead activity created");
        
        // ═════════════════════════════════════════════════════════════════════
        // STEP 15: Build and return response
        // ═════════════════════════════════════════════════════════════════════
        LeadConversionResponse response = LeadConversionResponse.builder()
                .leadId(lead.getId())
                .clientId(client.getId())
                .projectId(project.getId())
                .projectName(project.getName())
                .workspaceId(workspace.getId())
                .chatRoomId(chatRoom != null ? chatRoom.getId() : null)
                .membersAdded(membersAdded)
                .tasksCreated(0) // AI task generation disabled for Phase 1
                .attachmentsLinked(0) // Lead attachments not yet supported
                .convertedAt(lead.getConvertedAt())
                .success(true)
                .message("Lead successfully converted to project")
                .build();
        
        log.info("[LEAD-CONVERSION] Completed successfully lead={} project={}", leadId, project.getId());
        
        return response;
    }
    
    /**
     * Get current authenticated user's email for logging
     */
    private String getCurrentUserEmail() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof UserDetails) {
                return ((UserDetails) principal).getUsername();
            }
        } catch (Exception e) {
            return "UNKNOWN";
        }
        return "UNKNOWN";
    }
}
